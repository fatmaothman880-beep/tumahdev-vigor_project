import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react';
import { USE_MOCK_API } from '../../api/client';
import { getOverdueTasks, type OverdueTask } from '../../api/workflowApi';

export function OverdueTasks({ onSelectVessel }: { onSelectVessel: (vesselId: string) => void }) {
  const [tasks, setTasks] = useState<OverdueTask[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (USE_MOCK_API) return;
    let active = true;
    const load = async () => {
      try {
        const result = await getOverdueTasks();
        if (active) { setTasks(result); setError(''); }
      } catch (error) {
        if (active) setError(error instanceof Error ? error.message : 'Unable to load overdue tasks.');
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 30_000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  if (USE_MOCK_API) return null;
  return (
    <section className="bg-white border border-[#E1DED4] rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div><h2 className="text-sm font-bold uppercase tracking-wider text-[#14181A]">Overdue Operational Tasks</h2><p className="text-xs text-[#3F4A47]">Deadlines from visit checklists</p></div>
        <Clock3 className="w-5 h-5 text-[#B5760F]" />
      </div>
      {error ? <p role="alert" className="text-xs text-[#AE3B2E]">Checklist status unavailable: {error}</p> : tasks.length === 0 ? <p className="text-xs text-[#3F4A47] flex gap-2"><CheckCircle2 className="w-4 h-4 text-[#0C9349]" />No overdue tasks found. Unscheduled tasks are not counted as on time.</p> : <div className="space-y-2">{tasks.slice(0, 6).map((task) => <button key={task.id} onClick={() => onSelectVessel(task.vessel_id)} className="w-full text-left p-3 rounded-lg bg-[#FFF4F1] border border-[#AE3B2E]/20 hover:border-[#AE3B2E]/50"><div className="flex justify-between gap-3"><span className="font-semibold text-xs text-[#14181A]"><AlertTriangle className="inline w-3.5 h-3.5 mr-1 text-[#AE3B2E]" />{task.title}</span><span className="font-mono text-xs text-[#AE3B2E]">{task.delay_minutes} min late</span></div><p className="mt-1 text-xs text-[#3F4A47]">{task.vessel_name} · {task.owner_name || 'Unassigned'}</p></button>)}</div>}
    </section>
  );
}
