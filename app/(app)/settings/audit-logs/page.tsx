'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getAuditLogsAction, type AuditLog } from '@/lib/actions/audit-logs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AuditLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await getAuditLogsAction(0, 100);
        if (!cancelled) setLogs(res.content ?? []);
      } catch {
        if (!cancelled) setLogs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (user?.role === 'admin') {
      load();
    } else {
      setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-4 sm:p-5">
        <p className="text-sm text-muted-foreground">
          You do not have permission to view audit logs.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-5">
        <p className="text-sm text-muted-foreground">Loading audit logs...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 space-y-3">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          View a read-only history of key changes. Only administrators can access this page.
        </p>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Showing the latest {logs.length} audit entries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit entries found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3">Time</th>
                    <th className="text-left py-2 px-3">User ID</th>
                    <th className="text-left py-2 px-3">Action</th>
                    <th className="text-left py-2 px-3">Entity</th>
                    <th className="text-left py-2 px-3">Entity ID</th>
                    <th className="text-left py-2 px-3">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-border">
                      <td className="py-2 px-3 text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 text-xs">{log.userId ?? 'system'}</td>
                      <td className="py-2 px-3 text-xs font-medium">{log.action}</td>
                      <td className="py-2 px-3 text-xs">{log.entityType}</td>
                      <td className="py-2 px-3 text-xs">{log.entityId ?? '-'}</td>
                      <td className="py-2 px-3 text-xs max-w-md truncate" title={log.details ?? ''}>
                        {log.details ?? '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

