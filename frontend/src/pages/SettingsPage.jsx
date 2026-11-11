import React from 'react';
import { User, Shield, Key, Database, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

export const SettingsPage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Workspace Settings</h2>
        <p className="text-xs text-slate-500">Manage your researcher credentials and system configurations</p>
      </div>

      {/* User Profile Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl">
            {user?.full_name ? user.full_name[0] : 'R'}
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{user?.full_name || 'Dr. Eleanor Vance'}</h3>
            <p className="text-xs text-slate-500">{user?.email || 'researcher@papermind.ai'}</p>
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="primary">Verified Researcher</Badge>
              <Badge variant="success">Active Account</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* RAG Infrastructure Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <Database className="w-4 h-4 text-brand-600" />
          <span>Active RAG Pipeline Configuration</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block">Embedding Model</span>
            <span className="font-semibold text-slate-800 font-mono mt-0.5 block">sentence-transformers/all-MiniLM-L6-v2 (384d)</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block">Vector Database</span>
            <span className="font-semibold text-slate-800 font-mono mt-0.5 block">Qdrant Vector DB (Cosine Similarity)</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block">Relational Database</span>
            <span className="font-semibold text-slate-800 font-mono mt-0.5 block">PostgreSQL 16 (Port 5432)</span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block">Synthesis LLM</span>
            <span className="font-semibold text-slate-800 font-mono mt-0.5 block">Google Gemini 1.5 Flash (Strict Grounding)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
