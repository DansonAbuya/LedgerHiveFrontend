/**
 * Credit issuance workflow stages.
 * Flow: Application → Operation Manager → Collateral Manager (study) → Operation Manager → Finance Manager → Manager → Released.
 */
export const CREDIT_APPLICATION_STAGES = [
  'RECEIVED',           // Operation Manager received, checking details
  'WITH_COLLATERAL',    // Forwarded to Collateral Manager for ground check
  'STUDY_SUBMITTED',    // Collateral Manager submitted study form
  'NOT_WORTHY',         // Operation Manager marked not credible
  'WITH_FINANCE',       // Forwarded to Finance Manager (credible)
  'DOCUMENT_SENT',      // Terms document sent to applicant for signature
  'AWAITING_SIGNATURES',// Signed doc returned; Finance Manager → Manager
  'RELEASED',           // Manager signed, uploaded, credit released
  // Legacy / simple statuses
  'PENDING',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
] as const;

export type CreditStage = (typeof CREDIT_APPLICATION_STAGES)[number];

export const STAGE_LABELS: Record<string, string> = {
  RECEIVED: 'With Operation Manager',
  WITH_COLLATERAL: 'With Collateral Manager',
  STUDY_SUBMITTED: 'Study submitted',
  NOT_WORTHY: 'Not worthy of credit',
  WITH_FINANCE: 'With Finance Manager',
  DOCUMENT_SENT: 'Document sent for signature',
  AWAITING_SIGNATURES: 'Awaiting signatures',
  RELEASED: 'Released',
  PENDING: 'Pending',
  UNDER_REVIEW: 'Under review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};
