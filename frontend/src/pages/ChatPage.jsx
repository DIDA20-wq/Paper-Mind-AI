import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Send,
  Sparkles,
  BookOpen,
  FileText,
  Clock,
  Layers,
  Copy,
  Check,
  Plus,
  MessageSquareText,
  CheckSquare,
  Square,
  AlertCircle,
  FileCheck2,
  Trash2,
  Download,
} from 'lucide-react';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import CitationCard from '../components/chat/CitationCard';
import SuggestedQuestions from '../components/chat/SuggestedQuestions';
import api from '../services/api';

export const ChatPage = () => {
  const location = useLocation();
  const initialDocId = location.state?.documentId || null;

  const [documents, setDocuments] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState(initialDocId ? [initialDocId] : []);
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);

  // 1. Fetch user's documents
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await api.get('/documents');
        const docs = res.data.items || [];
        setDocuments(docs);
        if (!initialDocId && docs.length > 0 && selectedDocIds.length === 0) {
          setSelectedDocIds([docs[0].id]);
        }
      } catch (err) {
        console.error("Failed to fetch documents:", err);
      }
    };
    fetchDocs();
  }, []);

  // 2. Fetch sessions
  const fetchSessions = async () => {
    try {
      const res = await api.get('/chat/sessions');
      setSessions(res.data || []);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // 3. Load active session messages
  const loadSession = async (sessionId) => {
    setActiveSessionId(sessionId);
    try {
      const res = await api.get(`/chat/sessions/${sessionId}`);
      setMessages(res.data.messages || []);
      if (res.data.document_id && !selectedDocIds.includes(res.data.document_id)) {
        setSelectedDocIds([res.data.document_id]);
      }
    } catch (err) {
      console.error("Failed to load session:", err);
    }
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, asking]);

  const toggleDocumentSelection = (id) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleStartNewSession = () => {
    setActiveSessionId(null);
    setMessages([]);
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this research conversation?")) return;
    try {
      await api.delete(`/chat/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Delete session failed:", err);
      alert("Failed to delete chat session.");
    }
  };

  const handleExportSession = async () => {
    if (!activeSessionId) return;
    try {
      const res = await api.get(`/chat/sessions/${activeSessionId}/export`);
      const blob = new Blob([res.data.markdown], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', res.data.filename || 'research_conversation.md');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export session failed:", err);
      alert("Could not export session transcript.");
    }
  };

  const handleAsk = async (promptText) => {
    const textToSend = promptText || question;
    if (!textToSend.trim() || asking) return;

    const userMessage = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      content: textToSend,
      citations: [],
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setAsking(true);

    try {
      const response = await api.post('/chat/ask', {
        question: textToSend,
        session_id: activeSessionId,
        document_ids: selectedDocIds,
      });

      const assistantMessage = {
        id: response.data.message_id,
        sender: 'assistant',
        content: response.data.answer,
        citations: response.data.citations || [],
        response_time_ms: response.data.response_time_ms,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      if (!activeSessionId) {
        setActiveSessionId(response.data.session_id);
        fetchSessions();
      }
    } catch (err) {
      console.error("Ask question error:", err);
      const errorMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        content: err.response?.data?.detail || "An error occurred during retrieval. Please verify your document is indexed.",
        citations: [],
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setAsking(false);
    }
  };

  const copyToClipboard = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-[calc(100vh-8.5rem)] flex gap-6 overflow-hidden">
      
      {/* Left Column: Document Filter & Session History */}
      <div className="w-80 shrink-0 flex flex-col gap-4 overflow-hidden">
        
        {/* Document Ingestion & Scope Selector */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col max-h-64">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-brand-600" />
              <span>Query Scope ({selectedDocIds.length})</span>
            </span>
            <span className="text-[10px] text-slate-400">
              {documents.length} available
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {documents.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">No indexed papers yet</p>
            ) : (
              documents.map((doc) => {
                const isSelected = selectedDocIds.includes(doc.id);
                return (
                  <div
                    key={doc.id}
                    onClick={() => toggleDocumentSelection(doc.id)}
                    className={`p-2 rounded-lg text-xs cursor-pointer flex items-start gap-2 border transition-colors ${
                      isSelected
                        ? 'bg-brand-50/70 border-brand-300 text-brand-900 font-medium'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-brand-600" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-slate-400" />
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

        {/* Previous Chat Sessions */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-600" />
              <span>Conversations</span>
            </span>
            <button
              onClick={handleStartNewSession}
              className="p-1 rounded hover:bg-slate-100 text-brand-600 text-xs font-semibold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1">
            {sessions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No conversation history</p>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  className={`group flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                    activeSessionId === s.id
                      ? 'bg-brand-600 text-white font-medium shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <button
                    onClick={() => loadSession(s.id)}
                    className="flex-1 text-left truncate mr-2"
                  >
                    <p className="truncate font-medium">{s.title}</p>
                    <span className={`text-[10px] block mt-0.5 ${activeSessionId === s.id ? 'text-brand-200' : 'text-slate-400'}`}>
                      {new Date(s.updated_at).toLocaleDateString()}
                    </span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSession(s.id);
                    }}
                    className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
                      activeSessionId === s.id
                        ? 'hover:bg-brand-700 text-brand-200 hover:text-white'
                        : 'hover:bg-slate-200 text-slate-400 hover:text-rose-600'
                    }`}
                    title="Delete conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Right Column: Chat Stream & Citations */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
        
        {/* Chat Stream Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Grounded Research Dialogue</h3>
              <p className="text-[11px] text-slate-500">
                Active context: {selectedDocIds.length} paper(s) • Strict page-level citations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeSessionId && messages.length > 0 && (
              <button
                onClick={handleExportSession}
                className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 shadow-sm transition-colors"
                title="Export conversation and citations as Markdown"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export Chat (.md)</span>
              </button>
            )}
            <Badge variant="success">Zero Hallucination Grounding</Badge>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="py-12 max-w-xl mx-auto space-y-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto shadow-sm">
                <BookOpen className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">Inquire Against Your Research Corpus</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                  Ask technical questions about methodologies, mathematical formulas, datasets, and benchmark scores. Every answer is substantiated with source page numbers.
                </p>
              </div>

              {/* Quick suggestions */}
              <div className="text-left">
                <SuggestedQuestions onSelectQuestion={(q) => handleAsk(q)} />
              </div>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex items-start gap-3.5 max-w-3xl ${
                  m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    m.sender === 'user'
                      ? 'bg-slate-900 text-white'
                      : 'bg-brand-600 text-white shadow-sm'
                  }`}
                >
                  {m.sender === 'user' ? 'You' : 'AI'}
                </div>

                <div className="space-y-3 min-w-0 flex-1">
                  <div
                    className={`p-4 rounded-xl text-sm leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-slate-900 text-white rounded-tr-none ml-auto'
                        : 'bg-slate-50 text-slate-800 border border-slate-200/80 rounded-tl-none shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>

                    {m.sender === 'assistant' && (
                      <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                        {m.response_time_ms ? (
                          <span>Latency: {m.response_time_ms} ms</span>
                        ) : <span>Verified grounded response</span>}
                        
                        <button
                          onClick={() => copyToClipboard(m.id, m.content)}
                          className="flex items-center gap-1 hover:text-slate-600 transition-colors"
                        >
                          {copiedId === m.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-600 font-medium">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Supporting Source Citations */}
                  {m.citations && m.citations.length > 0 && (
                    <div className="space-y-2 pl-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                        <FileCheck2 className="w-3.5 h-3.5 text-brand-600" />
                        <span>Supporting Passages ({m.citations.length})</span>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {m.citations.map((c, idx) => (
                          <CitationCard key={idx} citation={c} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {asking && (
            <div className="flex items-start gap-3.5 max-w-3xl">
              <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center text-xs font-bold shrink-0 animate-pulse">
                AI
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-sm text-slate-600 flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin shrink-0"></div>
                <span>Retrieving vector passages from Qdrant and generating grounded synthesis...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAsk();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              disabled={asking}
              placeholder={
                selectedDocIds.length > 0
                  ? `Ask a research question grounded in ${selectedDocIds.length} paper(s)...`
                  : "Please select at least one paper on the left to ask questions..."
              }
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 disabled:bg-slate-50"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!question.trim() || asking || selectedDocIds.length === 0}
              loading={asking}
              icon={Send}
            >
              Ask
            </Button>
          </form>
        </div>

      </div>

    </div>
  );
};

export default ChatPage;
