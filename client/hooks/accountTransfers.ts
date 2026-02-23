import { useQueryClient } from '@tanstack/react-query';
import { useGetQuery, usePostMutation, useDeleteMutation } from '@/api/hooks';
import { accountTransferService } from '@/api/services/accountTransfers';
import {
    AccountTransferDto,
    CreateAccountTransferRequest,
    AccountTransferListQueryParams,
} from '@/types/api/accountTransfers';
import { PaginatedResponse } from '@/types/api/common';

export function useAccountTransfers(params?: AccountTransferListQueryParams) {
    return useGetQuery<PaginatedResponse<AccountTransferDto>>(
        ['accountTransfers', params],
        () => accountTransferService.getAccountTransfers(params),
        {
            staleTime: 5 * 60 * 1000,
        }
    );
}

export function useAccountTransfer(id: number | null) {
    return useGetQuery<AccountTransferDto>(
        ['accountTransfers', id],
        () => accountTransferService.getAccountTransfer(id!),
        {
            enabled: id !== null,
        }
    );
}

export function useCreateAccountTransfer() {
    const queryClient = useQueryClient();

    return usePostMutation<AccountTransferDto, CreateAccountTransferRequest>(
        (data) => accountTransferService.createAccountTransfer(data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['accountTransfers'] });
            },
        }
    );
}

export function useDeleteAccountTransfer() {
    const queryClient = useQueryClient();

    return useDeleteMutation(
        (id: number) => accountTransferService.deleteAccountTransfer(id),
        {
            onSuccess: (_, id) => {
                queryClient.removeQueries({ queryKey: ['accountTransfers', id] });
                queryClient.invalidateQueries({ queryKey: ['accountTransfers'] });
            },
        }
    );
}