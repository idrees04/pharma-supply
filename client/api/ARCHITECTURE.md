# HTTP Layer - Architecture & Design Decisions

## Overview

This document explains the architecture of the production-ready HTTP layer and the reasoning behind key design decisions.

## Complete Data Flow Diagram

```
┌─────────────────┐
│   Component     │  Never calls API directly
│  (e.g., Page)   │
└────────┬────────┘
         │ uses
         ▼
┌─────────────────┐
│   Custom Hooks  │  Example: useProductList()
│  (hooks.ts)     │  - Wraps React Query
│                 │  - Calls service layer
└────────┬────────┘
         │ calls
         ▼
┌──────────────────┐
│  Service Layer   │  Example: productService.getProducts()
│  (services/)     │  - Domain-specific logic
│                  │  - Endpoint URLs centralized
│                  │  - Type definitions
└────────┬─────────┘
         │ calls
         ▼
┌──────────────────┐
│  Request Funcs   │  Example: get<Product[]>('/products')
│  (requests.ts)   │  - Generic, reusable
│                  │  - Handle error normalization
│                  │  - Never called directly
└────────┬─────────┘
         │ uses
         ▼
┌──────────────────┐
│   Axios Client   │  - Interceptors
│   (axios.ts)     │  - Auth token injection
│                  │  - Error handling
│                  │  - Request/response logging
└────────┬─────────┘
         │ makes HTTP request
         ▼
┌──────────────────┐
│  Backend API     │  REST endpoints
│  (Server)        │  Returns normalized errors
└──────────────────┘
```

## Layer Breakdown

### Layer 1: Components

**Responsibility**: Render UI, collect user input, show results

**What it does**:
- Calls custom hooks (useProductList, useCreateProduct, etc.)
- Handles user interactions
- Shows loading/error/success states

**What it does NOT do**:
- Call API directly
- Know about Axios, fetch, or HTTP
- Handle request/response formatting
- Know about endpoint URLs

**Example**:
```tsx
export function ProductList() {
  const { data: products, isPending, error } = useProductList();
  
  if (isPending) return <Loader />;
  if (error) return <ErrorMessage error={error} />;
  
  return products.map(p => <ProductCard key={p.id} {...p} />);
}
```

**Why**: Components shouldn't know about HTTP layer. If API changes, components don't change.

---

### Layer 2: Custom Hooks

**Responsibility**: Orchestrate data fetching and state management

**What it does**:
- Wraps React Query hooks
- Calls service layer methods
- Handles cache invalidation
- Configures retry logic, stale times, etc.

**What it does NOT do**:
- Make direct HTTP requests
- Know about Axios or HTTP details
- Handle business logic

**Example**:
```tsx
export function useCreateProduct() {
  const queryClient = useQueryClient();
  
  return usePostMutation<Product, CreateProductDTO>(
    (data) => productService.createProduct(data),
    {
      onSuccess: (newProduct) => {
        // Update cache
        queryClient.invalidateQueries({ queryKey: ['products'] });
        
        // Instant access to newly created product
        queryClient.setQueryData(['products', newProduct.id], newProduct);
      },
    }
  );
}
```

**Why**: 
- Centralizes cache management
- Makes retrying easy (React Query handles it)
- Enables optimistic updates
- Reusable across multiple components

---

### Layer 3: Service Layer

**Responsibility**: Centralize API logic per domain

**What it does**:
- Defines request/response types (DTOs, models)
- Centralizes endpoint URLs
- Adds domain-specific logic (filtering, sorting)
- Provides typed functions for each API operation

**What it does NOT do**:
- Know about React Query
- Make direct Axios calls
- Handle component state

**Example**:
```tsx
export const productService = {
  // GET /api/products
  getProducts: async (filters?: ProductFilter) => 
    get<ProductListResponse>('/products', { params: filters }),
  
  // POST /api/products
  createProduct: async (data: CreateProductDTO) =>
    post<Product, CreateProductDTO>('/products', data),
  
  // DELETE /api/products/{id}
  deleteProduct: async (id: string) =>
    deleteRequest<void>(`/products/${id}`),
};
```

