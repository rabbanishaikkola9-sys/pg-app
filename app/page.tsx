import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight, Compass, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MobileBottomNav } from '@/components/landing/mobile-bottom-nav';
import { PgGallery } from '@/components/landing/pg-gallery';
import { FeatureGrid } from '@/components/landing/feature-grid';
import { AudienceSection } from '@/components/landing/audience-section';
import { AnimatedSection } from '@/components/ui/animated-section';
import { getCurrentUser } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/roles';

export default async function Home() {
  const user = await getCurrentUser();
  const dashHref = user ? ROLE_HOME[user.role] : null;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 pt-8 pb-28 md:px-8 md:pt-12">
        <AnimatedSection className="space-y-6" delay={0}>
          <div className="flex items-center justify-between gap-3">
            <Badge className="group gap-1 bg-blue-100 text-blue-700 transition-transform duration-300 hover:scale-105 hover:bg-blue-100 dark:bg-blue-500/20 dark:text-blue-200 dark:hover:bg-blue-500/20">
              <Sparkles className="h-3 w-3 transition-transform duration-300 group-hover:rotate-12" />
              PG Finder for India
            </Badge>
            {dashHref ? (
              <Link href={dashHref}>
                <Button
                  variant="outline"
                  className="group rounded-xl transition-all duration-200 hover:border-blue-300 hover:text-blue-700 dark:hover:border-blue-400/40 dark:hover:text-blue-200"
                >
                  Hi {user?.fullName.split(' ')[0]} → Go to Dashboard
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </Link>
            ) : (
              <div className="flex gap-2">
                <Link href="/login">
                  <Button
                    variant="ghost"
                    className="rounded-xl transition-colors duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  >
                    Login
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button className="group rounded-xl bg-blue-600 transition-all duration-200 hover:bg-blue-700 hover:shadow-blue-500/30 hover:shadow-lg">
                    Sign Up
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <h1 className="max-w-3xl bg-gradient-to-br from-zinc-900 via-zinc-700 to-zinc-900 bg-clip-text font-semibold text-4xl text-transparent tracking-tight md:text-6xl dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-100">
              Find Your Perfect Vibe, Not Just a Room
            </h1>
            <p className="max-w-2xl text-base text-zinc-600 leading-relaxed md:text-lg dark:text-zinc-300">
              PG matching that understands commute, lifestyle, and social fit for students and professionals.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="group/btn h-11 rounded-xl bg-blue-600 px-6 transition-all duration-200 hover:bg-blue-700 hover:shadow-blue-500/30 hover:shadow-lg"
            >
              <Link href="#explore">
                <Compass className="mr-1 h-4 w-4 transition-transform duration-300 group-hover/btn:rotate-12" />
                Browse all PGs
              </Link>
            </Button>
            {!user ? (
              <Button
                asChild
                size="lg"
                variant="outline"
                className="group/btn h-11 rounded-xl border-zinc-300 px-6 transition-all duration-200 hover:border-blue-300 hover:text-blue-700 dark:border-zinc-700 dark:hover:border-blue-400/40 dark:hover:text-blue-200"
              >
                <Link href="/signup">
                  Sign up free
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                </Link>
              </Button>
            ) : null}
          </div>
        </AnimatedSection>

        <AnimatedSection className="space-y-4" delay={0.08}>
          <div className="rounded-3xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-6 transition-all duration-300 hover:border-blue-200 hover:shadow-blue-500/5 hover:shadow-lg md:p-8 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-950 dark:hover:border-blue-400/30">
            <div className="grid gap-6 md:grid-cols-[1.4fr_1fr] md:items-center">
              <div className="space-y-3">
                <Badge
                  variant="outline"
                  className="border-zinc-200 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                >
                  What we&apos;re building
                </Badge>
                <h2 className="font-semibold text-2xl tracking-tight md:text-3xl">
                  India&apos;s first vibe-first PG marketplace
                </h2>
                <p className="text-zinc-600 leading-relaxed dark:text-zinc-300">
                  We&apos;re replacing endless WhatsApp groups, fake listings, and broker calls with a single
                  app. Renters discover verified PGs that match their lifestyle, budget, and commute — and owners list,
                  fill, and run their properties from one zero-brokerage dashboard.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: '0%', label: 'Brokerage for owners' },
                  { value: '100%', label: 'Verified listings' },
                  { value: '< 5m', label: 'To get matched' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl border border-zinc-200 bg-white p-3 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-blue-500/10 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-400/30"
                  >
                    <div className="font-semibold text-2xl text-blue-600 dark:text-blue-400">{stat.value}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection className="space-y-4" delay={0.12}>
          <h2 className="font-semibold text-2xl">Why users convert fast</h2>
          <FeatureGrid />
        </AnimatedSection>

        <AnimatedSection className="space-y-4" delay={0.18}>
          <div className="space-y-1">
            <h2 className="font-semibold text-2xl">Built for both sides of the move</h2>
            <p className="text-zinc-600 dark:text-zinc-400">
              Whether you&apos;re hunting for a PG or running one — we make it effortless.
            </p>
          </div>
          <AudienceSection />
        </AnimatedSection>

        <AnimatedSection id="explore" className="scroll-mt-8 space-y-4" delay={0.22}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <h2 className="font-semibold text-2xl">Explore verified PGs</h2>
              <p className="text-zinc-600 dark:text-zinc-400">
                Browse the full list — tap any card to see rooms, vacancies, amenities, and pricing.
              </p>
            </div>
            <Badge
              variant="outline"
              className="border-blue-200 text-blue-700 dark:border-blue-400/40 dark:text-blue-200"
            >
              Live inventory
            </Badge>
          </div>
          <Suspense fallback={<p className="text-sm text-zinc-500">Loading PGs...</p>}>
            <PgGallery />
          </Suspense>
        </AnimatedSection>

        <AnimatedSection
          id="owners"
          delay={0.26}
          className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-br from-zinc-950 to-zinc-800 p-6 text-white transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 md:p-10 dark:border-zinc-700"
        >
          <div
            className="pointer-events-none absolute -top-32 -right-20 h-72 w-72 rounded-full bg-blue-500 opacity-20 blur-3xl transition-all duration-700 group-hover:scale-125 group-hover:opacity-30"
            aria-hidden
          />
          <div className="relative max-w-2xl space-y-4">
            <Badge className="bg-blue-500 text-white hover:bg-blue-500">For PG Owners & Managers</Badge>
            <h3 className="font-semibold text-3xl tracking-tight md:text-4xl">List and Manage with 0% Brokerage</h3>
            <p className="text-zinc-300">
              Publish properties, update live inventory, and manage tenant operations from one dashboard built for
              scale.
            </p>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="group/cta rounded-xl bg-white text-zinc-950 transition-all duration-200 hover:scale-[1.02] hover:bg-zinc-100 hover:shadow-lg"
              >
                <Link href="/signup">
                  Get Started as Owner
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-1" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-xl border-zinc-500 bg-transparent text-white transition-all duration-200 hover:scale-[1.02] hover:bg-zinc-900"
              >
                <Link href="/login">Login to Dashboard</Link>
              </Button>
            </div>
          </div>
        </AnimatedSection>
      </main>
      <MobileBottomNav />
    </div>
  );
}
