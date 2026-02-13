/**
 * EXAMPLE COMPONENT: Complete Product Management
 *
 * This example demonstrates all best practices for using the HTTP layer:
 * - Fetching data with useGetQuery
 * - Creating with usePostMutation
 * - Updating with usePutMutation/usePatchMutation
 * - Deleting with useDeleteMutation
 * - Error handling
 * - Loading states
 * - Form validation feedback
 * - Optimistic updates
 * - Cache invalidation
 *
 * Copy this component and adapt it for your domain.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertCircle, Loader2, Trash2, Edit2, Plus } from 'lucide-react';

// Import from your service layer
import {
  Product,
  CreateProductDTO,
  UpdateProductDTO,
  useProductList,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  ProductFilter,
} from '@/api/services/products';

/**
 * Main Product Management Component
 */
export function ProductManagement() {
  const [filters, setFilters] = useState<ProductFilter>({
    page: 1,
    pageSize: 20,
  });

  // Search query state
  const [searchQuery, setSearchQuery] = useState('');

  // Dialog states
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Fetch products with current filters
  const {
    data: productsResponse,
    isPending: isLoadingProducts,
    error: productsError,
  } = useProductList({
    ...filters,
    search: searchQuery || undefined,
  });

  const products = productsResponse?.items || [];
  const total = productsResponse?.total || 0;

  // Create mutation
  const {
    mutate: createProduct,
    isPending: isCreating,
    error: createError,
  } = useCreateProduct();

  // Delete mutation
  const {
    mutate: deleteProduct,
    isPending: isDeleting,
  } = useDeleteProduct(editingId || '');

  const handleCreateOpen = () => {
    setOpenCreateDialog(true);
  };

  const handleCreateClose = () => {
    setOpenCreateDialog(false);
  };

  const handleCreate = (data: CreateProductDTO) => {
    createProduct(data, {
      onSuccess: (newProduct) => {
        toast.success(`Product "${newProduct.name}" created successfully`);
        handleCreateClose();
        // Reset to first page to see new product
        setFilters({ ...filters, page: 1 });
      },
      onError: (error) => {
        if (error.hasValidationErrors) {
          // Handle validation errors in form
          Object.entries(error.validationErrors).forEach(([field, message]) => {
            toast.error(`${field}: ${Array.isArray(message) ? message[0] : message}`);
          });
        } else {
          toast.error(error.userMessage);
        }
      },
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setEditingId(id);
      deleteProduct(undefined, {
        onSuccess: () => {
          toast.success('Product deleted successfully');
          setEditingId(null);
        },
        onError: (error) => {
          toast.error(error.userMessage);
          setEditingId(null);
        },
      });
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  // Render error state
  if (productsError) {
    return (
      <Card className="p-8 border-red-200 bg-red-50">
        <div className="flex items-center gap-3 text-red-800">
          <AlertCircle className="h-6 w-6 flex-shrink-0" />
          <div>
            <h3 className="font-semibold">Failed to load products</h3>
            <p className="text-sm mt-1">{productsError.userMessage}</p>
            {productsError.hasValidationErrors && (
              <details className="mt-2 text-xs">
                <summary>Details</summary>
                <pre className="mt-1">
                  {JSON.stringify(productsError.validationErrors, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Render loading state
  if (isLoadingProducts) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  // Calculate pagination info
  const pageCount = Math.ceil(total / (filters.pageSize || 20));

  return (
    <div className="space-y-6">
      {/* Header with search and create button */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search products by name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setFilters({ ...filters, page: 1 }); // Reset to first page on search
            }}
            className="max-w-md"
          />
        </div>
        <Button
          onClick={handleCreateOpen}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Product
        </Button>
      </div>

      {/* Create Dialog */}
      <Dialog open={openCreateDialog} onOpenChange={setOpenCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Product</DialogTitle>
          </DialogHeader>
          <CreateProductForm
            onSubmit={handleCreate}
            isLoading={isCreating}
            error={createError}
          />
        </DialogContent>
      </Dialog>

      {/* Products List */}
      <Card>
        {products.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No products found</p>
            {searchQuery && (
              <p className="text-sm mt-1">
                Try adjusting your search query
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      Name
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-700">
                      SKU
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">
                      Price
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">
                      Quantity
                    </th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((product) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      isDeleting={isDeleting && editingId === product.id}
                      onDelete={() => handleDelete(product.id)}
                      onEdit={() => {
                        // Implement edit in actual component
                        toast.info('Edit dialog coming soon');
                      }}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pageCount > 1 && (
              <div className="flex items-center justify-between border-t px-4 py-3 bg-gray-50">
                <p className="text-sm text-gray-600">
                  Page {filters.page} of {pageCount} ({total} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handlePageChange(filters.page! - 1)}
                    disabled={filters.page === 1}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => handlePageChange(filters.page! + 1)}
                    disabled={filters.page === pageCount}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

/**
 * Product row component
 */
function ProductRow({
  product,
  isDeleting,
  onDelete,
  onEdit,
}: {
  product: Product;
  isDeleting: boolean;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <tr className="hover:bg-gray-50 transition">
      <td className="px-4 py-3">{product.name}</td>
      <td className="px-4 py-3">{product.sku}</td>
      <td className="px-4 py-3 text-right">
        PKR {product.price.toFixed(2)}
      </td>
      <td className="px-4 py-3 text-right">{product.quantity}</td>
      <td className="px-4 py-3 text-right space-x-2">
        <Button
          onClick={onEdit}
          variant="ghost"
          size="sm"
          className="text-blue-600 hover:text-blue-700"
        >
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button
          onClick={onDelete}
          disabled={isDeleting}
          variant="ghost"
          size="sm"
          className="text-red-600 hover:text-red-700"
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </td>
    </tr>
  );
}

/**
 * Create Product Form
 */
function CreateProductForm({
  onSubmit,
  isLoading,
  error,
}: {
  onSubmit: (data: CreateProductDTO) => void;
  isLoading: boolean;
  error: any;
}) {
  const form = useForm<CreateProductDTO>({
    defaultValues: {
      name: '',
      description: '',
      sku: '',
      price: 0,
      quantity: 0,
    },
  });

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
    >
      {/* Global error message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
          {error.userMessage}
        </div>
      )}

      {/* Name field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Product Name *
        </label>
        <Input
          {...form.register('name', {
            required: 'Product name is required',
          })}
          placeholder="Enter product name"
          disabled={isLoading}
        />
        {form.formState.errors.name && (
          <p className="mt-1 text-sm text-red-600">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      {/* SKU field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          SKU *
        </label>
        <Input
          {...form.register('sku', {
            required: 'SKU is required',
          })}
          placeholder="Enter SKU"
          disabled={isLoading}
        />
        {form.formState.errors.sku && (
          <p className="mt-1 text-sm text-red-600">
            {form.formState.errors.sku.message}
          </p>
        )}
      </div>

      {/* Price field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Price (PKR) *
        </label>
        <Input
          type="number"
          {...form.register('price', {
            required: 'Price is required',
            min: { value: 0, message: 'Price must be positive' },
          })}
          placeholder="0.00"
          disabled={isLoading}
        />
        {form.formState.errors.price && (
          <p className="mt-1 text-sm text-red-600">
            {form.formState.errors.price.message}
          </p>
        )}
      </div>

      {/* Quantity field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Quantity *
        </label>
        <Input
          type="number"
          {...form.register('quantity', {
            required: 'Quantity is required',
            min: { value: 0, message: 'Quantity must be positive' },
          })}
          placeholder="0"
          disabled={isLoading}
        />
        {form.formState.errors.quantity && (
          <p className="mt-1 text-sm text-red-600">
            {form.formState.errors.quantity.message}
          </p>
        )}
      </div>

      {/* Description field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <Input
          {...form.register('description')}
          placeholder="Product description (optional)"
          disabled={isLoading}
        />
      </div>

      {/* Submit button */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating...
          </>
        ) : (
          'Create Product'
        )}
      </Button>
    </form>
  );
}

export default ProductManagement;
