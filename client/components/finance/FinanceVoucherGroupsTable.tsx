import { Fragment, useState } from 'react';
import { ChevronDown, ChevronRight, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';

export type VoucherGroupLine = {
  id: number;
  documentNumber: string | null;
  date: string;
  categoryName: string | null;
  accountName: string | null;
  amount: number;
  extraLabel?: string | null;
};

export type VoucherGroupRow = {
  voucherNumber: string;
  voucherIssuedDate: string | null;
  lineCount: number;
  totalAmount: number;
  lines: VoucherGroupLine[];
};

interface FinanceVoucherGroupsTableProps {
  groups: VoucherGroupRow[];
  loading?: boolean;
  emptyMessage?: string;
  documentHeader?: string;
  onPrint: (voucherNumber: string) => void;
}

export function FinanceVoucherGroupsTable({
  groups,
  loading = false,
  emptyMessage = 'No issued vouchers yet.',
  documentHeader = 'Document',
  onPrint,
}: FinanceVoucherGroupsTableProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (loading) {
    return <div className="py-12 text-center text-muted-foreground">Loading…</div>;
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed py-12 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <Card className="overflow-hidden border shadow-sm">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="w-8" />
            <TableHead className="text-xs font-bold uppercase">Voucher</TableHead>
            <TableHead className="text-xs font-bold uppercase">Issued</TableHead>
            <TableHead className="text-xs font-bold uppercase text-center">Lines</TableHead>
            <TableHead className="text-xs font-bold uppercase text-right">Total (PKR)</TableHead>
            <TableHead className="w-[100px] text-right text-xs font-bold uppercase">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => {
            const isOpen = expanded[group.voucherNumber];
            return (
              <Fragment key={group.voucherNumber}>
                <TableRow className="hover:bg-muted/20">
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        setExpanded((prev) => ({
                          ...prev,
                          [group.voucherNumber]: !prev[group.voucherNumber],
                        }))
                      }
                    >
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-mono text-xs font-semibold text-primary">
                    {group.voucherNumber}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {group.voucherIssuedDate
                      ? new Date(group.voucherIssuedDate).toLocaleDateString()
                      : '—'}
                  </TableCell>
                  <TableCell className="text-center tabular-nums">{group.lineCount}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {formatCurrency(group.totalAmount)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-xs"
                      onClick={() => onPrint(group.voucherNumber)}
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Print
                    </Button>
                  </TableCell>
                </TableRow>
                {isOpen && (
                  <TableRow className="bg-muted/10">
                    <TableCell colSpan={6} className="p-0">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-[10px] font-bold uppercase">{documentHeader}</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase">Date</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase">Category</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase">Account</TableHead>
                            <TableHead className="text-[10px] font-bold uppercase text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.lines.map((line) => (
                            <TableRow key={line.id}>
                              <TableCell className="font-mono text-xs">{line.documentNumber ?? '—'}</TableCell>
                              <TableCell className="text-xs whitespace-nowrap">
                                {new Date(line.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell className="text-xs">{line.categoryName ?? '—'}</TableCell>
                              <TableCell className="text-xs">
                                {line.accountName ?? '—'}
                                {line.extraLabel ? (
                                  <span className="block text-[10px] text-muted-foreground">{line.extraLabel}</span>
                                ) : null}
                              </TableCell>
                              <TableCell className="text-right text-xs tabular-nums font-medium">
                                {formatCurrency(line.amount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
