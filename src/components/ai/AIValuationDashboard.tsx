'use client';

import React, { useState, useEffect } from 'react';
import { Property } from '@/types/property';

interface AIValuationData {
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
    overall_risk: number;
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
    growth_potential: number;
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

interface AIValuationDashboardProps {
  property: Property;
  onAnalysisComplete?: (analysis: AIValuationData) => void;
}

export default function AIValuationDashboard({ property, onAnalysisComplete }: AIValuationDashboardProps) {
  const [analysis, setAnalysis] = useState<AIValuationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'valuation' | 'risk' | 'market' | 'insights'>('valuation');

  // Check for existing analysis on mount
  useEffect(() => {
    fetchExistingAnalysis();
  }, [property.id]);

  const fetchExistingAnalysis = async () => {
    try {
      const response = await fetch(`/api/ai/valuation?property_id=${property.id}`);
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
        onAnalysisComplete?.(data.analysis);
      }
    } catch (error) {
      console.error('Error fetching existing analysis:', error);
    }
  };

  const runAIAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/valuation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property_id: property.id,
          property_data: {
            name: property.name,
            location: property.location,
            property_type: property.property_type,
            total_value: property.total_value,
            area_sqm: property.property_details?.property_size ? parseFloat(property.property_details.property_size) : 0,
            bedrooms: 0, // Not available in current schema
            bathrooms: 0, // Not available in current schema
            year_built: 0, // Not available in current schema
            description: property.description,
            images: property.images
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setAnalysis(data.analysis);
        onAnalysisComplete?.(data.analysis);
      } else {
        setError(data.error || 'Analysis failed');
        if (data.fallback_analysis) {
          setAnalysis(data.fallback_analysis);
        }
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRiskColor = (risk: number) => {
    if (risk <= 3) return 'text-green-500';
    if (risk <= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRiskLabel = (risk: number) => {
    if (risk <= 3) return 'Low Risk';
    if (risk <= 6) return 'Medium Risk';
    return 'High Risk';
  };

  const getGrowthColor = (growth: number) => {
    if (growth >= 8) return 'text-green-500';
    if (growth >= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getGrowthLabel = (growth: number) => {
    if (growth >= 8) return 'High Growth';
    if (growth >= 6) return 'Medium Growth';
    return 'Low Growth';
  };

  const getRecommendationColor = (recommendation: string) => {
    const rec = recommendation.toLowerCase();
    if (rec.includes('buy') || rec.includes('strong buy')) return 'text-green-500';
    if (rec.includes('hold')) return 'text-yellow-500';
    if (rec.includes('sell')) return 'text-red-500';
    return 'text-gray-500';
  };

  if (!analysis && !loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            AI-Powered Property Analysis
          </h3>
          <p className="text-gray-600 mb-6">
            Get comprehensive valuation, risk assessment, and market insights powered by DeepSeek AI
          </p>
          <button
            onClick={runAIAnalysis}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            {loading ? 'Analyzing...' : 'Run AI Analysis'}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            AI Analysis in Progress
          </h3>
          <p className="text-gray-600">
            DeepSeek AI is analyzing your property...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-red-600 mb-2">
            Analysis Error
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={runAIAnalysis}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Retry Analysis
          </button>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              🤖 AI Property Analysis
            </h2>
            <p className="text-gray-600 mt-1">
              Powered by DeepSeek AI • {new Date(analysis.timestamp).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={runAIAnalysis}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
          >
            Refresh Analysis
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'valuation', label: 'Valuation', icon: '💰' },
            { id: 'risk', label: 'Risk Analysis', icon: '⚠️' },
            { id: 'market', label: 'Market Outlook', icon: '📈' },
            { id: 'insights', label: 'AI Insights', icon: '💡' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'valuation' | 'risk' | 'market' | 'insights')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'valuation' && (
          <div className="space-y-6">
            {/* Valuation Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-2">AI Estimated Value</h3>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(analysis.valuation.estimated_value)}
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Confidence: {analysis.valuation.confidence_score}%
                </p>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Listed Value</h3>
                <p className="text-3xl font-bold text-blue-600">
                  {formatCurrency(property.total_value || 0)}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Difference: {formatCurrency(analysis.valuation.estimated_value - (property.total_value || 0))}
                </p>
              </div>

              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-purple-800 mb-2">Value Range</h3>
                <p className="text-lg font-bold text-purple-600">
                  {formatCurrency(analysis.valuation.valuation_range.low)} - {formatCurrency(analysis.valuation.valuation_range.high)}
                </p>
                <p className="text-sm text-purple-700 mt-1">
                  ±{Math.round(((analysis.valuation.valuation_range.high - analysis.valuation.valuation_range.low) / 2 / analysis.valuation.estimated_value) * 100)}% range
                </p>
              </div>
            </div>

            {/* Valuation Details */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Valuation Methodology</h3>
              <p className="text-gray-700">{analysis.valuation.methodology}</p>
            </div>
          </div>
        )}

        {activeTab === 'risk' && (
          <div className="space-y-6">
            {/* Risk Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-red-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Overall Risk Score</h3>
                <p className={`text-4xl font-bold ${getRiskColor(analysis.risk_score.overall_risk)}`}>
                  {analysis.risk_score.overall_risk}/10
                </p>
                <p className={`text-lg font-medium ${getRiskColor(analysis.risk_score.overall_risk)}`}>
                  {getRiskLabel(analysis.risk_score.overall_risk)}
                </p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Risk Analysis</h3>
                <p className="text-gray-700">{analysis.risk_score.risk_analysis}</p>
              </div>
            </div>

            {/* Risk Factors */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(analysis.risk_score.risk_factors).map(([factor, score]) => (
                <div key={factor} className="bg-white border border-gray-200 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 capitalize mb-2">
                    {factor.replace('_', ' ')}
                  </h4>
                  <p className={`text-2xl font-bold ${getRiskColor(score as number)}`}>
                    {score}/10
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'market' && (
          <div className="space-y-6">
            {/* Market Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-2">Growth Potential</h3>
                <p className={`text-4xl font-bold ${getGrowthColor(analysis.market_analysis.growth_potential)}`}>
                  {analysis.market_analysis.growth_potential}/10
                </p>
                <p className={`text-lg font-medium ${getGrowthColor(analysis.market_analysis.growth_potential)}`}>
                  {getGrowthLabel(analysis.market_analysis.growth_potential)}
                </p>
              </div>

              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">Investment Recommendation</h3>
                <p className={`text-xl font-bold ${getRecommendationColor(analysis.market_analysis.investment_recommendation)}`}>
                  {analysis.market_analysis.investment_recommendation}
                </p>
              </div>
            </div>

            {/* Market Analysis */}
            <div className="space-y-4">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Market Outlook</h3>
                <p className="text-gray-700">{analysis.market_analysis.market_outlook}</p>
              </div>

              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Comparable Analysis</h3>
                <p className="text-gray-700">{analysis.market_analysis.comparable_analysis}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Key Strengths */}
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                  <span className="mr-2">✅</span>
                  Key Strengths
                </h3>
                <ul className="space-y-2">
                  {analysis.ai_insights.key_strengths.map((strength, index) => (
                    <li key={index} className="text-green-700 flex items-start">
                      <span className="mr-2">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Potential Concerns */}
              <div className="bg-yellow-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                  <span className="mr-2">⚠️</span>
                  Potential Concerns
                </h3>
                <ul className="space-y-2">
                  {analysis.ai_insights.potential_concerns.map((concern, index) => (
                    <li key={index} className="text-yellow-700 flex items-start">
                      <span className="mr-2">•</span>
                      {concern}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Optimization Suggestions */}
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                  <span className="mr-2">💡</span>
                  Optimization Suggestions
                </h3>
                <ul className="space-y-2">
                  {analysis.ai_insights.optimization_suggestions.map((suggestion, index) => (
                    <li key={index} className="text-blue-700 flex items-start">
                      <span className="mr-2">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

