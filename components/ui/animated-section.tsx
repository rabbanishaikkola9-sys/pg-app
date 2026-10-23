'use client';

import { motion } from 'framer-motion';

type Props = {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  id?: string;
  as?: 'section' | 'div';
};

export function AnimatedSection({ children, delay = 0, className, id, as = 'section' }: Props) {
  const Motion = as === 'div' ? motion.div : motion.section;
  return (
    <Motion
      id={id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </Motion>
  );
}
