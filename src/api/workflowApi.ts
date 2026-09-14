import { apiFetch } from './client';
import { getVisits } from './visitApi';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface SiteVessel {
  vessel_id: string;
  name: string;
  reference: string;
  reported_cargo_t: string | number | null;
  temporary_label: boolean;
  notes: string;
}

export interface SiteCatalogue {
  configured: boolean;
  name?: string;
  berth_id?: string;
  berth_label?: string;
  vessels: SiteVessel[];
}

export type TaskStatus =
  | 'NOT_STARTED'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'NOT_APPLICABLE';

export interface OperationalTask {
  id: string;
  visit_id: string;
  title: string;
  category: string;
  owner_name: string | null;
  due_at: string | null;
  completed_at: string | null;
  status: TaskStatus;
  blocks_departure: boolean;
  reason: string;
  evidence_reference: string;
  version: number;
  timeliness: string;
  delay_minutes: number;
}

export interface ChecklistResponse {
  tasks: OperationalTask[];
  checklist_state: string;
  overdue_count: number;
  unassigned_count: number;
  unscheduled_count: number;
  notice: string;
}

export interface TaskInput {
  performed_by: string;
  title: string;
  category: string;
  owner_name: string | null;
  due_at: string | null;
  completed_at: string | null;
  status: TaskStatus;
  blocks_departure: boolean;
  reason: string;
  evidence_reference: string;
}

export interface TaskHistoryEntry {
  id: string;
  performed_by: string;
  occurred_at: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown>;
}

export interface OverdueTask extends OperationalTask {
  vessel_id: string;
  vessel_name: string;
}

const taskPath = (visitId: string) =>
  `/workflow/visits/${encodeURIComponent(visitId)}/tasks`;

export const getSiteCatalogue = () =>
  apiFetch<SiteCatalogue>('/workflow/site');

export async function findChecklistVisitId(
  vesselId: string,
  preferredVisitId?: string,
): Promise<string | null> {
  if (preferredVisitId && UUID_PATTERN.test(preferredVisitId)) {
    return preferredVisitId;
  }
  if (!UUID_PATTERN.test(vesselId)) return null;

  const visits = await getVisits({ vessel_id: vesselId, limit: 100 });
  const usable = visits.find(
    (visit) => !['CANCELLED', 'DEPARTED'].includes(visit.status),
  );
  return usable?.id ?? visits[0]?.id ?? null;
}

export const getChecklist = (visitId: string) =>
  apiFetch<ChecklistResponse>(taskPath(visitId));

export const getOverdueTasks = () =>
  apiFetch<OverdueTask[]>('/workflow/overdue');

export const addSuggestedTasks = (visitId: string, performedBy: string) =>
  apiFetch<ChecklistResponse>(`${taskPath(visitId)}/templates`, {
    method: 'POST',
    body: JSON.stringify({ performed_by: performedBy }),
  });

export function saveTask(
  visitId: string,
  values: TaskInput,
  task?: OperationalTask,
  changeReason = ''
) {
  return apiFetch<OperationalTask>(
    task ? `${taskPath(visitId)}/${task.id}` : taskPath(visitId),
    {
      method: task ? 'PUT' : 'POST',
      body: JSON.stringify(
        task
          ? {
              ...values,
              expected_version: task.version,
              change_reason: changeReason,
            }
          : values
      ),
    }
  );
}

export const getTaskHistory = (visitId: string, taskId: string) =>
  apiFetch<TaskHistoryEntry[]>(`${taskPath(visitId)}/${taskId}/history`);
