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

interface AIInsightsModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
}

export default function AIInsightsModal({ property, isOpen, onClose }: AIInsightsModalProps) {
  const [insights, setInsights] = useState<AIInsightsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && !insights) {
      fetchAIInsights();
    }
  }, [isOpen, property.id]);

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
    if (risk <= 3) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (risk <= 6) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  const getRiskLabel = (risk: number) => {
    if (risk <= 3) return 'Low Risk';
    if (risk <= 6) return 'Medium Risk';
    return 'High Risk';
  };

  const getGrowthColor = (growth: number) => {
    if (growth >= 8) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (growth >= 6) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    return 'text-red-400 bg-red-500/20 border-red-500/30';
  };

  const getGrowthLabel = (growth: number) => {
    if (growth >= 8) return 'High Growth';
    if (growth >= 6) return 'Medium Growth';
    return 'Low Growth';
  };

  const getRecommendationColor = (recommendation: string) => {
    const rec = recommendation.toLowerCase();
    if (rec.includes('buy') || rec.includes('strong buy')) return 'text-green-400 bg-green-500/20 border-green-500/30';
    if (rec.includes('hold')) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    if (rec.includes('sell')) return 'text-red-400 bg-red-500/20 border-red-500/30';
    return 'text-gray-400 bg-gray-500/20 border-gray-500/30';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 via-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-blue-500/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                <span className="text-2xl">🤖</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  AI Property Analysis
                </h2>
                <p className="text-gray-300">
                  {property.name || property.title || 'Property'} • {property.location}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="text-center py-12">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-400 border-t-transparent mx-auto mb-4"></div>
                <div className="absolute inset-0 rounded-full border-4 border-blue-400/20"></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">AI Analysis in Progress</h3>
              <p className="text-gray-300 mb-4">Analyzing property data and market conditions...</p>
              <div className="flex justify-center space-x-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-400 text-2xl">⚠️</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Analysis Failed</h3>
              <p className="text-red-400 mb-6">{error}</p>
              <button
                onClick={runQuickAnalysis}
                className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white px-6 py-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-red-500/25"
              >
                Retry Analysis
              </button>
            </div>
          )}

          {!insights && !loading && !error && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">🧠</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Get AI-Powered Insights</h3>
              <p className="text-gray-300 mb-8 max-w-md mx-auto">
                Advanced machine learning analysis of property value, risk assessment, and investment recommendations
              </p>
              <button
                onClick={runQuickAnalysis}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-full transition-all duration-300 shadow-lg hover:shadow-blue-500/25 font-semibold text-lg"
              >
                Run AI Analysis
              </button>
            </div>
          )}

          {insights && (
            <div className="space-y-6">
              {/* Valuation Section */}
              <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-blue-400 text-xl">💰</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">Property Valuation</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-1">
                      {formatCurrency(insights.valuation.estimated_value)}
                    </div>
                    <div className="text-sm text-gray-300">AI Estimated Value</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400 mb-1">
                      {insights.valuation.confidence_score}%
                    </div>
                    <div className="text-sm text-gray-300">Confidence Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-300 mb-1">Value Range</div>
                    <div className="text-sm text-white">
                      {formatCurrency(insights.valuation.valuation_range.low)} - {formatCurrency(insights.valuation.valuation_range.high)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Risk & Growth Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-green-400 text-xl">🛡️</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">Risk Assessment</h3>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white mb-2">
                      {insights.risk_score.overall_risk}/10
                    </div>
                    <div className={`inline-block px-4 py-2 rounded-full border ${getRiskColor(insights.risk_score.overall_risk)}`}>
                      {getRiskLabel(insights.risk_score.overall_risk)}
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-purple-400 text-xl">📈</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">Growth Potential</h3>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-white mb-2">
                      {insights.market_analysis.growth_potential}/10
                    </div>
                    <div className={`inline-block px-4 py-2 rounded-full border ${getGrowthColor(insights.market_analysis.growth_potential)}`}>
                      {getGrowthLabel(insights.market_analysis.growth_potential)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendation */}
              <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center mr-3">
                    <span className="text-yellow-400 text-xl">💡</span>
                  </div>
                  <h3 className="text-xl font-bold text-white">AI Recommendation</h3>
                </div>
                <div className="text-center">
                  <div className={`inline-block px-6 py-3 rounded-full border text-lg font-semibold ${getRecommendationColor(insights.market_analysis.investment_recommendation)}`}>
                    {insights.market_analysis.investment_recommendation}
                  </div>
                </div>
              </div>

              {/* Key Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-2xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-green-400 text-xl">✨</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">Key Strengths</h3>
                  </div>
                  <ul className="space-y-2">
                    {insights.ai_insights.key_strengths.map((strength, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-400 mr-2">•</span>
                        <span className="text-gray-300">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/20 rounded-2xl p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center mr-3">
                      <span className="text-red-400 text-xl">⚠️</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">Potential Concerns</h3>
                  </div>
                  <ul className="space-y-2">
                    {insights.ai_insights.potential_concerns.map((concern, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-400 mr-2">•</span>
                        <span className="text-gray-300">{concern}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
