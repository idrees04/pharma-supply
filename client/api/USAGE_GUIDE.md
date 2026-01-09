# HTTP Layer - Complete Usage Guide

## Overview

This is a production-ready HTTP layer built with Axios and React Query. It provides:

- **Centralized Axios instance** with automatic token injection and error normalization
- **Typed request functions** for GET, POST, PUT, PATCH, DELETE
- **Custom React Query hooks** for queries and mutations
- **Enterprise error handling** with error boundaries
- **Best practices** for performance, scalability, and maintainability

## Architecture

```
Component
  ↓
Custom Hook (useProduct, useCreateProduct, etc.)
  ↓
Service Layer (productService.getProduct, etc.)
  ↓
Request Function (get<T>, post<T>, etc.)
  ↓
Axios Instance (with interceptors)
  ↓
HTTP Backend
```

### Why This Layering?

1. **Components**: Only use hooks, never call API directly
2. **Hooks**: Combine React Query with service methods
3. **Services**: Centralize API logic per domain
4. **Requests**: Generic functions with proper typing
5. **Axios**: Handles HTTP, auth, errors, retries, logging

## Quick Start

### 1. Wrap App with Providers

In `client/App.tsx`:

```tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/api/queryClient';
import ErrorBoundary from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {/* Your app routes here */}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
```

### 2. Create Service Layer

For each domain (products, suppliers, etc.), create a service:

```tsx
// api/services/suppliers.ts
export const supplierService = {
  getSuppliers: () => get<Supplier[]>('/suppliers'),
  getSupplier: (id: string) => get<Supplier>(`/suppliers/${id}`),
  createSupplier: (data: CreateSupplierDTO) => 
    post<Supplier>('/suppliers', data),
  updateSupplier: (id: string, data: UpdateSupplierDTO) => 
    patch<Supplier>(`/suppliers/${id}`, data),
  deleteSupplier: (id: string) => 
    deleteRequest<void>(`/suppliers/${id}`),
};
```

### 3. Create Custom Hooks

Wrap service methods with React Query hooks:

```tsx
// api/services/suppliers.ts (continued)
export function useSupplierList() {
  return useGetQuery(['suppliers'], () => supplierService.getSuppliers());
}

export function useSupplier(id: string) {
  return useGetQuery(
    ['suppliers', id],
    () => supplierService.getSupplier(id),
    { enabled: !!id }
  );
}

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return usePostMutation(
    (data) => supplierService.createSupplier(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      },
    }
  );
}
```

### 4. Use in Components

```tsx
// pages/suppliers/SupplierList.tsx
import { useSupplierList, useCreateSupplier } from '@/api/services/suppliers';
import { toast } from 'sonner';

export function SupplierList() {
  const { data: suppliers, isPending, error } = useSupplierList();
  const { mutate: createSupplier } = useCreateSupplier();

  if (isPending) return <div>Loading suppliers...</div>;
  if (error) return <div>Error: {error.userMessage}</div>;

  const handleCreate = (formData: CreateSupplierDTO) => {
    createSupplier(formData, {
      onSuccess: (newSupplier) => {
        toast.success(`Supplier ${newSupplier.name} created`);
      },
      onError: (error) => {
        if (error.hasValidationErrors) {
          toast.error('Please fix validation errors');
        } else {
          toast.error(error.userMessage);
        }
      },
    });
  };

  return (
    <div>
      <h1>Suppliers</h1>
      {suppliers?.map(supplier => (
        <SupplierCard key={supplier.id} {...supplier} />
      ))}
      <CreateSupplierForm onSubmit={handleCreate} />
    </div>
  );
}
```

## Common Patterns

### Pattern 1: Fetching Data with Caching

```tsx
const { data, isPending, error } = useGetQuery(
  ['products', filters],
  () => productService.getProducts(filters),
  {
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000,   // Clean up after 10 minutes
  }
);
```

**Why it works:**
- Data is cached by key, so switching filters caches each separately
- Stale time prevents unnecessary refetches
- GC time prevents memory leaks in SPAs

### Pattern 2: Creating with Optimistic Updates

```tsx
const { mutate } = usePostMutation(
  (data) => productService.createProduct(data),
  {
    onSuccess: (newProduct) => {
      // Update cache immediately
      queryClient.setQueryData(['products', newProduct.id], newProduct);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created!');
    },
    onError: (error) => {
      if (error.hasValidationErrors) {
        // Show validation errors to user
        Object.entries(error.validationErrors).forEach(([field, msg]) => {
          form.setError(field, { message: msg.toString() });
        });
      }
    },
  }
);
```

### Pattern 3: Dependent Queries

```tsx
export function useProductWithSupplier(productId: string) {
  const { data: product } = useGetQuery(
    ['products', productId],
    () => productService.getProduct(productId),
    { enabled: !!productId }
  );

  const { data: supplier } = useGetQuery(
    ['suppliers', product?.supplierId],
    () => supplierService.getSupplier(product!.supplierId),
    { 
      // Only fetch supplier if we have the product
      enabled: !!product?.supplierId 
    }
  );

  return { product, supplier };
}
```

### Pattern 4: Prefetching for Better UX

```tsx
import { useQueryClient } from '@tanstack/react-query';

export function ProductLink({ id, children }: Props) {
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ['products', id],
      queryFn: () => productService.getProduct(id),
    });
  };

  return (
    <Link
      to={`/products/${id}`}
      onMouseEnter={handleMouseEnter}
    >
      {children}
    </Link>
  );
}
```

### Pattern 5: Infinite Pagination

