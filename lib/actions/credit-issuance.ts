'use server';

import axios from 'axios';
import { getApiUrl } from '@/lib/api/config';
import { getAuthToken } from './auth';
import { toUserFriendlyMessage } from '@/lib/errors';

/** BULLET = one-off repayment; INSTALLMENTS = repayments in installments */
export type RepaymentType = 'BULLET' | 'INSTALLMENTS';

export type CreditApplication = {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  requestedAmount: number;
  status: string;
  notes?: string;
  /** Optional workflow: RECEIVED | WITH_COLLATERAL | STUDY_SUBMITTED | NOT_WORTHY | WITH_FINANCE | DOCUMENT_SENT | AWAITING_SIGNATURES | RELEASED */
  stage?: string;
  assignedToRole?: string;
  /** BULLET = one-off repayment; INSTALLMENTS = repayments in installments */
  repaymentType?: string;
  numberOfInstallments?: number | null;
  creditPeriodMonths?: number | null;
  createdAt: string;
  updatedAt: string;
  /** When Finance received/uploaded the applicant-signed document */
  signedDocumentReceivedAt?: string | null;
  /** Whether the signed document is stored (Finance must upload before forwarding to Manager) */
  hasSignedDocument?: boolean;
  financeSignedAt?: string | null;
  managerSignedAt?: string | null;
};

export type CreditAccount = {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  creditApplicationId?: string;
  creditLimit: number;
  repaymentType?: string;
  numberOfInstallments?: number | null;
  creditPeriodMonths?: number | null;
  utilizedAmount?: number;
  remainingCredit?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type CreditObligation = {
  id: string;
  tenantId: string;
  customerId: string;
  customerName: string;
  creditAccountId?: string;
  amount: number;
  dueDate?: string;
  assignmentDate?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type CreditTransaction = {
  id: string;
  creditAccountId: string;
  amount: number;
  transactionType: string;
  reference?: string;
  createdAt: string;
};

export type PageResult<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
};

export type CreditWorkflowStep = {
  id?: string;
  stepOrder: number;
  stageCode: string;
  stageName?: string;
  assignedRole?: string;
  assignedUserId?: string;
  assignedUserName?: string;
};

export type CreditWorkflow = {
  steps: CreditWorkflowStep[];
};

export async function getCreditApplicationsAction(page = 0, size = 50): Promise<PageResult<CreditApplication>> {
  const token = await getAuthToken();
  if (!token) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 0 };
  try {
    const { data } = await axios.get<PageResult<CreditApplication>>(
      getApiUrl(`/api/v1/credit-applications?page=${page}&size=${size}`),
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
      return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 0 };
    }
    throw new Error(toUserFriendlyMessage(err, 'Could not load credit applications. Please try again.'));
  }
}

export async function getCreditWorkflowAction(): Promise<CreditWorkflow> {
  const token = await getAuthToken();
  if (!token) return { steps: [] };
  try {
    const { data } = await axios.get<CreditWorkflow>(getApiUrl('/api/v1/credit-workflow/steps'), {
      headers: { Authorization: `Bearer ${token}` },
    });
    return { steps: data?.steps ?? [] };
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
      return { steps: [] };
    }
    throw new Error(toUserFriendlyMessage(err, 'Could not load credit workflow. Please try again.'));
  }
}

export async function replaceCreditWorkflowAction(input: {
  steps: Array<{
    stageCode: string;
    stageName?: string;
    assignedRole?: string;
    assignedUserId?: string | null;
  }>;
}): Promise<CreditWorkflow | null> {
  const token = await getAuthToken();
  if (!token) return null;
  try {
    const body = {
      steps: (input.steps ?? []).map((s) => ({
        stageCode: s.stageCode,
        stageName: s.stageName,
        assignedRole: s.assignedRole,
        assignedUserId: s.assignedUserId ? Number(s.assignedUserId) : null,
      })),
    };
    const { data } = await axios.put<CreditWorkflow>(
      getApiUrl('/api/v1/credit-workflow/steps'),
      body,
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
    );
    return data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) return null;
    throw new Error(toUserFriendlyMessage(err, 'Could not save credit workflow. Please try again.'));
  }
}

