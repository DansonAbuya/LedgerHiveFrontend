'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, FileCheck, Send, FileDown, Mail, FileText, Upload, Eye } from 'lucide-react';
import {
  createCreditApplicationAction,
  getCreditApplicationsAction,
  getCreditWorkflowAction,
  getCollateralStudiesAction,
  submitCollateralStudyAction,
  type CollateralStudy,
  updateCreditApplicationAction,
  getCreditTermsPdfAction,
  emailTermsToApplicantAction,
  uploadSignedDocumentAction,
  getSignedDocumentAction,
  type CreditApplication,
} from '@/lib/actions/credit-issuance';
import { formatRepaymentLabel } from '@/lib/credit-utils';
import { getCustomersAction, type Customer } from '@/lib/actions/customers';
import { useCurrency } from '@/lib/currency-context';
import { useAuth } from '@/lib/auth-context';
import { useAlert } from '@/lib/alert-context';
import { STAGE_LABELS } from '@/lib/credit-workflow';
import { toUserFriendlyMessage } from '@/lib/errors';

const statusColors: Record<string, string> = {
  RECEIVED: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
  WITH_COLLATERAL: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  STUDY_SUBMITTED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  NOT_WORTHY: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  WITH_FINANCE: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400',
  DOCUMENT_SENT: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  AWAITING_SIGNATURES: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  RELEASED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  APPROVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  REJECTED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  UNDER_REVIEW: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

export default function CreditApplicationsPage() {
  const { user } = useAuth();
  const { formatAmountWithCode } = useCurrency();
  const { showAlert } = useAlert();
  const [applications, setApplications] = useState<CreditApplication[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [studyFormOpen, setStudyFormOpen] = useState<CreditApplication | null>(null);
  const [viewReportOpen, setViewReportOpen] = useState<CreditApplication | null>(null);
  const [viewReportStudies, setViewReportStudies] = useState<CollateralStudy[]>([]);
  const [existingStudiesCount, setExistingStudiesCount] = useState(0);
  const [submittingStudy, setSubmittingStudy] = useState(false);
  const [transitioningId, setTransitioningId] = useState<string | null>(null);
  const [emailingTermsId, setEmailingTermsId] = useState<string | null>(null);
  const [uploadingSignedId, setUploadingSignedId] = useState<string | null>(null);
  const [signedDocFileInputKey, setSignedDocFileInputKey] = useState(0);
  const [workflowStageLabels, setWorkflowStageLabels] = useState<Record<string, string>>({});
  const [assignedToMeOnly, setAssignedToMeOnly] = useState(false);
  const [studyForm, setStudyForm] = useState({
    visitDate: '',
    findings: '',
    recommendation: 'CREDIBLE' as 'CREDIBLE' | 'NOT_WORTHY',
    notes: '',
  });
  const [createForm, setCreateForm] = useState({
    customerId: '',
    requestedAmount: '',
    repaymentType: 'BULLET' as 'BULLET' | 'INSTALLMENTS',
    numberOfInstallments: '',
    creditPeriodMonths: '',
    notes: '',
  });

  useEffect(() => {
    (async () => {
      try {
        const [appRes, custRes, workflowRes] = await Promise.all([
          getCreditApplicationsAction(0, 500),
          getCustomersAction(0, 500),
          getCreditWorkflowAction(),
        ]);
        setApplications(appRes.content ?? []);
        setCustomers(custRes.content ?? []);
        const labels: Record<string, string> = {};
        (workflowRes?.steps ?? []).forEach((s) => {
          if (s.stageCode && s.stageName) labels[s.stageCode] = s.stageName;
        });
        setWorkflowStageLabels(labels);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    setAssignedToMeOnly(params.get('assignedToMe') === '1');
  }, []);

  const role = (user?.role as string) ?? '';
  const filtered = applications.filter((a) => {
    const matchesSearch =
      a.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.id?.toString().includes(searchTerm);
    const matchesAssigned =
      !assignedToMeOnly || (a.assignedToRole?.toLowerCase() === role.toLowerCase());
    return matchesSearch && matchesAssigned;
  });

  const runStageTransition = async (
    app: CreditApplication,
    stage: string,
    assignedToRole?: string
  ) => {
    setTransitioningId(app.id);
    try {
      const updated = await updateCreditApplicationAction(app.id, {
        customerId: app.customerId,
        requestedAmount: app.requestedAmount,
        stage,
        assignedToRole: assignedToRole ?? app.assignedToRole ?? undefined,
      });
      if (updated) {
        setApplications((prev) =>
          prev.map((x) => (x.id === app.id ? { ...x, ...updated } : x))
        );
      }
    } catch (e) {
      showAlert(toUserFriendlyMessage(e, 'Action failed. Please try again.'), 'Action failed');
    } finally {
      setTransitioningId(null);
    }
  };

  return (
    <div className="space-y-4 p-3 sm:p-5 bg-background min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Credit Applications</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            <strong>Ops Manager</strong> receives the application and can send it to the <strong>Collateral Manager</strong>. The Collateral Manager receives it, does the ground-check study (form below), and on submit the application is <strong>returned to the Ops Manager</strong>. Ops then rejects (Mark not worthy) or forwards to Finance → Manager → Release.
          </p>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            <strong>Collateral Manager:</strong> Use &quot;Assigned to me&quot; to see applications sent to you. Complete the study form and submit to return the application to the Operation Manager.
          </p>
          <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
            <strong>Finance:</strong> Generate the terms document and email it to the applicant. They sign, scan, and email it back. You must receive and view the signed document here (upload it), then sign and forward to Manager. The Manager can view the document, sign, and on Release the document stays stored and funds are released to the applicant.
          </p>
        </div>
        {(['admin', 'operation_manager'].includes(role) && (
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
              <Plus size={18} />
              New Application
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Credit Application</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground">Customer</label>
                <select
                  className="mt-1 w-full rounded-lg border border-border bg-input px-3 py-2 text-foreground"
                  value={createForm.customerId}
                  onChange={(e) => setCreateForm((f) => ({ ...f, customerId: e.target.value }))}
                >
                  <option value="">Select customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Requested Amount</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={createForm.requestedAmount}
                  onChange={(e) => setCreateForm((f) => ({ ...f, requestedAmount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Repayment</label>
                <div className="mt-1 flex flex-col gap-2">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="repaymentType"
                        checked={createForm.repaymentType === 'BULLET'}
                        onChange={() => setCreateForm((f) => ({ ...f, repaymentType: 'BULLET', numberOfInstallments: '' }))}
                        className="rounded border-border"
                      />
                      <span className="text-sm">One-off repayment</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="repaymentType"
                        checked={createForm.repaymentType === 'INSTALLMENTS'}
                        onChange={() => setCreateForm((f) => ({ ...f, repaymentType: 'INSTALLMENTS' }))}
                        className="rounded border-border"
                      />
                      <span className="text-sm">Installments</span>
                    </label>
                  </div>
                  {createForm.repaymentType === 'INSTALLMENTS' && (
                    <div className="flex gap-3 flex-wrap">
                      <div className="flex-1 min-w-[120px]">
                        <label className="text-xs text-muted-foreground block mb-0.5">Number of installments</label>
                        <Input
                          type="number"
                          min="2"
                          max="120"
                          value={createForm.numberOfInstallments}
                          onChange={(e) => setCreateForm((f) => ({ ...f, numberOfInstallments: e.target.value }))}
                          placeholder="e.g. 12"
                        />
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <label className="text-xs text-muted-foreground block mb-0.5">Period (months, optional)</label>
                        <Input
                          type="number"
                          min="1"
                          max="360"
                          value={createForm.creditPeriodMonths}
                          onChange={(e) => setCreateForm((f) => ({ ...f, creditPeriodMonths: e.target.value }))}
                          placeholder="e.g. 12"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Notes (optional)</label>
                <Input
                  value={createForm.notes}
                  onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Additional notes"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                onClick={async () => {
                  if (!createForm.customerId || !createForm.requestedAmount) return;
                  if (createForm.repaymentType === 'INSTALLMENTS' && (!createForm.numberOfInstallments || Number(createForm.numberOfInstallments) < 2)) return;
                  const created = await createCreditApplicationAction({
                    customerId: createForm.customerId,
                    requestedAmount: Number(createForm.requestedAmount),
                    repaymentType: createForm.repaymentType,
                    numberOfInstallments: createForm.repaymentType === 'INSTALLMENTS' && createForm.numberOfInstallments ? Number(createForm.numberOfInstallments) : null,
                    creditPeriodMonths: createForm.creditPeriodMonths ? Number(createForm.creditPeriodMonths) || undefined : undefined,
                    notes: createForm.notes || undefined,
                  });
                  if (created) {
                    setApplications((prev) => [created, ...prev]);
                    setCreateForm({ customerId: '', requestedAmount: '', repaymentType: 'BULLET', numberOfInstallments: '', creditPeriodMonths: '', notes: '' });
                    setCreateOpen(false);
                  }
                }}
              >
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        ))}
      </div>

      <Card className="border-border">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search by customer or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-input border-border"
              />
            </div>
            {['operation_manager', 'collateral_manager', 'finance_officer', 'manager'].includes(role) && (
              <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={assignedToMeOnly}
                  onChange={(e) => setAssignedToMeOnly(e.target.checked)}
                  className="rounded border-border"
                />
                Assigned to me
              </label>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Applications</CardTitle>
          <CardDescription>
            {filtered.length} applications. Flow: Ops sends to Collateral Manager → Collateral does study → returned to Ops → Ops sends to Finance → Manager releases.
            {role === 'collateral_manager' && (
              <span className="block mt-1 text-foreground/80">Applications in &quot;With Collateral Manager&quot; are assigned to you; complete the study and submit to return to Ops Manager.</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Repayment</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Stage / Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Created</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((app) => {
                    const stage = (app.stage ?? app.status) ?? '';
                    const isWithCollateral = stage === 'WITH_COLLATERAL' || app.status === 'UNDER_REVIEW';
                    const canSubmitStudy = (role === 'collateral_manager' || role === 'admin') && isWithCollateral;
                    const isOps = role === 'operation_manager' || role === 'admin';
                    const isFinance = role === 'finance_officer' || role === 'admin';
                    const isManager = role === 'manager' || role === 'admin';
                    const busy = transitioningId === app.id;

                    const opsActions =
                      isOps && stage === 'RECEIVED'
                        ? [{ label: 'Send to Collateral', stage: 'WITH_COLLATERAL', assignedToRole: 'collateral_manager' }]
                        : isOps && stage === 'STUDY_SUBMITTED'
                          ? [
                              { label: 'Mark not worthy', stage: 'NOT_WORTHY', assignedToRole: undefined },
                              { label: 'Send to Finance', stage: 'WITH_FINANCE', assignedToRole: 'finance_officer' },
                            ]
                          : [];
                    const hasSignedDoc = !!app.hasSignedDocument;
                    const financeActions =
                      isFinance && stage === 'DOCUMENT_SENT'
                        ? [{ label: 'Signed doc received – forward to Manager', stage: 'AWAITING_SIGNATURES', assignedToRole: 'manager' as const, requireSignedDoc: true }]
                        : [];
                    const managerActions =
                      isManager && (stage === 'AWAITING_SIGNATURES' || stage === 'DOCUMENT_SENT')
                        ? [{ label: 'Release credit', stage: 'RELEASED', assignedToRole: undefined }]
                        : [];

                    const canViewReport = isOps && (stage === 'STUDY_SUBMITTED' || stage === 'WITH_COLLATERAL');
                    const stageActions = [...opsActions, ...financeActions, ...managerActions];

                    return (
                      <tr key={app.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium text-foreground">{app.customerName}</td>
                        <td className="py-3 px-4">{formatAmountWithCode(app.requestedAmount)}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {formatRepaymentLabel(app.repaymentType, app.numberOfInstallments)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`rounded px-2 py-0.5 text-xs ${statusColors[stage] ?? 'bg-muted text-muted-foreground'}`}>
                            {workflowStageLabels[stage] ?? STAGE_LABELS[stage] ?? stage}
                          </span>
                          {app.assignedToRole && (
                            <span className="ml-1.5 text-xs text-muted-foreground">
                              → {app.assignedToRole.replace(/_/g, ' ')}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex flex-wrap gap-1.5 justify-end">
                            {canViewReport && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={async () => {
                                  setViewReportOpen(app);
                                  const studies = await getCollateralStudiesAction(app.id);
                                  setViewReportStudies(studies ?? []);
                                }}
                              >
                                <FileText size={14} />
                                View collateral report
                              </Button>
                            )}
                            {canSubmitStudy && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={async () => {
                                  setStudyFormOpen(app);
                                  setStudyForm({ visitDate: '', findings: '', recommendation: 'CREDIBLE', notes: '' });
                                  setSubmittingStudy(false);
                                  const studies = await getCollateralStudiesAction(app.id);
                                  setExistingStudiesCount(studies?.length ?? 0);
                                }}
                              >
                                <FileCheck size={14} />
                                View & fill study form
                              </Button>
                            )}
                            {isFinance && stage === 'WITH_FINANCE' && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1"
                                  disabled={!!emailingTermsId}
                                  onClick={async () => {
                                    setEmailingTermsId(app.id);
                                    try {
                                      const result = await emailTermsToApplicantAction(app.id);
                                      if (result.ok) {
                                        const list = await getCreditApplicationsAction(0, 500);
                                        setApplications(list.content ?? []);
                                      } else {
                                        showAlert(result.error ?? 'Failed to email terms', 'Email terms');
                                      }
                                    } finally {
                                      setEmailingTermsId(null);
                                    }
                                  }}
                                >
                                  <Mail size={14} />
                                  {emailingTermsId === app.id ? 'Sending…' : 'Generate terms & email to applicant'}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1"
                                  onClick={async () => {
                                    const result = await getCreditTermsPdfAction(app.id);
                                    if (result.ok && result.pdfBase64) {
                                      const bin = Uint8Array.from(atob(result.pdfBase64), (c) => c.charCodeAt(0));
                                      const blob = new Blob([bin], { type: 'application/pdf' });
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = `credit-terms-application-${app.id}.pdf`;
                                      a.click();
                                      URL.revokeObjectURL(url);
                                    } else {
                                      showAlert(result.ok === false ? result.error ?? 'Could not download PDF' : 'Could not download PDF', 'Download terms');
                                    }
                                  }}
                                >
                                  <FileDown size={14} />
                                  Download terms (PDF)
                                </Button>
                              </>
                            )}
                            {isFinance && stage === 'DOCUMENT_SENT' && (
                              <>
                                <label className={`inline-flex items-center gap-1 cursor-pointer ${uploadingSignedId === app.id ? 'pointer-events-none opacity-70' : ''}`}>
                                  <input
                                    key={signedDocFileInputKey}
                                    type="file"
                                    accept="application/pdf,.pdf"
                                    className="sr-only"
                                    disabled={!!uploadingSignedId}
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (!file) return;
                                      setUploadingSignedId(app.id);
                                      try {
                                        const base64 = await new Promise<string>((res, rej) => {
                                          const r = new FileReader();
                                          r.onload = () => {
                                            const s = (r.result as string) ?? '';
                                            const b64 = s.includes(',') ? s.split(',')[1] : s;
                                            res(b64 || '');
                                          };
                                          r.onerror = rej;
                                          r.readAsDataURL(file);
                                        });
                                        const result = await uploadSignedDocumentAction(app.id, base64);
                                        if (result.ok) {
                                          const list = await getCreditApplicationsAction(0, 500);
                                          setApplications(list.content ?? []);
                                          setSignedDocFileInputKey((k) => k + 1);
                                        } else {
                                          showAlert(result.error ?? 'Upload failed', 'Upload signed document');
                                        }
                                      } finally {
                                        setUploadingSignedId(null);
                                      }
                                    }}
                                  />
                                  <Button variant="outline" size="sm" className="gap-1" asChild disabled={!!uploadingSignedId}>
                                    <span>
                                      <Upload size={14} />
                                      {uploadingSignedId === app.id ? 'Uploading…' : 'Upload signed document'}
                                    </span>
                                  </Button>
                                </label>
                                {hasSignedDoc && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-1"
                                    onClick={async () => {
                                      const result = await getSignedDocumentAction(app.id);
                                      if (result.ok && result.pdfBase64) {
                                        const bin = Uint8Array.from(atob(result.pdfBase64), (c) => c.charCodeAt(0));
                                        const blob = new Blob([bin], { type: 'application/pdf' });
                                        const url = URL.createObjectURL(blob);
                                        window.open(url, '_blank');
                                        URL.revokeObjectURL(url);
                                      } else {
                                        showAlert(result.ok === false ? result.error ?? 'Could not open document' : 'Could not open document', 'View signed document');
                                      }
                                    }}
                                  >
                                    <Eye size={14} />
                                    View signed document
                                  </Button>
                                )}
                              </>
                            )}
                            {(isManager && (stage === 'AWAITING_SIGNATURES' || stage === 'DOCUMENT_SENT') && hasSignedDoc) && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={async () => {
                                  const result = await getSignedDocumentAction(app.id);
                                  if (result.ok && result.pdfBase64) {
                                    const bin = Uint8Array.from(atob(result.pdfBase64), (c) => c.charCodeAt(0));
                                    const blob = new Blob([bin], { type: 'application/pdf' });
                                    const url = URL.createObjectURL(blob);
                                    window.open(url, '_blank');
                                    URL.revokeObjectURL(url);
                                  } else {
                                    showAlert(result.ok === false ? result.error ?? 'Could not open document' : 'Could not open document', 'View signed document');
                                  }
                                }}
                              >
                                <Eye size={14} />
                                View signed document
                              </Button>
                            )}
                            {stageActions.map((action) => {
                              const requireSignedDoc = 'requireSignedDoc' in action && action.requireSignedDoc;
                              const disabled = busy || (requireSignedDoc && !hasSignedDoc);
                              const releaseTitle = action.stage === 'RELEASED' ? 'Document stays stored; funds will be released to the applicant' : undefined;
                              const title = requireSignedDoc && !hasSignedDoc ? 'Upload and view the applicant-signed document first' : releaseTitle;
                              return (
                                <Button
                                  key={action.label}
                                  variant={action.stage === 'RELEASED' ? 'default' : 'outline'}
                                  size="sm"
                                  className="gap-1"
                                  disabled={disabled}
                                  title={title}
                                  onClick={() => runStageTransition(app, action.stage, action.assignedToRole)}
                                >
                                  {busy ? '…' : action.label}
                                </Button>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-muted-foreground">
                      No credit applications found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* View collateral report: read-only for Ops Manager to review before forwarding to Finance or marking not worthy */}
      <Dialog open={!!viewReportOpen} onOpenChange={(open) => { if (!open) { setViewReportOpen(null); setViewReportStudies([]); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Collateral report – Credit Application #{viewReportOpen?.id ?? '—'}</DialogTitle>
            <DialogDescription>
              Review the collateral study below before deciding to send to Finance or mark as not worthy.
            </DialogDescription>
          </DialogHeader>
          {viewReportOpen && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm">
                <p className="font-medium text-foreground">Application</p>
                <p className="text-muted-foreground mt-0.5">
                  #{viewReportOpen.id} · <strong>{viewReportOpen.customerName}</strong> · {formatAmountWithCode(viewReportOpen.requestedAmount)} requested
                </p>
              </div>
              {viewReportStudies.length === 0 ? (
                <p className="text-sm text-muted-foreground">No collateral study recorded yet for this application.</p>
              ) : (
                <div className="space-y-4">
                  {viewReportStudies.map((study, idx) => (
                    <div key={study.id ?? idx} className="rounded-lg border border-border p-3 space-y-2 text-sm">
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                        {study.visitDate && <span>Visit date: {study.visitDate}</span>}
                        {study.recommendation && <span>Recommendation: <strong className="text-foreground">{study.recommendation}</strong></span>}
                        {study.createdAt && <span>Submitted: {new Date(study.createdAt).toLocaleString()}</span>}
                      </div>
                      {study.findings && (
                        <div>
                          <p className="font-medium text-foreground mb-0.5">Findings</p>
                          <p className="text-muted-foreground whitespace-pre-wrap">{study.findings}</p>
                        </div>
                      )}
                      {study.notes && (
                        <div>
                          <p className="font-medium text-foreground mb-0.5">Notes</p>
                          <p className="text-muted-foreground whitespace-pre-wrap">{study.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setViewReportOpen(null); setViewReportStudies([]); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Collateral study form: auto-generated against the selected credit application; submitted study is attached and application is returned to Operation Manager */}
      <Dialog open={!!studyFormOpen} onOpenChange={(open) => { if (!open) setStudyFormOpen(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Collateral study form – Credit Application #{studyFormOpen?.id ?? '—'}</DialogTitle>
            <DialogDescription>
              This form is generated for the selected credit application. Complete it during or after your ground check. When you submit, this study will be attached to the application and the application will be returned to the Operation Manager for the next step.
            </DialogDescription>
          </DialogHeader>
          {studyFormOpen && (
            <div className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm">
                <p className="font-medium text-foreground">Credit application</p>
                <p className="text-muted-foreground mt-0.5">
                  Application #{studyFormOpen.id} · <strong>{studyFormOpen.customerName}</strong> · {formatAmountWithCode(studyFormOpen.requestedAmount)} requested
                </p>
                {existingStudiesCount > 0 && (
                  <p className="text-muted-foreground text-xs mt-1">
                    {existingStudiesCount} previous study/exercise already recorded for this application. This submission will add another.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Visit / check date</label>
                <Input
                  type="date"
                  value={studyForm.visitDate}
                  onChange={(e) => setStudyForm((f) => ({ ...f, visitDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Findings</label>
                <textarea
                  className="w-full min-h-[100px] rounded-lg border border-border bg-input px-3 py-2 text-sm"
                  placeholder="Record your ground check findings..."
                  value={studyForm.findings}
                  onChange={(e) => setStudyForm((f) => ({ ...f, findings: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Recommendation</label>
                <select
                  className="w-full border border-border rounded-md bg-background px-3 py-2 text-sm"
                  value={studyForm.recommendation}
                  onChange={(e) => setStudyForm((f) => ({ ...f, recommendation: e.target.value as 'CREDIBLE' | 'NOT_WORTHY' }))}
                >
                  <option value="CREDIBLE">Credible – forward to Finance Manager</option>
                  <option value="NOT_WORTHY">Not worthy of credit</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Additional notes</label>
                <Input
                  value={studyForm.notes}
                  onChange={(e) => setStudyForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setStudyFormOpen(null)}>Cancel</Button>
            <Button
              className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
              disabled={submittingStudy || !studyForm.visitDate}
              onClick={async () => {
                if (!studyFormOpen || !studyForm.visitDate) return;
                setSubmittingStudy(true);
                try {
                  await submitCollateralStudyAction(studyFormOpen.id, {
                    visitDate: studyForm.visitDate,
                    findings: studyForm.findings || undefined,
                    recommendation: studyForm.recommendation,
                    notes: studyForm.notes || undefined,
                  });
                  setStudyFormOpen(null);
                  const res = await getCreditApplicationsAction(0, 500);
                  setApplications(res.content ?? []);
                } catch (e) {
                  showAlert(toUserFriendlyMessage(e, 'Failed to submit study. Please try again.'), 'Submit study');
                } finally {
                  setSubmittingStudy(false);
                }
              }}
            >
              <Send size={14} />
              Submit study & return to Operation Manager
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
