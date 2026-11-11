import React, { useState } from 'react';
import { FileCheck2, ChevronDown, ChevronUp, BookOpen, Sparkles } from 'lucide-react';
import Badge from '../common/Badge';

export const CitationCard = ({ citation }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-brand-200/80 bg-brand-50/40 p-3 hover:bg-brand-50/70 transition-colors">
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <div className="w-6 h-6 rounded-md bg-brand-100 text-brand-700 flex items-center justify-center shrink-0">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-800 truncate">
            {citation.document_title || 'Research Paper'}
          </span>
          <Badge variant="primary" size="sm" className="bg-brand-100 text-brand-800 font-bold shrink-0">
            Page {citation.page_number}
          </Badge>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-brand-700 font-mono font-medium">
            Score: {(citation.similarity_score * 100).toFixed(1)}%
          </span>
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-2.5 pt-2.5 border-t border-brand-100/80 text-xs text-slate-600 font-sans leading-relaxed bg-white/70 p-2.5 rounded-md">
          <p className="italic text-slate-700">"{citation.snippet}"</p>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Chunk: {citation.chunk_id}</span>
            <span className="text-emerald-600 font-sans font-medium">✓ Grounded evidence verified</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitationCard;
