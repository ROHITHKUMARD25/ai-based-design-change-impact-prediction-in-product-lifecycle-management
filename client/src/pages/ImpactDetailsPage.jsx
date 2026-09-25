import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  GitPullRequest, AlertTriangle, CheckCircle2, XCircle, Clock, 
  ArrowLeft, ShieldCheck, ShieldAlert, BarChart2, DollarSign, Calendar, 
  Cpu, Wrench, Layers, MessageSquare, History, UserCheck, Lock 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ImpactDetailsPage({ changeRequestId, onBack }) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Status update modal / form state
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [approvalComment, setApprovalComment] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [changeRequestId]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/change-requests/${changeRequestId}`);
      setData(res.data);
    } catch (err) {
      console.error('Failed to load change request details:', err);
      setError('Failed to load impact prediction details.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!targetStatus) return;

    setUpdating(true);
    try {
      await api.patch(`/change-requests/${changeRequestId}/status`, {
        status: targetStatus,
        comments: approvalComment
      });

      setShowStatusModal(false);
      setApprovalComment('');
      fetchDetails(); // Refresh
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-slate-400">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Running graph analysis and fetching impact predictions...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-rose-400 bg-rose-500/10 rounded-2xl border border-rose-500/20 max-w-lg mx-auto my-8">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
        <p className="text-sm font-semibold">{error || 'Data unavailable'}</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-800 text-slate-200 text-xs rounded-xl">
          Back to Change Requests
        </button>
      </div>
    );
  }

  const { changeRequest: cr, predictions, auditLogs, summary } = data;
  const isManagerOrAdmin = ['manager', 'admin'].includes(user?.role);

  const statusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"><CheckCircle2 className="w-4 h-4"/> Approved</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40"><XCircle className="w-4 h-4"/> Rejected</span>;
      case 'implemented':
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-400 border border-purple-500/40"><CheckCircle2 className="w-4 h-4"/> Implemented</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40"><Clock className="w-4 h-4"/> Under Review</span>;
    }
  };

  const getScoreBadge = (score) => {
    if (score >= 80) {
      return <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 font-extrabold text-xs border border-rose-500/40 inline-flex items-center gap-1">Critical ({score})</span>;
    }
    if (score >= 65) {
      return <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-extrabold text-xs border border-amber-500/40 inline-flex items-center gap-1">High ({score})</span>;
    }
    if (score >= 45) {
      return <span className="px-2.5 py-1 rounded-lg bg-yellow-500/20 text-yellow-300 font-bold text-xs border border-yellow-500/40">Medium ({score})</span>;
    }
    return <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/40">Low ({score})</span>;
  };

  const impactTypeBadge = (type) => {
    const t = (type || '').toLowerCase();
    const map = {
      cost: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      schedule: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      compliance: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
      manufacturing: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      supplier: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
    };
    return (
      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase border ${map[t] || 'bg-slate-800 text-slate-300'}`}>
        {type}
      </span>
    );
  };

  const chartData = predictions.map(p => ({
    partName: p.part_number,
    score: p.impact_score,
    cost: p.predicted_cost_delta
  }));

  const BAR_COLORS = ['#ef4444', '#f59e0b', '#8b5cf6', '#3b82f6', '#10b981'];

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Back Button & Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold border border-slate-800 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Change Requests
        </button>

        <div className="flex items-center gap-3">
          {statusBadge(cr.status)}
        </div>
      </div>

      {/* Main ECN Header Panel */}
      <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-lg border border-indigo-500/30">
                {cr.id}
              </span>
              <span className="text-xs text-slate-400">Target Product: <strong className="text-white">{cr.product_name}</strong></span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {cr.title}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 mt-2 max-w-3xl leading-relaxed">
              {cr.description || 'No additional technical description provided.'}
            </p>
          </div>

          {/* Manager / Admin Approval Controls */}
          <div className="shrink-0 p-4 bg-slate-950/80 rounded-2xl border border-slate-800 text-right space-y-3 min-w-[220px]">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Approval Action</div>
            
            {cr.status === 'under_review' ? (
              isManagerOrAdmin ? (
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => { setTargetStatus('rejected'); setShowStatusModal(true); }}
                    className="px-3.5 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white font-semibold text-xs transition shadow-md flex items-center gap-1"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>

                  <button
                    onClick={() => { setTargetStatus('approved'); setShowStatusModal(true); }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-md flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve
                  </button>
                </div>
              ) : (
                <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-slate-400 text-xs flex items-center gap-2 justify-end">
                  <Lock className="w-3.5 h-3.5 text-amber-400" /> Approvals require Manager / Admin role
                </div>
              )
            ) : (
              <div className="text-xs font-bold text-slate-300">
                Decision finalized ({cr.status.toUpperCase()})
              </div>
            )}
          </div>
        </div>

        {/* Change Request Metadata Row */}
        <div className="pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">Target Changed Part</span>
            <span className="font-mono text-indigo-300 font-bold">{cr.part_number}</span>
            <div className="text-slate-300 text-[11px]">{cr.part_name}</div>
          </div>

          <div>
            <span className="text-slate-500 block">Requested By</span>
            <span className="font-semibold text-slate-200">{cr.requester_name || 'Engineer'}</span>
            <div className="text-slate-400 text-[11px]">{cr.requester_role || 'Avionics'}</div>
          </div>

          <div>
            <span className="text-slate-500 block">Supplier</span>
            <span className="font-semibold text-slate-200">{cr.part_supplier || 'Internal'}</span>
          </div>

          <div>
            <span className="text-slate-500 block">Submission Date</span>
            <span className="font-semibold text-slate-300">
              {new Date(cr.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Overall AI Risk Summary Banner */}
      <div className={`p-5 rounded-2xl border flex items-start gap-4 shadow-xl ${
        summary.riskLevel === 'CRITICAL' || summary.riskLevel === 'HIGH'
          ? 'bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/30 border-rose-500/30 text-rose-200'
          : 'bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900 border-emerald-500/30 text-emerald-200'
      }`}>
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 shrink-0">
          <ShieldAlert className="w-6 h-6 text-rose-400" />
        </div>

        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h3 className="text-base font-extrabold tracking-tight text-white">
              Automated Impact Prediction Summary
            </h3>
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
              summary.riskLevel === 'CRITICAL' ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50' : 'bg-amber-500/30 text-amber-300'
            }`}>
              {summary.riskLevel} SEVERITY
            </span>
          </div>
          
          <p className="text-xs sm:text-sm font-medium leading-relaxed">
            {summary.riskSummary}
          </p>
        </div>
      </div>

      {/* Impact Score Distribution Chart & Key Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Bar Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
          <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-indigo-400" /> Impact Score Severity Distribution
          </h3>
          <p className="text-xs text-slate-400 mb-4">Visualizing risk score per affected component</p>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="partName" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stat Highlights */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white mb-4">Impact Score Metrics</h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Total Affected Components:</span>
                <span className="font-extrabold text-white text-base">{summary.affectedPartsCount}</span>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Est. Total Cost Delta:</span>
                <span className="font-extrabold text-emerald-400 text-base">+${summary.totalCostDelta.toLocaleString()}</span>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Est. Max Schedule Delay:</span>
                <span className="font-extrabold text-amber-400 text-base">+{summary.maxDelayDays} days</span>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center">
                <span className="text-slate-400">Affected Suppliers:</span>
                <span className="font-bold text-indigo-300 text-sm">{summary.suppliersCount} Vendors</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Main Impact Predictions Table */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Affected Components Impact Predictions Breakdown</h3>
            <p className="text-xs text-slate-400">Sorted by impact score severity descending</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">Affected Component</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Impact Type</th>
                <th className="py-3.5 px-4">Impact Score</th>
                <th className="py-3.5 px-4">Est. Cost Delta</th>
                <th className="py-3.5 px-4">Est. Delay</th>
                <th className="py-3.5 px-4">Confidence</th>
                <th className="py-3.5 px-4 min-w-[300px]">AI Engineering Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {predictions.map(pred => (
                <tr key={pred.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-4 px-4">
                    <div className="font-bold text-slate-100">{pred.part_name}</div>
                    <div className="font-mono text-[11px] text-indigo-300">{pred.part_number}</div>
                    <div className="text-[10px] text-slate-500">Supplier: {pred.supplier}</div>
                  </td>

                  <td className="py-4 px-4 capitalize text-slate-300">
                    {pred.category}
                  </td>

                  <td className="py-4 px-4">
                    {impactTypeBadge(pred.impact_type)}
                  </td>

                  <td className="py-4 px-4">
                    {getScoreBadge(pred.impact_score)}
                  </td>

                  <td className="py-4 px-4 font-mono font-semibold text-emerald-400">
                    +${(pred.predicted_cost_delta || 0).toLocaleString()}
                  </td>

                  <td className="py-4 px-4 font-semibold text-amber-300">
                    +{pred.predicted_delay_days} days
                  </td>

                  <td className="py-4 px-4 text-indigo-300 font-mono font-semibold">
                    {Math.round(pred.confidence_score * 100)}%
                  </td>

                  <td className="py-4 px-4 text-slate-300 text-xs leading-relaxed bg-slate-950/40 rounded-xl">
                    {pred.explanation}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Timeline */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-400" /> Audit Trail & Decision History
        </h3>

        <div className="space-y-3">
          {auditLogs.map(log => (
            <div key={log.id} className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className={`px-2.5 py-0.5 rounded font-mono font-bold text-[11px] uppercase ${
                  log.action === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                  log.action === 'REJECTED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                  'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                }`}>
                  {log.action}
                </span>

                <div>
                  <div className="text-slate-200 font-semibold">{log.comments}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Performed by <strong className="text-slate-300">{log.user_name || 'System'}</strong> ({log.user_role || 'user'})
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 whitespace-nowrap">
                {new Date(log.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Approval / Rejection Comment Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-100">
            <h3 className="text-base font-bold text-white mb-2">
              Confirm {targetStatus.toUpperCase()} Decision
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Provide an engineering decision rationale or approval comment for audit logging.
            </p>

            <form onSubmit={handleStatusUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Audit Log Comment</label>
                <textarea
                  rows={3}
                  value={approvalComment}
                  onChange={(e) => setApprovalComment(e.target.value)}
                  placeholder={`Reason for ${targetStatus} status change...`}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 text-xs text-white outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 transition"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updating}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-md transition ${
                    targetStatus === 'approved' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                  }`}
                >
                  {updating ? 'Recording...' : `Confirm ${targetStatus.toUpperCase()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
