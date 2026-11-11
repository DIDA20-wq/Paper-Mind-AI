import React, { useState, useEffect } from 'react';
import {
  FileText,
  Target,
  FlaskConical,
  Database,
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Download,
  Copy,
  Check,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import api from '../services/api';

export const SummaryPage = () => {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await api.get('/documents');
        const docs = res.data.items || [];
        setDocuments(docs);
        if (docs.length > 0) {
          setSelectedDocId(docs[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch documents:", err);
      }
    };
    fetchDocs();
  }, []);

  const handleGenerateSummary = async () => {
    if (!selectedDocId) return;
    setLoading(true);
    setSummary(null);

    try {
      const res = await api.post('/research/summarize', {
        document_id: selectedDocId,
      });
      setSummary(res.data.summary);
    } catch (err) {
      console.error("Failed to generate summary:", err);
      alert(err.response?.data?.detail || "Could not generate summary.");
    } finally {
      setLoading(false);
    }
  };

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  const sections = summary
    ? [
        { title: 'Abstract & High-Level Scope', icon: FileText, content: summary.abstract },
        { title: 'Research Objectives & Hypotheses', icon: Target, content: summary.objectives },
        { title: 'Methodology & Technical Architecture', icon: FlaskConical, content: summary.methodology },
        { title: 'Datasets, Corpora & Benchmarks', icon: Database, content: summary.dataset },
        { title: 'Empirical Results & Metrics', icon: BarChart3, content: summary.results },
        { title: 'Limitations & Evidence-Based Gaps', icon: AlertTriangle, content: summary.limitations },
        { title: 'Conclusions & Future Research Avenues', icon: CheckCircle2, content: summary.conclusion },
      ]
    : [];

  const handleCopySummary = () => {
    if (!summary) return;
    const fullText = sections.map((s) => `## ${s.title}\n${s.content}\n`).join('\n');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">7-Section Structured Paper Summaries</h2>
          <p className="text-xs text-slate-500">
            Automated scholarly decomposition across 7 standardized academic dimensions
          </p>
        </div>

        {summary && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={copied ? Check : Copy}
              onClick={handleCopySummary}
            >
              {copied ? 'Copied Full Summary' : 'Copy Summary'}
            </Button>
          </div>
        )}
      </div>

      {/* Document Selector Card */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Select Research Paper
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => {
                setSelectedDocId(e.target.value);
                setSummary(null);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-brand-500 w-full sm:w-80 truncate"
            >
              {documents.length === 0 ? (
                <option value="">No papers uploaded yet</option>
              ) : (
                documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title} ({doc.page_count} pages)
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <Button
          variant="primary"
          icon={Sparkles}
          disabled={!selectedDocId || loading}
          loading={loading}
          onClick={handleGenerateSummary}
        >
          {loading ? 'Synthesizing...' : 'Generate 7-Section Summary'}
        </Button>
      </div>

      {/* Summary Content Blocks */}
      {loading ? (
        <div className="p-16 text-center space-y-3 bg-white rounded-xl border border-slate-200">
          <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-800">Synthesizing 7-section academic breakdown...</p>
          <p className="text-xs text-slate-500">Querying vector passages from Qdrant across standardized analytical blocks</p>
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sections.map((sec, idx) => {
            const Icon = sec.icon;
            const isFullWidth = idx === 0 || idx === sections.length - 1;
            return (
              <div
                key={idx}
                className={`bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between ${
                  isFullWidth ? 'md:col-span-2' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
                        <Icon className="w-4 h-4" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">{sec.title}</h4>
                    </div>
                    <Badge variant="primary">Section {idx + 1} of 7</Badge>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {sec.content || 'Evidence for this category was not reported in the retrieved sections.'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-16 text-center space-y-3 bg-white rounded-xl border border-slate-200">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-800">No Summary Generated Yet</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Choose a paper from the dropdown above and click "Generate 7-Section Summary" to distill key research parameters.
          </p>
        </div>
      )}
    </div>
  );
};

export default SummaryPage;
