import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileSearch,
  Layers,
  FileSpreadsheet,
  BrainCircuit,
  Database,
  Cpu,
  Search,
  FileCheck2,
  GitCompare,
  Zap,
} from 'lucide-react';
import Navbar from '../components/common/Navbar';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';

export const LandingPage = () => {
  const { quickDemoLogin } = useAuth();
  const navigate = useNavigate();

  const handleDemoAccess = async () => {
    try {
      await quickDemoLogin();
      navigate('/dashboard');
    } catch (err) {
      console.error("Demo login error:", err);
      navigate('/login');
    }
  };

  const features = [
    {
      icon: ShieldCheck,
      title: 'Zero-Hallucination Grounding',
      description: 'Answers are strictly tethered to retrieved document passages. If evidence is missing, PaperMind explicitly reports insufficient context instead of inventing facts.',
    },
    {
      icon: FileSearch,
      title: 'Verifiable Page-Level Citations',
      description: 'Every statement links directly to its source paper and exact page number, complete with excerpt previews and similarity confidence scores.',
    },
    {
      icon: FileSpreadsheet,
      title: 'Structured 7-Section Summaries',
      description: 'Automatically distill lengthy academic PDFs into structured breakdowns: Objectives, Methodology, Dataset, Results, Limitations, and Conclusions.',
    },
    {
      icon: GitCompare,
      title: 'Multi-Paper Comparative Synthesis',
      description: 'Select multiple papers to contrast objectives, benchmark results, architectures, and empirical findings side-by-side in structured matrices.',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Upload Academic PDF',
      description: 'Upload conference papers, journal articles, or preprints up to 30MB with automated integrity checks.',
    },
    {
      step: '02',
      title: 'Page-Accurate Parsing & Chunking',
      description: 'PyMuPDF extracts text page-by-page. Text chunking respects page boundaries to preserve citation accuracy.',
    },
    {
      step: '03',
      title: 'Vector Indexing in Qdrant',
      description: 'Sentence Transformers (all-MiniLM-L6-v2) compute 384-dimensional dense vectors with user isolation.',
    },
    {
      step: '04',
      title: 'Grounded Synthesis via Gemini',
      description: 'Retrieved top-K passages are fed into Google Gemini under negative constraint prompts for strictly faithful answers.',
    },
  ];

  const techStack = [
    { name: 'FastAPI', role: 'High-performance async Python backend', icon: Zap },
    { name: 'PostgreSQL', role: 'Relational data, user isolation & sessions', icon: Database },
    { name: 'Qdrant Vector DB', role: 'High-speed cosine similarity search', icon: BrainCircuit },
    { name: 'Sentence Transformers', role: '384-dim all-MiniLM-L6-v2 embeddings', icon: Cpu },
    { name: 'Google Gemini', role: 'Faithful reasoning & synthesis engine', icon: Sparkles },
    { name: 'PyMuPDF', role: 'Zero-loss page-preserving PDF extraction', icon: BookOpen },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32 bg-gradient-to-b from-white via-brand-50/20 to-slate-50">
        <div className="absolute inset-0 bg-[radial-gradient(#e0e7ff_1px,transparent_1px)] [background-size:24px_24px] opacity-40"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200/80 mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-brand-600 animate-pulse" />
            <span className="text-xs font-semibold text-brand-700 tracking-wide uppercase">Next-Gen Academic RAG</span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
            <span className="text-xs text-slate-600 font-medium">Production-Grade Architecture</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-tight">
            Intelligent Research Assistant Grounded in <span className="bg-gradient-to-r from-brand-700 via-brand-600 to-indigo-600 bg-clip-text text-transparent">Verifiable Evidence</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
            Upload complex academic PDFs, ask in-depth technical questions, receive strictly grounded answers with exact page numbers, and cross-compare literature with zero hallucinations.
          </p>

          {/* Action CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" icon={ArrowRight} className="w-full sm:w-auto shadow-lg shadow-brand-500/25">
                Explore Research Workspace
              </Button>
            </Link>
            <button
              onClick={handleDemoAccess}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-base shadow-sm transition-all"
            >
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>Launch 1-Click Researcher Demo</span>
            </button>
          </div>

          {/* Interactive Hero Preview Graphic */}
          <div className="mt-14 max-w-5xl mx-auto rounded-2xl border border-slate-200/80 bg-white p-3 sm:p-5 shadow-2xl shadow-indigo-900/10 text-left">
            <div className="rounded-xl bg-slate-900 p-4 sm:p-6 text-white border border-slate-800">
              
              {/* Header inside preview */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-slate-400 font-mono ml-2">PaperMind RAG Inference Engine • Vaswani et al. (2017)</span>
                </div>
                <Badge variant="primary" className="bg-brand-500/20 text-brand-300 border-brand-500/30">
                  Cosine Score 0.892
                </Badge>
              </div>

              {/* Chat Simulation */}
              <div className="py-4 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                    Q
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-lg rounded-tl-none text-sm text-slate-200 border border-slate-700/60 max-w-2xl">
                    How does the Multi-Head Attention mechanism compute attention projections across different subspaces?
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    AI
                  </div>
                  <div className="bg-slate-800/40 p-4 rounded-lg rounded-tl-none text-sm text-slate-300 border border-brand-500/30 space-y-3 max-w-3xl">
                    <p className="leading-relaxed">
                      Multi-Head Attention linearly projects the queries, keys, and values <span className="text-brand-300 font-semibold">h = 8</span> times with parameter matrices <code className="bg-slate-950 px-1.5 py-0.5 rounded text-brand-200 font-mono text-xs">W_i^Q, W_i^K, W_i^V</code>. On each of these projected versions, the attention function is performed in parallel, yielding <span className="text-brand-300 font-semibold">d_v = 64</span> dimensional output values, which are concatenated and once again projected.
                    </p>
                    
                    {/* Source Citation Pill */}
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-brand-950/80 border border-brand-500/40 text-xs text-brand-200 font-mono">
                        <FileCheck2 className="w-3.5 h-3.5 text-brand-400" />
                        <span>Source: Attention_Is_All_You_Need.pdf</span>
                        <span className="px-1.5 py-0.2 bg-brand-600 text-white rounded font-bold text-[10px]">Page 4</span>
                      </div>
                      <span className="text-[11px] text-emerald-400 font-medium">✓ Grounded passage verified</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Feature Grid */}
      <section id="features" className="py-20 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">Engineered For Accuracy</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Why PaperMind Beats Generic Chatbots
            </h3>
            <p className="mt-4 text-base text-slate-600">
              Generic LLMs guess when answering academic queries. PaperMind combines deterministic page-level parsing with dense vector search and strict grounding constraints.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-brand-300 hover:shadow-lg hover:shadow-brand-500/5 transition-all duration-300 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-brand-100 group-hover:bg-brand-600 text-brand-700 group-hover:text-white flex items-center justify-center transition-colors duration-300 mb-5">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">{feat.title}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Ingestion & RAG Pipeline Breakdown */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">Deterministic Ingestion</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How The Pipeline Functions
            </h3>
            <p className="mt-4 text-base text-slate-600">
              Every document undergoes a strict multi-stage transformation ensuring zero citation drift.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, idx) => (
              <div key={idx} className="relative p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
                <div className="text-3xl font-black text-brand-200 font-mono mb-3">{s.step}</div>
                <h4 className="text-base font-bold text-slate-900 mb-2">{s.title}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack Showcase */}
      <section id="technology" className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-400 mb-2">Modern Enterprise Stack</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Production-Grade Infrastructure
            </h3>
            <p className="mt-4 text-sm text-slate-400">
              Built with industry-standard frameworks for low latency, reproducible results, and horizontal scalability.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {techStack.map((tech, idx) => {
              const Icon = tech.icon;
              return (
                <div
                  key={idx}
                  className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/80 flex items-start gap-4 hover:border-brand-500/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-white">{tech.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">{tech.role}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Call to Action Footer Section */}
      <section className="py-20 bg-gradient-to-tr from-brand-900 via-slate-900 to-indigo-950 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Accelerate Your Scientific Research?
          </h2>
          <p className="mt-4 text-base text-slate-300 max-w-2xl mx-auto">
            Experience literature review with instant grounded retrieval, structured matrices, and verified citations.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" icon={ArrowRight} className="bg-brand-500 hover:bg-brand-400 text-white">
                Create Free Account
              </Button>
            </Link>
            <button
              onClick={handleDemoAccess}
              className="px-5 py-2.5 rounded-lg border border-slate-600 hover:bg-slate-800 text-slate-200 font-medium text-sm transition-all"
            >
              Sign In As Demo Researcher
            </button>
          </div>
        </div>
      </section>

      {/* Copyright Footer */}
      <footer className="py-8 bg-slate-950 border-t border-slate-900 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 PaperMind AI. Built with FastAPI, PostgreSQL, Qdrant, PyMuPDF, Sentence-Transformers, and React.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
