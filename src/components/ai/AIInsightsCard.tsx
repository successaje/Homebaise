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
      <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-indigo-500/10 rounded-xl p-4 border border-blue-500/20 backdrop-blur-sm relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center mr-3 shadow-md">
                <span className="text-sm">🤖</span>
              </div>
              <h3 className="text-sm font-semibold text-white">
                AI Insights
              </h3>
            </div>
            {!insights && !loading && (
              <button
                onClick={runQuickAnalysis}
                disabled={loading}
                className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-full transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-blue-500/25"
              >
                Analyze
              </button>
            )}
          </div>

        {loading && (
          <div className="text-center py-6">
            <div className="relative">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400 border-t-transparent mx-auto mb-3"></div>
              <div className="absolute inset-0 rounded-full border-2 border-blue-400/20"></div>
            </div>
            <p className="text-xs text-blue-300 font-medium">AI analyzing property data...</p>
            <p className="text-xs text-gray-400 mt-1">This may take a few moments</p>
          </div>
        )}

        {error && (
          <div className="text-center py-6">
            <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-red-400 text-sm">⚠️</span>
            </div>
            <p className="text-xs text-red-400 mb-3 font-medium">{error}</p>
            <button
              onClick={runQuickAnalysis}
              className="text-xs bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-4 py-2 rounded-full transition-all duration-300 shadow-lg hover:shadow-red-500/25"
            >
              Retry Analysis
            </button>
          </div>
        )}

        {insights && (
          <div className="space-y-4">
            {/* Valuation Summary */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-300 font-medium">AI Valuation</span>
                <span className="text-xs text-blue-300">Confidence: {insights.valuation.confidence_score}%</span>
              </div>
              <div className="text-lg font-bold text-white">
                {formatCurrency(insights.valuation.estimated_value)}
              </div>
              <div className="text-xs text-gray-400">
                Range: {formatCurrency(insights.valuation.valuation_range.low)} - {formatCurrency(insights.valuation.valuation_range.high)}
              </div>
            </div>

            {/* Risk & Growth Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-300">Risk Level</span>
                  <span className="text-xs text-gray-400">{insights.risk_score.overall_risk}/10</span>
                </div>
                <div className={`text-xs px-2 py-1 rounded-full inline-block ${getRiskColor(insights.risk_score.overall_risk)}`}>
                  {getRiskLabel(insights.risk_score.overall_risk)}
                </div>
              </div>
              
              <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-300">Growth Potential</span>
                  <span className="text-xs text-gray-400">{insights.market_analysis.growth_potential}/10</span>
                </div>
                <div className={`text-xs px-2 py-1 rounded-full inline-block ${getGrowthColor(insights.market_analysis.growth_potential)}`}>
                  {getGrowthLabel(insights.market_analysis.growth_potential)}
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-300 font-medium">AI Recommendation</span>
                <span className={`text-xs px-2 py-1 rounded-full ${getRecommendationColor(insights.market_analysis.investment_recommendation)}`}>
                  {insights.market_analysis.investment_recommendation}
                </span>
              </div>
            </div>

            {/* Key Strength */}
            {insights.ai_insights.key_strengths.length > 0 && (
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg p-3 border border-green-500/20">
                <div className="flex items-center mb-2">
                  <span className="text-xs text-green-300 font-medium mr-2">✨</span>
                  <span className="text-xs text-green-300 font-medium">Key Strength</span>
                </div>
                <p className="text-xs text-green-400 font-medium">
                  {insights.ai_insights.key_strengths[0]}
                </p>
              </div>
            )}
          </div>
        )}

        {!insights && !loading && !error && (
          <div className="text-center py-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🧠</span>
            </div>
            <p className="text-xs text-gray-300 mb-2 font-medium">
              Get AI-powered insights
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Advanced analysis of property value, risk, and market potential
            </p>
            <button
              onClick={runQuickAnalysis}
              className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-blue-500/25 font-medium"
            >
              Run AI Analysis
            </button>
          </div>
        )}
        </div>
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
