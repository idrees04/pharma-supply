import { useQueryClient } from '@tanstack/react-query';
import { useGetQuery, usePostMutation, usePutMutation, useDeleteMutation } from '@/api/hooks';
import { federationService } from '@/api/services/federation';
import {
    FederationDto,
    CreateFederationRequest,
    UpdateFederationRequest,
} from '@/types/api/federation';

export function useFederations() {
    return useGetQuery<FederationDto[]>(['federations'], () => federationService.getFederations(), {
        staleTime: 10 * 60 * 1000,
    });
}

export function useFederation(id: number | null) {
    return useGetQuery<FederationDto>(
        ['federations', id],
        () => federationService.getFederation(id!),
        {
            enabled: id !== null,
        }
    );
}

export function useCreateFederation() {
    const queryClient = useQueryClient();

    return usePostMutation<FederationDto, CreateFederationRequest>(
        (data) => federationService.createFederation(data),
        {
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ['federations'] });
            },
        }
    );
}

export function useUpdateFederation(id: number) {
    const queryClient = useQueryClient();

    return usePutMutation<FederationDto, UpdateFederationRequest>(
        (data) => federationService.updateFederation(id, data),
        {
            onSuccess: (updated) => {
                queryClient.setQueryData(['federations', id], updated);
                queryClient.invalidateQueries({ queryKey: ['federations'] });
            },
        }
    );
}

export function useDeleteFederation() {
    const queryClient = useQueryClient();

    return useDeleteMutation(
        (id: number) => federationService.deleteFederation(id),
        {
            onSuccess: (_, id) => {
                queryClient.removeQueries({ queryKey: ['federations', id] });
                queryClient.invalidateQueries({ queryKey: ['federations'] });
            },
        }
    );
}