export async function createCreditApplicationAction(input: {
  customerId: string;
  requestedAmount: number;
  repaymentType?: RepaymentType | string;
  numberOfInstallments?: number | null;
  creditPeriodMonths?: number | null;
  status?: string;
  notes?: string;
}): Promise<CreditApplication | null> {
  const token = await getAuthToken();
  if (!token) return null;
  try {
    const body: Record<string, unknown> = {
      customerId: Number(input.customerId),
      requestedAmount: input.requestedAmount,
      status: input.status,
      notes: input.notes,
    };
    if (input.repaymentType) body.repaymentType = input.repaymentType;
    if (input.numberOfInstallments != null) body.numberOfInstallments = input.numberOfInstallments;
    if (input.creditPeriodMonths != null) body.creditPeriodMonths = input.creditPeriodMonths;
    const { data } = await axios.post<CreditApplication>(
      getApiUrl('/api/v1/credit-applications'),
      body,
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
    );
    return data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) return null;
    throw new Error(toUserFriendlyMessage(err, 'Could not create credit application. Please try again.'));
  }
}

export async function updateCreditApplicationAction(
  id: string,
  input: {
    customerId?: string | number;
    requestedAmount?: number;
    status?: string;
    stage?: string;
    assignedToRole?: string;
    notes?: string;
  }
): Promise<CreditApplication | null> {
  const token = await getAuthToken();
  if (!token) return null;
  try {
    const body: Record<string, unknown> = {
      status: input.status,
      stage: input.stage,
      assignedToRole: input.assignedToRole,
      notes: input.notes,
    };
    if (input.customerId != null) body.customerId = Number(input.customerId);
    if (input.requestedAmount != null) body.requestedAmount = input.requestedAmount;
    const { data } = await axios.put<CreditApplication>(
      getApiUrl(`/api/v1/credit-applications/${id}`),
      body,
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
    );
    return data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) return null;
    throw new Error(toUserFriendlyMessage(err, 'Could not update credit application. Please try again.'));
  }
}

export type CollateralStudy = {
  id: string;
  creditApplicationId: string;
  visitDate: string;
  findings?: string;
  recommendation?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function getCollateralStudiesAction(applicationId: string): Promise<CollateralStudy[]> {
  const token = await getAuthToken();
  if (!token) return [];
  try {
    const { data } = await axios.get<CollateralStudy[]>(
      getApiUrl(`/api/v1/credit-applications/${applicationId}/collateral-study`),
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function submitCollateralStudyAction(
  applicationId: string,
  input: { visitDate: string; findings?: string; recommendation?: string; notes?: string }
): Promise<{ id: string } | null> {
  const token = await getAuthToken();
  if (!token) return null;
  try {
    const { data } = await axios.post<{ id: string }>(
      getApiUrl(`/api/v1/credit-applications/${applicationId}/collateral-study`),
      {
        visitDate: input.visitDate,
        findings: input.findings ?? '',
        recommendation: input.recommendation ?? '',
        notes: input.notes ?? '',
      },
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
    );
    return data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) return null;
    throw new Error(toUserFriendlyMessage(err, 'Could not submit collateral study. Please try again.'));
  }
}

/** Download credit terms PDF for an application (Finance stage). Returns base64 PDF or error. */
export async function getCreditTermsPdfAction(applicationId: string): Promise<{ ok: true; pdfBase64: string } | { ok: false; error: string }> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: 'Not authenticated' };
  try {
    const { data } = await axios.get(getApiUrl(`/api/v1/credit-applications/${applicationId}/terms.pdf`), {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer',
    });
    const base64 =
      typeof data === 'string'
        ? data
        : (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)
            ? (data as Buffer).toString('base64')
            : Buffer.from(data as ArrayBuffer).toString('base64'));
    return { ok: true, pdfBase64: base64 };
  } catch (err: unknown) {
    const msg = axios.isAxiosError(err) && err.response?.data
      ? (typeof err.response.data === 'string' ? err.response.data : (err.response.data as { message?: string })?.message)
      : null;
    return { ok: false, error: msg || toUserFriendlyMessage(err, 'Could not generate terms PDF.') };
  }
}

/** Generate terms PDF, email to applicant, and set stage to DOCUMENT_SENT. Finance (or admin) only. */
export async function emailTermsToApplicantAction(applicationId: string): Promise<{ ok: boolean; error?: string }> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: 'Not authenticated' };
  try {
    await axios.post(
      getApiUrl(`/api/v1/credit-applications/${applicationId}/email-terms`),
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { ok: true };
  } catch (err: unknown) {
    const msg = axios.isAxiosError(err) && err.response?.data
      ? (typeof err.response.data === 'string' ? err.response.data : (err.response.data as { message?: string })?.message)
      : null;
    return { ok: false, error: msg || toUserFriendlyMessage(err, 'Could not email terms to applicant.') };
  }
}

