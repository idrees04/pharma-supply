export interface ApiResponse<T> {
    success: boolean;
    message: string | null;
    data: T;
    errors: any | null;
    timestamp: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    pageNumber: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
}

// Re-export for convenience
export * from './accounts';
export * from './accountTransfers';
export * from './auditLogs';
export * from './dashboard';
export * from './expenseCategories';
export * from './expenses';
export * from './federation';
export * from './inventory';
export * from './invoices';
export * from './notifications';
export * from './payments';
export * from './productSuppliers';
export * from './reports';
export * from './systemConfiguration';
export * from './taxConfiguration';
export * from './users';