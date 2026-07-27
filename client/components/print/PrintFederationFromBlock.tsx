import { useFederationBranding } from '@/hooks/useFederationBranding';
import { cn } from '@/lib/utils';

interface PrintFederationFromBlockProps {
  className?: string;
  labelClassName?: string;
  /** Fetch full federation profile (address, email, phone) when true. */
  fetchProfile?: boolean;
  /** When true, renders the bank account number block below the address. */
  showAccountNumber?: boolean;
}

export function PrintFederationFromBlock({
  className,
  labelClassName,
  fetchProfile = true,
  showAccountNumber = true,
}: PrintFederationFromBlockProps) {
  const { federationName, contactPerson, email, phoneNumber, addressLine, salesTaxNumber, ntn } =
    useFederationBranding({
    enabled: fetchProfile,
  });

  return (
    <div className={className}>
      <p
        className={cn(
          'text-xs font-black uppercase tracking-wider text-slate-400 mb-2',
          labelClassName,
        )}
      >
        From
      </p>
      <div className="space-y-1">
        <p className="font-bold text-slate-900 text-sm">{federationName}</p>
        {contactPerson ? <p className="text-xs text-slate-600">{contactPerson}</p> : null}
        {addressLine ? <p className="text-xs text-slate-600">{addressLine}</p> : null}
        {salesTaxNumber ? (
          <p className="text-xs text-slate-600">Sales Tax No.: {salesTaxNumber}</p>
        ) : null}
        {ntn ? <p className="text-xs text-slate-600">NTN: {ntn}</p> : null}
        {email ? <p className="text-xs text-slate-600">Email: {email}</p> : null}
        {phoneNumber ? <p className="text-xs text-slate-600">Phone: {phoneNumber}</p> : null}
        {showAccountNumber ? (
          <div className="pt-1">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Bank Account
            </p>
            <p className="text-xs text-slate-600">A/c No.&nbsp;0010114825440010</p>
            <p className="text-xs text-slate-600">Branch Code:&nbsp;0649</p>
            <p className="text-xs text-slate-600">ALLIED BANK LTD.</p>
            <p className="text-xs text-slate-600">Satellite Town, Rawalpindi</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