```tsx
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetching,
  isPending,
} = useInfiniteGetQuery(
  ['products'],
  ({ pageParam = 1 }) =>
    productService.getProducts({ page: pageParam, pageSize: 20 }),
  {
    getNextPageParam: (lastPage) => lastPage.nextPage,
  }
);

return (
  <>
    {data?.pages.map((page) =>
      page.items.map((product) => (
        <ProductCard key={product.id} {...product} />
      ))
    )}
    {hasNextPage && (
      <button onClick={() => fetchNextPage()} disabled={isFetching}>
        Load More
      </button>
    )}
  </>
);
```

### Pattern 6: Form Mutations with Validation

```tsx
const { mutate: updateProduct, isPending, error } = usePutMutation(
  (data) => productService.updateProduct(productId, data),
  {
    onSuccess: (updated) => {
      form.reset(updated);
      toast.success('Product updated');
    },
  }
);

const onSubmit = async (formData: UpdateProductDTO) => {
  updateProduct(formData, {
    onError: (error) => {
      // Show validation errors in form
      if (error.hasValidationErrors) {
        Object.entries(error.validationErrors).forEach(([field, msg]) => {
          form.setError(field, {
            message: Array.isArray(msg) ? msg[0] : msg,
          });
        });
      }
    },
  });
};
```

## Error Handling

### Understanding Error Types

All HTTP errors are converted to `ApiError` with a `type` property:

```tsx
const { error } = useGetQuery(['products'], () => productService.getProducts());

if (error) {
  // Type-safe error handling
  if (error.type === ApiErrorType.UNAUTHORIZED) {
    // Redirect to login
  } else if (error.type === ApiErrorType.NETWORK_ERROR) {
    // Show offline message
  } else if (error.hasValidationErrors) {
    // Show validation errors
  }
  
  // Always available
  console.log(error.userMessage); // User-friendly message
  console.log(error.statusCode);   // HTTP status
  console.log(error.isRetryable);  // Can retry?
}
```

### Error Boundary for Render Errors

```tsx
import ErrorBoundary from '@/components/ErrorBoundary';

export function App() {
  return (
    <ErrorBoundary onError={(error, info) => {
      // Send to error tracking service
      console.error('App error:', error, info);
    }}>
      <Router>
        {/* App routes */}
      </Router>
    </ErrorBoundary>
  );
}
```

### Toast Notifications for API Errors

```tsx
export function useSupplierList() {
  return useGetQuery(['suppliers'], () => supplierService.getSuppliers(), {
    onError: (error) => {
      toast.error(error.userMessage);
    },
  });
}
```

## Advanced Topics

### Custom Request Configuration

```tsx
// Override timeout for slow endpoint
const data = await productService.getProducts(
  {},
  { timeout: 60000 } // 60 seconds
);
```

### Request Cancellation

```tsx
import { CancelToken } from 'axios';

const source = CancelToken.source();

const fetchProducts = async () => {
  try {
    const data = await productService.getProducts(
      {},
      { cancelToken: source.token }
    );
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request cancelled');
    }
  }
};

// Cancel the request
source.cancel('Operation cancelled by user');
```

### Request Logging in Development

Enable request/response logging in `client/api/axios.ts`:

```tsx
// Already implemented - check console in dev mode
apiClient.interceptors.request.use((config) => {
  if (import.meta.env.DEV) {
    console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});
```

### Adding Custom Headers

```tsx
// Per-request
const data = await productService.getProducts(
  {},
  {
    headers: {
      'X-Custom-Header': 'value',
    },
  }
);

// Global (update axios.ts interceptor)
apiClient.interceptors.request.use((config) => {
  config.headers['X-Custom-Header'] = 'value';
  return config;
});
```

## Migrating from Old API Client

### Before (Old apiClient with Fetch):
```tsx
const response = await apiClient.getProducts();
if (response.error) {
  console.error(response.error);
}
const products = response.data;
```

### After (New HTTP Layer with React Query):
```tsx
const { data: products, error, isPending } = useGetQuery(
  ['products'],
  () => productService.getProducts()
);

if (error) {
  toast.error(error.userMessage);
}
```

**Benefits:**
- Automatic caching
- Background refetch
- Type safety
- Automatic loading states
- Error normalization
- Deduplication

## Performance Tips

1. **Use cache keys effectively**
   - Include filters in keys: `['products', filters]`
   - Enables separate caching per filter

2. **Set appropriate stale times**
   - Fast-changing data: 30 seconds
   - Mostly static: 5-10 minutes
   - Consider user expectations

3. **Prefetch on hover**
   - Improve perceived performance
   - Use in navigation links

4. **Paginate instead of fetching all**
   - Use `useInfiniteGetQuery` for large lists
   - Reduces initial load time

5. **Avoid N+1 queries**
   - Use dependent queries
   - Enable only when needed

## Testing

```tsx
import { QueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

test('useProductList fetches products', async () => {
  // Mock the service
  vi.mock('@/api/services/products', () => ({
    productService: {
      getProducts: vi.fn().mockResolvedValue({
        items: [{ id: '1', name: 'Product 1' }],
      }),
    },
  }));

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <YourComponent />
    </QueryClientProvider>
  );

  await screen.findByText('Product 1');
});
```

## Troubleshooting

### "Query key not found"
- Check if queryKey includes all relevant parameters
- Invalidate with correct key: `queryClient.invalidateQueries({ queryKey: ['products'] })`

### "Request cancelled" errors
- Component unmounted while request was in flight
- Use `enabled` to prevent unnecessary requests

### "Mutation successful but cache not updated"
- Call `invalidateQueries()` or `setQueryData()` in `onSuccess`
- Check if queryKey matches

### 401 Unauthorized keeps happening
- Token refresh logic not implemented in `handleAuthError()`
- Update `client/api/axios.ts` to refresh token or redirect to login
