import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  GitPullRequest, Filter, Search, PlusCircle, CheckCircle2, 
  XCircle, Clock, AlertTriangle, ArrowRight, DollarSign, Calendar 
} from 'lucide-react';

export default function ChangeRequestsPage({ onSelectCR, onOpenCreateCR }) {
  const [changeRequests, setChangeRequests] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchChangeRequests();
  }, [selectedProductId, selectedStatus]);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      setProducts(res.data.products);
    } catch (err) {
      console.error('Failed to load products:', err);
    }
  };

  const fetchChangeRequests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedProductId) params.product_id = selectedProductId;
      if (selectedStatus) params.status = selectedStatus;

      const res = await api.get('/change-requests', { params });
      setChangeRequests(res.data.changeRequests || []);
    } catch (err) {
      console.error('Failed to load change requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredCRs = changeRequests.filter(cr => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      cr.title.toLowerCase().includes(q) ||
      cr.part_name.toLowerCase().includes(q) ||
      cr.part_number.toLowerCase().includes(q) ||
      (cr.requester_name && cr.requester_name.toLowerCase().includes(q))
    );
  });

  const statusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"><CheckCircle2 className="w-3 h-3"/> Approved</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30"><XCircle className="w-3 h-3"/> Rejected</span>;
      case 'implemented':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30"><CheckCircle2 className="w-3 h-3"/> Implemented</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30"><Clock className="w-3 h-3"/> Under Review</span>;
    }
  };

  const riskBadge = (score) => {
    if (!score) return <span className="text-xs text-slate-500">Unscored</span>;
    if (score >= 80) return <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/40">Critical Risk ({score})</span>;
    if (score >= 65) return <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/40">High Risk ({score})</span>;
    if (score >= 45) return <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-bold text-xs border border-yellow-500/40">Medium ({score})</span>;
    return <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/40">Low ({score})</span>;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-indigo-400" /> Engineering Change Requests (ECN)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Browse proposed design changes, review automated impact predictions, and approve/reject requests.
          </p>
        </div>

        <button
          onClick={onOpenCreateCR}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 transition shrink-0"
        >
          <PlusCircle className="w-4 h-4" /> New Change Request
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="glass-card p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 border border-slate-800">
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Product Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-indigo-500"
            >
              <option value="">All Products</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="implemented">Implemented</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ECN title, part..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
          />
        </div>

      </div>

      {/* Change Requests Grid / Table */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading change requests...</div>
      ) : filteredCRs.length === 0 ? (
        <div className="py-16 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-slate-800">
          <GitPullRequest className="w-8 h-8 mx-auto mb-2 text-slate-600" />
          <p className="text-sm font-semibold">No change requests found</p>
          <p className="text-xs text-slate-500 mt-1">Try resetting your filters or submit a new change request.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCRs.map(cr => (
            <div
              key={cr.id}
              onClick={() => onSelectCR(cr.id)}
              className="glass-panel p-5 rounded-2xl cursor-pointer hover:border-indigo-500/40 transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className="text-[11px] font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {cr.id}
                  </span>
                  <div>{statusBadge(cr.status)}</div>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition mb-2">
                  {cr.title}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                  {cr.description || 'No detailed description provided.'}
                </p>

                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1.5 text-xs mb-4">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Target Product:</span>
                    <span className="font-semibold text-slate-200">{cr.product_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Changed Part:</span>
                    <span className="font-mono text-indigo-300">{cr.part_number} ({cr.part_name})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Requester:</span>
                    <span className="text-slate-300">{cr.requester_name || 'Engineer'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>{riskBadge(cr.max_impact_score)}</div>
                  <span className="text-[11px] text-slate-400">
                    <strong>{cr.affected_parts_count}</strong> parts affected
                  </span>
                </div>

                <button className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1 transition">
                  Impact Predictions <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
