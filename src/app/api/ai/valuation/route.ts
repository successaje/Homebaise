import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { PropertyAnalysisService } from '@/lib/ai-property-analysis';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// AI Valuation Request Interface
interface AIValuationRequest {
  property_id: string;
  property_data: {
    name: string;
    location: string;
    property_type: string;
    total_value: number;
    area_sqm?: number;
    bedrooms?: number;
    bathrooms?: number;
    year_built?: number;
    description: string;
    images?: string[];
    market_data?: {
      similar_properties: any[];
      market_trends: any;
      location_metrics: any;
    };
  };
}

// AI Valuation Response Interface
interface AIValuationResponse {
  valuation: {
    estimated_value: number;
    confidence_score: number;
    valuation_range: {
      low: number;
      high: number;
    };
    methodology: string;
  };
  risk_score: {
    overall_risk: number; // 1-10 scale
    risk_factors: {
      location_risk: number;
      market_risk: number;
      property_risk: number;
      liquidity_risk: number;
    };
    risk_analysis: string;
  };
  market_analysis: {
    market_outlook: string;
    growth_potential: number; // 1-10 scale
    comparable_analysis: string;
    investment_recommendation: string;
  };
  ai_insights: {
    key_strengths: string[];
    potential_concerns: string[];
    optimization_suggestions: string[];
  };
  timestamp: string;
}

// Generate comprehensive property analysis prompt for DeepSeek
function generateAnalysisPrompt(propertyData: AIValuationRequest['property_data']): string {
  return `
You are an expert real estate analyst and AI-powered property valuation specialist. Analyze the following property and provide a comprehensive valuation and risk assessment.

PROPERTY DETAILS:
- Name: ${propertyData.name}
- Location: ${propertyData.location}
- Type: ${propertyData.property_type}
- Current Listed Value: $${propertyData.total_value.toLocaleString()}
- Area: ${propertyData.area_sqm ? `${propertyData.area_sqm} sqm` : 'Not specified'}
- Bedrooms: ${propertyData.bedrooms || 'Not specified'}
- Bathrooms: ${propertyData.bathrooms || 'Not specified'}
- Year Built: ${propertyData.year_built || 'Not specified'}
- Description: ${propertyData.description}

ANALYSIS REQUIREMENTS:
Please provide a detailed analysis in the following JSON format:

{
  "valuation": {
    "estimated_value": <number>,
    "confidence_score": <number between 0-100>,
    "valuation_range": {
      "low": <number>,
      "high": <number>
    },
    "methodology": "<explanation of valuation approach>"
  },
  "risk_score": {
    "overall_risk": <number between 1-10>,
    "risk_factors": {
      "location_risk": <number 1-10>,
      "market_risk": <number 1-10>,
      "property_risk": <number 1-10>,
      "liquidity_risk": <number 1-10>
    },
    "risk_analysis": "<detailed risk assessment>"
  },
  "market_analysis": {
    "market_outlook": "<market conditions and trends>",
    "growth_potential": <number 1-10>,
    "comparable_analysis": "<comparison with similar properties>",
    "investment_recommendation": "<buy/hold/sell recommendation with reasoning>"
  },
  "ai_insights": {
    "key_strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
    "potential_concerns": ["<concern 1>", "<concern 2>", "<concern 3>"],
    "optimization_suggestions": ["<suggestion 1>", "<suggestion 2>", "<suggestion 3>"]
  }
}

ANALYSIS GUIDELINES:
1. Consider location desirability, market trends, and property condition
2. Factor in African real estate market dynamics
3. Assess tokenization potential and liquidity
4. Consider regulatory environment and political stability
5. Evaluate infrastructure development and economic growth
6. Analyze comparable properties and recent sales
7. Consider currency stability and inflation impact
8. Assess environmental and climate risks
9. Evaluate property management and maintenance requirements
10. Consider exit strategy and resale potential

Provide realistic, data-driven analysis that would be valuable for real estate investors and token holders.
`;
}

// Call Ollama DeepSeek API
async function callDeepSeekAI(prompt: string): Promise<any> {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-r1:1.5b',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3, // Lower temperature for more consistent analysis
          top_p: 0.9,
          max_tokens: 4000,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error calling Ollama DeepSeek:', error);
    throw error;
  }
}

