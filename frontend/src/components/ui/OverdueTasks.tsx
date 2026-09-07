import {useEffect, useState} from "react";
import {getOverdue, type Task} from "../../api/workflowApi";
import {USE_MOCK_API} from "../../api/client";
import {Card, SectionHeader} from "./Layout";
import type {EntityId} from "../../types";

export default function OverdueTasks({openVessel}: {openVessel: (id: EntityId) => void}) {
  const [tasks,setTasks] = useState<(Task & {vessel_name:string})[]>([]);
  const [error,setError] = useState("");
  useEffect(() => {
    if (USE_MOCK_API) return;
    let active = true;
    const load = async () => { try {const rows = await getOverdue(); if(active){setTasks(rows);setError("");}} catch(e){if(active)setError(e instanceof Error ? e.message : "Unable to load overdue tasks");} };
    void load(); const timer = setInterval(load,30000);
    return () => {active=false;clearInterval(timer);};
  },[]);
  if(USE_MOCK_API) return null;
  return <Card className="p-5 mb-4"><SectionHeader title="Overdue operational actions" sub="Open a vessel to review responsibility and update its checklist" />
    {error ? <p role="alert" className="text-sm text-danger">{error}</p> : !tasks.length ? <p className="text-sm text-gray-500">No overdue tasks found. Unscheduled tasks are not counted as on time.</p> :
      <ul className="space-y-2">{tasks.map(t => <li key={t.id} className="text-sm"><button onClick={() => openVessel(t.visit_id)} className="text-left hover:underline"><strong className="text-danger">{t.title}</strong> · {t.vessel_name} · {t.owner_name || "Unassigned"} · {t.delay_minutes} min overdue</button></li>)}</ul>}
  </Card>;
}
