'use client';

import { motion, type Variants } from 'framer-motion';
import { Compass, MapPinned, MessagesSquare } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const features = [
  {
    icon: Compass,
    title: 'Lifestyle Matching',
    description: 'Match by vibe, budget, schedule, and preferred roommate habits in minutes.',
    accent: 'from-blue-500 to-indigo-500',
  },
  {
    icon: MapPinned,
    title: 'Real-time Availability',
    description: 'Live inventory from verified PG managers with near-instant booking confirmations.',
    accent: 'from-fuchsia-500 to-rose-500',
  },
  {
    icon: MessagesSquare,
    title: 'In-app Community Chats',
    description: 'Connect with flatmates and neighborhood groups before finalizing your move.',
    accent: 'from-emerald-500 to-teal-500',
  },
];

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

export function FeatureGrid() {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={containerVariants}
      className="grid gap-4 md:grid-cols-3"
    >
      {features.map((feature) => (
        <motion.div
          key={feature.title}
          variants={itemVariants}
          whileHover={{ y: -4 }}
          transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        >
          <Card className="group relative h-full overflow-hidden rounded-2xl border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div
              className={`absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br ${feature.accent} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-25`}
              aria-hidden
            />
            <CardHeader className="space-y-3">
              <span
                className={`inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${feature.accent} text-white shadow-sm transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110`}
                aria-hidden
              >
                <feature.icon className="h-5 w-5" />
              </span>
              <CardTitle className="text-zinc-900 dark:text-zinc-100">{feature.title}</CardTitle>
              <CardDescription className="text-zinc-600 dark:text-zinc-300">{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
