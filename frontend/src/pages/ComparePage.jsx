import React, { useState, useEffect } from 'react';
import {
  Scale,
  Sparkles,
  BookOpen,
  CheckSquare,
  Square,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Layers,
  Download,
} from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import api from '../services/api';

export const ComparePage = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await api.get('/documents');
        const docs = res.data.items || [];
        setDocuments(docs);
        if (docs.length >= 2) {
          setSelectedIds([docs[0].id, docs[1].id]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchDocs();
  }, []);

  const toggleDoc = (id) => {
    setError('');
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((d) => d !== id);
      } else {
        if (prev.length >= 5) {
          setError('You can compare a maximum of 5 papers simultaneously.');
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) {
      setError('Please select at least 2 research papers to generate a comparative matrix.');
      return;
    }
    setError('');
    setLoading(true);
    setComparison(null);

    try {
      const res = await api.post('/research/compare', {
        document_ids: selectedIds,
      });
      setComparison(res.data);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Comparison analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportComparison = async () => {
    if (selectedIds.length < 2) return;
    try {
      const res = await api.post('/research/compare/export', {
        document_ids: selectedIds,
      });
      const blob = new Blob([res.data.markdown], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', res.data.filename || 'research_comparison_matrix.md');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Failed to export comparative matrix.');
    }
  };

  const selectAll = () => {
    setSelectedIds(documents.slice(0, 5).map((d) => d.id));
  };

  const clearAll = () => {
    setSelectedIds([]);
  };

  const comparisonFields = [
    { key: 'objectives', label: 'Research Objectives & Problem Scope' },
    { key: 'methodology', label: 'Methodology & Technical Architecture' },
    { key: 'dataset', label: 'Datasets, Benchmarks & Baselines' },
    { key: 'results', label: 'Key Empirical Findings & Performance' },
    { key: 'limitations', label: 'Observed Limitations & Evidence-Based Gaps' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Multi-Paper Comparative Analysis</h2>
          <p className="text-xs text-slate-500">
            Cross-examine methodologies, empirical benchmarks, and architectural designs side-by-side
          </p>
        </div>

        {comparison && (
          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={handleExportComparison}
          >
            Export Matrix (.md)
          </Button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Paper Selection Matrix */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-brand-600" />
                <span>Select Papers To Compare ({selectedIds.length} Selected • Min: 2, Max: 5)</span>
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">Choose papers to include in the side-by-side synthesis</p>
            </div>
            {documents.length > 0 && (
              <div className="flex items-center gap-2 text-xs ml-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="text-brand-600 hover:text-brand-700 font-semibold"
                >
                  Select All
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={clearAll}
                  className="text-slate-500 hover:text-slate-700 font-semibold"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          <Button
            variant="primary"
            size="sm"
            icon={Scale}
            disabled={selectedIds.length < 2 || loading}
            loading={loading}
            onClick={handleCompare}
          >
            {loading ? 'Synthesizing Matrix...' : 'Compare Selected Papers'}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
          {documents.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 col-span-full text-center">
              No research papers uploaded yet. Upload at least 2 papers in your Library to run comparative synthesis.
            </p>
          ) : (
            documents.map((doc) => {
              const isSelected = selectedIds.includes(doc.id);
              return (
                <div
                  key={doc.id}
                  onClick={() => toggleDoc(doc.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer flex items-start gap-2.5 transition-colors ${
                    isSelected
                      ? 'bg-brand-50/70 border-brand-400 text-brand-950 font-medium'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-brand-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{doc.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{doc.page_count} pages • {doc.chunk_count} chunks</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Comparison Results */}
      {loading ? (
        <div className="p-16 text-center space-y-3 bg-white rounded-xl border border-slate-200">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-800">Cross-referencing papers across dimensions...</p>
          <p className="text-xs text-slate-500">Evaluating objectives, methodologies, and findings</p>
        </div>
      ) : comparison ? (
        <div className="space-y-6">
          
          {/* Executive Overview Banner */}
          <div className="bg-gradient-to-r from-brand-900 to-indigo-950 text-white p-6 rounded-xl shadow-md space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[10px] font-bold uppercase tracking-wider border border-brand-400/30">
                Comparative Synthesis
              </span>
            </div>
            <h3 className="text-base font-bold text-white">
              {comparison.comparison_summary}
            </h3>
          </div>

          {/* Key Differences & Observations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-brand-600" />
                <span>Key Differences</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-700">
                {comparison.key_differences.map((diff, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 shrink-0"></span>
                    <span>{diff}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Evidence-Based Observations</span>
              </h4>
              <ul className="space-y-2 text-xs text-slate-700">
                {comparison.synthesis_observations.map((obs, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></span>
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Structured Comparative Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Side-by-Side Dimension Matrix
              </h4>
              <span className="text-[11px] text-slate-500 font-medium">
                {comparison.papers.length} Papers Compared
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200">
                    <th className="p-4 font-bold text-slate-700 uppercase tracking-wider w-48 shrink-0">
                      Dimension
                    </th>
                    {comparison.papers.map((p) => (
                      <th key={p.document_id} className="p-4 font-bold text-brand-900 border-l border-slate-200 min-w-64">
                        <div className="truncate max-w-xs">{p.title}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {comparisonFields.map((field) => (
                    <tr key={field.key} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 font-semibold text-slate-800 align-top bg-slate-50/40">
                        {field.label}
                      </td>
                      {comparison.papers.map((p) => (
                        <td key={p.document_id} className="p-4 text-slate-600 border-l border-slate-100 leading-relaxed align-top">
                          {p[field.key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : (
        <div className="bg-white p-16 rounded-xl border border-slate-200 text-center max-w-lg mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Scale className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800">No Comparison Generated Yet</h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Select 2 or more research papers above and click "Compare Selected Papers" to generate an automated cross-examination matrix.
          </p>
        </div>
      )}
    </div>
  );
};

export default ComparePage;
