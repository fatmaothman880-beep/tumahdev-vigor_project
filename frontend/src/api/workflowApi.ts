import { apiFetch } from "./client";
import type { EntityId } from "../types";

export interface SiteVessel { vessel_id: string; name: string; reference: string; reported_cargo_t: string | number | null; temporary_label: boolean; notes: string }
export interface SiteCatalogue { configured: boolean; berth_id?: string; berth_label?: string; vessels: SiteVessel[] }
export type TaskStatus = "NOT_STARTED" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "NOT_APPLICABLE";
export interface Task {
  id: string; visit_id: string; title: string; category: string; owner_name: string | null;
  due_at: string | null; completed_at: string | null; status: TaskStatus;
  blocks_departure: boolean; reason: string; evidence_reference: string; version: number;
  timeliness: string; delay_minutes: number;
}
export interface Checklist { tasks: Task[]; checklist_state: string; overdue_count: number; unassigned_count: number; unscheduled_count: number; notice: string }
export interface TaskInput { performed_by: string; title: string; category: string; owner_name: string | null; due_at: string | null; completed_at: string | null; status: TaskStatus; blocks_departure: boolean; reason: string; evidence_reference: string }
export interface Change {id: string; performed_by: string; occurred_at: string; old_value: Record<string, unknown> | null; new_value: Record<string, unknown> }
const path = (id: EntityId) => `/workflow/visits/${encodeURIComponent(id)}/tasks`;
export const getSite = () => apiFetch<SiteCatalogue>("/workflow/site");
export const getTasks = (id: EntityId) => apiFetch<Checklist>(path(id));
export const getOverdue = () => apiFetch<(Task & {vessel_name: string})[]>("/workflow/overdue");
export const addTemplates = (id: EntityId, actor: string) => apiFetch<Checklist>(`${path(id)}/templates`, {method:"POST", body:JSON.stringify({performed_by:actor})});
export const saveTask = (id: EntityId, values: TaskInput, task?: Task, changeReason = "") => apiFetch<Task>(task ? `${path(id)}/${task.id}` : path(id), {
  method: task ? "PUT" : "POST", body: JSON.stringify(task ? {...values, expected_version: task.version, change_reason: changeReason} : values),
});
export const getHistory = (id: EntityId, task: Task) => apiFetch<Change[]>(`${path(id)}/${task.id}/history`);
