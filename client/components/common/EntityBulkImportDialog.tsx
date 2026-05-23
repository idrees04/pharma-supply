import { useCallback, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { FileSpreadsheet, Download, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { BulkImportResult } from '@/types/api/bulkImport';
import { downloadExcelBlob } from '@/lib/utils';

type Phase = 'idle' | 'uploading' | 'done';

function downloadBase64Excel(base64: string, filename: string): void {
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  downloadExcelBlob(
    new Blob([bytes], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    filename
  );
}

export interface EntityBulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  fieldLegend: string;
  onDownloadTemplate: () => Promise<void>;
  onImport: (
    file: File,
    options?: { onUploadProgress?: (percent: number) => void }
  ) => Promise<BulkImportResult>;
  onImported: () => void;
}

export function EntityBulkImportDialog({
  open,
  onOpenChange,
  title,
  description,
  fieldLegend,
  onDownloadTemplate,
  onImport,
  onImported,
}: EntityBulkImportDialogProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [file, setFile] = useState<File | null>(null);
  const [uploadPct, setUploadPct] = useState(0);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const clearFileInput = useCallback(() => {
    setFile(null);
    const el = fileInputRef.current;
    if (el) el.value = '';
  }, []);

  const reset = useCallback(() => {
    setPhase('idle');
    clearFileInput();
    setUploadPct(0);
    setResult(null);
  }, [clearFileInput]);

  const handleOpenChange = (next: boolean) => {
    if (!next && phase === 'uploading') return;
    if (!next) reset();
    onOpenChange(next);
  };

  const handleDownloadTemplate = async () => {
    try {
      await onDownloadTemplate();
      toast.success('Template downloaded');
    } catch (e: unknown) {
      toast.error((e as Error)?.message || 'Could not download template');
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Choose an .xlsx file first');
      return;
    }
    setPhase('uploading');
    setUploadPct(0);
    try {
      const data = await onImport(file, {
        onUploadProgress: (p) => setUploadPct(p),
      });
      setResult(data);
      setPhase('done');
      setUploadPct(100);
      // Avoid accidental re-import of the same file (would duplicate rows / re-hit API).
      clearFileInput();
      if (data.importedCount > 0) onImported();
      toast.success(
        `Import finished: ${data.importedCount} saved, ${data.skippedDuplicateCount} duplicates skipped, ${data.failedValidationCount} failed.`
      );
    } catch (e: unknown) {
      setPhase('idle');
      toast.error((e as { message?: string })?.message || 'Import failed');
    }
  };

  const problemRows =
    result?.rowResults?.filter((r) => r.status === 'Failed' || r.status === 'SkippedDuplicate') ?? [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 min-h-0 flex flex-col">
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={handleDownloadTemplate}>
              <Download className="h-4 w-4" />
              Sample template
            </Button>
          </div>

          <div className="rounded-lg border border-dashed p-4 space-y-2">
            <label className="text-sm font-medium cursor-pointer flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="sr-only"
                disabled={phase === 'uploading'}
                onChange={(ev) => {
                  const f = ev.target.files?.[0];
                  setFile(f ?? null);
                  setResult(null);
                  setPhase('idle');
                }}
              />
              <span className="inline-flex items-center gap-2 text-primary">
                <Upload className="h-4 w-4" />
                {file ? file.name : 'Choose .xlsx file'}
              </span>
            </label>
            <p className="text-xs text-muted-foreground">{fieldLegend}</p>
            {phase === 'done' && !file && (
              <p className="text-xs text-amber-800 dark:text-amber-200">
                Choose an .xlsx file again to run another import (the previous file was cleared so the same sheet is not uploaded twice by mistake).
              </p>
            )}
          </div>

          {phase === 'uploading' && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Uploading and processing…</p>
              <Progress value={uploadPct} className="h-2" />
            </div>
          )}

          {phase === 'done' && result && (
            <div className="space-y-3 flex-1 min-h-0 flex flex-col">
              <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                <div className="flex items-center gap-2 text-emerald-700 font-medium">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  Summary
                </div>
                <ul className="list-disc pl-5 text-muted-foreground">
                  <li>Imported: {result.importedCount}</li>
                  <li>Skipped (duplicates): {result.skippedDuplicateCount}</li>
                  <li>Failed validation: {result.failedValidationCount}</li>
                  <li>Empty rows skipped: {result.skippedEmptyCount}</li>
                  <li>Data rows read: {result.totalRowsRead}</li>
                </ul>
              </div>

              {problemRows.length > 0 && (
                <div className="space-y-2 flex-1 min-h-0 flex flex-col">
                  <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
                    <AlertCircle className="h-4 w-4" />
                    Row issues ({problemRows.length})
                  </div>
                  <ScrollArea className="h-40 rounded-md border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b bg-muted/40">
                          <th className="text-left p-2">Row</th>
                          <th className="text-left p-2">Record</th>
                          <th className="text-left p-2">Status</th>
                          <th className="text-left p-2">Messages</th>
                        </tr>
                      </thead>
                      <tbody>
                        {problemRows.map((r) => (
                          <tr key={`${r.rowNumber}-${r.status}`} className="border-b last:border-0">
                            <td className="p-2 align-top tabular-nums">{r.rowNumber}</td>
                            <td className="p-2 align-top max-w-[100px] truncate">{r.recordPreview}</td>
                            <td className="p-2 align-top whitespace-nowrap">{r.status}</td>
                            <td className="p-2 align-top text-muted-foreground">
                              {r.messages?.join('; ')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </ScrollArea>
                </div>
              )}

              {result.errorReportBase64 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="gap-2 w-fit"
                  onClick={() =>
                    downloadBase64Excel(
                      result.errorReportBase64!,
                      result.errorReportFileName || 'import-errors.xlsx'
                    )
                  }
                >
                  <Download className="h-4 w-4" />
                  Download error report (.xlsx)
                </Button>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              {phase === 'done' ? 'Close' : 'Cancel'}
            </Button>
            {phase !== 'uploading' && (
              <Button type="button" onClick={handleImport} disabled={!file || phase === 'done'}>
                Import
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
