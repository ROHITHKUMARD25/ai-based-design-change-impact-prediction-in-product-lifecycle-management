import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Cpu, LayoutDashboard, Layers, GitPullRequest, History, LogOut, PlusCircle, UserCheck } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenCreateCR }) {
  const { user, logout } = useAuth();

  const roleColors = {
    admin: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    manager: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    engineer: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0a0f1d]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Impact Predictor <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">PLM v2.4</span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Product Design Change Risk Intelligence</p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'products' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> Products & BOM
            </button>

            <button
              onClick={() => setActiveTab('change-requests')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'change-requests' || activeTab === 'cr-details' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <GitPullRequest className="w-3.5 h-3.5" /> Change Requests
            </button>

            <button
              onClick={() => setActiveTab('audit-logs')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition ${
                activeTab === 'audit-logs' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <History className="w-3.5 h-3.5" /> Audit Trail
            </button>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenCreateCR}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md transition"
            >
              <PlusCircle className="w-4 h-4" /> New Change Request
            </button>

            {/* User Badge */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-200">{user?.full_name}</div>
                <div className="flex items-center justify-end gap-1">
                  <span className={`text-[10px] uppercase font-mono font-bold px-1.5 py-0.2 rounded border ${roleColors[user?.role] || 'text-slate-400'}`}>
                    {user?.role}
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                title="Log Out"
                className="p-2 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/60 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="md:hidden flex border-t border-slate-800/80 bg-slate-950 px-2 py-1.5 justify-around">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-3 py-1 text-xs rounded ${activeTab === 'dashboard' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-3 py-1 text-xs rounded ${activeTab === 'products' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
        >
          BOM Tree
        </button>
        <button
          onClick={() => setActiveTab('change-requests')}
          className={`px-3 py-1 text-xs rounded ${activeTab === 'change-requests' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
        >
          Requests
        </button>
        <button
          onClick={() => setActiveTab('audit-logs')}
          className={`px-3 py-1 text-xs rounded ${activeTab === 'audit-logs' ? 'text-indigo-400 font-bold' : 'text-slate-400'}`}
        >
          Audit
        </button>
      </div>
    </header>
  );
}
