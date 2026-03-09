const MODULE_LABELS: Record<string, string> = {
  collections: 'Collections',
  issuance: 'Credit Issuance',
  invoices: 'Invoices',
  payments: 'Payments',
};

export const TENANT_MODULES = ['collections', 'issuance', 'invoices', 'payments'] as const;
export type TenantModule = (typeof TENANT_MODULES)[number];

export function getModuleLabel(module: string): string {
  return MODULE_LABELS[module] ?? module;
}
