import React, { useState, useEffect } from 'react';
import api from '../api';
import { 
  Package, GitPullRequest, AlertTriangle, DollarSign, Clock, ArrowUpRight, 
  BarChart2, ShieldCheck, Activity, PlusCircle, CheckCircle2, XCircle, ChevronRight 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function DashboardPage({ onNavigate, onOpenCreateCR, onSelectCR }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/dashboard');
        setData(res.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
        setError('Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-400">Loading PLM intelligence analytics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center text-rose-400 bg-rose-500/10 rounded-2xl border border-rose-500/20 max-w-lg mx-auto my-12">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
        <p className="text-sm font-semibold">{error || 'Could not load data'}</p>
      </div>
    );
  }

  const { metrics, recentCRs, categoryBreakdown } = data;

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
    if (score >= 80) return <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-xs border border-rose-500/40">Critical ({score})</span>;
    if (score >= 65) return <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/40">High ({score})</span>;
    if (score >= 45) return <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-bold text-xs border border-yellow-500/40">Medium ({score})</span>;
    return <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-xs border border-emerald-500/40">Low ({score})</span>;
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            PLM Change Impact Executive Dashboard
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time graph traversal, supplier risk scoring, and cost/schedule delay predictions.
          </p>
        </div>

        <button
          onClick={onOpenCreateCR}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 transition shrink-0"
        >
          <PlusCircle className="w-4 h-4" /> Create Change Request
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Card 1: Total Products */}
        <div 
          onClick={() => onNavigate('products')}
          className="glass-card p-5 rounded-2xl cursor-pointer transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Products</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white">{metrics.totalProducts}</div>
            <div className="text-xs text-indigo-300 mt-1 flex items-center gap-1 font-medium">
              <span>{metrics.totalParts} total BOM components</span> <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        {/* Card 2: Open Change Requests */}
        <div 
          onClick={() => onNavigate('change-requests')}
          className="glass-card p-5 rounded-2xl cursor-pointer transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Open Change Requests</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <GitPullRequest className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-white">{metrics.openChangeRequests}</div>
            <div className="text-xs text-amber-300 mt-1 flex items-center gap-1 font-medium">
              <span>{metrics.totalChangeRequests} total requests logged</span>
            </div>
          </div>
        </div>

        {/* Card 3: High Risk Predictions */}
        <div 
          onClick={() => onNavigate('change-requests')}
          className="glass-card p-5 rounded-2xl cursor-pointer transition flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">High Risk Predictions</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-rose-400">{metrics.highRiskPredictionsThisMonth}</div>
            <div className="text-xs text-rose-300 mt-1 font-medium">
              Components exceeding 70% risk severity
            </div>
          </div>
        </div>

        {/* Card 4: Financial Risk Exposure */}
        <div className="glass-card p-5 rounded-2xl transition flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Estimated Cost Impact</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-400">
              ${(metrics.totalCostRisk || 0).toLocaleString()}
            </div>
            <div className="text-xs text-emerald-300 mt-1 font-medium">
              Cumulative predicted cost delta
            </div>
          </div>
        </div>

      </div>

      {/* Middle Section: Chart & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Breakdown Bar Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-400" /> Component Categories Distribution
              </h3>
              <p className="text-xs text-slate-400">BOM breakdown across mechanical, electrical, and structural domains</p>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="category" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Action Panel */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Active System Status
            </h3>
            <p className="text-xs text-slate-400 mb-4">PLM Impact Prediction Engine active & monitoring graph changes.</p>

            <div className="space-y-3">
              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs flex items-center justify-between">
                <span className="text-slate-300 font-medium">BOM Graph Traversal Engine</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Online
                </span>
              </div>

              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs flex items-center justify-between">
                <span className="text-slate-300 font-medium">AI Impact Explainer</span>
                <span className="text-indigo-400 font-semibold">Active (Rules + LLM)</span>
              </div>

              <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs flex items-center justify-between">
                <span className="text-slate-300 font-medium">Role-Based Access Control</span>
                <span className="text-purple-400 font-semibold">Enforced</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('products')}
            className="mt-6 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition flex items-center justify-center gap-2"
          >
            Explore Product BOM Trees <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Recent Change Requests Table */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <GitPullRequest className="w-4 h-4 text-indigo-400" /> Recent Change Requests & Impact Analysis
            </h3>
            <p className="text-xs text-slate-400">Click any request to view its full component impact prediction table</p>
          </div>

          <button
            onClick={() => onNavigate('change-requests')}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Title & ECN ID</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Target Part</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Max Risk</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentCRs.map(cr => (
                <tr 
                  key={cr.id}
                  onClick={() => onSelectCR(cr.id)}
                  className="hover:bg-slate-800/40 cursor-pointer transition"
                >
                  <td className="py-3.5 px-4 font-semibold text-slate-100 max-w-xs truncate">
                    {cr.title}
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">{cr.product_name}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded text-[11px]">
                      {cr.part_number}
                    </span>
                    <span className="text-slate-400 ml-1.5">{cr.part_name}</span>
                  </td>
                  <td className="py-3.5 px-4">{statusBadge(cr.status)}</td>
                  <td className="py-3.5 px-4">{riskBadge(cr.max_score)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onSelectCR(cr.id); }}
                      className="px-3 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white font-semibold text-[11px] transition"
                    >
                      Impact Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
