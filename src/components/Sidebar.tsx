import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Ship,
  Anchor,
  Route,
  MapPinned,
  Factory,
  Fuel,
  CreditCard,
  Bell,
  History,
  FileText,
  Settings,
  X,
} from 'lucide-react';
import { Alert } from '../types';

export type NavPageId =
  | 'dashboard'
  | 'control-tower'
  | 'vessels'
  | 'vessel-detail'
  | 'berths'
  | 'voyages'
  | 'tracking'
  | 'manufacturer-queue'
  | 'fuel'
  | 'payments'
  | 'alerts'
  | 'history'
  | 'reports'
  | 'admin';

interface SidebarProps {
  currentPage: NavPageId;
  onNavigate: (page: NavPageId) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  alerts: Alert[];
}

interface NavSection {
  title: string;
  items: {
    id: NavPageId;
    label: string;
    icon: React.ReactNode;
    badgeCount?: number;
  }[];
}

export function Sidebar({
  currentPage,
  onNavigate,
  isMobileOpen,
  onCloseMobile,
  alerts,
}: SidebarProps) {
  const unreadAlerts = alerts.filter((a) => !a.acknowledged).length;

  const sections: NavSection[] = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Operations Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'control-tower', label: 'Control Tower', icon: <Activity className="w-4 h-4" /> },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'vessels', label: 'Vessels', icon: <Ship className="w-4 h-4" /> },
        { id: 'berths', label: 'VIGOR Berth', icon: <Anchor className="w-4 h-4" /> },
        { id: 'voyages', label: 'Voyages', icon: <Route className="w-4 h-4" /> },
        { id: 'tracking', label: 'Live Tracking', icon: <MapPinned className="w-4 h-4" /> },
        { id: 'manufacturer-queue', label: 'Manufacturer Queue', icon: <Factory className="w-4 h-4" /> },
        { id: 'fuel', label: 'Fuel / Oil', icon: <Fuel className="w-4 h-4" /> },
      ],
    },
    {
      title: 'FINANCE',
      items: [
        { id: 'payments', label: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
      ],
    },
    {
      title: 'MONITORING',
      items: [
        {
          id: 'alerts',
          label: 'Delays & Alerts',
          icon: <Bell className="w-4 h-4" />,
          badgeCount: unreadAlerts > 0 ? unreadAlerts : undefined,
        },
      ],
    },
    {
      title: 'RECORDS',
      items: [
        { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
        { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
      ],
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'admin', label: 'Administration', icon: <Settings className="w-4 h-4" /> },
      ],
    },
  ];

  const handleItemClick = (pageId: NavPageId) => {
    onNavigate(pageId);
    onCloseMobile();
  };

  const content = (
    <div className="w-[260px] h-full flex flex-col bg-[#14181A] text-[#C9C4B6] select-none">
      {/* Header with Tasteful VIGOR Logo Box */}
      <div className="p-4 border-b border-[#3F4A47]/40">
        <div className="flex items-center justify-between mb-3">
          {/* Light Rectangular Logo Container as specified in Part 10 */}
          <div className="bg-white rounded px-3 py-1.5 shadow-xs flex items-center justify-center border border-[#E1DED4] w-full">
            <div className="text-center">
              <div className="text-[#0A7A3D] font-extrabold tracking-widest text-sm leading-none font-mono">
                VIGOR
              </div>
              <div className="text-[#14181A] font-bold tracking-wider text-[8px] uppercase mt-0.5 leading-none">
                CEMENT WORKS
              </div>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="md:hidden text-[#C9C4B6] hover:text-white p-1 ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h2 className="text-xs font-bold tracking-wider text-white uppercase">
            SMART PORT OPERATIONS
          </h2>
          <p className="text-[10px] text-[#C9C4B6]/80 font-medium">
            Vigor Cement Works · Zanzibar
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="px-3 py-1 text-[10px] font-semibold font-mono tracking-wider text-[#C9C4B6]/60 uppercase">
              {section.title}
            </div>
            <div className="space-y-0.5 mt-1">
              {section.items.map((item) => {
                const isActive =
                  currentPage === item.id ||
                  (item.id === 'vessels' && currentPage === 'vessel-detail');

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-r transition ${
                      isActive
                        ? 'bg-[#3F4A47]/60 text-white border-l-[3px] border-[#0C9349] font-semibold pl-[9px]'
                        : 'text-[#C9C4B6] hover:bg-[#3F4A47]/30 hover:text-white border-l-[3px] border-transparent pl-[9px]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={isActive ? 'text-[#0C9349]' : 'text-[#C9C4B6]/80'}>
                        {item.icon}
                      </span>
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badgeCount && (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-full bg-[#AE3B2E] text-white">
                        {item.badgeCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#3F4A47]/40 text-[10px] text-[#C9C4B6]/60 font-mono flex items-center justify-between">
        <span>VIGOR OS v2.4</span>
        <span className="text-[#0C9349]">ZNZ TERMINAL</span>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop permanent sidebar */}
      <aside className="hidden md:block w-[260px] h-screen sticky top-0 shrink-0 shadow-lg z-40">
        {content}
      </aside>

      {/* Mobile drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10">{content}</div>
        </div>
      )}
    </>
  );
}
