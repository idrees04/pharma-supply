import type { ReactNode } from 'react';
import { useFederationBranding } from '@/hooks/useFederationBranding';
import { cn } from '@/lib/utils';

interface PrintDocumentHeaderProps {
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
  className?: string;
}

export function PrintDocumentHeader({
  title,
  subtitle,
  rightSlot,
  className,
}: PrintDocumentHeaderProps) {
  const { logoSrc, federationName } = useFederationBranding({ enabled: false });

  return (
    <div className={cn('mb-8 border-b-2 border-slate-200 pb-6', className)}>
      <div className="flex items-start justify-between gap-6">
        <div className="flex min-w-0 items-center gap-4">
          <img
            src={logoSrc}
            alt={federationName}
            crossOrigin="anonymous"
            className="h-14 w-auto max-w-[140px] shrink-0 object-contain"
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800">{federationName}</p>
            {subtitle ? (
              <p className="mt-0.5 text-xs font-medium text-slate-500">{subtitle}</p>
            ) : null}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h1>
          {rightSlot ? <div className="mt-2">{rightSlot}</div> : null}
        </div>
      </div>
    </div>
  );
}