**Why**:
- Endpoint URLs in one place (easy to change API path)
- Types defined per domain (Product, CreateProductDTO, etc.)
- Logic reusable by multiple hooks/components
- Easy to test (mock entire service)

---

### Layer 4: Request Functions

**Responsibility**: Generic HTTP operations with consistent error handling

**What it does**:
- Provides typed `get<T>()`, `post<T, D>()`, etc.
- Handles all HTTP error conversion to ApiError
- Retry logic at this level
- Request validation

**What it does NOT do**:
- Know about specific endpoints
- Have domain logic
- Know about React or React Query

**Example**:
```tsx
export async function get<T>(url: string, config?: RequestConfig): Promise<T> {
  try {
    const response = await apiClient.get(url, config);
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error; // Already normalized
    }
    throw new ApiError('Unexpected error', ApiErrorType.UNKNOWN_ERROR);
  }
}
```

**Why**:
- All API calls use same error handling
- No Axios called directly in components
- Type-safe: Never unsure about response shape
- Easy to add cross-cutting concerns (logging, analytics)

---

### Layer 5: Axios Instance

**Responsibility**: HTTP protocol implementation with interceptors

**What it does**:
- Creates HTTP requests
- Runs request interceptor: attaches auth token, adds headers
- Runs response interceptor: normalizes errors to ApiError
- Handles timeout, retries at protocol level
- Logs requests in development

**What it does NOT do**:
- Know about business logic
- Know about React

**Interceptors**:

**Request Interceptor**:
```tsx
// Before request
- Get auth token from storage
- Add Authorization header
- Add correlation ID for tracing
- Log in dev mode
```

**Response Interceptor**:
```tsx
// After response
- Convert HTTP errors to ApiError
- Map status codes to error types
- Handle auth errors (401)
- Log errors in dev mode
```

