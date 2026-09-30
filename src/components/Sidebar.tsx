import React, { useEffect, useRef, useState } from 'react';
import {
  Gauge,
  LayoutDashboard,
  Activity,
  Ship,
  Anchor,
  Route,
  Factory,
  Fuel,
  CreditCard,
  Bell,
  History,
  FileText,
  Settings,
  X,
  Shield,
  ChevronDown,
  UserCheck,
} from 'lucide-react';
import { Alert } from '../types';
import { useAuth, UserRole } from '../auth/AuthContext';

export type NavPageId =
  | 'dashboard-summary'
  | 'dashboard'
  | 'control-tower'
  | 'vessels'
  | 'vessel-detail'
  | 'berths'
  | 'voyages'
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
  const { user, quickLoginAs } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const drawer = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!isMobileOpen) return;
    const dialog = drawer.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog?.showModal();
    const desktop = window.matchMedia('(min-width: 768px)');
    const onResize = () => { if (desktop.matches) onCloseMobile(); };
    desktop.addEventListener('change', onResize);
    return () => { dialog?.close(); document.body.style.overflow = previousOverflow; desktop.removeEventListener('change', onResize); };
  }, [isMobileOpen]);
  const unreadAlerts = alerts.filter((a) => !a.acknowledged).length;

  const sections: NavSection[] = [
    {
      title: 'OVERVIEW',
      items: [
        { id: 'dashboard-summary', label: 'Dashboard Summary', icon: <Gauge className="w-4 h-4" /> },
        { id: 'dashboard', label: 'Operations Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'control-tower', label: 'Control Tower', icon: <Activity className="w-4 h-4" /> },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { id: 'vessels', label: 'Vessels', icon: <Ship className="w-4 h-4" /> },
        { id: 'berths', label: 'Mangapwani Berth', icon: <Anchor className="w-4 h-4" /> },
        { id: 'voyages', label: 'Voyages', icon: <Route className="w-4 h-4" /> },
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
    <div className="w-[240px] h-full flex flex-col bg-shell text-muted border-r border-line select-none">
      <div className="px-5 py-6 border-b border-line flex justify-between items-start">
        <div><div className="flex items-center gap-2"><span className="w-1 h-6 bg-positive rounded-full" /><span className="text-xl font-bold tracking-[0.16em] text-foreground">VIGOR</span></div>
          <p className="text-[10px] tracking-[0.18em] text-muted mt-1 ml-3">CEMENT WORKS</p>
          <p className="text-xs text-muted mt-4">Smart Port Operations</p></div>
        <button onClick={onCloseMobile} className="icon-button md:hidden" aria-label="Close navigation"><X className="w-4 h-4" /></button>
      </div>
      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {sections.filter(section => section.items.some(item => item.id !== 'admin' || user?.role === 'Admin')).map(section => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-[10px] font-medium tracking-[0.13em] text-muted">{section.title}</p>
            <div className="space-y-1">{section.items.filter(item => item.id !== 'admin' || user?.role === 'Admin').map(item => {
              const active = currentPage === item.id || (item.id === 'vessels' && currentPage === 'vessel-detail');
              return <button key={item.id} onClick={() => handleItemClick(item.id)} aria-current={active ? 'page' : undefined} className="nav-item">
                <span className="flex items-center gap-3 min-w-0"><span className={active ? 'text-info' : 'text-muted'}>{item.icon}</span><span className="truncate">{item.label}</span></span>
                {!!item.badgeCount && <span className="text-[10px] tabular-nums text-danger">{item.badgeCount}</span>}
              </button>;
            })}</div>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-line">
        <button onClick={() => setShowRoleMenu(!showRoleMenu)} aria-expanded={showRoleMenu} className="nav-item" title="Switch demo evaluation role"><span className="flex items-center gap-2"><Shield className="w-3.5 h-3.5" />Evaluation roles</span><ChevronDown className="w-3.5 h-3.5" /></button>
        {showRoleMenu && <div className="space-y-1 mt-2">{(['Admin', 'Management', 'Vessel Operation', 'Viewer'] as UserRole[]).map(role => <button key={role} onClick={() => { void quickLoginAs(role); setShowRoleMenu(false); }} className="nav-item"><span>{role}</span>{user?.role === role && <UserCheck className="w-3.5 h-3.5 text-positive" />}</button>)}</div>}
        <p className="text-[10px] text-muted px-3 pt-4 pb-1">VIGOR OS <span className="float-right">ZNZ terminal</span></p>
      </div>
    </div>
  );
  return <>
    <aside className="hidden md:block w-[240px] h-dvh sticky top-0 shrink-0 z-40">{content}</aside>
    {isMobileOpen && <dialog ref={drawer} onCancel={event => { event.preventDefault(); onCloseMobile(); }} aria-label="Navigation"
      className="fixed inset-y-0 left-0 m-0 p-0 w-[240px] h-dvh max-h-none max-w-none border-0 bg-shell text-foreground backdrop:bg-black/70">
      {content}
    </dialog>}
  </>;
}
