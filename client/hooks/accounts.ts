import { useQueryClient } from '@tanstack/react-query';
import { useGetQuery, usePostMutation, usePutMutation } from '@/api/hooks';
import { accountService } from '@/api/services/accounts';
import {
    AccountDto,
    AccountBalanceDto,
    CreateAccountRequest,
    UpdateAccountRequest,
} from '@/types/api/accounts';

export function useAccounts() {
    return useGetQuery<AccountDto[]>(['accounts'], () => accountService.getAccounts(), {
        staleTime: 5 * 60 * 1000,
    });
}

export function useAccount(id: number | null) {
    return useGetQuery<AccountDto>(
        ['accounts', id],
        () => accountService.getAccount(id!),
        {
            enabled: id !== null,
        }
    );
}

export function useAccountBalances() {
    return useGetQuery<AccountBalanceDto[]>(
        ['accounts', 'balances'],
        () => accountService.getAccountBalances(),
        {
            staleTime: 5 * 60 * 1000,
        }
    );
}

export function useCreateAccount() {
    const queryClient = useQueryClient();

    return usePostMutation<AccountDto, CreateAccountRequest>(
        (data) => accountService.createAccount(data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['accounts'] });
                queryClient.invalidateQueries({ queryKey: ['accounts', 'balances'] });
            },
        }
    );
}

export function useUpdateAccount(id: number) {
    const queryClient = useQueryClient();

    return usePutMutation<AccountDto, UpdateAccountRequest>(
        (data) => accountService.updateAccount(id, data),
        {
            onSuccess: (updated) => {
                queryClient.setQueryData(['accounts', id], updated);
                queryClient.invalidateQueries({ queryKey: ['accounts'] });
                queryClient.invalidateQueries({ queryKey: ['accounts', 'balances'] });
            },
        }
    );
}