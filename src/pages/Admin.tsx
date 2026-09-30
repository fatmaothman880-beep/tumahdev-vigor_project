import React, { useState, useEffect } from 'react';
import { useAppData } from '../hooks/useAppData';
import { PageHeader } from '../components/ui/KpiCard';
import {
  Users,
  Shield,
  FileText,
  Database,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  Download,
  Zap,
  Server,
  KeyRound,
  UserCheck,
  UserX,
  PlusCircle,
  Copy,
  ExternalLink,
  Search,
} from 'lucide-react';
import { useAuth, UserRole } from '../auth/AuthContext';

interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  department: string;
  role: UserRole;
  status: 'Active' | 'Disabled' | 'Pending';
  createdAt: string;
  lastLoginAt?: string;
}

interface ActivityLogRecord {
  id: string;
  timestamp: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress?: string;
}

interface DbHealthStatus {
  status: string;
  database: string;
  provider: string;
  host: string;
  databaseName: string;
  user: string;
  message: string;
  lastChecked: string;
}

export function Admin() {
  const { systemSettings, api } = useAppData();
  const { user: currentAuthUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'USERS' | 'AUDIT' | 'CPANEL' | 'CONFIG'>('USERS');

  // Calculation parameters
  const [bufferHours, setBufferHours] = useState(String(systemSettings.postUnloadBerthBufferHours));
  const [paymentThreshold, setPaymentThreshold] = useState(String(systemSettings.paymentEligibilityThresholdPercent));
  const [savedSuccess, setSavedSuccess] = useState(false);

  // User management state
  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userActionMsg, setUserActionMsg] = useState<string | null>(null);

  // New staff modal state
  const [showAddUser, setShowAddUser] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('Turkys@2025');
  const [newName, setNewName] = useState('');
  const [newDept, setNewDept] = useState('Terminal Operations');
  const [newRole, setNewRole] = useState<UserRole>('Vessel Operation');

  // Audit logs state
  const [activityLogs, setActivityLogs] = useState<ActivityLogRecord[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logSearch, setLogSearch] = useState('');

  // Database diagnostic state
  const [dbHealth, setDbHealth] = useState<DbHealthStatus | null>(null);
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  // Fetch users
  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/v1/users', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('vigor_auth_token') || ''}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (e) {
      console.warn('Failed to fetch users:', e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fetch logs
  const loadLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const res = await fetch('/api/v1/activity-logs', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('vigor_auth_token') || ''}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setActivityLogs(data.map((entry: any) => ({
          ...entry, timestamp: entry.createdAt, entityType: entry.targetEntity, entityId: entry.targetId,
        })));
      }
    } catch (e) {
      console.warn('Failed to fetch logs:', e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Fetch DB health
  const checkDbHealth = async () => {
    setIsTestingDb(true);
    try {
      const res = await fetch('/api/v1/health/database');
      const data = await res.json();
      setDbHealth({
        ...data,
        provider: 'PostgreSQL',
        host: 'Operations backend',
        databaseName: 'Configured PostgreSQL database',
        user: 'Configured service account',
        message: res.ok ? 'PostgreSQL connection verified through the operations gateway.' : (data.detail || 'Database connection unavailable.'),
        lastChecked: new Date().toISOString(),
      });
    } catch (e: any) {
      setDbHealth({
        status: 'error',
        database: 'unreachable',
        provider: 'N/A',
        host: 'N/A',
        databaseName: 'N/A',
        user: 'N/A',
        message: e.message || 'Failed to ping database health endpoint',
        lastChecked: new Date().toISOString(),
      });
    } finally {
      setIsTestingDb(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'USERS') {
      loadUsers();
    } else if (activeTab === 'AUDIT') {
      loadLogs();
    } else if (activeTab === 'CPANEL') {
      checkDbHealth();
    }
  }, [activeTab]);

  const handleUpdateStatus = async (userId: string, status: 'Active' | 'Disabled') => {
    try {
      const res = await fetch(`/api/v1/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('vigor_auth_token') || ''}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        setUserActionMsg(`User status updated to ${status}.`);
        loadUsers();
        setTimeout(() => setUserActionMsg(null), 3000);
      }
    } catch (err: any) {
      setUserActionMsg(`Error: ${err.message}`);
    }
  };

  const handleUpdateRole = async (userId: string, role: UserRole) => {
    try {
      const res = await fetch(`/api/v1/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('vigor_auth_token') || ''}`,
        },
        body: JSON.stringify({ role }),
      });
      if (res.ok) {
        setUserActionMsg(`User role changed to ${role}.`);
        loadUsers();
        setTimeout(() => setUserActionMsg(null), 3000);
      }
    } catch (err: any) {
      setUserActionMsg(`Error: ${err.message}`);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.toLowerCase().endsWith('@turkysgroup.co.tz')) {
      alert('Email must end with @turkysgroup.co.tz');
      return;
    }

    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail.trim().toLowerCase(),
          password: newPassword,
          fullName: newName,
          department: newDept,
          requestedRole: newRole,
        }),
      });

      if (res.ok) {
        setShowAddUser(false);
        setNewEmail('');
        setNewName('');
        setUserActionMsg('Staff account successfully registered.');
        loadUsers();
        setTimeout(() => setUserActionMsg(null), 3000);
      } else {
        const data = await res.json();
        alert(data.error || 'Registration failed');
      }
    } catch (err: any) {
      alert(err.message || 'Registration error');
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    api.updateSystemSettings({
      postUnloadBerthBufferHours: Number(bufferHours) || 1.5,
      paymentEligibilityThresholdPercent: Number(paymentThreshold) || 100,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(api.exportState(), null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `vigor-port-ops-export-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.fullName?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.department?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredLogs = activityLogs.filter(
    (l) =>
      l.userEmail?.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.action?.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.details?.toLowerCase().includes(logSearch.toLowerCase()) ||
      l.entityType?.toLowerCase().includes(logSearch.toLowerCase())
  );

  const envSample = `# cPanel MySQL Connection Configuration for VIGOR
DB_HOST=localhost          # or cPanel server IP / remote MySQL host
DB_PORT=3306
DB_USER=cpaneluser_vigor
DB_PASSWORD=SecurePassword_2025!
DB_NAME=cpaneluser_vigor_port
AUTH_SECRET=`;

  const copyEnvSnippet = () => {
    navigator.clipboard.writeText(envSample);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        eyebrow="CORPORATE GOVERNANCE"
        title="Administration"
        description="Manage corporate access, review audit activity, and configure terminal settings."
      />

      {/* Tabs Bar */}
      <div className="flex border-b border-line gap-2 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('USERS')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition cursor-pointer border-b-2 ${
            activeTab === 'USERS'
              ? 'border-positive text-positive bg-surface'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users & access</span>
          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-positive-soft text-positive">
            {usersList.length || 4}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('AUDIT')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition cursor-pointer border-b-2 ${
            activeTab === 'AUDIT'
              ? 'border-positive text-positive bg-surface'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit trail</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CPANEL')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition cursor-pointer border-b-2 ${
            activeTab === 'CPANEL'
              ? 'border-positive text-positive bg-surface'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Database</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CONFIG')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition cursor-pointer border-b-2 ${
            activeTab === 'CONFIG'
              ? 'border-positive text-positive bg-surface'
              : 'border-transparent text-muted hover:text-foreground'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Terminal settings</span>
        </button>
      </div>

      {/* Action Notification Banner */}
      {userActionMsg && (
        <div className="p-3 bg-positive-soft border border-positive/30 text-xs text-positive rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{userActionMsg}</span>
          </div>
        </div>
      )}

      {/* ----------------- TAB 1: USERS ----------------- */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          <div className="bg-surface border border-line rounded-xl p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
              <div>
                <h3 className="text-base font-bold text-foreground">Authorized Turkys Group Personnel</h3>
                <p className="text-xs text-muted">
                  Only users with confirmed corporate emails (<code className="font-mono">@turkysgroup.co.tz</code>)
                  can access the system.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadUsers}
                  disabled={isLoadingUsers}
                  className="p-2 bg-canvas hover:bg-raised rounded-lg text-xs transition cursor-pointer"
                  title="Refresh user list"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingUsers ? 'animate-spin' : ''}`} />
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddUser(true)}
                  className="px-3 py-2 bg-brand-hover hover:bg-brand-hover text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Register Staff</span>
                </button>
              </div>
            </div>

            {/* Filter */}
            <div className="pt-3 pb-2 flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search staff by name, email, department..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-canvas border border-line rounded-lg text-xs"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-line text-muted font-semibold">
                    <th className="py-2.5 px-3">Name & Email</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Last Active</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60 font-medium">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-xs text-muted">
                        No users match query.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-surface">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-foreground">{u.fullName}</div>
                          <div className="text-[11px] font-mono text-muted">{u.email}</div>
                        </td>
                        <td className="py-2.5 px-3 text-foreground">{u.department || 'Terminal'}</td>
                        <td className="py-2.5 px-3">
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateRole(u.id, e.target.value as UserRole)}
                            className={`p-1 rounded text-[11px] font-semibold border cursor-pointer ${
                              u.role === 'Admin'
                                ? 'bg-raised text-muted border-muted/30'
                                : u.role === 'Management'
                                ? 'bg-info-soft text-info border-info/30'
                                : u.role === 'Vessel Operation'
                                ? 'bg-positive-soft text-positive border-positive/30'
                                : 'bg-canvas text-muted border-line'
                            }`}
                          >
                            <option value="Admin">Admin</option>
                            <option value="Management">Management</option>
                            <option value="Vessel Operation">Vessel Operation</option>
                            <option value="Viewer">Viewer</option>
                          </select>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              u.status === 'Active'
                                ? 'bg-positive-soft text-positive'
                                : u.status === 'Pending'
                                ? 'bg-warning-soft text-warning'
                                : 'bg-danger-soft text-danger'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] font-mono text-muted">
                          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {u.status === 'Active' ? (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(u.id, 'Disabled')}
                              className="px-2.5 py-1 text-[11px] text-danger hover:bg-danger-soft rounded border border-danger/30 transition cursor-pointer"
                            >
                              Deactivate
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(u.id, 'Active')}
                              className="px-2.5 py-1 text-[11px] text-positive hover:bg-positive-soft rounded border border-positive/30 transition cursor-pointer"
                            >
                              Activate
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Staff Modal */}
          {showAddUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
              <div className="bg-surface rounded-xl border border-line shadow-xl max-w-md w-full p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-line">
                  <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-positive" />
                    <span>Register Turkys Group Staff</span>
                  </h3>
                  <button
                    onClick={() => setShowAddUser(false)}
                    className="text-muted hover:text-foreground text-lg font-mono leading-none"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-foreground mb-1">Full Legal Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Salim Ali Mwamba"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="w-full p-2 bg-canvas border border-line rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-foreground mb-1">Company Email (@turkysgroup.co.tz)</label>
                    <input
                      type="email"
                      required
                      placeholder="staff.name@turkysgroup.co.tz"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full p-2 bg-canvas border border-line rounded-lg font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-foreground mb-1">Temporary Password</label>
                    <input
                      type="text"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-2 bg-canvas border border-line rounded-lg font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-foreground mb-1">Department</label>
                      <select
                        value={newDept}
                        onChange={(e) => setNewDept(e.target.value)}
                        className="w-full p-2 bg-canvas border border-line rounded-lg"
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
                      <label className="block font-semibold text-foreground mb-1">Assigned Role</label>
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as UserRole)}
                        className="w-full p-2 bg-canvas border border-line rounded-lg"
                      >
                        <option value="Vessel Operation">Vessel Operation</option>
                        <option value="Management">Management</option>
                        <option value="Admin">Admin</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-line flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddUser(false)}
                      className="px-3 py-1.5 rounded-lg border border-line text-xs font-semibold hover:bg-canvas"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-brand-hover hover:bg-brand-hover text-white text-xs font-semibold cursor-pointer"
                    >
                      Save & Authorize
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------- TAB 2: AUDIT LOGS ----------------- */}
      {activeTab === 'AUDIT' && (
        <div className="bg-surface border border-line rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
            <div>
              <h3 className="text-base font-bold text-foreground">Operational Activity & Security Trail</h3>
              <p className="text-xs text-muted">
                Tamper-evident logs of logins, pneumatic rate submissions, berth clearances, and user management.
              </p>
            </div>

            <button
              type="button"
              onClick={loadLogs}
              disabled={isLoadingLogs}
              className="p-2 bg-canvas hover:bg-raised rounded-lg text-xs transition cursor-pointer self-start sm:self-auto"
              title="Refresh logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="relative max-w-sm">
            <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit trail by user, action, details..."
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-canvas border border-line rounded-lg text-xs"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line text-muted font-semibold">
                  <th className="py-2.5 px-3">Timestamp (EAT)</th>
                  <th className="py-2.5 px-3">Actor / Email</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity</th>
                  <th className="py-2.5 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 font-medium">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-xs text-muted">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-surface">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-muted whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-foreground font-semibold">
                        {log.userEmail}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-canvas border border-line text-foreground font-bold">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-muted">
                        {log.entityType}: {log.entityId}
                      </td>
                      <td className="py-2.5 px-3 text-foreground">{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ----------------- TAB 3: CPANEL MYSQL ----------------- */}
      {activeTab === 'CPANEL' && (
        <div className="space-y-5">
          {/* Live Status Card */}
          <div className="bg-surface border border-line rounded-xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-line mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-positive-soft text-positive border border-positive/20">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">PostgreSQL Operations Database</h3>
                  <p className="text-xs text-muted">
                    Official database engine for VIGOR Cement Works port telemetry and vessel schedules.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={checkDbHealth}
                disabled={isTestingDb}
                className="px-3 py-1.5 bg-brand-hover hover:bg-brand-hover text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer shadow-2xs self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingDb ? 'animate-spin' : ''}`} />
                <span>{isTestingDb ? 'Testing...' : 'Test Connection'}</span>
              </button>
            </div>

            {/* Health Diagnostics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-4">
              <div className="p-3 rounded-lg bg-surface border border-line">
                <div className="text-[10px] text-muted uppercase font-mono">Engine State</div>
                <div className="text-xs font-bold mt-1 text-positive flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{dbHealth?.database === 'connected' ? 'PostgreSQL Connected' : 'Database Unavailable'}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface border border-line">
                <div className="text-[10px] text-muted uppercase font-mono">Host Endpoint</div>
                <div className="text-xs font-mono font-bold mt-1 text-foreground truncate">
                  {dbHealth?.host || 'localhost (3306)'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface border border-line">
                <div className="text-[10px] text-muted uppercase font-mono">Target Database</div>
                <div className="text-xs font-mono font-bold mt-1 text-foreground truncate">
                  {dbHealth?.databaseName || 'Configured PostgreSQL database'}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface border border-line">
                <div className="text-[10px] text-muted uppercase font-mono">Database User</div>
                <div className="text-xs font-mono font-bold mt-1 text-foreground truncate">
                  {dbHealth?.user || 'Configured service account'}
                </div>
              </div>
            </div>

            {dbHealth?.message && (
              <div className="p-3 rounded-lg bg-surface border border-line text-xs font-mono text-muted">
                <strong>Diagnostics:</strong> {dbHealth.message}
              </div>
            )}
          </div>

          {/* cPanel Setup Instructions for Turkys IT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-surface border border-line rounded-xl p-5 shadow-xs space-y-3">
              <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Server className="w-4 h-4 text-positive" />
                <span>Optional MySQL Account Adapter Setup</span>
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-xs text-muted leading-relaxed">
                <li>
                  <strong className="text-foreground">Log in to Turkys cPanel:</strong> Navigate to{' '}
                  <span className="font-mono">MySQL Databases</span>.
                </li>
                <li>
                  <strong className="text-foreground">Create New Database:</strong> e.g.{' '}
                  <code className="font-mono bg-canvas px-1 py-0.5 rounded">turkysgr_vigor_port</code>.
                </li>
                <li>
                  <strong className="text-foreground">Create Database User:</strong> Generate a strong alphanumeric password and assign it to the user.
                </li>
                <li>
                  <strong className="text-foreground">Grant Privileges:</strong> Under "Add User to Database", check{' '}
                  <strong className="text-foreground">ALL PRIVILEGES</strong> and apply changes.
                </li>
                <li>
                  <strong className="text-foreground">Import Relational Schema:</strong> Open{' '}
                  <span className="font-mono">phpMyAdmin</span>, select the database, click <em>Import</em>, and upload{' '}
                  <code className="font-mono bg-canvas px-1 py-0.5 rounded">/database/schema.sql</code> followed by{' '}
                  <code className="font-mono bg-canvas px-1 py-0.5 rounded">/database/demo_seed.sql</code>.
                </li>
              </ol>
            </div>

            <div className="bg-surface border border-line rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-positive" />
                  <span>Environment Variables Template</span>
                </h4>
                <button
                  type="button"
                  onClick={copyEnvSnippet}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded bg-canvas hover:bg-raised border border-line text-foreground flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedEnv ? 'Copied!' : 'Copy .env'}</span>
                </button>
              </div>

              <p className="text-xs text-muted">
                For the optional account adapter, configure these on the Node gateway <code className="font-mono">.env</code>:
              </p>

              <pre className="p-3 bg-shell text-positive rounded-lg font-mono text-[11px] overflow-x-auto whitespace-pre leading-snug">
                {envSample}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- TAB 4: CONFIGURATION & SCENARIOS ----------------- */}
      {activeTab === 'CONFIG' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Core Calculation Parameters */}
          <div className="lg:col-span-2 bg-surface border border-line rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-line mb-5">
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Sliders className="w-5 h-5 text-positive" />
                Downstream Calculation Parameters
              </h3>
              {savedSuccess && (
                <span className="text-xs font-semibold text-positive flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Changes saved
                </span>
              )}
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Post-Unload Berth Clearance Buffer (Hours)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    step="0.1"
                    value={bufferHours}
                    onChange={(e) => setBufferHours(e.target.value)}
                    className="w-32 p-2 bg-canvas border border-line rounded-lg font-mono font-bold"
                  />
                  <span className="text-muted">
                    Hours required after last cement tonne discharged for pneumatic line purge, disconnect, and castoff clearance (default 1.5h).
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Manufacturer Payment Gate Eligibility Threshold (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={paymentThreshold}
                    onChange={(e) => setPaymentThreshold(e.target.value)}
                    className="w-32 p-2 bg-canvas border border-line rounded-lg font-mono font-bold"
                  />
                  <span className="text-muted">
                    Percentage of advance commercial invoice required cleared in treasury before manufacturer confirms loading slot (Default: 100%).
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-line flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-brand-hover hover:bg-brand-hover text-white flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Apply Engine Parameters
                </button>
              </div>
            </form>
          </div>

          {/* Operational Scenarios & Data Management */}
          <div className="space-y-6">
            <div className="bg-surface border border-line rounded-xl p-5 shadow-xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-warning" />
                Interactive Operational Scenarios
              </h3>
              <p className="text-xs text-muted mb-4">
                Trigger operational test states to preview system-wide recalculations across berths, queues, and financial gates.
              </p>

              <div className="space-y-2.5">
                <button
                  onClick={() => api.loadPresetScenario('BASELINE')}
                  className="w-full text-left p-3 rounded-lg bg-canvas hover:bg-raised/60 border border-line transition text-xs cursor-pointer"
                >
                  <div className="font-bold text-foreground">1. Reset to Baseline Conflict</div>
                  <div className="text-[11px] text-muted mt-0.5">
                    V01 unloading, V03 arrives early (berth conflict), V01 payment pending.
                  </div>
                </button>

                <button
                  onClick={() => api.loadPresetScenario('SOLVE_PAYMENT')}
                  className="w-full text-left p-3 rounded-lg bg-positive-soft hover:bg-brand/20 border border-positive/40 transition text-xs cursor-pointer"
                >
                  <div className="font-bold text-positive">2. Solve Manufacturer Payment</div>
                  <div className="text-[11px] text-muted mt-0.5">
                    Clears remaining TZS 200M wire, unlocking V01 queue eligibility.
                  </div>
                </button>

                <button
                  onClick={() => api.loadPresetScenario('SOLVE_BERTH')}
                  className="w-full text-left p-3 rounded-lg bg-info-soft hover:bg-info-strong/20 border border-info/40 transition text-xs cursor-pointer"
                >
                  <div className="font-bold text-info">3. Eco-Steaming (Berth Synced)</div>
                  <div className="text-[11px] text-muted mt-0.5">
                    Adjusts MV VIGOR 03 speed to 8.5 kts, arriving right as B01 releases.
                  </div>
                </button>
              </div>
            </div>

            <div className="bg-surface border border-line rounded-xl p-5 shadow-xs">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground mb-3 flex items-center gap-2">
                <Database className="w-4 h-4 text-muted" />
                Data Persistence & Snapshot
              </h3>
              <p className="text-xs text-muted mb-4">
                Export full state snapshot (vessels, voyages, transactions, readings, alerts) for offline backup.
              </p>

              <button
                onClick={handleExportData}
                className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-surface border border-line hover:bg-canvas text-foreground flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Download className="w-4 h-4 text-positive" />
                <span>Export System State (JSON)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
