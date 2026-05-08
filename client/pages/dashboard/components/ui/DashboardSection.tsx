import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface DashboardSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  title,
  description,
  children,
  className,
  delay = 0
}) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={cn("space-y-4", className)}
    >
      {(title || description) && (
        <div className="space-y-1">
          {title && <h2 className="text-xl font-semibold tracking-tight">{title}</h2>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      {children}
    </motion.section>
  );
};
