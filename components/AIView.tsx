import React, { useState } from 'react';
import { Bot, Send, Sparkles, TrendingUp } from 'lucide-react';
import { Product, Sale } from '../types';
import { analyzeBusinessData } from '../services/gemini';

interface AIViewProps {
  products: Product[];
  sales: Sale[];
}

export const AIView: React.FC<AIViewProps> = ({ products, sales }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAskAI = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse('');
    
    const result = await analyzeBusinessData(sales, products, query);
    setResponse(result);
    setLoading(false);
  };

  const suggestions = [
    "What items are selling best this week?",
    "Which products are low on stock and need reordering?",
    "Calculate my estimated profit for this month.",
    "Give me a marketing idea for slow-moving items."
  ];

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-6rem)] flex flex-col">
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-8 rounded-t-2xl shadow-lg text-white">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
            <Bot size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AR Printers AI Advisor</h2>
            <p className="text-indigo-100">Ask questions about your sales, inventory, and growth strategies.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-white border-x border-b border-slate-200 shadow-sm rounded-b-2xl p-6 overflow-y-auto flex flex-col">
        {response ? (
          <div className="mb-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <Sparkles size={20} className="text-indigo-600" />
              </div>
              <div className="flex-1 space-y-2">
                <p className="font-semibold text-slate-700">Analysis Result:</p>
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {response}
                </div>
                <button 
                  onClick={() => setResponse('')} 
                  className="text-sm text-indigo-600 hover:underline mt-2"
                >
                  Ask another question
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
            <TrendingUp size={48} className="text-slate-300 mb-4" />
            <p className="text-lg text-slate-500 font-medium">Ready to analyze your business data</p>
          </div>
        )}

        {!response && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {suggestions.map((s, i) => (
              <button 
                key={i}
                onClick={() => setQuery(s)}
                className="text-left p-4 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-slate-600 text-sm"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="mt-auto relative">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask AI about your business performance..."
            className="w-full p-4 pr-14 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none shadow-sm"
            rows={3}
          />
          <button 
            onClick={handleAskAI}
            disabled={loading || !query}
            className="absolute right-3 bottom-3 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-300 transition-colors"
          >
            {loading ? <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"/> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};
