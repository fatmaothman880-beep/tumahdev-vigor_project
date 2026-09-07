import { useState } from "react";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import { useAppData } from "./hooks/useAppData";
import { useLiveClock } from "./hooks/useLiveClock";
import { useOperationalModel } from "./hooks/useOperationalModel";
import { Card } from "./components/ui/Layout";
import { LoadingSkeleton, ErrorState } from "./components/ui/States";
import { Toast } from "./components/ui/Feedback";
import type { RateUnit } from "./types";
import Dashboard from "./pages/Dashboard";
import Vessels from "./pages/Vessels";
import NewVessel from "./pages/NewVessel";
import EditVessel from "./pages/EditVessel";
import VesselDetail from "./pages/VesselDetail";
import Berths from "./pages/Berths";
import DelaysPage from "./pages/DelaysPage";
import History from "./pages/History";
import VesselReport from "./pages/VesselReport";

export type Page = "dashboard" | "vessels" | "vessel-new" | "vessel-detail" | "vessel-edit" | "berths" | "delays" | "history" | "report";

/**
 * Deliberately state-based routing rather than react-router: this keeps the
 * dependency list minimal for a beginner-friendly local setup. Swap in
 * react-router-dom later if deep-linking specific vessels/reports becomes
 * a requirement — the route list in README.md maps directly onto the
 * `Page` union above.
 */
export default function App() {
  const { data, loading, error, toast, reload, createVessel, addReading, addDelay, completeVessel, editVessel } = useAppData();

  // Live clock: re-renders the app on an interval so time-based progress,
  // at-risk/overdue forecasts, and alerts all recalculate continuously
  // without a page refresh (see hooks/useLiveClock.ts). 30s gives a
  // visibly live feel without excessive re-render churn.
  const now = useLiveClock(30_000);
  const model = useOperationalModel(data, now);

  // Unloading rate unit preference — t/h is the default/primary unit
  // throughout; this is a simple lifted React state rather than a global
  // store, matching the "avoid unnecessary dependencies" guidance.
  const [rateUnit, setRateUnit] = useState<RateUnit>("tph");

  const [page, setPage] = useState<Page>("dashboard");
  const [selectedVesselId, setSelectedVesselId] = useState<string | number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const go = (p: Page, vesselId?: string | number) => {
    setPage(p);
    if (vesselId) setSelectedVesselId(vesselId);
    window.scrollTo({ top: 0 });
  };
  const openVessel = (id: string | number) => {
    setSelectedVesselId(id);
    setPage("vessel-detail");
    window.scrollTo({ top: 0 });
  };

  const selectedVessel = data?.vessels.find((v) => v.id === selectedVesselId);
  const alertBadgeCount = model.alerts.filter((a) => a.severity !== "info").length;

  const titles: Record<Page, string> = {
    dashboard: "Operations dashboard",
    vessels: "Vessel visits",
    "vessel-new": "New vessel visit",
    "vessel-detail": selectedVessel?.name || "Vessel",
    "vessel-edit": selectedVessel ? `Edit — ${selectedVessel.name}` : "Edit vessel visit",
    berths: "Berths",
    delays: "Delays & Alerts",
    history: "Vessel history",
    report: "Vessel report",
  };

  return (
    <div className="h-screen flex bg-paper overflow-hidden">
      <Sidebar page={page} go={go} mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} alertCount={alertBadgeCount} />
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <TopBar
          title={titles[page]}
          breadcrumb="Smart Port Operations · Vigor Cement Works"
          setMobileOpen={setMobileOpen}
          now={now}
          alerts={model.alerts}
          onSelectVessel={openVessel}
        />
        <div className="flex-1 overflow-y-auto">
          <main className="p-4 sm:p-6 max-w-[1400px] w-full mx-auto">
            {loading ? (
              <Card>
                <LoadingSkeleton rows={5} />
              </Card>
            ) : error || !data ? (
              <ErrorState onRetry={reload} />
            ) : page === "dashboard" ? (
              <Dashboard data={data} model={model} rateUnit={rateUnit} now={now} go={go} openVessel={openVessel} />
            ) : page === "vessels" ? (
              <Vessels data={data} model={model} now={now} go={go} openVessel={openVessel} />
            ) : page === "vessel-new" ? (
              <NewVessel
                berths={data.berths}
                onCancel={() => go("vessels")}
                onSave={async (input) => {
                  const vessel = await createVessel(input);
                  go("vessel-detail", vessel.id);
                }}
              />
            ) : page === "vessel-edit" ? (
              <EditVessel
                data={data}
                vessel={selectedVessel}
                onCancel={() => go("vessel-detail")}
                onSave={async (id, input) => {
                  await editVessel(id, input);
                  go("vessel-detail", id);
                }}
              />
            ) : page === "vessel-detail" && selectedVesselId ? (
              <VesselDetail
                data={data}
                model={model}
                rateUnit={rateUnit}
                setRateUnit={setRateUnit}
                vesselId={selectedVesselId}
                go={go}
                back={() => go("vessels")}
                onAddReading={addReading}
                onAddDelay={addDelay}
                onComplete={completeVessel}
              />
            ) : page === "berths" ? (
              <Berths data={data} model={model} openVessel={openVessel} />
            ) : page === "delays" ? (
              <DelaysPage data={data} model={model} openVessel={openVessel} />
            ) : page === "history" ? (
              <History data={data} now={now} go={go} />
            ) : page === "report" && selectedVesselId ? (
              <VesselReport data={data} vesselId={selectedVesselId} back={() => go("history")} />
            ) : (
              <ErrorState onRetry={() => go("dashboard")} />
            )}
          </main>
          <footer className="px-6 py-3 text-[11px] text-gray-500 print-hide">
            Smart Port Operations — MVP-1 decision-support prototype · Illustrative demo data · Vigor Cement Works, Zanzibar
          </footer>
        </div>
      </div>
      <Toast toast={toast} />
    </div>
  );
}
