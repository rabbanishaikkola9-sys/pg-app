export type DbRole = 'ADMIN' | 'MANAGER' | 'TENANT';

export const ROLE_HOME: Record<DbRole, string> = {
  ADMIN: '/admin/dashboard',
  MANAGER: '/owner/dashboard',
  TENANT: '/renter/dashboard',
};

export const ROLE_LABEL: Record<DbRole, string> = {
  ADMIN: 'Admin',
  MANAGER: 'PG Owner',
  TENANT: 'Renter',
};

export function signupRoleToDb(role: 'STUDENT_PROFESSIONAL' | 'PG_OWNER'): DbRole {
  return role === 'PG_OWNER' ? 'MANAGER' : 'TENANT';
}
