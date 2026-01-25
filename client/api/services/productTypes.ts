/**
 * ProductTypes API Service
 *
 * This module encapsulates all API calls for product types.
 * It provides both raw service methods and custom React Query hooks.
 *
 * Architecture:
 * Component → Hook (useProductTypeList, etc.) → Service (productTypeService) → Requests
 *
 * API Base: https://mds.vtoxi.com/api/ProductTypes
 */

import { get, post, put, deleteRequest, RequestConfig } from "../requests";
import {
  ProductType,
  CreateProductTypeRequest,
  UpdateProductTypeRequest,
  GetProductTypesListResponse,
  CreateProductTypeResponse,
  GetProductTypeResponse,
  UpdateProductTypeResponse,
  DeleteProductTypeResponse,
} from "@/types/api/productTypes";
import {
  useGetQuery,
  usePostMutation,
  usePutMutation,
  useDeleteMutation,
} from "../hooks";
import { useQueryClient } from "@tanstack/react-query";

/**
 * ProductTypes API Service
 *
 * All product type API calls go through this service object.
 * This keeps endpoint URLs and logic centralized and reusable.
 */
export const productTypeService = {
  /**
   * Get all product types
   */
  getProductTypes: async (config?: RequestConfig): Promise<ProductType[]> => {
    const response = await get<GetProductTypesListResponse>(
      "/api/ProductTypes",
      config,
    );
    return response.data;
  },

  /**
   * Get a single product type by ID
   */
  getProductType: async (
    id: number,
    config?: RequestConfig,
  ): Promise<ProductType> => {
    const response = await get<GetProductTypeResponse>(
      `/api/ProductTypes/${id}`,
      config,
    );
    return response.data;
  },

  /**
   * Create a new product type
   */
  createProductType: async (
    data: CreateProductTypeRequest,
    config?: RequestConfig,
  ): Promise<ProductType> => {
    const response = await post<
      CreateProductTypeResponse,
      CreateProductTypeRequest
    >("/api/ProductTypes", data, config);
    return response.data;
  },

  /**
   * Update a product type
   */
  updateProductType: async (
    id: number,
    data: UpdateProductTypeRequest,
    config?: RequestConfig,
  ): Promise<ProductType> => {
    const response = await put<
      UpdateProductTypeResponse,
      UpdateProductTypeRequest
    >(`/api/ProductTypes/${id}`, data, config);
    return response.data;
  },

  /**
   * Delete a product type
   */
  deleteProductType: async (
    id: number,
    config?: RequestConfig,
  ): Promise<void> => {
    await deleteRequest<DeleteProductTypeResponse>(
      `/api/ProductTypes/${id}`,
      config,
    );
  },
};

/**
 * Custom Hooks for ProductTypes
 *
 * These hooks combine React Query with the service layer.
 * Components should use these hooks instead of calling the service directly.
 */

/**
 * useProductTypeList - Fetch all product types
 *
 * Example:
 *   const { data, isPending, error } = useProductTypeList();
 *
 *   if (isPending) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.userMessage}</div>;
 *
 *   return (
 *     <div>
 *       {data.map(type => <ProductTypeCard key={type.id} {...type} />)}
 *     </div>
 *   );
 */
export function useProductTypeList() {
  return useGetQuery(
    ["productTypes"],
    () => productTypeService.getProductTypes(),
    {
      staleTime: 5 * 60 * 1000,
    },
  );
}

/**
 * useProductType - Fetch a single product type by ID
 *
 * Example:
 *   const { data: productType, isPending } = useProductType(5);
 */
export function useProductType(id: number) {
  return useGetQuery(
    ["productType", id],
    () => productTypeService.getProductType(id),
    {
      enabled: !!id,
      staleTime: 5 * 60 * 1000,
    },
  );
}

/**
 * useCreateProductType - Create a new product type
 *
 * Example:
 *   const { mutate, isPending, error } = useCreateProductType();
 *
 *   const handleCreate = (data: CreateProductTypeRequest) => {
 *     mutate(data, {
 *       onSuccess: () => {
 *         toast.success('Product type created');
 *       },
 *     });
 *   };
 */
export function useCreateProductType() {
  const queryClient = useQueryClient();

  return usePostMutation<ProductType, CreateProductTypeRequest>(
    (data) => productTypeService.createProductType(data),
    {
      onSuccess: () => {
        // Invalidate the product types list to refetch
        queryClient.invalidateQueries({ queryKey: ["productTypes"] });
      },
    },
  );
}

/**
 * useUpdateProductType - Update a product type
 *
 * Example:
 *   const { mutate, isPending } = useUpdateProductType(5);
 *
 *   const handleUpdate = (data: UpdateProductTypeRequest) => {
 *     mutate(data, {
 *       onSuccess: () => {
 *         toast.success('Product type updated');
 *       },
 *     });
 *   };
 */
export function useUpdateProductType(id: number) {
  const queryClient = useQueryClient();

  return usePutMutation<ProductType, UpdateProductTypeRequest>(
    (data) => productTypeService.updateProductType(id, data),
    {
      onSuccess: (updatedProductType) => {
        // Update the cache with the new data
        queryClient.setQueryData(["productType", id], updatedProductType);
        // Invalidate the list to refetch
        queryClient.invalidateQueries({ queryKey: ["productTypes"] });
      },
    },
  );
}

/**
 * useDeleteProductType - Delete a product type
 *
 * Example:
 *   const { mutate, isPending } = useDeleteProductType(5);
 *
 *   const handleDelete = () => {
 *     mutate(undefined, {
 *       onSuccess: () => {
 *         toast.success('Product type deleted');
 *         navigate('/settings/product-types');
 *       },
 *     });
 *   };
 */
export function useDeleteProductType(id: number) {
  const queryClient = useQueryClient();

  return useDeleteMutation(() => productTypeService.deleteProductType(id), {
    onSuccess: () => {
      // Remove the deleted item from cache
      queryClient.removeQueries({ queryKey: ["productType", id] });
      // Invalidate the list to refetch
      queryClient.invalidateQueries({ queryKey: ["productTypes"] });
    },
  });
}
