'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowDown, ArrowLeft, ArrowUp, Plus, Save, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth-context';
import { useAlert } from '@/lib/alert-context';
import { getUsersAction, type AdminUser } from '@/lib/actions/users';
import {
  getCreditWorkflowAction,
  replaceCreditWorkflowAction,
  type CreditWorkflowStep,
} from '@/lib/actions/credit-issuance';
import { ROLE_LABELS, type Role } from '@/lib/roles';
import { toUserFriendlyMessage } from '@/lib/errors';

type EditableStep = {
  stageCode: string;
  stageName: string;
  assignedRole: string;
  assignedUserId: string;
};

const DEFAULT_STEPS: EditableStep[] = [
  { stageCode: 'RECEIVED', stageName: 'Received', assignedRole: 'operation_manager', assignedUserId: '' },
  { stageCode: 'WITH_COLLATERAL', stageName: 'With Collateral', assignedRole: 'collateral_manager', assignedUserId: '' },
  { stageCode: 'STUDY_SUBMITTED', stageName: 'Study Submitted', assignedRole: 'operation_manager', assignedUserId: '' },
  { stageCode: 'WITH_FINANCE', stageName: 'With Finance', assignedRole: 'finance_officer', assignedUserId: '' },
  { stageCode: 'DOCUMENT_SENT', stageName: 'Document Sent', assignedRole: 'finance_officer', assignedUserId: '' },
  { stageCode: 'AWAITING_SIGNATURES', stageName: 'Awaiting Signatures', assignedRole: 'manager', assignedUserId: '' },
  { stageCode: 'RELEASED', stageName: 'Released', assignedRole: 'manager', assignedUserId: '' },
];

function normalizeStageCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '_');
}

function mapWorkflowSteps(steps: CreditWorkflowStep[]): EditableStep[] {
  if (!steps || steps.length === 0) return DEFAULT_STEPS;
  return steps.map((s) => ({
    stageCode: s.stageCode ?? '',
    stageName: s.stageName ?? (s.stageCode ?? '').replace(/_/g, ' '),
    assignedRole: s.assignedRole ?? '',
    assignedUserId: s.assignedUserId ?? '',
  }));
}

