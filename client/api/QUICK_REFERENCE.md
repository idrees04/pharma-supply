# HTTP Layer - Quick Reference

## 30-Second Setup

1. **App.tsx** - Already done! ✅
   - ErrorBoundary wraps app
   - QueryClientProvider configured

2. **Create service** (if not exists):
   ```tsx
   // api/services/yourservice.ts
   export const yourService = {
     getAll: () => get<Item[]>('/items'),
     getOne: (id) => get<Item>(`/items/${id}`),
   };
   ```

3. **Create hook** (in same file):
   ```tsx
   export function useItemList() {
     return useGetQuery(['items'], () => yourService.getAll());
   }
   ```

4. **Use in component**:
   ```tsx
   const { data: items, error, isPending } = useItemList();
   ```

Done! 🎉

---

## Common Operations

### Fetch Data (READ)

```tsx
// Hook
const { data, isPending, error } = useGetQuery(
  ['products'],
  () => get<Product[]>('/products')
);

// In component
if (isPending) return <Loader />;
if (error) return <Error error={error} />;
return data.map(p => <Card {...p} />);
```

### Create Item (POST)

```tsx
// Hook
const { mutate, isPending } = usePostMutation(
  (data) => post<Product, CreateDTO>('/products', data),
  {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Created!');
    },
    onError: (error) => toast.error(error.userMessage),
  }
);

// In component
<button onClick={() => mutate({ name: 'New Product' })}>Create</button>
```

### Update Item (PUT/PATCH)

```tsx
// Hook - Full replacement (PUT)
const { mutate } = usePutMutation(
  (data) => put<Product>(`/products/${id}`, data)
);

// Hook - Partial update (PATCH)
const { mutate } = usePatchMutation(
  (data) => patch<Product>(`/products/${id}`, data)
);

// In component
mutate({ name: 'New Name' });
```

### Delete Item (DELETE)

```tsx
// Hook
const { mutate } = useDeleteMutation(
  () => deleteRequest<void>(`/products/${id}`),
  {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate('/products');
    },
  }
);

// In component
<button onClick={() => mutate()}>Delete</button>
```

---

## Error Handling

```tsx
// From hook
const { error } = useGetQuery(...);

if (error) {
  // Type-safe error object
  if (error.type === ApiErrorType.UNAUTHORIZED) {
    // Redirect to login
  } else if (error.hasValidationErrors) {
    // Show form errors
    Object.entries(error.validationErrors).forEach(([field, msg]) => {
      form.setError(field, { message: msg.toString() });
    });
  } else {
    toast.error(error.userMessage); // User-friendly message
  }
}
```

---

## Hook Reference

| Hook | Use | Returns |
|------|-----|---------|
| `useGetQuery` | Fetch data | `{ data, isPending, error, isFetching }` |
| `usePostMutation` | Create | `{ mutate, isPending, error }` |
| `usePutMutation` | Full update | `{ mutate, isPending, error }` |
| `usePatchMutation` | Partial update | `{ mutate, isPending, error }` |
| `useDeleteMutation` | Delete | `{ mutate, isPending, error }` |
| `useInfiniteGetQuery` | Pagination | `{ data, fetchNextPage, hasNextPage }` |

---

## Request Functions

```tsx
// Direct use (NOT recommended in components)
import { get, post, put, patch, deleteRequest } from '@/api/requests';

const data = await get<Product[]>('/products');
const created = await post<Product>('/products', { name: 'New' });
await patch<Product>(`/products/${id}`, { name: 'Updated' });
await deleteRequest(`/products/${id}`);
```

---

## QueryClient Utilities

```tsx
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// Invalidate cache (refetch on next use)
queryClient.invalidateQueries({ queryKey: ['products'] });

// Set data directly (optimistic update)
queryClient.setQueryData(['products', id], newProduct);

// Prefetch data
queryClient.prefetchQuery({
  queryKey: ['products', id],
  queryFn: () => productService.getProduct(id),
});

// Clear all cache
queryClient.clear();

// Get cached data
const data = queryClient.getQueryData(['products']);
```

