'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/AppLogo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { useI18n } from '@/lib/i18n-context';
import {
  LayoutDashboard,
  Wallet,
  FileText,
  CreditCard,
  BarChart3,
  ArrowRight,
  Calendar,
  AlertCircle,
  Bell,
  Shield,
  Zap,
  Building2,
  GraduationCap,
  Truck,
  Leaf,
  Store,
  HardHat,
  Briefcase,
  MessageCircle,
  Smartphone,
  Link2,
  Quote,
  Github,
  Twitter,
  Linkedin,
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const { t } = useI18n();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  if (loading || isAuthenticated) {
    return (
      <div className="auth-screen min-h-screen min-h-dvh flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="auth-screen h-dvh h-screen flex flex-col overflow-hidden">
      {/* Top Navigation Bar - fixed, only main scrolls */}
      <header className="w-full border-b border-border/60 bg-background/95 backdrop-blur-sm flex-shrink-0 z-50 sticky top-0 min-w-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4 min-w-0">
          <Link href="/" className="flex items-center shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md">
            <span className="sm:hidden"><AppLogo size={28} /></span>
            <span className="hidden sm:flex"><AppLogo size={32} showText /></span>
          </Link>
          <nav className="hidden md:flex items-center gap-1 text-sm shrink-0">
            <a href="#solution" className="px-3 py-2 text-muted-foreground hover:text-foreground rounded-md">{t('landing', 'product')}</a>
            <a href="#solutions" className="px-3 py-2 text-muted-foreground hover:text-foreground rounded-md">{t('landing', 'solutions')}</a>
            <a href="#pricing" className="px-3 py-2 text-muted-foreground hover:text-foreground rounded-md">{t('landing', 'pricing')}</a>
            <a href="#architecture" className="px-3 py-2 text-muted-foreground hover:text-foreground rounded-md">{t('landing', 'developers')}</a>
            <a href="#modules" className="px-3 py-2 text-muted-foreground hover:text-foreground rounded-md">{t('landing', 'resources')}</a>
          </nav>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" className="px-2 sm:px-3 min-h-[36px] sm:min-h-9" asChild>
              <Link href="/login">{t('landing', 'signIn')}</Link>
            </Button>
            <Button size="sm" className="px-2 sm:px-4 min-h-[36px] sm:min-h-9 text-xs sm:text-sm whitespace-nowrap" asChild>
              <Link href="/signup">{t('landing', 'startFreeTrial')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 pb-[env(safe-area-inset-bottom)]">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-12">
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 items-center">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl lg:text-4xl font-bold text-foreground tracking-tight">
                {t('landing', 'heroTitle')}
              </h1>
              <p className="mt-2 sm:mt-3 text-sm sm:text-lg text-muted-foreground max-w-xl">
                {t('landing', 'heroSubtitle')}
              </p>
              <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
                <Button size="lg" className="text-sm sm:text-base w-full sm:w-auto min-h-[44px]" asChild>
                  <Link href="/signup">
                    {t('landing', 'startFreeTrial')}
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-sm sm:text-base w-full sm:w-auto min-h-[44px]" asChild>
                  <a href="#contact">{t('landing', 'bookDemo')}</a>
                </Button>
              </div>
              {/* Trusted by - commented out for now
              <p className="mt-10 text-sm font-medium text-muted-foreground">
                {t('landing', 'trustedBy')}
              </p>
              <div className="mt-3 flex flex-wrap gap-6 items-center text-muted-foreground/80">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-8 w-24 rounded bg-muted/60 flex items-center justify-center text-xs font-medium">
                    Logo {i}
                  </div>
                ))}
              </div>
              */}
            </div>
            <div className="relative">
              <div className="rounded-xl border border-border bg-card shadow-lg p-4 space-y-3 min-h-[220px]">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground text-sm">Dashboard</h3>
                  <span className="text-xs text-muted-foreground">Preview</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['Outstanding', 'Overdue', 'Collected'].map((label) => (
                    <div key={label} className="rounded-lg bg-muted/50 p-2">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-base font-semibold text-foreground mt-0.5">—</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-lg bg-muted/30 h-16 flex items-center justify-center text-muted-foreground text-xs">
                  Credit balances · Payments · Reminders
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem Section */}
        <section id="problem" className="border-t border-border/60 bg-muted/20 py-6 sm:py-10">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center">
              {t('landing', 'problemHeadline')}
            </h2>
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ProblemCard titleKey="problemManual" descKey="problemManualDesc" icon={FileText} t={t} />
              <ProblemCard titleKey="problemLate" descKey="problemLateDesc" icon={Calendar} t={t} />
              <ProblemCard titleKey="problemCollections" descKey="problemCollectionsDesc" icon={Bell} t={t} />
              <ProblemCard titleKey="problemVisibility" descKey="problemVisibilityDesc" icon={AlertCircle} t={t} />
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section id="solution" className="py-6 sm:py-10">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center">
              {t('landing', 'solutionHeadline')}
            </h2>
            <div className="mt-6 grid sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
              <SolutionCard titleKey="solutionIssuance" descKey="solutionIssuanceDesc" icon={Wallet} t={t} />
              <SolutionCard titleKey="solutionMonitoring" descKey="solutionMonitoringDesc" icon={BarChart3} t={t} />
              <SolutionCard titleKey="solutionAutomated" descKey="solutionAutomatedDesc" icon={Bell} t={t} />
              <SolutionCard titleKey="solutionPayments" descKey="solutionPaymentsDesc" icon={CreditCard} t={t} />
            </div>
          </div>
        </section>

        {/* Product Modules Section */}
        <section id="modules" className="border-t border-border/60 bg-muted/20 py-6 sm:py-10">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center">
              {t('landing', 'modulesHeadline')}
            </h2>
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ModuleCard titleKey="modulesIssuance" bulletsKey="modulesIssuanceBullets" icon={Wallet} t={t} />
              <ModuleCard titleKey="modulesCollections" bulletsKey="modulesCollectionsBullets" icon={Bell} t={t} />
              <ModuleCard titleKey="modulesPayments" bulletsKey="modulesPaymentsBullets" icon={CreditCard} t={t} />
              <ModuleCard titleKey="modulesAI" bulletsKey="modulesAIBullets" icon={Zap} t={t} />
            </div>
          </div>
        </section>

        {/* Customer Payment Experience */}
        <section id="payment-experience" className="py-6 sm:py-10">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center">
              {t('landing', 'paymentExpHeadline')}
            </h2>
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <PaymentOption titleKey="paymentWeb" descKey="paymentWebDesc" icon={LayoutDashboard} t={t} />
              <PaymentOption titleKey="paymentMobile" descKey="paymentMobileDesc" icon={Smartphone} t={t} />
              <PaymentOption titleKey="paymentLinks" descKey="paymentLinksDesc" icon={Link2} t={t} />
              <PaymentOption titleKey="paymentWhatsApp" descKey="paymentWhatsAppDesc" icon={MessageCircle} t={t} />
            </div>
          </div>
        </section>

        {/* Industry Solutions */}
        <section id="solutions" className="border-t border-border/60 bg-muted/20 py-6 sm:py-10">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center">
              {t('landing', 'industryHeadline')}
            </h2>
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <IndustryCard titleKey="industryHealthcare" descKey="industryHealthcareDesc" icon={Building2} t={t} />
              <IndustryCard titleKey="industryEducation" descKey="industryEducationDesc" icon={GraduationCap} t={t} />
              <IndustryCard titleKey="industryWholesale" descKey="industryWholesaleDesc" icon={Store} t={t} />
              <IndustryCard titleKey="industryLending" descKey="industryLendingDesc" icon={Wallet} t={t} />
              <IndustryCard titleKey="industryAgriculture" descKey="industryAgricultureDesc" icon={Leaf} t={t} />
              <IndustryCard titleKey="industryRetail" descKey="industryRetailDesc" icon={Store} t={t} />
              <IndustryCard titleKey="industryLogistics" descKey="industryLogisticsDesc" icon={Truck} t={t} />
              <IndustryCard titleKey="industryConstruction" descKey="industryConstructionDesc" icon={HardHat} t={t} />
              <IndustryCard titleKey="industryProfessional" descKey="industryProfessionalDesc" icon={Briefcase} t={t} />
            </div>
          </div>
        </section>

        {/* Platform Architecture */}
        <section id="architecture" className="py-6 sm:py-10">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center">
              {t('landing', 'architectureHeadline')}
            </h2>
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <ArchitectureCard titleKey="architectureAPI" descKey="architectureAPIDesc" icon={Zap} t={t} />
              <ArchitectureCard titleKey="architectureMultiTenant" descKey="architectureMultiTenantDesc" icon={Building2} t={t} />
              <ArchitectureCard titleKey="architectureScalable" descKey="architectureScalableDesc" icon={BarChart3} t={t} />
              <ArchitectureCard titleKey="architectureSecurity" descKey="architectureSecurityDesc" icon={Shield} t={t} />
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="border-t border-border/60 bg-muted/20 py-6 sm:py-10">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center">
              {t('landing', 'pricingHeadline')}
            </h2>
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <PricingCard nameKey="pricingStarter" descKey="pricingStarterDesc" priceKey="pricingStarterPrice" t={t} />
              <PricingCard nameKey="pricingGrowth" descKey="pricingGrowthDesc" priceKey="pricingGrowthPrice" t={t} />
              <PricingCard nameKey="pricingBusiness" descKey="pricingBusinessDesc" priceKey="pricingBusinessPrice" t={t} />
              <PricingCard nameKey="pricingEnterprise" descKey="pricingEnterpriseDesc" priceKey="pricingEnterprisePrice" t={t} featured />
            </div>
            <div className="mt-6 text-center">
              <Button size="lg" asChild>
                <Link href="/signup">{t('landing', 'startFreeTrial')}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-6 sm:py-10">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground text-center">
              {t('landing', 'testimonialsHeadline')}
            </h2>
            <div className="mt-6 grid sm:grid-cols-3 gap-4">
              <TestimonialCard quoteKey="testimonial1" t={t} />
              <TestimonialCard quoteKey="testimonial2" t={t} />
              <TestimonialCard quoteKey="testimonial3" t={t} />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section id="contact" className="border-t border-border/60 bg-muted/20 py-6 sm:py-10">
          <div className="max-w-3xl mx-auto px-3 sm:px-6 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {t('landing', 'finalCtaHeadline')}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t('landing', 'finalCtaSubtext')}
            </p>
            <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 justify-center">
              <Button size="lg" className="w-full sm:w-auto min-h-[44px]" asChild>
                <Link href="/signup">
                  {t('landing', 'startFreeTrial')}
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto min-h-[44px]" asChild>
                <a href="#contact">{t('landing', 'bookDemo')}</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer links - part of scrollable content, not fixed */}
        <section className="border-t border-border/60 bg-muted/20 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
              <FooterColumn
                title={t('landing', 'footerProduct')}
                links={[
                  { label: t('landing', 'footerFeatures'), href: '#solution' },
                  { label: t('landing', 'footerModules'), href: '#modules' },
                  { label: t('landing', 'footerPricing'), href: '#pricing' },
                  { label: t('landing', 'footerAPI'), href: '#architecture' },
                ]}
              />
              <FooterColumn
                title={t('landing', 'footerSolutions')}
                links={[
                  { label: t('landing', 'footerLending'), href: '#' },
                  { label: t('landing', 'footerHealthcare'), href: '#' },
                  { label: t('landing', 'footerEducation'), href: '#' },
                  { label: t('landing', 'footerWholesale'), href: '#' },
                  { label: t('landing', 'footerLogistics'), href: '#' },
                  { label: t('landing', 'footerAgriculture'), href: '#' },
                ]}
              />
              <FooterColumn
                title={t('landing', 'footerDevelopers')}
                links={[
                  { label: t('landing', 'footerAPIDocs'), href: '#' },
                  { label: t('landing', 'footerSDKs'), href: '#' },
                  { label: t('landing', 'footerIntegrations'), href: '#' },
                ]}
              />
              <FooterColumn
                title={t('landing', 'footerResources')}
                links={[
                  { label: t('landing', 'footerDocs'), href: '#' },
                  { label: t('landing', 'footerHelp'), href: '#' },
                  { label: t('landing', 'footerBlog'), href: '#' },
                ]}
              />
              <FooterColumn
                title={t('landing', 'footerCompany')}
                links={[
                  { label: t('landing', 'footerAbout'), href: '#' },
                  { label: t('landing', 'footerCareers'), href: '#' },
                  { label: t('landing', 'footerContact'), href: '#contact' },
                ]}
              />
              <FooterColumn
                title={t('landing', 'footerLegal')}
                links={[
                  { label: t('landing', 'footerPrivacy'), href: '#' },
                  { label: t('landing', 'footerTerms'), href: '#' },
                ]}
              />
            </div>
          </div>
        </section>
      </main>

      {/* Fixed footer - logo and social only */}
      <footer className="border-t border-border bg-muted/30 flex-shrink-0 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-2">
          <Link href="/" className="flex items-center gap-2">
            <AppLogo size={24} showText />
          </Link>
          <div className="flex items-center gap-3 text-muted-foreground">
            <a href="#" className="hover:text-foreground" aria-label="Twitter"><Twitter className="size-4" /></a>
            <a href="#" className="hover:text-foreground" aria-label="LinkedIn"><Linkedin className="size-4" /></a>
            <a href="#" className="hover:text-foreground" aria-label="GitHub"><Github className="size-4" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProblemCard({
  titleKey,
  descKey,
  icon: Icon,
  t,
}: {
  titleKey: string;
  descKey: string;
  icon: React.ComponentType<{ className?: string }>;
  t: (ns: string, key: string) => string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <h3 className="mt-3 font-semibold text-foreground text-sm">{t('landing', titleKey)}</h3>
      <p className="mt-1.5 text-xs text-muted-foreground">{t('landing', descKey)}</p>
    </div>
  );
}

function SolutionCard({
  titleKey,
  descKey,
  icon: Icon,
  t,
}: {
  titleKey: string;
  descKey: string;
  icon: React.ComponentType<{ className?: string }>;
  t: (ns: string, key: string) => string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <h3 className="mt-3 font-semibold text-foreground text-sm">{t('landing', titleKey)}</h3>
      <p className="mt-1.5 text-xs text-muted-foreground">{t('landing', descKey)}</p>
    </div>
  );
}

function ModuleCard({
  titleKey,
  bulletsKey,
  icon: Icon,
  t,
}: {
  titleKey: string;
  bulletsKey: string;
  icon: React.ComponentType<{ className?: string }>;
  t: (ns: string, key: string) => string;
}) {
  const bullets = t('landing', bulletsKey).split(',').map((s) => s.trim());
  return (
    <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <h3 className="mt-3 font-semibold text-foreground text-sm">{t('landing', titleKey)}</h3>
      <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-primary mt-0.5">•</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PaymentOption({
  titleKey,
  descKey,
  icon: Icon,
  t,
}: {
  titleKey: string;
  descKey: string;
  icon: React.ComponentType<{ className?: string }>;
  t: (ns: string, key: string) => string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <h3 className="mt-3 font-semibold text-foreground text-sm">{t('landing', titleKey)}</h3>
      <p className="mt-1.5 text-xs text-muted-foreground">{t('landing', descKey)}</p>
    </div>
  );
}

function IndustryCard({
  titleKey,
  descKey,
  icon: Icon,
  t,
}: {
  titleKey: string;
  descKey: string;
  icon: React.ComponentType<{ className?: string }>;
  t: (ns: string, key: string) => string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <h3 className="mt-3 font-semibold text-foreground text-sm">{t('landing', titleKey)}</h3>
      <p className="mt-1.5 text-xs text-muted-foreground">{t('landing', descKey)}</p>
    </div>
  );
}

function ArchitectureCard({
  titleKey,
  descKey,
  icon: Icon,
  t,
}: {
  titleKey: string;
  descKey: string;
  icon: React.ComponentType<{ className?: string }>;
  t: (ns: string, key: string) => string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </div>
      <h3 className="mt-3 font-semibold text-foreground text-sm">{t('landing', titleKey)}</h3>
      <p className="mt-1.5 text-xs text-muted-foreground">{t('landing', descKey)}</p>
    </div>
  );
}

function PricingCard({
  nameKey,
  descKey,
  priceKey,
  t,
  featured,
}: {
  nameKey: string;
  descKey: string;
  priceKey: string;
  t: (ns: string, key: string) => string;
  featured?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-sm ${
        featured ? 'border-primary bg-primary/5' : 'border-border bg-background'
      }`}
    >
      <h3 className="font-semibold text-foreground text-sm">{t('landing', nameKey)}</h3>
      <p className="mt-0.5 text-xs text-muted-foreground">{t('landing', descKey)}</p>
      <p className="mt-3 text-xl font-bold text-foreground">{t('landing', priceKey)}</p>
      {featured ? (
        <Button className="mt-3 w-full" size="sm" asChild>
          <a href="#contact">{t('landing', 'bookDemo')}</a>
        </Button>
      ) : (
        <Button className="mt-3 w-full" variant="outline" size="sm" asChild>
          <Link href="/signup">{t('landing', 'startFreeTrial')}</Link>
        </Button>
      )}
    </div>
  );
}

function TestimonialCard({ quoteKey, t }: { quoteKey: string; t: (ns: string, key: string) => string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
      <Quote className="size-6 text-muted-foreground/50" />
      <p className="mt-2 text-sm text-foreground">&ldquo;{t('landing', quoteKey)}&rdquo;</p>
    </div>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h4 className="font-semibold text-foreground text-xs">{title}</h4>
      <ul className="mt-1.5 space-y-0.5">
        {links.map(({ label, href }) => (
          <li key={label}>
            <a href={href} className="text-xs text-muted-foreground hover:text-foreground">
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