export default function CreditWorkflowSettingsPage() {
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const [steps, setSteps] = useState<EditableStep[]>(DEFAULT_STEPS);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canManage = user?.role === 'admin';
  const roleOptions: Role[] = ['operation_manager', 'collateral_manager', 'finance_officer', 'manager', 'customer', 'admin'];

  const usersById = useMemo(() => {
    const m = new Map<string, AdminUser>();
    users.forEach((u) => m.set(u.id, u));
    return m;
  }, [users]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [workflow, tenantUsers] = await Promise.all([
          getCreditWorkflowAction(),
          getUsersAction(),
        ]);
        if (!cancelled) {
          setSteps(mapWorkflowSteps(workflow.steps ?? []));
          setUsers(tenantUsers ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          showAlert(toUserFriendlyMessage(err, 'Could not load credit workflow.'), 'Credit workflow');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showAlert]);

  const moveStep = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= steps.length) return;
    setSteps((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[nextIndex];
      copy[nextIndex] = temp;
      return copy;
    });
  };

  const validate = (): string | null => {
    if (steps.length === 0) return 'Add at least one workflow step.';
    const seen = new Set<string>();
    for (const step of steps) {
      const code = normalizeStageCode(step.stageCode);
      if (!code) return 'Stage code is required for all steps.';
      if (seen.has(code)) return `Duplicate stage code: ${code}`;
      seen.add(code);
      if (!step.assignedRole && !step.assignedUserId) {
        return `Step ${code} must have an assigned role or assigned user.`;
      }
      if (step.assignedUserId && !usersById.has(step.assignedUserId)) {
        return `Assigned user not found for step ${code}.`;
      }
    }
    return null;
  };

  const save = async () => {
    const error = validate();
    if (error) {
      showAlert(error, 'Validation');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        steps: steps.map((s) => ({
          stageCode: normalizeStageCode(s.stageCode),
          stageName: s.stageName?.trim() || normalizeStageCode(s.stageCode).replace(/_/g, ' '),
          assignedRole: s.assignedRole || undefined,
          assignedUserId: s.assignedUserId || null,
        })),
      };
      const res = await replaceCreditWorkflowAction(payload);
      if (!res) {
        showAlert('You are not authorized to update workflow.', 'Credit workflow');
        return;
      }
      setSteps(mapWorkflowSteps(res.steps ?? []));
      showAlert('Workflow updated successfully.', 'Credit workflow');
    } catch (err) {
      showAlert(toUserFriendlyMessage(err, 'Could not save credit workflow.'), 'Credit workflow');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 p-4 sm:p-5 bg-background">
      <Link href="/settings">
        <Button variant="ghost" className="gap-2" size="sm">
          <ArrowLeft size={16} />
          Back to Settings
        </Button>
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Credit Workflow</h1>
        <p className="text-muted-foreground mt-2">
          Define your credit issuance flow. Admin can adjust steps, order, and who is responsible for each step.
        </p>
      </div>

      {!canManage && (
        <Card className="border-border">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            Only Admin can modify workflow steps. You can view the current configuration here.
          </CardContent>
        </Card>
      )}

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Workflow Steps</CardTitle>
          <CardDescription>
            For each step, choose either a role, a specific user, or both. If user is set, that user is required for that step.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading workflow...</p>
          ) : steps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No steps configured.</p>
          ) : (
            steps.map((step, idx) => (
              <div key={`${step.stageCode}-${idx}`} className="rounded-lg border border-border p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">Step {idx + 1}</p>
                  {canManage && (
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => moveStep(idx, -1)} disabled={idx === 0}>
                        <ArrowUp size={14} />
                      </Button>
                      <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => moveStep(idx, 1)} disabled={idx === steps.length - 1}>
                        <ArrowDown size={14} />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => setSteps((prev) => prev.filter((_, i) => i !== idx))}
                        disabled={steps.length <= 1}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Stage code</label>
                    <Input
                      value={step.stageCode}
                      disabled={!canManage}
                      onChange={(e) => setSteps((prev) => prev.map((x, i) => (i === idx ? { ...x, stageCode: e.target.value } : x)))}
                      placeholder="e.g. WITH_FINANCE"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Display name</label>
                    <Input
                      value={step.stageName}
                      disabled={!canManage}
                      onChange={(e) => setSteps((prev) => prev.map((x, i) => (i === idx ? { ...x, stageName: e.target.value } : x)))}
                      placeholder="e.g. With Finance"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">Assigned role</label>
                    <select
                      className="w-full border border-border rounded-md bg-background px-3 py-2 text-sm"
                      value={step.assignedRole}
                      disabled={!canManage}
                      onChange={(e) => setSteps((prev) => prev.map((x, i) => (i === idx ? { ...x, assignedRole: e.target.value } : x)))}
                    >
                      <option value="">None</option>
                      {roleOptions.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">Assigned user (optional)</label>
                    <select
                      className="w-full border border-border rounded-md bg-background px-3 py-2 text-sm"
                      value={step.assignedUserId}
                      disabled={!canManage}
                      onChange={(e) => {
                        const id = e.target.value;
                        const selected = id ? usersById.get(id) : null;
                        setSteps((prev) =>
                          prev.map((x, i) =>
                            i === idx
                              ? { ...x, assignedUserId: id, assignedRole: selected?.role ? String(selected.role) : x.assignedRole }
                              : x
                          )
                        );
                      }}
                    >
                      <option value="">None</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.email})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))
          )}

          {canManage && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                className="gap-2"
                onClick={() => setSteps((prev) => [...prev, { stageCode: '', stageName: '', assignedRole: '', assignedUserId: '' }])}
              >
                <Plus size={14} />
                Add step
              </Button>
              <Button type="button" className="gap-2 bg-accent hover:bg-accent/90 text-accent-foreground" onClick={save} disabled={saving}>
                <Save size={14} />
                {saving ? 'Saving...' : 'Save workflow'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
