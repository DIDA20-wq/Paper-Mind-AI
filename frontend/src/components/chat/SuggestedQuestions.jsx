import React from 'react';
import { HelpCircle } from 'lucide-react';

export const SuggestedQuestions = ({ onSelectQuestion }) => {
  const suggestions = [
    "What are the primary research objectives and hypotheses of this paper?",
    "Explain the core methodology and architectural formulations.",
    "What datasets and benchmark baselines were used for evaluation?",
    "What key empirical findings and performance gains are reported?",
    "What limitations or constraints were identified by the authors?",
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
        <HelpCircle className="w-3.5 h-3.5 text-brand-600" />
        <span>Suggested Research Questions</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => onSelectQuestion(q)}
            className="text-xs text-left px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 border border-slate-200 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedQuestions;
