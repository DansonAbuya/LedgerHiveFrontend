'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Save } from 'lucide-react';

export default function OrganizationSettingsPage() {
  const [formData, setFormData] = useState({
    companyName: 'Acme Corporation',
    email: 'billing@acme.com',
    phone: '(555) 123-4567',
    website: 'https://acme.com',
    address: '123 Business Street, Suite 100',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'United States',
    industry: 'Manufacturing',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
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

      <div>
        <h1 className="text-3xl font-bold text-foreground">Organization Settings</h1>
        <p className="text-muted-foreground mt-2">
          Update your company information and preferences
        </p>
      </div>

      {/* Basic Information */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Company name and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">
                Company Name
              </label>
              <Input
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="mt-2 bg-input border-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Email Address
              </label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-2 bg-input border-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Phone Number
              </label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-2 bg-input border-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                Website
              </label>
              <Input
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="mt-2 bg-input border-border"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Address</CardTitle>
          <CardDescription>
            Your company's registered address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">
              Street Address
            </label>
            <Input
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="mt-2 bg-input border-border"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-foreground">
                City
              </label>
              <Input
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="mt-2 bg-input border-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                State/Province
              </label>
              <Input
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="mt-2 bg-input border-border"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">
                ZIP/Postal Code
              </label>
              <Input
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                className="mt-2 bg-input border-border"
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground">
              Country
            </label>
            <Input
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="mt-2 bg-input border-border"
            />
          </div>
        </CardContent>
      </Card>

      {/* Business Information */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label className="text-sm font-medium text-foreground">
              Industry
            </label>
            <select
              name="industry"
              value={formData.industry}
              onChange={handleChange}
              className="mt-2 w-full px-3 py-2 rounded-lg border border-border bg-card text-foreground"
            >
              <option>Manufacturing</option>
              <option>Retail</option>
              <option>Services</option>
              <option>Technology</option>
              <option>Finance</option>
              <option>Healthcare</option>
              <option>Other</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
        >
          <Save size={16} />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
        <Link href="/settings">
          <Button variant="outline" className="border-border">
            Cancel
          </Button>
        </Link>
      </div>
    </div>
  );
}
