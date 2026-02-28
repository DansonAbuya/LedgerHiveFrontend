'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Edit, Trash2, MoreVertical, Mail, MessageSquare, Clock } from 'lucide-react';

// Mock data
const mockTemplates = [
  {
    id: '1',
    name: 'First Reminder - Polite',
    channel: 'Email',
    subject: 'Payment Reminder - Invoice Due',
    preview: 'We noticed that your invoice INV-001 is now due...',
    triggerDays: 1,
    status: 'Active',
    used: 234,
  },
  {
    id: '2',
    name: 'Second Reminder - Urgent',
    channel: 'Email',
    subject: 'Urgent: Invoice Payment Required',
    preview: 'Your invoice INV-001 is now 7 days overdue...',
    triggerDays: 7,
    status: 'Active',
    used: 156,
  },
  {
    id: '3',
    name: 'SMS Reminder - Quick',
    channel: 'SMS',
    subject: 'Payment Due',
    preview: 'Hi {{customer_name}}, Invoice INV-001 is due today.',
    triggerDays: 0,
    status: 'Active',
    used: 89,
  },
  {
    id: '4',
    name: 'Final Notice - Legal',
    channel: 'Email',
    subject: 'Final Notice - Debt Collection',
    preview: 'This is a final notice regarding your outstanding debt...',
    triggerDays: 30,
    status: 'Active',
    used: 42,
  },
];

const mockSchedules = [
  {
    id: '1',
    name: 'Standard Collections Flow',
    steps: [
      { day: 1, template: 'First Reminder - Polite', channel: 'Email' },
      { day: 7, template: 'SMS Reminder - Quick', channel: 'SMS' },
      { day: 15, template: 'Second Reminder - Urgent', channel: 'Email' },
      { day: 30, template: 'Final Notice - Legal', channel: 'Email' },
    ],
    applicableCustomers: 85,
    status: 'Active',
  },
];

export default function RemindersPage() {
  const [activeTab, setActiveTab] = useState('templates');

  return (
    <div className="space-y-6 p-6 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reminders & Automation</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage collection reminder templates and workflows
          </p>
        </div>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2">
          <Plus size={18} />
          {activeTab === 'templates' ? 'New Template' : 'New Schedule'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'templates'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Email Templates
        </button>
        <button
          onClick={() => setActiveTab('schedules')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'schedules'
              ? 'border-accent text-accent'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          Automation Schedules
        </button>
      </div>

      {activeTab === 'templates' && (
        <div className="space-y-4">
          {mockTemplates.map((template) => (
            <Card key={template.id} className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {template.channel === 'Email' ? (
                        <Mail size={18} className="text-accent" />
                      ) : (
                        <MessageSquare size={18} className="text-accent" />
                      )}
                      <h3 className="font-semibold text-foreground text-lg">
                        {template.name}
                      </h3>
                      <span className="ml-auto text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">
                        {template.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Channel: {template.channel}
                    </p>
                    <p className="font-medium text-foreground mb-1">
                      {template.subject}
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">
                      {template.preview}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        Trigger after {template.triggerDays} days
                      </div>
                      <span>Used {template.used} times</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0"
                      >
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit size={16} className="mr-2" />
                        Edit Template
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">
                        <Trash2 size={16} className="mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'schedules' && (
        <div className="space-y-4">
          {mockSchedules.map((schedule) => (
            <Card key={schedule.id} className="border-border">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">
                      {schedule.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Applied to {schedule.applicableCustomers} customers
                    </p>
                  </div>
                  <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded">
                    {schedule.status}
                  </span>
                </div>

                {/* Timeline */}
                <div className="space-y-3 mb-4">
                  {schedule.steps.map((step, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="text-center">
                        <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-semibold text-sm">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-sm font-medium text-foreground">
                          Day {step.day}: {step.template}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Via {step.channel}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border flex-1"
                  >
                    <Edit size={14} className="mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 flex-1"
                  >
                    <Trash2 size={14} className="mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
