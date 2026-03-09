'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, Plus, MoreVertical, Edit, Trash2, Shield, Copy, Check } from 'lucide-react';
import { getUsersAction, inviteUserAction, setUserPortalEnabledAction, type AdminUser } from '@/lib/actions/users';
import { toUserFriendlyMessage } from '@/lib/errors';
import { ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, canInviteUsers, CAN_MANAGE_PORTAL_ACCESS, isPortalGatedRole, type Role } from '@/lib/roles';
import { useAuth } from '@/lib/auth-context';
import { Input } from '@/components/ui/input';

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('customer');
  const [togglingPortalId, setTogglingPortalId] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSetPasswordLink, setInviteSetPasswordLink] = useState<string | null>(null);
  const [lastInvitedRole, setLastInvitedRole] = useState<Role | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const list = await getUsersAction();
        if (!cancelled) setUsers(list);
      } catch {
        if (!cancelled) setUsers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    if (!inviteName || !inviteEmail) {
      setInviteError('Name and email are required');
      return;
    }
    try {
      const created = await inviteUserAction({
        name: inviteName,
        email: inviteEmail,
        role: inviteRole,
      });
      if (created) {
        setUsers((prev) => [...prev, created]);
        setInviteName('');
        setInviteEmail('');
        setInviteRole(currentUser?.role === 'operation_manager' ? 'customer' : 'operation_manager');
        setInviteOpen(false);
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams();
          if (created.email) params.set('email', created.email);
          if (created.tenantId) params.set('tenantId', created.tenantId);
          setInviteSetPasswordLink(`${window.location.origin}/set-password?${params.toString()}`);
          setLastInvitedRole(created.role as Role);
        }
      }
    } catch (err) {
      setInviteError(toUserFriendlyMessage(err, 'Could not invite user. Please try again.'));
    }
  };

  return (
    <div className="space-y-4 p-4 sm:p-5 bg-background">
      {/* Header */}
      <Link href="/settings">
        <Button variant="ghost" className="gap-2" size="sm">
          <ArrowLeft size={16} />
          Back to Settings
        </Button>
      </Link>

      {inviteSetPasswordLink && (
        <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-3">
          <p className="text-sm text-foreground">
            <strong>User invited.</strong> An OTP has been sent to their email. They must set their password using the link below before signing in.
            {lastInvitedRole === 'customer' && (
              <> Enable their portal (in the table above) so they can log in after setting their password.</>
            )}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-muted-foreground shrink-0">Set password link:</span>
            <code className="text-xs bg-muted px-2 py-1 rounded truncate flex-1 min-w-0" title={inviteSetPasswordLink}>
              {inviteSetPasswordLink}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(inviteSetPasswordLink);
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
            >
              {copiedLink ? <Check size={14} /> : <Copy size={14} />}
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={() => { setInviteSetPasswordLink(null); setLastInvitedRole(null); }}>
            Dismiss
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Admin adds staff (they can always log in). Operation Manager adds customers; a set-password link is sent. Admin or Operation Manager must enable a customer&apos;s portal for them to log in.
          </p>
        </div>
        {(currentUser && canInviteUsers(currentUser.role as string)) && (
          <Button
            className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
            onClick={() => setInviteOpen(true)}
          >
            <Plus size={18} />
            Invite User
          </Button>
        )}
      </div>

      {/* Users Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {users.length} users in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {loading ? (
              <p className="text-sm text-muted-foreground py-4">Loading users...</p>
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                No users yet. {currentUser && canInviteUsers(currentUser.role as string) ? 'Invite your team above.' : 'Only admins can add users.'}
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Email</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Role</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Joined</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Portal</th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-border hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="font-medium text-foreground">
                        {user.name}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Shield size={16} className="text-accent" />
                        <span className="text-foreground">
                          {ROLE_LABELS[user.role as Role] ?? (user.role as string).replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      {isPortalGatedRole(user.role as string) ? (
                        currentUser && CAN_MANAGE_PORTAL_ACCESS.includes(currentUser.role as Role) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={togglingPortalId === user.id}
                            onClick={async () => {
                              setTogglingPortalId(user.id);
                              const ok = await setUserPortalEnabledAction(user.id, !user.portalEnabled);
                              if (ok) setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, portalEnabled: !u.portalEnabled } : u));
                              setTogglingPortalId(null);
                            }}
                          >
                            {togglingPortalId === user.id ? '…' : user.portalEnabled !== false ? 'Disable' : 'Enable'}
                          </Button>
                        ) : (
                          <span className={`text-xs font-medium ${user.portalEnabled !== false ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {user.portalEnabled !== false ? 'Enabled' : 'Disabled'}
                          </span>
                        )
                      ) : (
                        <span className="text-xs text-muted-foreground">Always</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Edit size={16} className="mr-2" />
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            Resend Invite
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 size={16} className="mr-2" />
                            Remove User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {inviteOpen && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle>{currentUser?.role === 'operation_manager' ? 'Add Customer / Applicant' : 'Invite New User'}</CardTitle>
            <CardDescription>
              {currentUser?.role === 'operation_manager'
                ? 'Add a customer or applicant. A set-password link will be sent to their email. Enable their portal (above) so they can log in after setting their password.'
                : 'Admin can add staff (they can always log in) or customers. Customers need their portal enabled by Admin or Operation Manager. An OTP and set-password link are sent to their email.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleInvite} className="space-y-4 max-w-md">
              {inviteError && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded px-3 py-2">
                  {inviteError}
                </p>
              )}
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <Input
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="jane@example.com"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Role</label>
                <select
                  className="w-full border border-border rounded-md bg-background px-3 py-2 text-sm"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Role)}
                >
                  {(currentUser?.role === 'operation_manager' ? (['customer'] as const) : ROLES).map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  {currentUser?.role === 'operation_manager' ? 'Add customer & send link' : 'Send Invite'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Role Descriptions */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Available Roles</CardTitle>
          <CardDescription>
            Staff (added by Admin) can always log in. Customers (added by Operation Manager) receive a set-password link; Admin or Operation Manager must enable their portal for them to log in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ROLES.map((role) => (
              <div key={role} className="border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground mb-1">{ROLE_LABELS[role]}</h4>
                <p className="text-sm text-muted-foreground">{ROLE_DESCRIPTIONS[role]}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
