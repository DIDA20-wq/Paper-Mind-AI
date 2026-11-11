import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Upload,
  Search,
  FileText,
  Trash2,
  MessageSquareText,
  FileCheck2,
  AlertCircle,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import DocumentUploadModal from '../components/documents/DocumentUploadModal';
import api from '../services/api';

export const LibraryPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/documents${search ? `?search=${encodeURIComponent(search)}` : ''}`);
      setDocuments(res.data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [search]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this research paper?")) return;
    try {
      await api.delete(`/documents/${id}`);
      fetchDocs();
    } catch (err) {
      alert("Failed to delete document");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Research Paper Library</h2>
          <p className="text-xs text-slate-500">Manage and inspect your indexed academic literature</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search papers by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500 w-64"
            />
          </div>
          <Button variant="primary" icon={Upload} size="sm" onClick={() => setIsUploadOpen(true)}>
            Upload PDF
          </Button>
        </div>
      </div>

      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => fetchDocs()}
      />

      {/* Document Grid / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading library...</div>
        ) : documents.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-800">Your library is empty</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Upload PDF documents to begin page extraction, text chunking, and Qdrant vector indexing.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-slate-900 truncate">{doc.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                      <span>{doc.filename}</span>
                      <span>•</span>
                      <span>{doc.page_count} Pages</span>
                      <span>•</span>
                      <span>{doc.chunk_count} Chunks</span>
                      <span>•</span>
                      <span>{(doc.file_size / (1024 * 1024)).toFixed(2)} MB</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Badge variant={doc.status === 'indexed' ? 'success' : 'warning'}>
                    {doc.status}
                  </Badge>

                  <Link to="/chat" state={{ documentId: doc.id }}>
                    <Button variant="outline" size="sm" icon={MessageSquareText}>
                      Ask AI
                    </Button>
                  </Link>

                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete paper"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryPage;
