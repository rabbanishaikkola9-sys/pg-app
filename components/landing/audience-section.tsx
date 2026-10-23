'use client';

import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { ArrowRight, Building2, Sparkles, ShieldCheck, MessageCircle, Wallet, LineChart, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Persona = {
  audience: 'renter' | 'owner';
  badge: string;
  title: string;
  description: string;
  cta: { label: string; href: string };
  bullets: { icon: React.ComponentType<{ className?: string }>; title: string; text: string }[];
  accent: string;
  glow: string;
};

const personas: Persona[] = [
  {
    audience: 'renter',
    badge: 'For Students & Professionals',
    title: 'Find a PG that fits your vibe — not just your budget',
    description:
      'Skip endless WhatsApp groups and broker calls. Get matched to verified PGs that fit your commute, lifestyle, and ideal flatmate profile in minutes.',
    cta: { label: 'Find your PG', href: '/signup' },
    accent: 'from-blue-500 to-indigo-500',
    glow: 'group-hover:shadow-blue-500/20',
    bullets: [
      {
        icon: Sparkles,
        title: 'Lifestyle Matching',
        text: 'Tell us your routine, food habits, and budget — we surface PGs that actually feel like home.',
      },
      {
        icon: ShieldCheck,
        title: 'Verified Listings, Zero Brokerage',
        text: 'Every PG is verified with real photos, live pricing, and no hidden broker fees.',
      },
      {
        icon: MessageCircle,
        title: 'Chat Before You Commit',
        text: 'Message owners and future flatmates inside the app before you sign anything.',
      },
    ],
  },
  {
    audience: 'owner',
    badge: 'For PG Owners & Managers',
    title: 'List, fill, and run your PG from one dashboard',
    description:
      'Stop juggling spreadsheets and broker fees. Publish rooms, manage live inventory, and grow occupancy with a tenant pipeline that comes pre-matched.',
    cta: { label: 'List your PG', href: '/signup' },
    accent: 'from-emerald-500 to-teal-500',
    glow: 'group-hover:shadow-emerald-500/20',
    bullets: [
      {
        icon: Wallet,
        title: '0% Brokerage Listings',
        text: 'Keep every rupee — list unlimited rooms and update pricing on the fly.',
      },
      {
        icon: Users,
        title: 'Pre-matched Tenants',
        text: 'Receive enquiries from renters whose lifestyle and budget already fit your property.',
      },
      {
        icon: LineChart,
        title: 'Operations on Autopilot',
        text: 'Track rent, payments, and maintenance tickets from one mobile-friendly dashboard.',
      },
    ],
  },
];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};

export function AudienceSection() {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={containerVariants}
      className="grid gap-5 md:grid-cols-2"
    >
      {personas.map((persona) => (
        <motion.div
          key={persona.audience}
          variants={cardVariants}
          whileHover={{ y: -6 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className={`group relative overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow duration-300 hover:shadow-2xl md:p-8 dark:border-zinc-800 dark:bg-zinc-900 ${persona.glow}`}
        >
          <div
            className={`absolute -top-24 -right-24 h-56 w-56 rounded-full bg-gradient-to-br ${persona.accent} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-30`}
            aria-hidden
          />
          <div className="relative space-y-5">
            <div className="flex items-center justify-between gap-3">
              <Badge
                variant="outline"
                className="border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-200"
              >
                {persona.badge}
              </Badge>
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${persona.accent} text-white shadow-md transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110`}
                aria-hidden
              >
                {persona.audience === 'renter' ? <Sparkles className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
              </span>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-2xl text-zinc-900 tracking-tight md:text-3xl dark:text-zinc-100">
                {persona.title}
              </h3>
              <p className="text-zinc-600 leading-relaxed dark:text-zinc-300">{persona.description}</p>
            </div>

            <ul className="space-y-3 pt-1">
              {persona.bullets.map((bullet) => (
                <li
                  key={bullet.title}
                  className="group/item flex items-start gap-3 rounded-xl p-2 transition-colors duration-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                >
                  <span
                    className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${persona.accent} text-white shadow-sm transition-transform duration-300 group-hover/item:scale-110`}
                    aria-hidden
                  >
                    <bullet.icon className="h-4 w-4" />
                  </span>
                  <div className="space-y-0.5">
                    <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{bullet.title}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{bullet.text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="pt-2">
              <Button
                asChild
                size="lg"
                className="group/cta rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                <Link href={persona.cta.href}>
                  {persona.cta.label}
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform duration-300 group-hover/cta:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
