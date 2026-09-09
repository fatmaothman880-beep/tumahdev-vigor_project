import React, { useState } from 'react';
import { useAppData } from './hooks/useAppData';
import { Sidebar, NavPageId } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { Dashboard } from './pages/Dashboard';
import { ControlTower } from './pages/ControlTower';
import { Vessels } from './pages/Vessels';
import { VesselDetail } from './pages/VesselDetail';
import { Berths } from './pages/Berths';
import { Voyages } from './pages/Voyages';
import { Tracking } from './pages/Tracking';
import { ManufacturerQueue } from './pages/ManufacturerQueue';
import { Fuel } from './pages/Fuel';
import { Payments } from './pages/Payments';
import { AlertsPage } from './pages/AlertsPage';
import { Reports, History } from './pages/Reports';
import { Admin } from './pages/Admin';
import { AiAssistantModal } from './components/AiAssistantModal';

export function App() {
  const { alerts, api, connectionInfo } = useAppData();
  const [currentPage, setCurrentPage] = useState<NavPageId>('dashboard');
  const [selectedVesselId, setSelectedVesselId] = useState<string>('v-01');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Navigate to single vessel
  const handleSelectVessel = (vesselId: string) => {
    setSelectedVesselId(vesselId);
    setCurrentPage('vessel-detail');
  };

  const getPageTitle = (): string => {
    switch (currentPage) {
      case 'dashboard':
        return 'Operations Dashboard';
      case 'control-tower':
        return 'Operations Control Tower';
      case 'vessels':
        return 'Fleet Vessels';
      case 'vessel-detail':
        return 'Single-Vessel Control Centre';
      case 'berths':
        return 'VIGOR Berth Operations';
      case 'voyages':
        return 'Voyage Rotations';
      case 'tracking':
        return 'Live Vessel Tracking';
      case 'manufacturer-queue':
        return 'Manufacturer Queue & Loading Slots';
      case 'fuel':
        return 'Fuel & Bunkering Operations';
      case 'payments':
        return 'Finance Center & Payment Gateways';
      case 'alerts':
        return 'Delays & Operational Alerts';
      case 'reports':
        return 'Operational Reports & Shift Handoff';
      case 'history':
        return 'Voyage History & Archives';
      case 'admin':
        return 'System Administration & Settings';
      default:
        return 'Smart Port Operations';
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col md:flex-row text-[#14181A] antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={(page) => setCurrentPage(page)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        alerts={alerts}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Sticky TopBar */}
        <TopBar
          currentPageTitle={getPageTitle()}
          alerts={alerts}
          connectionInfo={connectionInfo}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onNavigateToAlerts={() => setCurrentPage('alerts')}
          onResetDemo={() => api.loadPresetScenario('BASELINE')}
          onOpenAssistant={() => setIsAssistantOpen(true)}
          onNavigateToAdmin={() => setCurrentPage('admin')}
          onTestConnection={() => api.testConnection(true)}
        />

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1400px] w-full mx-auto">
          {currentPage === 'dashboard' && (
            <Dashboard
              onSelectVessel={handleSelectVessel}
              onNavigateToPayments={() => setCurrentPage('payments')}
              onNavigateToBerths={() => setCurrentPage('berths')}
              onNavigateToAlerts={() => setCurrentPage('alerts')}
            />
          )}

          {currentPage === 'control-tower' && (
            <ControlTower
              onSelectVessel={handleSelectVessel}
              onNavigateToBerths={() => setCurrentPage('berths')}
              onNavigateToPayments={() => setCurrentPage('payments')}
            />
          )}

          {currentPage === 'vessels' && (
            <Vessels onSelectVessel={handleSelectVessel} />
          )}

          {currentPage === 'vessel-detail' && (
            <VesselDetail
              vesselId={selectedVesselId}
              onBack={() => setCurrentPage('vessels')}
              onNavigateToPayments={() => setCurrentPage('payments')}
              onNavigateToBerths={() => setCurrentPage('berths')}
            />
          )}

          {currentPage === 'berths' && (
            <Berths onSelectVessel={handleSelectVessel} />
          )}

          {currentPage === 'voyages' && (
            <Voyages onSelectVessel={handleSelectVessel} />
          )}

          {currentPage === 'tracking' && (
            <Tracking onSelectVessel={handleSelectVessel} />
          )}

          {currentPage === 'manufacturer-queue' && (
            <ManufacturerQueue
              onSelectVessel={handleSelectVessel}
              onNavigateToPayments={() => setCurrentPage('payments')}
            />
          )}

          {currentPage === 'fuel' && (
            <Fuel
              onSelectVessel={handleSelectVessel}
              onNavigateToPayments={() => setCurrentPage('payments')}
            />
          )}

          {currentPage === 'payments' && (
            <Payments onSelectVessel={handleSelectVessel} />
          )}

          {currentPage === 'alerts' && (
            <AlertsPage
              onSelectVessel={handleSelectVessel}
              onNavigateToBerths={() => setCurrentPage('berths')}
              onNavigateToPayments={() => setCurrentPage('payments')}
            />
          )}

          {currentPage === 'reports' && <Reports />}

          {currentPage === 'history' && <History />}

          {currentPage === 'admin' && <Admin />}
        </main>
      </div>

      {/* AI Operations Assistant Dialog */}
      <AiAssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        onNavigateToPayments={() => setCurrentPage('payments')}
        onNavigateToBerths={() => setCurrentPage('berths')}
        onSelectVessel={handleSelectVessel}
      />
    </div>
  );
}

export default App;
