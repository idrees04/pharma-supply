// types/dropdown.ts

export interface EnumOption {
  value: number;        // int32
  name: string;
  displayName: string;
}

export interface PaymentModeOption {
  value: number;        // int32
  name: string;
  label: string;
}

// Generic API response wrapper (matches backend)
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors: unknown;
  timestamp: string;
}

// All enums grouped by enum name
export type AllEnumsResponse = Record<string, EnumOption[]>;