**Why**:
- Single point for auth token injection (components don't handle tokens)
- Consistent error normalization
- Easy to add logging, analytics, error tracking
- Handles timeouts and retries

---

### Layer 6: Error System

**Responsibility**: Normalize all errors into consistent structure

**Error Type Hierarchy**:
```
Network Errors:
  - NETWORK_ERROR: No response from server
  - TIMEOUT: Request took too long

Client Errors (4xx):
  - BAD_REQUEST (400): Invalid input
  - UNAUTHORIZED (401): Login required
  - FORBIDDEN (403): No permission
  - NOT_FOUND (404): Resource doesn't exist
  - CONFLICT (409): Resource conflict
  - UNPROCESSABLE_ENTITY (422): Validation failed
  - TOO_MANY_REQUESTS (429): Rate limited

Server Errors (5xx):
  - INTERNAL_SERVER_ERROR (500)
  - SERVICE_UNAVAILABLE (503)
  - BAD_GATEWAY (502)

Unknown:
  - UNKNOWN_ERROR
```

**ApiError properties**:
```tsx
class ApiError {
  type: ApiErrorType              // What kind of error
  statusCode: number              // HTTP status
  message: string                 // Technical message
  userMessage: string             // User-friendly message
  isRetryable: boolean            // Can we retry?
  isAuthError: boolean            // Requires re-login?
  validationErrors: Record<...>   // Form validation errors
  hasValidationErrors: boolean
}
```

**Why**:
- Components don't check "typeof error === string"
- Consistent error handling everywhere
- Form errors separated from HTTP errors
- Easy to determine if retry is safe
- User-friendly messages

---

## Key Design Decisions

### 1. No Direct Axios Calls in Components

**Decision**: Components never import or use Axios

**Reasoning**:
- If we switch from Axios to Fetch or other client, only one file changes
- Components remain testable without HTTP setup
- Clear separation of concerns
- Easier to add interceptors later

**Example of what NOT to do**:
```tsx
// ❌ DON'T DO THIS
import axios from 'axios';

export function ProductList() {
  const [products, setProducts] = useState([]);
  
  useEffect(() => {
    axios.get('/api/products').then(res => setProducts(res.data));
  }, []);
}
```

**Correct approach**:
```tsx
// ✅ DO THIS
import { useProductList } from '@/api/services/products';

export function ProductList() {
  const { data: products } = useProductList();
}
```

---

### 2. Service Layer Abstracts Endpoints

**Decision**: All endpoint URLs are in `services/` layer

**Reasoning**:
- API structure changes don't affect components
- Easy to find all uses of an endpoint (grep the service)
- Centralized place for endpoint documentation
- Easy to add endpoint-specific logic (caching, retry policies)

**Example**:
- API changed from `/api/v1/products` to `/api/v2/products`?
- Update in one place: `productService.getProducts()`
- All 50 components using it automatically work

---

### 3. React Query for Data Fetching

**Decision**: Use @tanstack/react-query instead of useState + useEffect

**Reasoning**:
- Automatic caching (huge performance boost)
- Background refetch on tab focus
- Deduplication (5 components request same data = 1 request)
- Built-in error/loading states
- Automatic retry logic
- Stale-while-revalidate pattern

**Comparison**:

```tsx
// Without React Query (❌ harder)
export function Products() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);
  
  // Manual cache management?
  // Manual refetch on focus?
  // Manual deduplication?
  // Prop drilling error state?
}

// With React Query (✅ easier)
export function Products() {
  const { data, loading, error } = useProductList();
  // All state management automatic
  // Caching, refetch, retry all included
}
```

---

### 4. Error Boundary for Render Errors

**Decision**: Wrap app with React Error Boundary

**Reasoning**:
- Catches component render errors
- Shows graceful fallback instead of white screen
- Separates render errors from HTTP errors
- Can send to error tracking service

**Errors caught**:
- Component render errors ✅
- Lifecycle method errors ✅

**Errors NOT caught** (use try-catch in handler):
- Async operations (timeouts, promises) ❌
- Event handlers ❌
- Server-side rendering ❌

**For HTTP errors**: Use hook error states + error boundaries for double protection

---

### 5. Generic Functions Over Specific Helpers

**Decision**: `get<T>()`, `post<T>()` instead of `getProduct()`, `postProduct()`

**Reasoning**:
- Request layer is reusable for all domains
- DRY principle (Don't Repeat Yourself)
- Consistent error handling everywhere
- Easy to maintain (1 place instead of 100)

**Hierarchy**:
```
Specific helpers (BAD - repetitive):
  getProduct() { return get<Product>('/products/{id}') }
  getSupplier() { return get<Supplier>('/suppliers/{id}') }
  getHospital() { return get<Hospital>('/hospitals/{id}') }
  ... repeat 50 times

Generic functions (GOOD - DRY):
  get<T>(url, config) // One implementation
  post<T, D>(url, data, config) // Used by all domains
```

---

## When to Use Each Layer

| Task | Use This | NOT This |
|------|----------|----------|
| Fetch data | `useProductList()` | `axios.get()` |
| Create item | `useCreateProduct()` | Direct service call |
| Show error | Error from hook | Direct error handling |
| Call API | Service method | Axios directly |
| Type API response | Service types | `any` |
| Handle auth | Interceptor | Per-component |
| Retry request | React Query built-in | Manual `await retry()` |
| Cache data | React Query | localStorage |

---

## File Organization

```
client/
├── api/
│   ├── axios.ts                 # Axios instance + interceptors
│   ├── errors.ts                # ApiError, error types
│   ├── requests.ts              # get<T>, post<T>, etc.
│   ├── hooks.ts                 # useGetQuery, useMutation, etc.
│   ├── queryClient.ts           # React Query configuration
│   ├── services/
│   │   ├── products.ts          # Product domain
│   │   ├── suppliers.ts         # Supplier domain
│   │   ├── hospitals.ts         # Hospital domain
│   │   └── ... (one per domain)
│   ├── USAGE_GUIDE.md           # How to use this layer
│   ├── ARCHITECTURE.md          # This file
│   └── EXAMPLE_COMPONENT.tsx    # Example product management
├── components/
│   └── ErrorBoundary.tsx        # Top-level error catcher
└── ...
```

---

## Adding a New Domain

**Step 1: Create service file** (`api/services/newdomain.ts`):
```tsx
export const newDomainService = {
  getAll: () => get<NewItem[]>('/new-domain'),
  getOne: (id: string) => get<NewItem>(`/new-domain/${id}`),
  create: (data) => post<NewItem>('/new-domain', data),
  update: (id, data) => patch<NewItem>(`/new-domain/${id}`, data),
  delete: (id) => deleteRequest<void>(`/new-domain/${id}`),
};

export function useNewDomainList() {
  return useGetQuery(['newDomain'], () => newDomainService.getAll());
}

export function useCreateNewDomain() {
  const queryClient = useQueryClient();
  return usePostMutation(
    (data) => newDomainService.create(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['newDomain'] });
      },
    }
  );
}
```

**Step 2: Use in component**:
```tsx
export function NewDomainList() {
  const { data: items, error, isPending } = useNewDomainList();
  const { mutate: create } = useCreateNewDomain();
  // Done!
}
```

---

## Performance Considerations

### Caching Strategy

**Default stale times** (configured in queryClient.ts):
- Most queries: 5 minutes fresh time
- Garbage collection: 10 minutes

**Override per-query**:
```tsx
useGetQuery(['products'], ..., {
  staleTime: 1000 * 60 * 60, // 1 hour for rarely-changing data
})
```

### Deduplication

React Query automatically deduplicates identical requests:
```tsx
// Only 1 request made (not 3)
const Component1 = () => useProductList(); // Request made
const Component2 = () => useProductList(); // Uses cache
const Component3 = () => useProductList(); // Uses cache
```

### Prefetching

Prefetch data before it's needed:
```tsx
const queryClient = useQueryClient();

const handleMouseEnter = (id) => {
  queryClient.prefetchQuery({
    queryKey: ['products', id],
    queryFn: () => productService.getProduct(id),
  });
};
```

---

## Security Considerations

### Token Handling

Tokens are injected automatically in the Axios interceptor:
```tsx
// In axios.ts request interceptor
const token = getAuthToken(); // From localStorage
if (token) {
  config.headers.Authorization = `Bearer ${token}`;
}
```

**Never pass tokens in**:
- URL query params (`?token=...`)
- localStorage with insecure flag
- Component props

**Safe approaches**:
- localStorage + HttpOnly cookies
- Session storage (cleared on tab close)
- Zustand store

### CORS & CSRF

- Backend should handle CORS headers
- Axios automatically includes credentials

### Sensitive Data

Never log sensitive data:
```tsx
// ❌ DON'T log passwords, tokens, etc.
if (import.meta.env.DEV) {
  console.log(config.data); // Could be sensitive
}

// ✅ DO log safely
if (import.meta.env.DEV) {
  console.log(`[API] ${config.method} ${config.url}`);
}
```

---

## Testing

### Unit Test Example

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

test('useProductList fetches and displays products', async () => {
  // Mock the service
  vi.mock('@/api/services/products', () => ({
    productService: {
      getProducts: vi.fn().mockResolvedValue({
        items: [{ id: '1', name: 'Widget' }],
        total: 1,
      }),
    },
  }));

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <ProductList />
    </QueryClientProvider>
  );

  await screen.findByText('Widget');
});
```

---

## Conclusion

This architecture provides:

✅ **Maintainability**: Each layer has single responsibility  
✅ **Scalability**: Add domains without changing core  
✅ **Testability**: Each layer independently testable  
✅ **Performance**: Built-in caching, deduplication, retry  
✅ **Type Safety**: Full TypeScript support  
✅ **Error Handling**: Consistent error handling everywhere  
✅ **Developer Experience**: Clear conventions, less boilerplate  

Start by copying the products service, adapting it for your domain, then use the hooks in components. Follow the same pattern for all new domains.
