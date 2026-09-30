export const USER_ROLES = ['Admin', 'Vessel Operation', 'Management', 'Viewer'] as const;
export type UserRole = typeof USER_ROLES[number];

export function isUserRole(role: unknown): role is UserRole {
  return USER_ROLES.some(value => value === role);
}

// Preserve existing accounts and browser sessions after the role rename.
export function normalizeUserRole(role: unknown): UserRole {
  if (role === 'Operations') return 'Vessel Operation';
  return isUserRole(role) ? role : 'Viewer';
}

export function canEditOperations(role: unknown): boolean {
  return role === 'Admin' || role === 'Vessel Operation';
}
