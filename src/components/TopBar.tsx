import React, { useState } from 'react';
import { useLiveClock } from '../hooks/useAppData';
import { Bell, RefreshCw, Menu, Wifi, WifiOff, Database, Server, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { Alert } from '../types';
import { ConnectionInfo, API_BASE_URL } from '../api/client';

interface TopBarProps {
  currentPageTitle: string;
  alerts: Alert[];
  connectionInfo: ConnectionInfo;
  onOpenMobileSidebar: () => void;
  onNavigateToAlerts: () => void;
  onResetDemo: () => void;
  onOpenAssistant: () => void;
  onNavigateToAdmin?: () => void;
  onTestConnection?: () => void;
}

export function TopBar({
  currentPageTitle,
  alerts,
  connectionInfo,
  onOpenMobileSidebar,
  onNavigateToAlerts,
  onResetDemo,
  onOpenAssistant,
  onNavigateToAdmin,
  onTestConnection,
}: TopBarProps) {
  const { eatTime } = useLiveClock();
  const unreadAlerts = alerts.filter((a) => !a.acknowledged);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleQuickTest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onTestConnection) {
      setIsTesting(true);
      try {
        await onTestConnection();
      } finally {
        setIsTesting(false);
      }
    }
  };

  const getStatusBadge = () => {
    switch (connectionInfo.connectionStatus) {
      case 'DATABASE CONNECTED':
        return (
          <button
            onClick={() => setShowStatusModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded-full bg-[#E7F4EB] text-[#0A7A3D] border border-[#0C9349]/30 hover:bg-[#D8EEDF] transition cursor-pointer"
            title="FastAPI & PostgreSQL connected"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0C9349] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0C9349]" />
            </span>
            <Database className="w-3 h-3" />
            <span className="font-semibold tracking-wide">DATABASE CONNECTED</span>
          </button>
        );
      case 'LIVE API':
        return (
          <button
            onClick={() => setShowStatusModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded-full bg-[#E4F1F2] text-[#0E7C86] border border-[#0E7C86]/30 hover:bg-[#D5EAEC] transition cursor-pointer"
            title="FastAPI connected"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0E7C86] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0E7C86]" />
            </span>
            <Server className="w-3 h-3" />
            <span className="font-semibold tracking-wide">LIVE API</span>
          </button>
        );
      case 'API OFFLINE':
        return (
          <button
            onClick={() => setShowStatusModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium rounded-full bg-[#FCEBEA] text-[#AE3B2E] border border-[#AE3B2E]/30 hover:bg-[#F9DCDA] transition cursor-pointer animate-pulse"
            title="FastAPI backend offline. Click for diagnostics."
          >
            <WifiOff className="w-3 h-3 text-[#AE3B2E]" />
            <span className="font-semibold tracking-wide">API OFFLINE</span>
          </button>
        );
      case 'DEMO MODE':
      default:
        return (
          <button
            onClick={() => setShowStatusModal(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-mono uppercase tracking-wider rounded bg-[#F4EBDB] text-[#B5760F] border border-[#C99A5B]/40 hover:bg-[#EBDCC5] transition cursor-pointer whitespace-nowrap"
            title="Operating in client-side demo mode"
          >
            DEMO MODE — MOCK DATA
          </button>
        );
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-[#E1DED4] px-4 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-4 max-w-[1400px] mx-auto">
          {/* Left: Mobile trigger & Page title + breadcrumb */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenMobileSidebar}
              className="md:hidden p-1.5 rounded-lg text-[#3F4A47] hover:bg-[#F7F5F0] hover:text-[#14181A] transition"
              aria-label="Open navigation drawer"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <div className="text-[11px] font-medium text-[#3F4A47] tracking-wider uppercase flex items-center gap-1.5">
                <span>Smart Port Operations</span>
                <span className="text-[#C9C4B6]">·</span>
                <span className="text-[#0A7A3D] font-semibold">Vigor Cement Works</span>
              </div>
              <h1 className="text-base sm:text-lg font-bold text-[#14181A] leading-tight">
                {currentPageTitle}
              </h1>
            </div>
          </div>

          {/* Right: Live clock, status badges, alert trigger, reset demo & user avatar */}
          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Live Operations Indicator */}
            <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 bg-[#E7F4EB] text-[#0A7A3D] rounded-full border border-[#0C9349]/30 text-xs font-mono font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0C9349] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0C9349]" />
              </span>
              <span className="font-semibold tracking-wide">LIVE OPERATIONS</span>
              <span className="text-[#3F4A47] font-normal">| {eatTime} EAT</span>
            </div>

            {/* Backend Connectivity Status Badge */}
            {getStatusBadge()}

            {/* AI Operations Assistant Button */}
            <button
              onClick={onOpenAssistant}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#E4F1F2] text-[#0E7C86] border border-[#0E7C86]/30 hover:bg-[#0E7C86] hover:text-white transition"
              title="Ask Vigor Operations Assistant"
            >
              <span className="font-bold">AI</span> Assistant
            </button>

            {/* Reset Demo State Button */}
            <button
              onClick={onResetDemo}
              className="p-1.5 rounded-lg text-[#3F4A47] hover:bg-[#F7F5F0] hover:text-[#14181A] transition border border-transparent hover:border-[#E1DED4]"
              title="Reset system to standard baseline demo scenario"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Notifications Bell */}
            <button
              onClick={onNavigateToAlerts}
              className="relative p-1.5 rounded-lg text-[#3F4A47] hover:bg-[#F7F5F0] hover:text-[#14181A] transition"
              title="View Active Operational Alerts"
            >
              <Bell className="w-4 h-4" />
              {unreadAlerts.length > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-[#AE3B2E] text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadAlerts.length}
                </span>
              )}
            </button>

            {/* User Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-[#E1DED4]">
              <div className="w-8 h-8 rounded-full bg-[#14181A] text-white flex items-center justify-center text-xs font-mono font-bold tracking-wider">
                OM
              </div>
              <div className="hidden xl:block text-left leading-tight">
                <div className="text-xs font-bold text-[#14181A]">Operations Mgr</div>
                <div className="text-[10px] text-[#3F4A47]">Zanzibar Port HQ</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Persistent Offline Diagnostic Notice Bar if API is configured but offline */}
      {connectionInfo.connectionStatus === 'API OFFLINE' && (
        <div className="bg-[#AE3B2E] text-white px-4 py-2 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 max-w-[1400px] mx-auto w-full">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <div className="flex-1 truncate">
              <span className="font-bold">FastAPI Backend Offline: </span>
              <span>
                Unable to reach <code className="font-mono bg-black/20 px-1 py-0.5 rounded">{API_BASE_URL}</code>.
                Running in resilient local cache mode.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleQuickTest}
                disabled={isTesting}
                className="px-2.5 py-1 bg-white text-[#AE3B2E] rounded font-semibold text-[11px] hover:bg-neutral-100 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                {isTesting ? 'Checking...' : 'Test Connection'}
              </button>
              {onNavigateToAdmin && (
                <button
                  onClick={onNavigateToAdmin}
                  className="px-2.5 py-1 bg-black/20 hover:bg-black/30 rounded font-semibold text-[11px] transition"
                >
                  Diagnostic Details
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Diagnostic Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl border border-[#E1DED4] shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E1DED4]">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-[#0C9349]" />
                <h3 className="font-bold text-sm text-[#14181A]">Backend Connection Status</h3>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="text-[#3F4A47] hover:text-[#14181A] text-lg font-mono leading-none"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#E1DED4]/60">
                <span className="text-[#3F4A47]">FastAPI Base URL:</span>
                <span className="font-mono font-bold text-[#14181A]">{API_BASE_URL}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E1DED4]/60">
                <span className="text-[#3F4A47]">Connection State:</span>
                <span className="font-bold">
                  {connectionInfo.connectionStatus === 'DATABASE CONNECTED' && (
                    <span className="text-[#0A7A3D] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Full Stack Live
                    </span>
                  )}
                  {connectionInfo.connectionStatus === 'LIVE API' && (
                    <span className="text-[#0E7C86] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> API Healthy
                    </span>
                  )}
                  {connectionInfo.connectionStatus === 'API OFFLINE' && (
                    <span className="text-[#AE3B2E] flex items-center gap-1">
                      <WifiOff className="w-3.5 h-3.5" /> Offline / Unreachable
                    </span>
                  )}
                  {connectionInfo.connectionStatus === 'DEMO MODE' && (
                    <span className="text-[#B5760F]">Client Demo Mock Store</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E1DED4]/60">
                <span className="text-[#3F4A47]">Database Status:</span>
                <span className="font-mono font-semibold uppercase">
                  {connectionInfo.databaseStatus}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-[#E1DED4]/60">
                <span className="text-[#3F4A47]">Last Checked:</span>
                <span className="font-mono text-[#3F4A47]">
                  {connectionInfo.lastChecked
                    ? new Date(connectionInfo.lastChecked).toLocaleTimeString()
                    : 'Not checked yet'}
                </span>
              </div>

              {connectionInfo.errorMessage && (
                <div className="p-3 rounded-lg bg-[#FCEBEA] border border-[#AE3B2E]/30 text-[#AE3B2E]">
                  <div className="font-bold mb-1">Diagnostic Detail:</div>
                  <div className="font-mono text-[11px] break-all">{connectionInfo.errorMessage}</div>
                  {connectionInfo.isCorsError && (
                    <div className="mt-2 text-[11px] text-[#3F4A47] bg-white p-2 rounded border border-[#AE3B2E]/20">
                      <strong>CORS Advisory:</strong> The browser blocked requests to FastAPI. Ensure FastAPI has <code className="font-mono">CORSMiddleware</code> configured with <code className="font-mono">allow_origins=["*"]</code> or your frontend origin.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E1DED4]">
              {onTestConnection && (
                <button
                  onClick={handleQuickTest}
                  disabled={isTesting}
                  className="px-3 py-1.5 rounded-lg bg-[#F7F5F0] hover:bg-[#E1DED4] text-xs font-semibold text-[#14181A] transition flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  {isTesting ? 'Testing...' : 'Test Now'}
                </button>
              )}
              {onNavigateToAdmin && (
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    onNavigateToAdmin();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#0C9349] hover:bg-[#0A7A3D] text-white text-xs font-semibold transition"
                >
                  Open Admin Center
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
