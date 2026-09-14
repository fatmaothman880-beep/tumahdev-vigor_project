import React, { useState } from 'react';
import { useAuth, DEMO_CREDENTIALS, UserRole } from '../auth/AuthContext';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Anchor,
  UserCheck,
  Building,
  KeyRound,
} from 'lucide-react';

export function Login() {
  const { login, quickLoginAs, register, error, clearError, isLoading } = useAuth();

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('Terminal Operations');
  const [requestedRole, setRequestedRole] = useState<UserRole>('Operations');
  const [regSuccess, setRegSuccess] = useState<string | null>(null);
  const [formValidation, setFormValidation] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidation(null);
    clearError();

    const normalized = email.trim().toLowerCase();
    if (!normalized.endsWith('@turkysgroup.co.tz')) {
      setFormValidation('Access restricted: Only official @turkysgroup.co.tz corporate email addresses are authorized.');
      return;
    }

    if (mode === 'LOGIN') {
      await login(normalized, password);
    } else {
      if (!fullName.trim()) {
        setFormValidation('Please provide your full legal name.');
        return;
      }
      try {
        const msg = await register(normalized, password, fullName, department, requestedRole);
        setRegSuccess(msg);
        setMode('LOGIN');
      } catch (err: any) {
        setFormValidation(err.message || 'Registration error');
      }
    }
  };

  const handleQuickLogin = async (role: UserRole) => {
    setFormValidation(null);
    clearError();
    await quickLoginAs(role);
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col justify-between text-[#14181A] px-4 py-8 select-none">
      {/* Top Brand Bar */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between pb-6 border-b border-[#E1DED4]">
        <div className="flex items-center gap-3">
          <div className="bg-white border border-[#E1DED4] px-3.5 py-1.5 rounded shadow-2xs">
            <span className="font-mono font-extrabold text-sm tracking-widest text-[#0A7A3D]">VIGOR</span>
            <span className="text-[10px] font-bold text-[#14181A] tracking-wider ml-1 uppercase">CEMENT</span>
          </div>
          <div className="hidden sm:block border-l border-[#E1DED4] pl-3">
            <div className="text-xs font-bold text-[#14181A]">Smart Port Operations & Berth Intelligence</div>
            <div className="text-[10px] text-[#5A6764]">VIGOR Cement Works · Turkys Group of Companies</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-[#5A6764]">
          <span className="w-2 h-2 rounded-full bg-[#0A7A3D]" />
          <span>ZNZ Terminal Secure Gateway</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-md mx-auto my-auto pt-6 pb-10">
        <div className="bg-white border border-[#E1DED4] rounded-2xl shadow-sm overflow-hidden">
          {/* Card Header */}
          <div className="p-6 bg-gradient-to-b from-[#FAF9F5] to-white border-b border-[#E1DED4]">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E7F4EB] text-[#0A7A3D] text-[11px] font-mono font-semibold border border-[#0C9349]/20 mb-3">
              <Shield className="w-3.5 h-3.5" />
              <span>Turkys Group Single Sign-On</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[#14181A]">
              {mode === 'LOGIN' ? 'Corporate Staff Sign In' : 'Request Staff Account'}
            </h2>
            <p className="text-xs text-[#5A6764] mt-1 leading-relaxed">
              {mode === 'LOGIN'
                ? 'Sign in to access vessel scheduling, berth pneumatic discharge telemetry, and operational decisions.'
                : 'Submit your Turkys Group corporate details for administrator authorization.'}
            </p>
          </div>

          {/* Form Body */}
          <div className="p-6 space-y-5">
            {/* Feedback Banners */}
            {(formValidation || error) && (
              <div className="p-3 rounded-lg bg-[#FCEBEA] border border-[#AE3B2E]/30 text-xs text-[#AE3B2E] flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="leading-snug">{formValidation || error}</div>
              </div>
            )}

            {regSuccess && (
              <div className="p-3 rounded-lg bg-[#E7F4EB] border border-[#0C9349]/30 text-xs text-[#0A7A3D] flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="leading-snug">{regSuccess}</div>
              </div>
            )}

            {/* Email Domain Warning Notice */}
            <div className="p-2.5 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg text-[11px] text-[#5A6764] flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-[#0A7A3D] shrink-0" />
              <span>
                Domain restricted to <strong className="text-[#14181A] font-mono">@turkysgroup.co.tz</strong>
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {mode === 'REGISTER' && (
                <>
                  <div>
                    <label className="block font-semibold text-[#14181A] mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Salim Ali Mwamba"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full p-2.5 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg focus:outline-none focus:border-[#0A7A3D] text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#14181A] mb-1">Department</label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full p-2.5 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg focus:outline-none focus:border-[#0A7A3D] text-xs font-medium"
                    >
                      <option value="Terminal Operations">Terminal Operations</option>
                      <option value="Marine Dispatch">Marine Dispatch</option>
                      <option value="Executive Office">Executive Office</option>
                      <option value="Finance & Accounts">Finance & Accounts</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Compliance & Audit">Compliance & Audit</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#14181A] mb-1">Requested Operational Role</label>
                    <select
                      value={requestedRole}
                      onChange={(e) => setRequestedRole(e.target.value as UserRole)}
                      className="w-full p-2.5 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg focus:outline-none focus:border-[#0A7A3D] text-xs font-medium"
                    >
                      <option value="Operations">Operations (Port Dispatcher / Berths)</option>
                      <option value="Management">Management (Executive Dashboard & AI)</option>
                      <option value="Viewer">Viewer (Read-Only Status Monitor)</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block font-semibold text-[#14181A] mb-1">Company Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#7C8884] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="user@turkysgroup.co.tz"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg focus:outline-none focus:border-[#0A7A3D] text-xs font-medium font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#14181A] mb-1">Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-[#7C8884] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg focus:outline-none focus:border-[#0A7A3D] text-xs font-medium font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-[#0A7A3D] hover:bg-[#086331] text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <span>Authenticating...</span>
                ) : mode === 'LOGIN' ? (
                  <>
                    <span>Sign In to VIGOR OS</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Submit Account Request</span>
                    <UserCheck className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN');
                  setFormValidation(null);
                  clearError();
                }}
                className="text-xs text-[#0A7A3D] hover:underline font-medium"
              >
                {mode === 'LOGIN'
                  ? 'New employee? Request corporate account approval'
                  : 'Already registered? Return to sign in'}
              </button>
            </div>
          </div>

          {/* Quick Demo Accounts for Management & Evaluator Testing */}
          <div className="p-5 bg-[#FAF9F5] border-t border-[#E1DED4]">
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-[11px] font-bold text-[#14181A] uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#0A7A3D]" />
                <span>Management / Reviewer Quick Access</span>
              </div>
              <span className="text-[10px] text-[#5A6764] font-mono">1-Click Auth</span>
            </div>

            <p className="text-[11px] text-[#5A6764] mb-3">
              Click any pre-authorized Turkys Group staff role to evaluate the system instantly:
            </p>

            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(DEMO_CREDENTIALS) as UserRole[]).map((r) => {
                const c = DEMO_CREDENTIALS[r];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleQuickLogin(r)}
                    disabled={isLoading}
                    className="text-left p-2.5 bg-white hover:bg-[#E7F4EB]/50 border border-[#E1DED4] hover:border-[#0A7A3D] rounded-lg transition cursor-pointer group shadow-2xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#14181A] group-hover:text-[#0A7A3D]">{r}</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#F7F5F0] text-[#5A6764]">
                        {r === 'Admin' ? 'FULL' : r === 'Management' ? 'CEO' : r === 'Operations' ? 'DISPATCH' : 'READ'}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#5A6764] font-mono truncate mt-0.5">{c.email}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Corporate Disclaimers */}
      <div className="w-full max-w-5xl mx-auto pt-6 border-t border-[#E1DED4] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#7C8884]">
        <div>
          © {new Date().getFullYear()} Vigor Cement Works · Turkys Group of Companies. All rights reserved.
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono">
          <span>Zanzibar Head Office</span>
          <span>·</span>
          <span>Malindi Quay Bulk Terminal</span>
          <span>·</span>
          <span className="text-[#0A7A3D] font-bold">VIGOR OS v2.4</span>
        </div>
      </div>
    </div>
  );
}