---

## API Error Types

```tsx
import { ApiErrorType, isApiError } from '@/api/errors';

// Types
ApiErrorType.NETWORK_ERROR
ApiErrorType.UNAUTHORIZED      // 401 - requires login
ApiErrorType.FORBIDDEN         // 403 - no permission
ApiErrorType.NOT_FOUND         // 404
ApiErrorType.CONFLICT          // 409
ApiErrorType.INTERNAL_SERVER_ERROR  // 500
// ... and more

// Checking
if (isApiError(error)) {
  if (error.isRetryable) { /* safe to retry */ }
  if (error.isAuthError) { /* redirect to login */ }
  if (error.hasValidationErrors) { /* show form errors */ }
}
```

---

## Creating New Service

**Template:**

```tsx
// api/services/items.ts

import { get, post, put, patch, deleteRequest } from '../requests';
import { useGetQuery, usePostMutation, usePutMutation, useDeleteMutation } from '../hooks';
import { useQueryClient } from '@tanstack/react-query';

// Types
export interface Item {
  id: string;
  name: string;
  // ... other fields
}

export interface CreateItemDTO {
  name: string;
  // ... only required fields
}

export interface UpdateItemDTO {
  name?: string;
  // ... only updatable fields
}

// Service
export const itemService = {
  getItems: () => get<Item[]>('/items'),
  getItem: (id: string) => get<Item>(`/items/${id}`),
  createItem: (data: CreateItemDTO) => post<Item>('/items', data),
  updateItem: (id: string, data: UpdateItemDTO) => patch<Item>(`/items/${id}`, data),
  deleteItem: (id: string) => deleteRequest<void>(`/items/${id}`),
};

// Hooks
export function useItemList() {
  return useGetQuery(['items'], () => itemService.getItems());
}

export function useCreateItem() {
  const queryClient = useQueryClient();
  return usePostMutation((data) => itemService.createItem(data), {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  });
}

export function useDeleteItem(id: string) {
  const queryClient = useQueryClient();
  return useDeleteMutation(() => itemService.deleteItem(id), {
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  });
}
```

---

## Common Patterns

### Dependent Queries

Fetch B only after A is available:

```tsx
const { data: product } = useGetQuery(
  ['products', productId],
  () => productService.getProduct(productId),
  { enabled: !!productId } // Don't fetch if productId is falsy
);

const { data: supplier } = useGetQuery(
  ['suppliers', product?.supplierId],
  () => supplierService.getSupplier(product!.supplierId),
  { enabled: !!product?.supplierId } // Only fetch if we have supplierId
);
```

### Optimistic Updates

Update UI before server confirms:

```tsx
const { mutate } = usePatchMutation(
  (data) => productService.updateProduct(id, data),
  {
    onMutate: async (newData) => {
      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: ['products', id] });

      // Snapshot old data
      const oldData = queryClient.getQueryData(['products', id]);

      // Update UI optimistically
      queryClient.setQueryData(['products', id], (old: Product) => ({
        ...old,
        ...newData,
      }));

      return { oldData }; // Return for error rollback
    },
    onError: (err, newData, context: any) => {
      // Rollback on error
      queryClient.setQueryData(['products', id], context.oldData);
      toast.error(err.userMessage);
    },
    onSuccess: () => {
      // Re-verify with server
      queryClient.invalidateQueries({ queryKey: ['products', id] });
    },
  }
);
```

### Search with Debounce

```tsx
import { useState } from 'react';
import { useDebouncedValue } from 'some-hook-library'; // Or implement your own

export function ProductSearch() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data: results } = useProductList({
    search: debouncedSearch,
    page: 1,
  });

  return (
    <>
      <input value={search} onChange={(e) => setSearch(e.target.value)} />
      {results?.items.map(p => <ProductCard key={p.id} {...p} />)}
    </>
  );
}
```

