import { useState } from "react";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import { useAppData } from "./hooks/useAppData";
import { Card } from "./components/ui/Layout";
import { LoadingSkeleton, ErrorState } from "./components/ui/States";
import { Toast } from "./components/ui/Feedback";
import Dashboard from "./pages/Dashboard";
import Vessels from "./pages/Vessels";
import NewVessel from "./pages/NewVessel";
import VesselDetail from "./pages/VesselDetail";
import Berths from "./pages/Berths";
import DelaysPage from "./pages/DelaysPage";
import History from "./pages/History";
import VesselReport from "./pages/VesselReport";

export type Page =
  | "dashboard"
  | "vessels"
  | "vessel-new"
  | "vessel-detail"
  | "berths"
  | "delays"
  | "history"
  | "report";

export default function App() {
  const {
    data,
    loading,
    error,
    toast,
    reload,
    createVessel,
    addReading,
    addDelay,
    completeVessel,
  } = useAppData();

  const [page, setPage] = useState<Page>("dashboard");
  const [selectedVesselId, setSelectedVesselId] = useState<
    string | number | null
  >(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const go = (nextPage: Page, vesselId?: string | number) => {
    setPage(nextPage);

    if (vesselId !== undefined) {
      setSelectedVesselId(vesselId);
    }

    window.scrollTo({ top: 0 });
  };

  const openVessel = (id: string | number) => {
    setSelectedVesselId(id);
    setPage("vessel-detail");
    window.scrollTo({ top: 0 });
  };

  const selectedVessel = data?.vessels.find(
    (vessel) => String(vessel.id) === String(selectedVesselId),
  );

  const titles: Record<Page, string> = {
    dashboard: "Operations dashboard",
    vessels: "Vessel visits",
    "vessel-new": "New vessel visit",
    "vessel-detail": selectedVessel?.name || "Vessel",
    berths: "Berths",
    delays: "Delays & downtime",
    history: "Vessel history",
    report: "Vessel report",
  };

  return (
    <div className="min-h-screen flex bg-paper">
      <Sidebar
        page={page}
        go={go}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar
          title={titles[page]}
          breadcrumb="Smart Port Operations · Vigor Cement Works"
          setMobileOpen={setMobileOpen}
          now={new Date()}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-[1400px] w-full mx-auto">
          {loading ? (
            <Card>
              <LoadingSkeleton rows={5} />
            </Card>
          ) : error || !data ? (
            <ErrorState onRetry={reload} />
          ) : page === "dashboard" ? (
            <Dashboard
              data={data}
              go={go}
              openVessel={openVessel}
            />
          ) : page === "vessels" ? (
            <Vessels
              data={data}
              go={go}
              openVessel={openVessel}
            />
          ) : page === "vessel-new" ? (
            <NewVessel
              berths={data.berths}
              onCancel={() => go("vessels")}
              onSave={async (input) => {
                await createVessel(input);
                go("vessels");
              }}
            />
          ) : page === "vessel-detail" &&
            selectedVesselId !== null ? (
            <VesselDetail
              data={data}
              vesselId={selectedVesselId}
              go={go}
              back={() => go("vessels")}
              onAddReading={addReading}
              onAddDelay={addDelay}
              onComplete={completeVessel}
            />
          ) : page === "berths" ? (
            <Berths
              data={data}
              openVessel={openVessel}
            />
          ) : page === "delays" ? (
            <DelaysPage
              data={data}
              openVessel={openVessel}
            />
          ) : page === "history" ? (
            <History
              data={data}
              go={go}
            />
          ) : page === "report" &&
            selectedVesselId !== null ? (
            <VesselReport
              data={data}
              vesselId={selectedVesselId}
              back={() => go("history")}
            />
          ) : (
            <ErrorState onRetry={() => go("dashboard")} />
          )}
        </main>

        <footer className="px-6 py-3 text-[11px] text-gray-500 print-hide">
          Smart Port Operations — MVP-1 decision-support prototype · Vigor
          Cement Works, Zanzibar
        </footer>
      </div>

      <Toast toast={toast} />
    </div>
  );
}