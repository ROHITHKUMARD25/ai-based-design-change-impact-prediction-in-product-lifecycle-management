import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Cpu, ShieldCheck, Zap, Lock, Mail, User, Building, AlertCircle, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';

export default function AuthPage() {
  const { login, signup } = useAuth();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'signup'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');

  // Login Form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Signup Form state
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [companyRole, setCompanyRole] = useState('');
  const [signupRole, setSignupRole] = useState('engineer');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await login(loginEmail, loginPassword);
    } catch (err) {
      const msg = err.response?.data?.error || 'Invalid credentials. Please check your email and password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      await signup({
        full_name: fullName,
        email: signupEmail,
        company_role: companyRole,
        role: signupRole,
        password,
        confirm_password: confirmPassword
      });
    } catch (err) {
      const msg = err.response?.data?.error || 'Sign up failed. Email already registered or invalid inputs.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (email, defaultRole) => {
    setError('');
    setLoginEmail(email);
    setLoginPassword('Password123!');
    setLoading(true);
    try {
      await login(email, 'Password123!');
    } catch (err) {
      setError('Failed to login with demo account.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setForgotMsg('Please enter your registered email address.');
      return;
    }
    setForgotMsg('Password reset link sent! Check your inbox for instructions.');
    setTimeout(() => {
      setShowForgotModal(false);
      setForgotMsg('');
      setForgotEmail('');
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[300px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Brand Header */}
      <div className="text-center mb-8 relative z-10 max-w-lg">
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <Cpu className="w-4 h-4 text-indigo-400" /> Enterprise PLM Intelligence
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
          Design Change Impact Predictor
        </h1>
        <p className="text-slate-400 text-sm sm:text-base">
          AI-driven graph traversal & predictive risk analysis for product lifecycle management.
        </p>
      </div>

      {/* Main Auth Card */}
      <div className="w-full max-w-md bg-[#0f172a]/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden relative z-10">
        
        {/* Tab Header */}
        <div className="flex border-b border-slate-800 bg-[#0b1120]">
          <button
            type="button"
            onClick={() => { setActiveTab('login'); setError(''); }}
            className={`flex-1 py-4 text-center text-sm font-semibold transition-all relative ${
              activeTab === 'login' ? 'text-indigo-400 bg-slate-900/60' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Log In
            {activeTab === 'login' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('signup'); setError(''); }}
            className={`flex-1 py-4 text-center text-sm font-semibold transition-all relative ${
              activeTab === 'signup' ? 'text-indigo-400 bg-slate-900/60' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign Up
            {activeTab === 'signup' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500" />}
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 sm:p-8">
          
          {/* Inline Validation Error Banner */}
          {error && (
            <div className="mb-6 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* LOGIN TAB */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="engineer@acmplm.com"
                    className="w-full bg-slate-900/90 border border-slate-700/70 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-900/90 border border-slate-700/70 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {loading ? 'Authenticating...' : (
                  <>
                    Sign In to Dashboard <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Demo Accounts Quick Selector */}
              <div className="mt-6 pt-5 border-t border-slate-800">
                <p className="text-xs font-medium text-slate-400 mb-2 text-center uppercase tracking-wider">
                  Quick Demo Login (One Click)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('engineer@acmplm.com', 'engineer')}
                    className="py-2 px-2 bg-slate-900 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/40 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition flex flex-col items-center gap-1"
                  >
                    <span className="text-indigo-400 font-bold">Engineer</span>
                    <span className="text-[10px] text-slate-500">View & Submit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('manager@acmplm.com', 'manager')}
                    className="py-2 px-2 bg-slate-900 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-500/40 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition flex flex-col items-center gap-1"
                  >
                    <span className="text-emerald-400 font-bold">Manager</span>
                    <span className="text-[10px] text-slate-500">Approve/Reject</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('admin@acmplm.com', 'admin')}
                    className="py-2 px-2 bg-slate-900 hover:bg-purple-950/60 border border-slate-800 hover:border-purple-500/40 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition flex flex-col items-center gap-1"
                  >
                    <span className="text-purple-400 font-bold">Admin</span>
                    <span className="text-[10px] text-slate-500">Full Access</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* SIGNUP TAB */}
          {activeTab === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. Elena Rostova"
                    className="w-full bg-slate-900/90 border border-slate-700/70 focus:border-indigo-500 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="elena@acme-space.com"
                    className="w-full bg-slate-900/90 border border-slate-700/70 focus:border-indigo-500 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Company / Title</label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={companyRole}
                      onChange={(e) => setCompanyRole(e.target.value)}
                      placeholder="Systems Lead"
                      className="w-full bg-slate-900/90 border border-slate-700/70 focus:border-indigo-500 rounded-xl py-2 pl-10 pr-3 text-xs text-slate-100 placeholder-slate-500 outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Role Type</label>
                  <select
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-700/70 focus:border-indigo-500 rounded-xl py-2 px-3 text-xs text-slate-100 outline-none transition"
                  >
                    <option value="engineer">Engineer</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 chars"
                    className="w-full bg-slate-900/90 border border-slate-700/70 focus:border-indigo-500 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Confirm Password *</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full bg-slate-900/90 border border-slate-700/70 focus:border-indigo-500 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-medium py-3 rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : (
                  <>
                    Create Account & Log In <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2">Reset Your Password</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter your registered email address and we will send a password reset verification link.
            </p>
            {forgotMsg && (
              <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-300 text-xs">
                {forgotMsg}
              </div>
            )}
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="engineer@acmplm.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition"
                >
                  Send Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
