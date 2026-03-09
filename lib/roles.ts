/**
 * Staff are added by Admin and can always log in; Admin assigns their rights.
 * Customers/applicants are added by Operation Manager; set-password link is sent; portal must be enabled by Admin or Operation Manager.
 */
export const ROLES = [
  'admin',
  'operation_manager',
  'collateral_manager',
  'finance_officer',
  'manager',
  'customer',
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Admin',
  operation_manager: 'Operation Manager',
  collateral_manager: 'Collateral Manager',
  finance_officer: 'Finance Manager',
  manager: 'Manager',
  customer: 'Customer / Applicant',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: 'Full system access. Add users, assign or revoke rights, enable customer portal access.',
  operation_manager: 'Add customers (link sent to set password); enable customer portal access.',
  collateral_manager: 'Ground check and credibility study on applicants; fill and submit study form.',
  finance_officer: 'Initiate payment process, generate terms document, send for applicant signature, confirm release.',
  manager: 'Sign and upload agreement document, confirm release of credit to client.',
  customer: 'Customer or applicant; portal must be enabled by Admin or Operation Manager to log in.',
};

/** Roles that can enable/disable a customer's portal access */
export const CAN_MANAGE_PORTAL_ACCESS: Role[] = ['admin', 'operation_manager'];

/** Admin can invite any user. Operation Manager can only add customers. */
export function canInviteUsers(role: string): boolean {
  return role === 'admin' || role === 'operation_manager';
}

/** Only customers have portal gated by portalEnabled; staff can always log in. */
export function isPortalGatedRole(role: string): boolean {
  return role === 'customer';
}
