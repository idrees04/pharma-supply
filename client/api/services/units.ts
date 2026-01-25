/**
 * Units API Service
 *
 * This module encapsulates all API calls for units.
 * It provides both raw service methods and custom React Query hooks.
 *
 * Architecture:
 * Component → Hook (useUnitList, etc.) → Service (unitService) → Requests
 *
 * API Base: https://mds.vtoxi.com/api/Units
 */

import { get, post, put, deleteRequest, RequestConfig } from '../requests';
import {
  Unit,
  CreateUnitRequest,
  UpdateUnitRequest,
  GetUnitsListResponse,
  CreateUnitResponse,
  GetUnitResponse,
  UpdateUnitResponse,
  DeleteUnitResponse,
} from '@/types/api/units';
import { useGetQuery, usePostMutation, usePutMutation, useDeleteMutation } from '../hooks';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Units API Service
 *
 * All unit API calls go through this service object.
 * This keeps endpoint URLs and logic centralized and reusable.
 */
export const unitService = {
  /**
   * Get all units
   */
  getUnits: async (config?: RequestConfig): Promise<Unit[]> => {
    const response = await get<GetUnitsListResponse>('/api/Units', config);
    return response.data;
  },

  /**
   * Get a single unit by ID
   */
  getUnit: async (id: number, config?: RequestConfig): Promise<Unit> => {
    const response = await get<GetUnitResponse>(`/api/Units/${id}`, config);
    return response.data;
  },

  /**
   * Create a new unit
   */
  createUnit: async (data: CreateUnitRequest, config?: RequestConfig): Promise<Unit> => {
    const response = await post<CreateUnitResponse, CreateUnitRequest>(
      '/api/Units',
      data,
      config
    );
    return response.data;
  },

  /**
   * Update a unit
   */
  updateUnit: async (
    id: number,
    data: UpdateUnitRequest,
    config?: RequestConfig
  ): Promise<Unit> => {
    const response = await put<UpdateUnitResponse, UpdateUnitRequest>(
      `/api/Units/${id}`,
      data,
      config
    );
    return response.data;
  },

  /**
   * Delete a unit
   */
  deleteUnit: async (id: number, config?: RequestConfig): Promise<void> => {
    await deleteRequest<DeleteUnitResponse>(`/api/Units/${id}`, config);
  },
};

/**
 * Custom Hooks for Units
 *
 * These hooks combine React Query with the service layer.
 * Components should use these hooks instead of calling the service directly.
 */

/**
 * useUnitList - Fetch all units
 *
 * Example:
 *   const { data, isPending, error } = useUnitList();
 *
 *   if (isPending) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.userMessage}</div>;
 *
 *   return (
 *     <div>
 *       {data.map(unit => <UnitCard key={unit.id} {...unit} />)}
 *     </div>
 *   );
 */
export function useUnitList() {
  return useGetQuery(['units'], () => unitService.getUnits(), {
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * useUnit - Fetch a single unit by ID
 *
 * Example:
 *   const { data: unit, isPending } = useUnit(5);
 */
export function useUnit(id: number) {
  return useGetQuery(['unit', id], () => unitService.getUnit(id), {
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * useCreateUnit - Create a new unit
 *
 * Example:
 *   const { mutate, isPending, error } = useCreateUnit();
 *
 *   const handleCreate = (data: CreateUnitRequest) => {
 *     mutate(data, {
 *       onSuccess: () => {
 *         toast.success('Unit created');
 *       },
 *     });
 *   };
 */
export function useCreateUnit() {
  const queryClient = useQueryClient();

  return usePostMutation<Unit, CreateUnitRequest>(
    (data) => unitService.createUnit(data),
    {
      onSuccess: () => {
        // Invalidate the units list to refetch
        queryClient.invalidateQueries({ queryKey: ['units'] });
      },
    }
  );
}

/**
 * useUpdateUnit - Update a unit
 *
 * Example:
 *   const { mutate, isPending } = useUpdateUnit(5);
 *
 *   const handleUpdate = (data: UpdateUnitRequest) => {
 *     mutate(data, {
 *       onSuccess: () => {
 *         toast.success('Unit updated');
 *       },
 *     });
 *   };
 */
export function useUpdateUnit(id: number) {
  const queryClient = useQueryClient();

  return usePutMutation<Unit, UpdateUnitRequest>(
    (data) => unitService.updateUnit(id, data),
    {
      onSuccess: (updatedUnit) => {
        // Update the cache with the new data
        queryClient.setQueryData(['unit', id], updatedUnit);
        // Invalidate the list to refetch
        queryClient.invalidateQueries({ queryKey: ['units'] });
      },
    }
  );
}

/**
 * useDeleteUnit - Delete a unit
 *
 * Example:
 *   const { mutate, isPending } = useDeleteUnit(5);
 *
 *   const handleDelete = () => {
 *     mutate(undefined, {
 *       onSuccess: () => {
 *         toast.success('Unit deleted');
 *         navigate('/settings/units');
 *       },
 *     });
 *   };
 */
export function useDeleteUnit(id: number) {
  const queryClient = useQueryClient();

  return useDeleteMutation(() => unitService.deleteUnit(id), {
    onSuccess: () => {
      // Remove the deleted item from cache
      queryClient.removeQueries({ queryKey: ['unit', id] });
      // Invalidate the list to refetch
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
  });
}
