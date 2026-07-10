import React from 'react';
import { Loader2, FileText, PackageCheck, CreditCard, XCircle, History } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';
import type { PurchaseOrderTimelineEvent } from '@/types/api/purchaseOrders';

interface PurchaseOrderTimelineProps {
  events: PurchaseOrderTimelineEvent[];
  isLoading?: boolean;
}

function eventIcon(type: string) {
  switch (type) {
    case 'Created':
      return FileText;
    case 'GoodsReceived':
      return PackageCheck;
    case 'Payment':
      return CreditCard;
    case 'Cancelled':
      return XCircle;
    default:
      return History;
  }
}

function eventAccent(type: string) {
  switch (type) {
    case 'Created':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'GoodsReceived':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'Payment':
      return 'border-violet-200 bg-violet-50 text-violet-700';
    case 'Cancelled':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700';
  }
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function PurchaseOrderTimeline({ events, isLoading = false }: PurchaseOrderTimelineProps) {
  if (isLoading) {
    return (
      <Card className="border-slate-200 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
        <CardContent className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading activity timeline…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden">
      <CardHeader className="bg-slate-50/80 border-b py-4">
        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No activity recorded yet.</p>
        ) : (
          <ol className="relative space-y-0">
            {events.map((event, index) => {
              const Icon = eventIcon(event.eventType);
              const accent = eventAccent(event.eventType);
              const isLast = index === events.length - 1;

              return (
                <li key={`${event.eventType}-${event.occurredAt}-${index}`} className="relative flex gap-4 pb-8 last:pb-0">
                  {!isLast && (
                    <span className="absolute left-5 top-11 bottom-0 w-px bg-slate-200" aria-hidden />
                  )}
                  <div
                    className={cn(
                      'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border-2 shadow-sm',
                      accent
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-900">{event.title}</p>
                      <Badge variant="outline" className={cn('text-[10px] font-bold uppercase', accent)}>
                        {event.eventType === 'GoodsReceived'
                          ? 'Receipt'
                          : event.eventType === 'Payment'
                            ? 'Payment'
                            : event.eventType}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{formatWhen(event.occurredAt)}</p>
                    {event.description && (
                      <p className="text-sm text-slate-600 mt-2 leading-relaxed">{event.description}</p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2 text-sm">
                      {event.quantity != null && event.quantity > 0 && (
                        <span className="font-semibold text-emerald-700 tabular-nums">
                          +{event.quantity.toLocaleString()} units received
                        </span>
                      )}
                      {event.amount != null && event.amount > 0 && (
                        <span className="font-semibold text-violet-700 tabular-nums">
                          {formatCurrency(event.amount)} paid
                        </span>
                      )}
                      {event.referenceNumber && (
                        <span className="text-slate-500 font-mono text-xs">
                          Ref: {event.referenceNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