// Parse AI response and extract JSON
function parseAIResponse(aiResponse: string): AIValuationResponse {
  try {
    // Try to extract JSON from the response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate and set defaults
    return {
      valuation: {
        estimated_value: parsed.valuation?.estimated_value || 0,
        confidence_score: Math.max(0, Math.min(100, parsed.valuation?.confidence_score || 75)),
        valuation_range: {
          low: parsed.valuation?.valuation_range?.low || parsed.valuation?.estimated_value * 0.85,
          high: parsed.valuation?.valuation_range?.high || parsed.valuation?.estimated_value * 1.15
        },
        methodology: parsed.valuation?.methodology || 'AI-powered comparative market analysis'
      },
      risk_score: {
        overall_risk: Math.max(1, Math.min(10, parsed.risk_score?.overall_risk || 5)),
        risk_factors: {
          location_risk: Math.max(1, Math.min(10, parsed.risk_score?.risk_factors?.location_risk || 5)),
          market_risk: Math.max(1, Math.min(10, parsed.risk_score?.risk_factors?.market_risk || 5)),
          property_risk: Math.max(1, Math.min(10, parsed.risk_score?.risk_factors?.property_risk || 5)),
          liquidity_risk: Math.max(1, Math.min(10, parsed.risk_score?.risk_factors?.liquidity_risk || 5))
        },
        risk_analysis: parsed.risk_score?.risk_analysis || 'Risk assessment based on market conditions and property characteristics'
      },
      market_analysis: {
        market_outlook: parsed.market_analysis?.market_outlook || 'Market analysis based on current conditions',
        growth_potential: Math.max(1, Math.min(10, parsed.market_analysis?.growth_potential || 6)),
        comparable_analysis: parsed.market_analysis?.comparable_analysis || 'Analysis based on similar properties in the area',
        investment_recommendation: parsed.market_analysis?.investment_recommendation || 'Hold - Monitor market conditions'
      },
      ai_insights: {
        key_strengths: Array.isArray(parsed.ai_insights?.key_strengths) ? parsed.ai_insights.key_strengths : ['Strong location', 'Good market potential'],
        potential_concerns: Array.isArray(parsed.ai_insights?.potential_concerns) ? parsed.ai_insights.potential_concerns : ['Market volatility'],
        optimization_suggestions: Array.isArray(parsed.ai_insights?.optimization_suggestions) ? parsed.ai_insights.optimization_suggestions : ['Consider market timing']
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error parsing AI response:', error);
    // Return default analysis if parsing fails
    return {
      valuation: {
        estimated_value: 0,
        confidence_score: 50,
        valuation_range: { low: 0, high: 0 },
        methodology: 'Analysis failed - using default values'
      },
      risk_score: {
        overall_risk: 5,
        risk_factors: {
          location_risk: 5,
          market_risk: 5,
          property_risk: 5,
          liquidity_risk: 5
        },
        risk_analysis: 'Unable to complete risk analysis'
      },
      market_analysis: {
        market_outlook: 'Analysis unavailable',
        growth_potential: 5,
        comparable_analysis: 'Unable to complete comparable analysis',
        investment_recommendation: 'Unable to provide recommendation'
      },
      ai_insights: {
        key_strengths: ['Analysis in progress'],
        potential_concerns: ['Data processing error'],
        optimization_suggestions: ['Retry analysis']
      },
      timestamp: new Date().toISOString()
    };
  }
}

// POST /api/ai/valuation - Get AI-powered property valuation
export async function POST(request: NextRequest) {
  try {
    const body: AIValuationRequest = await request.json();
    const { property_id } = body;

    if (!property_id) {
      return NextResponse.json(
        { error: 'property_id is required' },
        { status: 400 }
      );
    }

    console.log(`Starting AI valuation for property: ${property_id}`);

    // Gather comprehensive property analysis data
    let analysisData;
    try {
      analysisData = await PropertyAnalysisService.gatherPropertyAnalysisData(property_id);
      console.log('Analysis data gathered successfully:', analysisData.property.name);
    } catch (error: any) {
      console.error('Error gathering analysis data:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: `Failed to gather property data: ${error.message}`,
          property_id 
        },
        { status: 400 }
      );
    }
    
    // Generate enhanced analysis prompt with comprehensive data
    const prompt = PropertyAnalysisService.generateEnhancedAnalysisPrompt(analysisData);
    
    // Call DeepSeek AI
    const aiResponse = await callDeepSeekAI(prompt);
    
    if (!aiResponse || !aiResponse.response) {
      throw new Error('No response from AI model');
    }

    // Parse AI response
    const analysis = parseAIResponse(aiResponse.response);

    // Save analysis to database
    const { error: saveError } = await supabase
      .from('ai_valuations')
      .upsert({
        property_id,
        analysis_data: analysis,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (saveError) {
      console.error('Error saving AI valuation:', saveError);
      // Continue even if save fails
    }

    console.log(`AI valuation completed for property: ${property_id}`);

    return NextResponse.json(
      {
        success: true,
        analysis,
        property_id,
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error in AI valuation:', error);
    
    // Return error response with fallback
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        fallback_analysis: {
          valuation: {
            estimated_value: 0,
            confidence_score: 0,
            valuation_range: { low: 0, high: 0 },
            methodology: 'Analysis failed - please retry'
          },
          risk_score: {
            overall_risk: 5,
            risk_factors: {
              location_risk: 5,
              market_risk: 5,
              property_risk: 5,
              liquidity_risk: 5
            },
            risk_analysis: 'Unable to complete analysis due to technical error'
          },
          market_analysis: {
            market_outlook: 'Analysis unavailable',
            growth_potential: 5,
            comparable_analysis: 'Unable to complete analysis',
            investment_recommendation: 'Unable to provide recommendation'
          },
          ai_insights: {
            key_strengths: ['Analysis in progress'],
            potential_concerns: ['Technical error occurred'],
            optimization_suggestions: ['Please retry the analysis']
          },
          timestamp: new Date().toISOString()
        }
      },
      { status: 500 }
    );
  }
}

// GET /api/ai/valuation - Get existing AI valuation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('property_id');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'property_id is required' },
        { status: 400 }
      );
    }

    const { data: valuation, error } = await supabase
      .from('ai_valuations')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw error;
    }

    if (!valuation) {
      return NextResponse.json(
        { error: 'No AI valuation found for this property' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        analysis: valuation.analysis_data,
        property_id: propertyId,
        created_at: valuation.created_at,
        updated_at: valuation.updated_at
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('Error fetching AI valuation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
