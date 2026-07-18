import { cn } from '@/lib/utils';

interface PrintSignatureBlockProps {
  className?: string;
}

export function PrintSignatureBlock({ className }: PrintSignatureBlockProps) {
  const labels = ['Prepared by', 'Authorized by', 'Received by'];

  return (
    <div className={cn('mt-10 grid grid-cols-3 gap-8 border-t border-slate-300 pt-8', className)}>
      {labels.map((label) => (
        <div key={label} className="text-center">
          <div className="mb-2 h-12 border-b border-slate-400" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-1 text-[9px] text-slate-400">Name &amp; signature</p>
        </div>
      ))}
    </div>
  );
}
