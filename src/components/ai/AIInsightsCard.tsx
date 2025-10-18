'use client';

import React, { useState, useEffect } from 'react';
import { Property } from '@/types/property';

interface AIInsightsData {
  valuation: {
    estimated_value: number;
    confidence_score: number;
    valuation_range: {
      low: number;
      high: number;
    };
  };
  risk_score: {
    overall_risk: number;
  };
  market_analysis: {
    growth_potential: number;
    investment_recommendation: string;
  };
  ai_insights: {
    key_strengths: string[];
    potential_concerns: string[];
  };
}

interface AIInsightsCardProps {
  property: Property;
  compact?: boolean;
}

export default function AIInsightsCard({ property, compact = false }: AIInsightsCardProps) {
  const [insights, setInsights] = useState<AIInsightsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAIInsights();
  }, [property.id]);

  const fetchAIInsights = async () => {
    try {
      const response = await fetch(`/api/ai/valuation?property_id=${property.id}`);
      if (response.ok) {
        const data = await response.json();
        setInsights(data.analysis);
      }
    } catch (error) {
      console.error('Error fetching AI insights:', error);
    }
  };

  const runQuickAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/valuation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          property_id: property.id
        })
      });

      const data = await response.json();

      if (data.success) {
        setInsights(data.analysis);
      } else {
        setError(data.error || 'Analysis failed');
      }
    } catch (error: any) {
      setError(error.message);
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
    if (risk <= 3) return 'text-green-400 bg-green-500/20';
    if (risk <= 6) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  const getRiskLabel = (risk: number) => {
    if (risk <= 3) return 'Low Risk';
    if (risk <= 6) return 'Medium Risk';
    return 'High Risk';
  };

  const getGrowthColor = (growth: number) => {
    if (growth >= 8) return 'text-green-400 bg-green-500/20';
    if (growth >= 6) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  const getGrowthLabel = (growth: number) => {
    if (growth >= 8) return 'High Growth';
    if (growth >= 6) return 'Medium Growth';
    return 'Low Growth';
  };

  const getRecommendationColor = (recommendation: string) => {
    const rec = recommendation.toLowerCase();
    if (rec.includes('buy') || rec.includes('strong buy')) return 'text-green-400 bg-green-500/20';
    if (rec.includes('hold')) return 'text-yellow-400 bg-yellow-500/20';
    if (rec.includes('sell')) return 'text-red-400 bg-red-500/20';
    return 'text-gray-400 bg-gray-500/20';
  };

  if (compact) {
    return (
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg p-4 border border-blue-500/20">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center">
            <span className="mr-2">🤖</span>
            AI Insights
          </h3>
          {!insights && !loading && (
            <button
              onClick={runQuickAnalysis}
              disabled={loading}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full transition-colors disabled:opacity-50"
            >
              Analyze
            </button>
          )}
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400 mx-auto mb-2"></div>
            <p className="text-xs text-gray-300">AI analyzing...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-4">
            <p className="text-xs text-red-400 mb-2">{error}</p>
            <button
              onClick={runQuickAnalysis}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {insights && (
          <div className="space-y-3">
            {/* Valuation Summary */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300">AI Value:</span>
              <span className="text-sm font-semibold text-white">
                {formatCurrency(insights.valuation.estimated_value)}
              </span>
            </div>

            {/* Risk & Growth */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-300">Risk:</span>
                <span className={`text-xs px-2 py-1 rounded-full ${getRiskColor(insights.risk_score.overall_risk)}`}>
                  {getRiskLabel(insights.risk_score.overall_risk)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-300">Growth:</span>
                <span className={`text-xs px-2 py-1 rounded-full ${getGrowthColor(insights.market_analysis.growth_potential)}`}>
                  {getGrowthLabel(insights.market_analysis.growth_potential)}
                </span>
              </div>
            </div>

            {/* Recommendation */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-300">Recommendation:</span>
              <span className={`text-xs px-2 py-1 rounded-full ${getRecommendationColor(insights.market_analysis.investment_recommendation)}`}>
                {insights.market_analysis.investment_recommendation}
              </span>
            </div>

            {/* Key Strength */}
            {insights.ai_insights.key_strengths.length > 0 && (
              <div className="pt-2 border-t border-blue-500/20">
                <p className="text-xs text-gray-300 mb-1">Key Strength:</p>
                <p className="text-xs text-green-400 font-medium">
                  {insights.ai_insights.key_strengths[0]}
                </p>
              </div>
            )}
          </div>
        )}

        {!insights && !loading && !error && (
          <div className="text-center py-4">
            <p className="text-xs text-gray-300 mb-2">
              Get AI-powered insights
            </p>
            <button
              onClick={runQuickAnalysis}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full transition-colors"
            >
              Run Analysis
            </button>
          </div>
        )}
      </div>
    );
  }

  // Full card view
  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <span className="mr-2">🤖</span>
            AI Property Insights
          </h2>
          {!insights && !loading && (
            <button
              onClick={runQuickAnalysis}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              Run Analysis
            </button>
          )}
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI Analysis in Progress
            </h3>
            <p className="text-gray-600">
              DeepSeek AI is analyzing your property...
            </p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-red-600 mb-2">
              Analysis Error
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={runQuickAnalysis}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Retry Analysis
            </button>
          </div>
        )}

        {insights && (
          <div className="space-y-6">
            {/* Valuation Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-green-800 mb-1">AI Estimated Value</h3>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(insights.valuation.estimated_value)}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Confidence: {insights.valuation.confidence_score}%
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-800 mb-1">Listed Value</h3>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(property.total_value)}
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Difference: {formatCurrency(insights.valuation.estimated_value - property.total_value)}
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-purple-800 mb-1">Value Range</h3>
                <p className="text-lg font-bold text-purple-600">
                  {formatCurrency(insights.valuation.valuation_range.low)} - {formatCurrency(insights.valuation.valuation_range.high)}
                </p>
              </div>
            </div>

            {/* Risk & Growth */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-red-800 mb-1">Risk Score</h3>
                <p className={`text-3xl font-bold ${getRiskColor(insights.risk_score.overall_risk).split(' ')[0]}`}>
                  {insights.risk_score.overall_risk}/10
                </p>
                <p className={`text-sm font-medium ${getRiskColor(insights.risk_score.overall_risk).split(' ')[0]}`}>
                  {getRiskLabel(insights.risk_score.overall_risk)}
                </p>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-green-800 mb-1">Growth Potential</h3>
                <p className={`text-3xl font-bold ${getGrowthColor(insights.market_analysis.growth_potential).split(' ')[0]}`}>
                  {insights.market_analysis.growth_potential}/10
                </p>
                <p className={`text-sm font-medium ${getGrowthColor(insights.market_analysis.growth_potential).split(' ')[0]}`}>
                  {getGrowthLabel(insights.market_analysis.growth_potential)}
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-800 mb-1">Recommendation</h3>
                <p className={`text-lg font-bold ${getRecommendationColor(insights.market_analysis.investment_recommendation).split(' ')[0]}`}>
                  {insights.market_analysis.investment_recommendation}
                </p>
              </div>
            </div>

            {/* Key Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-green-800 mb-2 flex items-center">
                  <span className="mr-2">✅</span>
                  Key Strengths
                </h3>
                <ul className="space-y-1">
                  {insights.ai_insights.key_strengths.slice(0, 3).map((strength, index) => (
                    <li key={index} className="text-green-700 text-sm flex items-start">
                      <span className="mr-2">•</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold text-yellow-800 mb-2 flex items-center">
                  <span className="mr-2">⚠️</span>
                  Potential Concerns
                </h3>
                <ul className="space-y-1">
                  {insights.ai_insights.potential_concerns.slice(0, 3).map((concern, index) => (
                    <li key={index} className="text-yellow-700 text-sm flex items-start">
                      <span className="mr-2">•</span>
                      {concern}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Refresh Button */}
            <div className="pt-4 border-t border-gray-200">
              <button
                onClick={runQuickAnalysis}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                Refresh Analysis
              </button>
            </div>
          </div>
        )}

        {!insights && !loading && !error && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              AI-Powered Property Analysis
            </h3>
            <p className="text-gray-600 mb-6">
              Get comprehensive valuation, risk assessment, and market insights powered by DeepSeek AI
            </p>
            <button
              onClick={runQuickAnalysis}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Run AI Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
