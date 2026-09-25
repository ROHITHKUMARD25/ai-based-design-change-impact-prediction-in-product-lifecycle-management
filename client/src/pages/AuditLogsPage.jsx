import React, { useState, useEffect } from 'react';
import api from '../api';
import { History, UserCheck, CheckCircle2, XCircle, GitPullRequest, Clock } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await api.get('/audit-logs');
        setLogs(res.data.logs || []);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const actionBadge = (action) => {
    switch (action) {
      case 'APPROVED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"><CheckCircle2 className="w-3 h-3"/> APPROVED</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40"><XCircle className="w-3 h-3"/> REJECTED</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/40"><GitPullRequest className="w-3 h-3"/> {action}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      <div className="glass-panel p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" /> Enterprise PLM Audit Trail & Governance Log
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Immutable history of change request submissions, manager approvals, rejections, and system predictions.
        </p>
      </div>

      <div className="glass-panel p-6 rounded-2xl">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading audit log entries...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">No audit log records found.</div>
        ) : (
          <div className="relative border-l-2 border-slate-800 ml-4 space-y-6">
            {logs.map(log => (
              <div key={log.id} className="relative pl-6">
                
                {/* Timeline node dot */}
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-900 border-2 border-indigo-500" />

                <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {actionBadge(log.action)}
                      <span className="text-xs font-bold text-white truncate max-w-xs">{log.change_request_title}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {log.comments}
                  </p>

                  <div className="pt-2 border-t border-slate-800/60 flex items-center gap-2 text-[11px] text-slate-400">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Performed by: <strong className="text-slate-200">{log.user_name || 'System'}</strong></span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] uppercase font-mono">{log.user_role}</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
