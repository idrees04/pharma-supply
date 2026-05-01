// contexts/DropdownProvider.tsx
import { useAllEnums } from '@/hooks/dropdown';
import { AllEnumsResponse, EnumOption } from '@/types/api/dropdown';
import React, { createContext, useContext, ReactNode } from 'react';

interface DropdownContextValue {
  enums: AllEnumsResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  getEnumOptions: (enumName: string) => EnumOption[] | undefined;
}

const DropdownContext = createContext<DropdownContextValue | undefined>(undefined);

export const DropdownProvider = ({ children }: { children: ReactNode }) => {
  const { data: enums, isLoading, isError } = useAllEnums();

  const getEnumOptions = (enumName: string): EnumOption[] | undefined => {
    return enums?.[enumName];
  };

  return (
    <DropdownContext.Provider value={{ enums, isLoading, isError, getEnumOptions }}>
      {children}
    </DropdownContext.Provider>
  );
};

// Hook to consume dropdown data (alternative to individual hooks)
export const useDropdownContext = () => {
  const context = useContext(DropdownContext);
  if (!context) {
    throw new Error('useDropdownContext must be used within a DropdownProvider');
  }
  return context;
};