import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  History, 
  Search, 
  Trash2, 
  RotateCcw, 
  ExternalLink, 
  CheckCircle2, 
  X, 
  Sparkles 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getStoredQueries, deleteQueryRecord } from '../../lib/storage';
import type { QueryRecord } from '../../types';

export const LearningHistory: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [queries, setQueries] = useState<QueryRecord[]>(getStoredQueries(user?.id));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedQueryDetail, setSelectedQueryDetail] = useState<QueryRecord | null>(null);
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);

  React.useEffect(() => {
    setQueries(getStoredQueries(user?.id));
  }, [user?.id]);

  // Filtered queries
  const filteredQueries = useMemo(() => {
    return queries.filter((q) => {
      const matchSearch = q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (q.topic && q.topic.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchSubject = selectedSubject === 'All' || q.subject === selectedSubject;
      const matchStatus = selectedStatus === 'All' || q.status === selectedStatus;
      return matchSearch && matchSubject && matchStatus;
    });
  }, [queries, searchTerm, selectedSubject, selectedStatus]);

  const confirmDelete = () => {
    if (deleteCandidateId) {
      deleteQueryRecord(deleteCandidateId, user?.id);
      setQueries(getStoredQueries(user?.id));
      if (selectedQueryDetail?.id === deleteCandidateId) {
        setSelectedQueryDetail(null);
      }
      setDeleteCandidateId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
              <History className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Personalized Learning Log
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Learning History & Saved Queries
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review past questions, step-by-step solutions, verification notes, and mistake patterns.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/doubt')}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition flex items-center gap-2 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>Ask New Doubt</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
        
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search queries by keywords, concepts, or formulas..."
            className="w-full pl-10 pr-4 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
          />
        </div>

        {/* Subject Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="w-full md:w-auto px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="All">All Subjects</option>
            <option value="Physics">Physics</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Chemistry">Chemistry</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full md:w-auto px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Needs Review">Needs Review</option>
          </select>
        </div>
      </div>

      {/* History Items List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {filteredQueries.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No Learning History Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search filters or ask your first doubt to start tracking your learning progress.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredQueries.map((q) => (
              <div 
                key={q.id}
                className="p-5 hover:bg-slate-50/70 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700">
                      {q.subject}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {q.topic || 'Concept Question'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      • {new Date(q.createdAt).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      {q.solution?.verificationStatus || 'Verified'}
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-800 line-clamp-2">
                    {q.questionText}
                  </p>

                  {q.solution && (
                    <p className="text-[11px] text-slate-500 font-medium">
                      Answer: <span className="font-semibold text-slate-700">{q.solution.finalAnswer}</span>
                    </p>
                  )}
                </div>

                {/* Item Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedQueryDetail(q)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition flex items-center gap-1.5"
                  >
                    <span>View Solution</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate(`/practice?topic=${encodeURIComponent(q.topic || '')}`)}
                    className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition"
                    title="Retry / Practice Concept"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteCandidateId(q.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Query Detail Modal */}
      {selectedQueryDetail && selectedQueryDetail.solution && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in-95">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-700">
                  {selectedQueryDetail.subject}
                </span>
                <span className="text-xs font-bold text-slate-700">
                  {selectedQueryDetail.topic}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedQueryDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Question</h3>
              <p className="text-sm font-bold text-slate-900 leading-relaxed">
                {selectedQueryDetail.questionText}
              </p>
            </div>

            {/* Verification Badge */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 space-y-1">
              <div className="font-extrabold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verification Status: {selectedQueryDetail.solution.verificationStatus}</span>
              </div>
              <p className="text-[11px] text-emerald-700">
                {selectedQueryDetail.solution.verificationDetails}
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Solution Steps</h4>
              {selectedQueryDetail.solution.solutionSteps.map((step) => (
                <div key={step.stepNumber} className="pl-4 border-l-2 border-indigo-200 space-y-1">
                  <p className="text-xs font-bold text-slate-800">
                    Step {step.stepNumber}: {step.title}
                  </p>
                  {step.calculationOrFormula && (
                    <div className="p-2 rounded-lg bg-slate-50 font-mono text-xs font-bold text-indigo-900">
                      {step.calculationOrFormula}
                    </div>
                  )}
                  <p className="text-xs text-slate-600">{step.explanation}</p>
                </div>
              ))}
            </div>

            {/* Final Answer */}
            <div className="p-3.5 rounded-2xl bg-indigo-600 text-white">
              <p className="text-[10px] font-bold uppercase text-indigo-200">Final Answer</p>
              <p className="text-sm font-bold">{selectedQueryDetail.solution.finalAnswer}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedQueryDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const topic = selectedQueryDetail.topic || '';
                  setSelectedQueryDetail(null);
                  navigate(`/practice?topic=${encodeURIComponent(topic)}`);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow-xs"
              >
                Practice this Topic
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidateId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Delete Question Record?</h3>
              <p className="text-xs text-slate-500 mt-1">
                This action cannot be undone. The question and verified solution will be permanently removed from your learning log.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCandidateId(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
