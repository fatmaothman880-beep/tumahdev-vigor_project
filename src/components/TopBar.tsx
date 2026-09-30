import React, { useState } from 'react';
import { useLiveClock } from '../hooks/useAppData';
import { Bell, RefreshCw, Menu, LogOut, ChevronDown, Sparkles } from 'lucide-react';
import { Alert } from '../types';
import { ConnectionInfo, API_BASE_URL } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Modal } from './ui/Modal';

interface TopBarProps {
  currentPageTitle: string; alerts: Alert[]; connectionInfo: ConnectionInfo;
  onOpenMobileSidebar: () => void; onNavigateToAlerts: () => void; onResetDemo: () => void;
  onOpenAssistant: () => void; onNavigateToAdmin?: () => void; onTestConnection?: () => void;
}
export function TopBar({ currentPageTitle, alerts, connectionInfo, onOpenMobileSidebar, onNavigateToAlerts, onResetDemo, onOpenAssistant, onNavigateToAdmin, onTestConnection }: TopBarProps) {
  const { user, logout } = useAuth();
  const { eatTime } = useLiveClock();
  const [showStatus, setShowStatus] = useState(false);
  const [testing, setTesting] = useState(false);
  const count = alerts.filter(a => !a.acknowledged).length;
  const offline = connectionInfo.connectionStatus === 'API OFFLINE';
  const checking = connectionInfo.apiHealth === 'checking';
  const connected = connectionInfo.connectionStatus === 'DATABASE CONNECTED';
  const check = async () => { setTesting(true); try { await onTestConnection?.(); } finally { setTesting(false); } };
  return <>
    <header className="sticky top-0 z-30 bg-canvas border-b border-line px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-2 max-w-[1560px] mx-auto">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onOpenMobileSidebar} className="icon-button md:hidden" aria-label="Open navigation drawer"><Menu className="w-5 h-5" /></button>
          <div className="hidden lg:block text-xs text-muted">Mangapwani <span className="mx-2 text-line">/</span> Zanzibar terminal</div>
          <span className="md:hidden text-xs font-semibold truncate">VIGOR</span>
          <span className="sr-only">Current section: {currentPageTitle}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-3">
          <time className="hidden xl:block text-xs text-muted tabular-nums">{eatTime.slice(0, 5)} EAT</time>
          <button onClick={() => setShowStatus(true)} className={`button-ghost !px-2 ${offline ? 'text-danger' : ''}`} title={connected ? 'FastAPI & PostgreSQL connected' : 'Connection details'}>
            <span className={`w-1.5 h-1.5 rounded-full ${checking ? 'bg-warning' : connected ? 'bg-positive' : offline ? 'bg-danger' : 'bg-info'}`} />
            <span className="hidden sm:inline">{checking ? 'Connecting' : connected ? 'Connected' : offline ? 'Offline' : connectionInfo.connectionStatus === 'DEMO MODE' ? 'Demo' : 'API online'}</span>
            <span className="sr-only sm:hidden">Connection details</span>
          </button>
          <button onClick={onOpenAssistant} className="button-secondary !px-2.5" title="Ask Vigor Operations Assistant" aria-label="Open operations assistant"><Sparkles className="w-4 h-4 text-info" /><span className="hidden sm:inline">Assistant</span></button>
          <button onClick={onNavigateToAlerts} className="icon-button relative" title="View Active Operational Alerts" aria-label={`Alerts, ${count} unread`}><Bell className="w-4 h-4" />{count > 0 && <span className="absolute right-1 top-1 w-1.5 h-1.5 rounded-full bg-danger" />}</button>
          <details className="relative border-l border-line pl-2">
            <summary className="flex items-center gap-2 list-none cursor-pointer rounded-lg px-1 py-1" aria-label="Account menu">
              <span className="w-8 h-8 rounded-full bg-raised text-foreground flex items-center justify-center text-xs font-medium">{user?.fullName?.split(' ').map(n => n[0]).slice(0, 2).join('') || 'TG'}</span>
              <span className="hidden lg:block text-xs">{user?.fullName}</span><ChevronDown className="w-3 h-3 text-muted" />
            </summary>
            <div className="absolute right-0 top-full mt-3 w-64 panel p-3 shadow-xl space-y-2 z-40">
              <div className="px-2 py-2 border-b border-line"><p className="text-sm font-medium">{user?.fullName}</p><p className="text-xs text-muted break-all mt-1">{user?.email}</p><p className="text-xs text-muted mt-2">{user?.role}{['Viewer', 'Management'].includes(user?.role || '') ? ' · Read-only access' : ''}</p><p className="text-xs text-muted">{user?.department}</p></div>
              <button onClick={logout} className="button-ghost w-full !justify-start" title="Sign out of Turkys Group system"><LogOut className="w-4 h-4" />Sign out</button>
              <button onClick={onResetDemo} disabled={!['Admin', 'Vessel Operation'].includes(user?.role || '')} className="button-ghost w-full !justify-start text-warning" title="Reset system to standard baseline demo scenario"><RefreshCw className="w-4 h-4" />Reset demo scenario</button>
            </div>
          </details>
        </div>
      </div>
    </header>
    {offline && !checking && <div role="status" className="px-6 py-2 bg-danger-soft/40 border-b border-danger/20 flex flex-wrap items-center gap-3 text-xs"><span className="flex-1 text-danger">Connection unavailable. Displayed records may be out of date.</span><button onClick={() => void check()} disabled={testing} className="button-ghost">{testing ? 'Checking…' : 'Retry connection'}</button></div>}
    <Modal isOpen={showStatus} onClose={() => setShowStatus(false)} title="Connection details" maxWidth="max-w-md">
      <dl className="space-y-4 text-sm">
        {[['Gateway API', API_BASE_URL], ['Connection', connectionInfo.connectionStatus], ['Database', connectionInfo.databaseStatus], ['Last checked', connectionInfo.lastChecked ? new Date(connectionInfo.lastChecked).toLocaleTimeString() : 'Not checked yet']].map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt className="text-muted">{label}</dt><dd className="text-right break-all">{value}</dd></div>)}
      </dl>
      {connectionInfo.errorMessage && <p className="text-xs text-danger bg-danger-soft rounded-lg p-3 mt-5">{connectionInfo.errorMessage}</p>}
      <div className="flex flex-wrap justify-end gap-2 mt-6">{onTestConnection && <button disabled={testing} onClick={() => void check()} className="button-secondary">{testing ? 'Checking…' : 'Test connection'}</button>}{onNavigateToAdmin && <button onClick={() => { setShowStatus(false); onNavigateToAdmin(); }} className="button-primary">Open administration</button>}</div>
    </Modal>
  </>;
}
