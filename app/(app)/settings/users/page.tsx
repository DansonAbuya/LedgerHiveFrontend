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
import { getUsersAction, inviteUserAction, type AdminUser } from '@/lib/actions/users';
import { Input } from '@/components/ui/input';

const roleDescriptions = {
  admin: 'Full system access, manage users and settings',
  finance_officer: 'View and manage invoices and payments',
  collections_agent: 'Handle collections and reminders',
  manager: 'View reports and manage team members',
};

export default function UserManagementPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'finance_officer' | 'collections_agent' | 'manager'>('finance_officer');
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSetPasswordLink, setInviteSetPasswordLink] = useState<string | null>(null);
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
        setInviteRole('finance_officer');
        setInviteOpen(false);
        if (typeof window !== 'undefined') {
          const params = new URLSearchParams();
          if (created.email) params.set('email', created.email);
          if (created.tenantId) params.set('tenantId', created.tenantId);
          setInviteSetPasswordLink(`${window.location.origin}/set-password?${params.toString()}`);
        }
      }
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to invite user');
    }
  };

  return (
    <div className="space-y-6 p-6 bg-background">
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
          <Button variant="ghost" size="sm" onClick={() => setInviteSetPasswordLink(null)}>
            Dismiss
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage team members and their permissions
          </p>
        </div>
        <Button
          className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
          onClick={() => setInviteOpen(true)}
        >
          <Plus size={18} />
          Invite User
        </Button>
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
              <p className="text-sm text-muted-foreground py-4">No users yet. Invite your team above.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Name
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Role
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Joined
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">
                    Status
                  </th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">
                    Actions
                  </th>
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
                        <span className="text-foreground capitalize">
                          {user.role.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {user.status}
                      </span>
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
            <CardTitle>Invite New User</CardTitle>
            <CardDescription>
              A temporary password will be emailed to the user. They will be required to change it on first login.
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
                  onChange={(e) =>
                    setInviteRole(e.target.value as 'admin' | 'finance_officer' | 'collections_agent' | 'manager')
                  }
                >
                  <option value="admin">Admin</option>
                  <option value="finance_officer">Finance Officer</option>
                  <option value="collections_agent">Collections Agent</option>
                  <option value="manager">Manager</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  Send Invite
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
            Permission levels for team members
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(roleDescriptions).map(([role, description]) => (
              <div key={role} className="border border-border rounded-lg p-4">
                <h4 className="font-semibold text-foreground capitalize mb-1">
                  {role.replace('_', ' ')}
                </h4>
                <p className="text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
