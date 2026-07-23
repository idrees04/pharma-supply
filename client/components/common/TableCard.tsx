import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TableCardProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  /** Right-aligned count badge, e.g. "12 movement(s)". */
  count?: number;
  countLabel?: (count: number) => string;
  /** Extra controls rendered next to the count badge (e.g. print actions). */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}

/**
 * Standardized "table card" shell used across ledgers, reports, and lists so
 * every table on the site shares the same header, spacing, and badge style.
 */
export function TableCard({
  icon,
  title,
  description,
  count,
  countLabel,
  actions,
  children,
  className,
  contentClassName,
}: TableCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b bg-muted/20 py-4">
        <div className="flex items-center gap-2">
          {icon ? <span className="text-primary [&>svg]:h-4 [&>svg]:w-4">{icon}</span> : null}
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            {description ? (
              <p className="mt-0.5 text-xs font-normal text-muted-foreground">{description}</p>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          {typeof count === 'number' ? (
            <Badge variant="secondary">
              {countLabel ? countLabel(count) : `${count} record(s)`}
            </Badge>
          ) : null}
          {actions}
        </div>
      </CardHeader>
      <CardContent className={cn('pt-4', contentClassName)}>{children}</CardContent>
    </Card>
  );
}