/** Upload the applicant-signed document (PDF). Finance only. Pass file content as base64. */
export async function uploadSignedDocumentAction(
  applicationId: string,
  contentBase64: string
): Promise<{ ok: boolean; error?: string }> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: 'Not authenticated' };
  try {
    await axios.post(
      getApiUrl(`/api/v1/credit-applications/${applicationId}/signed-document`),
      { contentBase64 },
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
    );
    return { ok: true };
  } catch (err: unknown) {
    const msg = axios.isAxiosError(err) && err.response?.data
      ? (typeof err.response.data === 'string' ? err.response.data : (err.response.data as { message?: string })?.message)
      : null;
    return { ok: false, error: msg || toUserFriendlyMessage(err, 'Could not upload signed document.') };
  }
}

/** Download the stored applicant-signed document (Finance/Manager/Admin). */
export async function getSignedDocumentAction(applicationId: string): Promise<{ ok: true; pdfBase64: string } | { ok: false; error: string }> {
  const token = await getAuthToken();
  if (!token) return { ok: false, error: 'Not authenticated' };
  try {
    const { data } = await axios.get(getApiUrl(`/api/v1/credit-applications/${applicationId}/signed-document`), {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer',
    });
    const base64 =
      typeof data === 'string'
        ? data
        : (typeof Buffer !== 'undefined' && Buffer.isBuffer(data)
            ? (data as Buffer).toString('base64')
            : Buffer.from(data as ArrayBuffer).toString('base64'));
    return { ok: true, pdfBase64: base64 };
  } catch (err: unknown) {
    const msg = axios.isAxiosError(err) && err.response?.data
      ? (typeof err.response.data === 'string' ? err.response.data : (err.response.data as { message?: string })?.message)
      : null;
    return { ok: false, error: msg || toUserFriendlyMessage(err, 'Could not load signed document.') };
  }
}

export async function getCreditAccountsAction(page = 0, size = 50): Promise<PageResult<CreditAccount>> {
  const token = await getAuthToken();
  if (!token) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 0 };
  try {
    const { data } = await axios.get<PageResult<CreditAccount>>(
      getApiUrl(`/api/v1/credit-accounts?page=${page}&size=${size}`),
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
      return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 0 };
    }
    throw new Error(toUserFriendlyMessage(err, 'Could not load credit accounts. Please try again.'));
  }
}

export async function createCreditAccountAction(input: {
  customerId: string;
  creditLimit: number;
  creditApplicationId?: string;
  repaymentType?: RepaymentType | string;
  numberOfInstallments?: number | null;
  creditPeriodMonths?: number | null;
  status?: string;
}): Promise<CreditAccount | null> {
  const token = await getAuthToken();
  if (!token) return null;
  try {
    const body: Record<string, unknown> = {
      customerId: Number(input.customerId),
      creditLimit: input.creditLimit,
      status: input.status,
    };
    if (input.creditApplicationId) body.creditApplicationId = Number(input.creditApplicationId);
    if (input.repaymentType) body.repaymentType = input.repaymentType;
    if (input.numberOfInstallments != null) body.numberOfInstallments = input.numberOfInstallments;
    if (input.creditPeriodMonths != null) body.creditPeriodMonths = input.creditPeriodMonths;
    const { data } = await axios.post<CreditAccount>(
      getApiUrl('/api/v1/credit-accounts'),
      body,
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
    );
    return data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) return null;
    throw new Error(toUserFriendlyMessage(err, 'Could not create credit account. Please try again.'));
  }
}

export async function getCreditObligationsAction(page = 0, size = 50): Promise<PageResult<CreditObligation>> {
  const token = await getAuthToken();
  if (!token) return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 0 };
  try {
    const { data } = await axios.get<PageResult<CreditObligation>>(
      getApiUrl(`/api/v1/credit-obligations?page=${page}&size=${size}`),
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data;
  } catch (err: any) {
    if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
      return { content: [], totalElements: 0, totalPages: 0, number: 0, size: 0 };
    }
    throw err;
  }
}

export async function createCreditObligationAction(input: {
  customerId: string;
  amount: number;
  creditAccountId?: string;
  dueDate?: string;
  assignmentDate?: string;
  status?: string;
}): Promise<CreditObligation | null> {
  const token = await getAuthToken();
  if (!token) return null;
  try {
    const body: Record<string, unknown> = {
      customerId: Number(input.customerId),
      amount: input.amount,
      dueDate: input.dueDate,
      assignmentDate: input.assignmentDate,
      status: input.status,
    };
    if (input.creditAccountId) body.creditAccountId = Number(input.creditAccountId);
    const { data } = await axios.post<CreditObligation>(
      getApiUrl('/api/v1/credit-obligations'),
      body,
      { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } }
    );
    return data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) return null;
    throw new Error(toUserFriendlyMessage(err, 'Could not create credit obligation. Please try again.'));
  }
}
