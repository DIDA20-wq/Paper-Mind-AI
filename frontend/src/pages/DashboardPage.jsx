import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  MessageSquareText,
  Scale,
  Upload,
  ArrowRight,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Clock,
  Layers,
  Search,
  ExternalLink,
  ChevronRight,
  Database,
  RefreshCw,
} from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({
    totalDocs: 0,
    totalPages: 0,
    totalChunks: 0,
    activeSessions: 0,
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch documents
      const docsRes = await api.get('/documents?limit=5');
      const docs = docsRes.data.items || [];
      setDocuments(docs);

      // 2. Fetch sessions
      const sessionsRes = await api.get('/chat/sessions');
      const chatSessions = sessionsRes.data || [];
      setSessions(chatSessions);

      // Compute statistics
      const totalPages = docs.reduce((acc, d) => acc + (d.page_count || 0), 0);
      const totalChunks = docs.reduce((acc, d) => acc + (d.chunk_count || 0), 0);

      setStats({
        totalDocs: docsRes.data.total || docs.length,
        totalPages,
        totalChunks,
        activeSessions: chatSessions.length,
      });
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'indexed':
        return <Badge variant="success">Indexed</Badge>;
      case 'processing':
        return <Badge variant="warning">Processing</Badge>;
      case 'error':
        return <Badge variant="danger">Error</Badge>;
      default:
        return <Badge variant="default">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome & Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-8 rounded-2xl text-white shadow-xl shadow-slate-900/10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-semibold uppercase tracking-wider">
              Research Workspace
            </span>
            <span className="text-xs text-slate-400">PostgreSQL + Qdrant Vector DB</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Researcher'}
          </h2>
          <p className="mt-1 text-sm text-slate-300 max-w-xl">
            Access your indexed papers, execute grounded RAG queries with page citations, and synthesize scientific literature.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link to="/library">
            <Button variant="primary" icon={Upload} className="bg-brand-600 hover:bg-brand-500 text-white shadow-md">
              Upload PDF
            </Button>
          </Link>
          <Link to="/chat">
            <Button variant="outline" icon={MessageSquareText} className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700">
              New Chat
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Uploaded Papers</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.totalDocs}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Indexed for semantic search</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Indexed Pages</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.totalPages}</p>
            <p className="text-[11px] text-emerald-600 mt-0.5">Page-accurate boundaries</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Vector Chunks</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.totalChunks}</p>
            <p className="text-[11px] text-violet-600 mt-0.5">384-dim Qdrant points</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <MessageSquareText className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Research Chats</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{stats.activeSessions}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Evidence-grounded sessions</p>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
          Quick Research Workflows
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link
            to="/library"
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-brand-400 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
              Ingest Research PDF
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Upload PDF papers with automated page extraction, overlapping chunking, and Qdrant vector indexing.
            </p>
            <div className="mt-4 flex items-center text-xs font-semibold text-brand-600 gap-1">
              <span>Go to Library</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/chat"
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-brand-400 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
              Grounded AI Chat
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Pose queries against single or multi-paper contexts with verifiable page citations and zero hallucination.
            </p>
            <div className="mt-4 flex items-center text-xs font-semibold text-brand-600 gap-1">
              <span>Start Questioning</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link
            to="/compare"
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-brand-400 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Scale className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors">
              Cross-Paper Comparison
            </h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Generate structured comparative matrices across objectives, methodologies, datasets, and findings.
            </p>
            <div className="mt-4 flex items-center text-xs font-semibold text-brand-600 gap-1">
              <span>Compare Papers</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* Two Column Layout: Recent Documents & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recent Papers */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Research Papers</h3>
              <p className="text-xs text-slate-500">Indexed papers available for grounded RAG</p>
            </div>
            <Link to="/library" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">Loading documents...</div>
            ) : documents.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-slate-700">No research papers uploaded yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Upload your first PDF in the Research Library to trigger automatic chunking, embeddings, and vector indexing.
                </p>
                <Link to="/library">
                  <Button size="sm" variant="outline" icon={Upload} className="mt-2">
                    Upload Your First Paper
                  </Button>
                </Link>
              </div>
            ) : (
              documents.map((doc) => (
                <div key={doc.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-slate-900 truncate">{doc.title}</h4>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>{doc.page_count} pages</span>
                        <span>•</span>
                        <span>{doc.chunk_count} chunks</span>
                        <span>•</span>
                        <span>{(doc.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {getStatusBadge(doc.status)}
                    <Link to="/chat" state={{ documentId: doc.id }}>
                      <button className="p-2 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors">
                        <MessageSquareText className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Research Sessions */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200/80 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Active Conversations</h3>
              <p className="text-xs text-slate-500">Persistent research dialogs</p>
            </div>
            <Link to="/chat" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1">
              <span>Open Chat</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-500">Loading sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <p className="text-sm font-medium text-slate-700">No active conversations</p>
                <p className="text-xs text-slate-500">
                  Select a document and ask your first research question.
                </p>
                <Link to="/chat">
                  <Button size="sm" variant="primary" icon={Sparkles} className="mt-3">
                    Start Session
                  </Button>
                </Link>
              </div>
            ) : (
              sessions.slice(0, 5).map((s) => (
                <Link
                  key={s.id}
                  to={`/chat?session=${s.id}`}
                  className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between group block"
                >
                  <div className="min-w-0 pr-3">
                    <h5 className="text-sm font-medium text-slate-800 group-hover:text-brand-600 truncate">
                      {s.title}
                    </h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {new Date(s.updated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
