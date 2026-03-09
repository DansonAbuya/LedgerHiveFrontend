'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { getAvailableReportsAction, getReportDownloadAction, type AvailableReport, type ReportDownloadParams } from '@/lib/actions/reports';
import { getCustomersAction, type Customer } from '@/lib/actions/customers';
import { getCreditApplicationsAction, type CreditApplication } from '@/lib/actions/credit-issuance';
import { FileDown, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

function downloadBlob(base64: string, filename: string, mimeType: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<AvailableReport[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [customerStatementCustomerId, setCustomerStatementCustomerId] = useState<string>('');
  const [paymentsFromDate, setPaymentsFromDate] = useState('');
  const [paymentsToDate, setPaymentsToDate] = useState('');
  const [applications, setApplications] = useState<CreditApplication[]>([]);
  const [applicationStatusApplicationId, setApplicationStatusApplicationId] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const list = await getAvailableReportsAction();
        if (!cancelled) setReports(list);
        const hasCustomerStatement = list.some((r) => r.id === 'customer-statement');
        if (hasCustomerStatement) {
          const page = await getCustomersAction(0, 500);
          if (!cancelled) setCustomers(page?.content ?? []);
        }
        const hasApplicationStatus = list.some((r) => r.id === 'application-status');
        if (hasApplicationStatus) {
          const page = await getCreditApplicationsAction(0, 500);
          if (!cancelled) setApplications(page?.content ?? []);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const staffRoles = ['admin', 'operation_manager', 'collateral_manager', 'finance_officer', 'manager'];
  const canAccess = (report: AvailableReport) => {
    if (!user?.role) return true;
    if (report.requiredRole === 'ADMIN') return user.role === 'admin';
    if (report.requiredRole === 'USER') return staffRoles.includes(user.role);
    if (report.requiredRole === 'CUSTOMER') return user.role === 'customer';
    return report.requiredRole === user.role;
  };

  const getParamsForReport = (reportId: string): ReportDownloadParams | undefined => {
    if (reportId === 'customer-statement' && customerStatementCustomerId) {
      return { customerId: Number(customerStatementCustomerId) };
    }
    if (reportId === 'application-status' && applicationStatusApplicationId) {
      return { applicationId: Number(applicationStatusApplicationId) };
    }
    if (reportId === 'payments-summary' && (paymentsFromDate || paymentsToDate)) {
      return { fromDate: paymentsFromDate || undefined, toDate: paymentsToDate || undefined };
    }
    return undefined;
  };

  const handleDownload = async (reportId: string, format: 'pdf' | 'xlsx') => {
    if (reportId === 'customer-statement' && !customerStatementCustomerId) return;
    if (reportId === 'application-status' && !applicationStatusApplicationId) return;
    const key = `${reportId}-${format}`;
    setDownloading(key);
    try {
      const params = getParamsForReport(reportId);
      const result = await getReportDownloadAction(reportId, format, params);
      if (result) {
        const mime = format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        downloadBlob(result.data, result.filename, mime);
      }
    } finally {
      setDownloading(null);
    }
  };

  if (!user) {
    return (
      <div className="p-3 sm:p-5 min-w-0">
        <p className="text-sm text-muted-foreground">Please sign in to view reports.</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-5 min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Generate and download reports as PDF or Excel. Only reports applicable to your role are shown. Organizations with white labeling can have their logo on reports (Settings → Organization).
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading reports...</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
          {reports.map((report) => {
            const allowed = canAccess(report);
            const needsCustomer = report.id === 'customer-statement';
            const needsDateRange = report.id === 'payments-summary';
            const needsApplication = report.id === 'application-status';
            const canDownloadCustomerStatement = needsCustomer ? !!customerStatementCustomerId : true;
            const canDownloadApplicationStatus = needsApplication ? !!applicationStatusApplicationId : true;
            return (
              <Card key={report.id} className="border-border">
                <CardHeader>
                  <CardTitle className="text-lg">{report.name}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {needsCustomer && (
                    <div className="space-y-2">
                      <Label>Customer</Label>
                      <Select value={customerStatementCustomerId} onValueChange={setCustomerStatementCustomerId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name} {c.email ? `(${c.email})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {needsApplication && (
                    <div className="space-y-2">
                      <Label>Application</Label>
                      <Select value={applicationStatusApplicationId} onValueChange={setApplicationStatusApplicationId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select application" />
                        </SelectTrigger>
                        <SelectContent>
                          {applications.map((app) => (
                            <SelectItem key={app.id} value={app.id}>
                              #{app.id} – {app.customerName ?? 'Customer'} – {app.requestedAmount != null ? Number(app.requestedAmount).toLocaleString() : ''} – {app.stage ?? app.status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {needsDateRange && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label>From date</Label>
                        <Input
                          type="date"
                          value={paymentsFromDate}
                          onChange={(e) => setPaymentsFromDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>To date</Label>
                        <Input
                          type="date"
                          value={paymentsToDate}
                          onChange={(e) => setPaymentsToDate(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                  {!allowed ? (
                    <p className="text-sm text-muted-foreground">You do not have permission to generate this report.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {report.formats.map((fmt) => (
                        <Button
                          key={fmt}
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(report.id, fmt as 'pdf' | 'xlsx')}
                          disabled={downloading !== null || (needsCustomer && !canDownloadCustomerStatement) || (needsApplication && !canDownloadApplicationStatus)}
                        >
                          {downloading === `${report.id}-${fmt}` ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : fmt === 'pdf' ? (
                            <FileDown className="h-4 w-4 mr-2" />
                          ) : (
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                          )}
                          {fmt.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