### Infinite Scroll

```tsx
export function ProductInfinite() {
  const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteGetQuery(
    ['products'],
    ({ pageParam = 1 }) =>
      get<{ items: Product[]; nextPage?: number }>(
        `/products?page=${pageParam}&limit=20`
      ),
    {
      getNextPageParam: (lastPage) => lastPage.nextPage,
    }
  );

  return (
    <>
      {data?.pages.map((page) =>
        page.items.map((p) => <ProductCard key={p.id} {...p} />)
      )}
      {hasNextPage && (
        <button onClick={() => fetchNextPage()} disabled={isFetching}>
          Load More
        </button>
      )}
    </>
  );
}
```

### Form with Validation Errors

```tsx
const { mutate, error } = useCreateProduct();

const onSubmit = (formData: CreateProductDTO) => {
  mutate(formData, {
    onError: (error) => {
      if (error.hasValidationErrors) {
        // Map API errors to form errors
        Object.entries(error.validationErrors).forEach(([field, messages]) => {
          const message = Array.isArray(messages) ? messages[0] : messages;
          form.setError(field as any, { message });
        });
      } else {
        toast.error(error.userMessage);
      }
    },
  });
};

return (
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <input {...form.register('name')} />
    {form.formState.errors.name && (
      <span>{form.formState.errors.name.message}</span>
    )}
  </form>
);
```

---

## Testing

```tsx
// Mock service
vi.mock('@/api/services/products', () => ({
  productService: {
    getProducts: vi.fn().mockResolvedValue({
      items: [{ id: '1', name: 'Widget' }],
    }),
  },
}));

// Test
test('shows products', async () => {
  render(<ProductList />);
  expect(await screen.findByText('Widget')).toBeInTheDocument();
});
```

---

## Performance Tips

1. **Enable only when needed**:
   ```tsx
   useGetQuery([...], () => ..., { enabled: !!productId })
   ```

2. **Set appropriate stale times**:
   ```tsx
   useGetQuery([...], () => ..., { staleTime: 5 * 60 * 1000 })
   ```

3. **Prefetch on hover**:
   ```tsx
   onMouseEnter={() => queryClient.prefetchQuery(...)}
   ```

4. **Paginate instead of fetch all**:
   ```tsx
   useGetQuery([...], () => getProducts({ page: 1, pageSize: 20 }))
   ```

5. **Use select to memoize**:
   ```tsx
   useGetQuery([...], () => ..., {
     select: (data) => data.items, // Only return items
   })
   ```

---

## Debugging

```tsx
// Enable React Query DevTools (development only)
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export function App() {
  return (
    <>
      {/* App routes */}
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  );
}

// Browser console
localStorage.debug = 'axios:*'; // Log all Axios calls
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Data not updating after mutation | Call `queryClient.invalidateQueries()` |
| "Cannot find module @/api" | Check TypeScript paths in `tsconfig.json` |
| Component refetching too often | Increase `staleTime` or add `enabled: false` |
| API request not including token | Check `getAuthToken()` in axios.ts |
| Error not caught | Make sure using hook's error state |
| Request cancelled | Component unmounted - add `enabled` to prevent |

---

## Quick Checklist

- [ ] Service layer created in `api/services/`
- [ ] Types defined (Item, CreateDTO, UpdateDTO)
- [ ] API functions created
- [ ] Hooks created and exported
- [ ] Using hooks in components (not direct API calls)
- [ ] Error handling in place
- [ ] Loading states shown
- [ ] Cache invalidation after mutations
- [ ] Tests written
- [ ] TypeScript strict mode passing

---

## Further Reading

- 📖 [Architecture](./ARCHITECTURE.md) - Deep dive into design decisions
- 📘 [Usage Guide](./USAGE_GUIDE.md) - Comprehensive patterns and examples
- 💡 [Example Component](./EXAMPLE_COMPONENT.tsx) - Full working example

---

**Need help?** Check the usage guide or look at the example component!
