import React, { useState } from 'react';
import { useAppData } from '../hooks/useAppData';
import { PageHeader } from '../components/ui/KpiCard';
import {
  RefreshCw,
  Save,
  Download,
  Sliders,
  CheckCircle2,
  Database,
  Zap,
  Server,
  WifiOff,
  Radio,
  ArrowDownCircle,
  AlertTriangle,
} from 'lucide-react';
import { API_BASE_URL, USE_MOCK_API } from '../api/client';

export function Admin() {
  const { systemSettings, connectionInfo, api } = useAppData();

  const [bufferHours, setBufferHours] = useState(String(systemSettings.postUnloadBerthBufferHours));
  const [paymentThreshold, setPaymentThreshold] = useState(String(systemSettings.paymentEligibilityThresholdPercent));
  const [refreshInterval, setRefreshInterval] = useState(String(systemSettings.trackingRefreshIntervalSeconds));
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Backend test & sync states
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    api.updateSystemSettings({
      postUnloadBerthBufferHours: Number(bufferHours) || 1.5,
      paymentEligibilityThresholdPercent: Number(paymentThreshold) || 100,
      trackingRefreshIntervalSeconds: Number(refreshInterval) || 300,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleTestConnection = async () => {
    setIsTestingConn(true);
    setTestResult(null);
    try {
      const res = await api.testConnection(true);
      if (res.connectionStatus === 'DATABASE CONNECTED') {
        setTestResult('Success: FastAPI backend and PostgreSQL database are healthy.');
      } else if (res.connectionStatus === 'LIVE API') {
        setTestResult('FastAPI online. (Database status: ' + res.databaseStatus + ')');
      } else if (res.connectionStatus === 'DEMO MODE') {
        setTestResult('System running in DEMO MODE (VITE_USE_MOCK_API=true).');
      } else {
        setTestResult(`Backend unreachable: ${res.errorMessage || 'Unknown error'}`);
      }
    } catch (err: any) {
      setTestResult(`Connection failed: ${err.message}`);
    } finally {
      setIsTestingConn(false);
    }
  };

  const handleSyncBackend = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      await api.syncFromBackend();
      setSyncResult('Synchronized latest fleet vessels, berths, and active visit dashboard.');
      setTimeout(() => setSyncResult(null), 4000);
    } catch (err: any) {
      setSyncResult(`Sync failed: ${err.message}`);
    } finally {
      setIsSyncing(false);
    }
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

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        eyebrow="SYSTEM CONFIGURATION"
        title="Administration & Infrastructure"
        description="Global parameters governing downstream dependency algorithms, FastAPI backend connectivity, financial gate thresholds, and scenario testing."
      />

      {/* Backend Infrastructure Card */}
      <div className="bg-white border border-[#E1DED4] rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E1DED4] mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#E7F4EB] text-[#0A7A3D] border border-[#0C9349]/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold tracking-wider text-[#3F4A47] uppercase">
                Backend Infrastructure & Services
              </div>
              <h3 className="text-base font-bold text-[#14181A]">
                FastAPI + PostgreSQL Port Operations Engine
              </h3>
            </div>
          </div>

          {/* Current Status Pill */}
          <div className="flex items-center gap-2">
            {connectionInfo.connectionStatus === 'DATABASE CONNECTED' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7F4EB] text-[#0A7A3D] border border-[#0C9349]/30 text-xs font-mono font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0C9349] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0C9349]" />
                </span>
                DATABASE CONNECTED
              </span>
            )}
            {connectionInfo.connectionStatus === 'LIVE API' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E4F1F2] text-[#0E7C86] border border-[#0E7C86]/30 text-xs font-mono font-bold">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0E7C86] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0E7C86]" />
                </span>
                LIVE API
              </span>
            )}
            {connectionInfo.connectionStatus === 'API OFFLINE' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FCEBEA] text-[#AE3B2E] border border-[#AE3B2E]/30 text-xs font-mono font-bold">
                <WifiOff className="w-3.5 h-3.5" />
                API OFFLINE
              </span>
            )}
            {connectionInfo.connectionStatus === 'DEMO MODE' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4EBDB] text-[#B5760F] border border-[#C99A5B]/40 text-xs font-mono font-bold">
                <Radio className="w-3.5 h-3.5" />
                DEMO MODE — MOCK
              </span>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs mb-5">
          <div className="p-3 bg-[#F7F5F0] rounded-lg border border-[#E1DED4]">
            <div className="text-[10px] font-bold text-[#3F4A47] uppercase tracking-wider">FastAPI Endpoint</div>
            <div className="font-mono font-bold text-[#14181A] truncate mt-1" title={API_BASE_URL}>
              {API_BASE_URL}
            </div>
            <div className="text-[10px] text-[#3F4A47] mt-0.5">Configured via VITE_API_URL</div>
          </div>

          <div className="p-3 bg-[#F7F5F0] rounded-lg border border-[#E1DED4]">
            <div className="text-[10px] font-bold text-[#3F4A47] uppercase tracking-wider">API Health (/health)</div>
            <div className="font-mono font-bold capitalize mt-1 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  connectionInfo.apiHealth === 'healthy'
                    ? 'bg-[#0C9349]'
                    : connectionInfo.apiHealth === 'checking'
                    ? 'bg-[#B5760F] animate-pulse'
                    : 'bg-[#AE3B2E]'
                }`}
              />
              {connectionInfo.apiHealth}
            </div>
            <div className="text-[10px] text-[#3F4A47] mt-0.5">Service: {connectionInfo.serviceName}</div>
          </div>

          <div className="p-3 bg-[#F7F5F0] rounded-lg border border-[#E1DED4]">
            <div className="text-[10px] font-bold text-[#3F4A47] uppercase tracking-wider">Database (/health/database)</div>
            <div className="font-mono font-bold uppercase mt-1 flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  connectionInfo.databaseStatus === 'connected'
                    ? 'bg-[#0C9349]'
                    : connectionInfo.databaseStatus === 'checking'
                    ? 'bg-[#B5760F] animate-pulse'
                    : 'bg-[#AE3B2E]'
                }`}
              />
              {connectionInfo.databaseStatus}
            </div>
            <div className="text-[10px] text-[#3F4A47] mt-0.5">PostgreSQL Engine</div>
          </div>

          <div className="p-3 bg-[#F7F5F0] rounded-lg border border-[#E1DED4]">
            <div className="text-[10px] font-bold text-[#3F4A47] uppercase tracking-wider">Last Health Check</div>
            <div className="font-mono font-semibold text-[#14181A] mt-1">
              {connectionInfo.lastChecked
                ? new Date(connectionInfo.lastChecked).toLocaleTimeString()
                : 'Not checked'}
            </div>
            <div className="text-[10px] text-[#3F4A47] mt-0.5">
              Auto-polled every 30s
            </div>
          </div>
        </div>

        {/* Diagnostic Feedback / Error message if any */}
        {connectionInfo.errorMessage && (
          <div className="mb-4 p-3.5 rounded-lg bg-[#FCEBEA] border border-[#AE3B2E]/30 text-xs text-[#AE3B2E] space-y-2">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Connection Notice:</span>
            </div>
            <div className="font-mono text-[11px] bg-white/60 p-2 rounded border border-[#AE3B2E]/20">
              {connectionInfo.errorMessage}
            </div>
            <p className="text-[11px] text-[#3F4A47]">
              The application automatically operates in resilient local fallback mode with realistic Zanzibar Port operational state.
              To connect your real FastAPI instance, start the server (<code className="font-mono bg-black/5 px-1">uvicorn main:app --reload --port 8000</code>) and verify CORS allows this origin.
            </p>
          </div>
        )}

        {testResult && (
          <div className="mb-4 p-3 rounded-lg bg-[#F7F5F0] border border-[#E1DED4] text-xs font-mono text-[#14181A]">
            {testResult}
          </div>
        )}

        {syncResult && (
          <div className="mb-4 p-3 rounded-lg bg-[#E7F4EB] border border-[#0C9349]/30 text-xs font-semibold text-[#0A7A3D] flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            {syncResult}
          </div>
        )}

        {/* Actions bar */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-[#E1DED4]">
          <button
            onClick={handleTestConnection}
            disabled={isTestingConn}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#0C9349] hover:bg-[#0A7A3D] text-white flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTestingConn ? 'animate-spin' : ''}`} />
            {isTestingConn ? 'Testing Endpoint...' : 'Test Connection'}
          </button>

          <button
            onClick={handleSyncBackend}
            disabled={isSyncing || connectionInfo.connectionStatus === 'API OFFLINE'}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-white border border-[#E1DED4] hover:bg-[#F7F5F0] text-[#14181A] flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40"
          >
            <ArrowDownCircle className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Fleet & Berths'}
          </button>

          <div className="text-[11px] text-[#3F4A47] ml-auto">
            Mode: <span className="font-bold font-mono">{USE_MOCK_API ? 'VITE_USE_MOCK_API=true' : 'VITE_USE_MOCK_API=false (Real API Preferred)'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Calculation Parameters */}
        <div className="lg:col-span-2 bg-white border border-[#E1DED4] rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E1DED4] mb-5">
            <h3 className="text-base font-bold text-[#14181A] flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#0C9349]" />
              Downstream Calculation Parameters
            </h3>
            {savedSuccess && (
              <span className="text-xs font-semibold text-[#0A7A3D] flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Changes saved
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
            <div>
              <label className="block font-semibold text-[#14181A] mb-1">
                Post-Unload Berth Clearance Buffer (Hours)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.1"
                  value={bufferHours}
                  onChange={(e) => setBufferHours(e.target.value)}
                  className="w-32 p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg font-mono font-bold"
                />
                <span className="text-[#3F4A47]">
                  Hours required after last cement tonne discharged for pneumatic line purge, disconnect, and castoff clearance (default 1.5h).
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#14181A] mb-1">
                Manufacturer Payment Gate Eligibility Threshold (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={paymentThreshold}
                  onChange={(e) => setPaymentThreshold(e.target.value)}
                  className="w-32 p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg font-mono font-bold"
                />
                <span className="text-[#3F4A47]">
                  Percentage of advance commercial invoice required cleared in treasury before manufacturer confirms loading slot (Default: 100%).
                </span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#14181A] mb-1">
                Live AIS Telemetry Polling Rate (Seconds)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(e.target.value)}
                  className="w-32 p-2 bg-[#F7F5F0] border border-[#E1DED4] rounded-lg font-mono font-bold"
                />
                <span className="text-[#3F4A47]">
                  Interval between vessel GPS position updates before telemetry is flagged as stale.
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E1DED4] flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#0C9349] hover:bg-[#0A7A3D] text-white flex items-center gap-1.5 transition shadow-xs cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Apply Engine Parameters
              </button>
            </div>
          </form>
        </div>

        {/* Operational Scenarios & Data Management */}
        <div className="space-y-6">
          <div className="bg-white border border-[#E1DED4] rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#14181A] mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#B5760F]" />
              Interactive Operational Scenarios
            </h3>
            <p className="text-xs text-[#3F4A47] mb-4">
              Trigger operational test states to preview system-wide recalculations across berths, queues, and financial gates.
            </p>

            <div className="space-y-2.5">
              <button
                onClick={() => api.loadPresetScenario('BASELINE')}
                className="w-full text-left p-3 rounded-lg bg-[#F7F5F0] hover:bg-[#E1DED4]/60 border border-[#E1DED4] transition text-xs cursor-pointer"
              >
                <div className="font-bold text-[#14181A]">1. Reset to Baseline Conflict</div>
                <div className="text-[11px] text-[#3F4A47] mt-0.5">
                  V01 unloading, V03 arrives early (berth conflict), V01 payment pending.
                </div>
              </button>

              <button
                onClick={() => api.loadPresetScenario('SOLVE_PAYMENT')}
                className="w-full text-left p-3 rounded-lg bg-[#E7F4EB] hover:bg-[#0C9349]/20 border border-[#0C9349]/40 transition text-xs cursor-pointer"
              >
                <div className="font-bold text-[#0A7A3D]">2. Solve Manufacturer Payment</div>
                <div className="text-[11px] text-[#3F4A47] mt-0.5">
                  Clears remaining TZS 200M wire, unlocking V01 queue eligibility.
                </div>
              </button>

              <button
                onClick={() => api.loadPresetScenario('SOLVE_BERTH')}
                className="w-full text-left p-3 rounded-lg bg-[#E4F1F2] hover:bg-[#0E7C86]/20 border border-[#0E7C86]/40 transition text-xs cursor-pointer"
              >
                <div className="font-bold text-[#0E7C86]">3. Eco-Steaming (Berth Synced)</div>
                <div className="text-[11px] text-[#3F4A47] mt-0.5">
                  Adjusts MV VIGOR 03 speed to 8.5 kts, arriving right as B01 releases.
                </div>
              </button>
            </div>
          </div>

          <div className="bg-white border border-[#E1DED4] rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#14181A] mb-3 flex items-center gap-2">
              <Database className="w-4 h-4 text-[#3F4A47]" />
              Data Persistence & Snapshot
            </h3>
            <p className="text-xs text-[#3F4A47] mb-4">
              Export full state snapshot (vessels, voyages, transactions, readings, alerts) for offline backup.
            </p>

            <button
              onClick={handleExportData}
              className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-white border border-[#E1DED4] hover:bg-[#F7F5F0] text-[#14181A] flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#0C9349]" />
              <span>Export System State (JSON)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
