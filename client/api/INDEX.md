# API Layer - File Index

This document provides a quick reference to all files in the HTTP layer and their purposes.

## Core Files

### `axios.ts` (227 lines)
**Purpose**: Centralized Axios instance with interceptors

**Contains**:
- Axios instance creation with base URL and timeout
- Request interceptor: token injection, correlation IDs, logging
- Response interceptor: error normalization, auth handling
- Helper functions: getAuthToken(), handleAuthError(), generateRequestId()

**Import**: `import { apiClient } from '@/api/axios'`

**When to use**: Never directly. Use through request functions.

**When to modify**: 
- Change API base URL
- Add custom headers
- Implement token refresh
- Add error tracking

---

### `errors.ts` (167 lines)
**Purpose**: Error type definitions and normalization

**Contains**:
- `ApiErrorType` enum (13 error types)
- `ApiError` class with properties:
  - `type`, `statusCode`, `message`
  - `userMessage` - user-friendly text
  - `validationErrors` - form field errors
  - `isRetryable`, `isAuthError` - boolean helpers
- Type guards: `isApiError()`, `isRetryableError()`, `isAuthError()`

**Import**: `import { ApiError, ApiErrorType, isApiError } from '@/api/errors'`

**When to use**: Error handling, type guards, form error display

**Example**:
```tsx
if (isApiError(error)) {
  if (error.hasValidationErrors) {
    // Show form errors
  }
}
```

---

### `requests.ts` (199 lines)
**Purpose**: Generic HTTP request functions (GET, POST, PUT, PATCH, DELETE)

**Contains**:
- `get<T>(url, config?)` - GET request
- `post<T, D>(url, data?, config?)` - POST request
- `put<T, D>(url, data?, config?)` - PUT request
- `patch<T, D>(url, data?, config?)` - PATCH request
- `deleteRequest<T>(url, config?)` - DELETE request
- `createRequest<T>(config)` - Factory for custom requests

**Import**: `import { get, post, put, patch, deleteRequest } from '@/api/requests'`

**When to use**: In service layer, never in components

**Example**:
```tsx
export const productService = {
  getProducts: () => get<Product[]>('/products'),
  createProduct: (data) => post<Product>('/products', data),
};
```

---

### `hooks.ts` (307 lines)
**Purpose**: Custom React Query hooks for queries and mutations

**Contains**:
- `useGetQuery<T>()` - Fetch data with caching
- `usePostMutation<T, D>()` - Create operation
- `usePutMutation<T, D>()` - Full update operation
- `usePatchMutation<T, D>()` - Partial update operation
- `useDeleteMutation<T>()` - Delete operation
- `useInfiniteGetQuery<T>()` - Infinite pagination

**Import**: `import { useGetQuery, usePostMutation, ... } from '@/api/hooks'`

**When to use**: In custom domain hooks (products, suppliers, etc.)

**Example**:
```tsx
export function useProductList() {
  return useGetQuery(
    ['products'],
    () => productService.getProducts()
  );
}
```

---

### `queryClient.ts` (101 lines)
**Purpose**: React Query client configuration

**Contains**:
- `queryClient` instance with defaults
- Default stale time: 5 minutes
- Default GC time: 10 minutes
- Default retry: 3 attempts
- `setupErrorLogger()` - Optional error tracking
- `setupSuccessLogger()` - Optional analytics

**Import**: `import { queryClient } from '@/api/queryClient'`

**When to use**: In App.tsx (already done)

**When to modify**: 
- Change default cache times
- Add error tracking
- Add analytics

---

## Service Layer

### `services/products.ts` (317 lines)
**Purpose**: Product domain API and hooks (EXAMPLE)

**Contains**:
- Types: `Product`, `CreateProductDTO`, `UpdateProductDTO`, `ProductListResponse`, `ProductFilter`
- Service: `productService` with all CRUD methods
- Hooks: `useProductList()`, `useCreateProduct()`, `useDeleteProduct()`, etc.

**Import**: `import { useProductList, useCreateProduct, ... } from '@/api/services/products'`

**When to use**: In product pages and components

**Pattern to follow**: Copy this file, adapt for new domain

---

## Components

### `ErrorBoundary.tsx` (186 lines)
**Purpose**: React error boundary for rendering errors

**Contains**:
- `ErrorBoundary` class component
- Catches component render errors
- Shows graceful fallback UI
- Displays error details in dev mode
- Extensible error handler callback

**Import**: `import ErrorBoundary from '@/components/ErrorBoundary'`

**When to use**: Wrap app or major sections

**In App.tsx**:
```tsx
<ErrorBoundary onError={(error, info) => {
  // Optional: send to error tracking
}}>
  <QueryClientProvider>
    {/* App routes */}
  </QueryClientProvider>
</ErrorBoundary>
```

---

## Documentation

### `README.md` (468 lines)
**Purpose**: Main documentation and overview

**Contains**:
- What's included
- Quick start (5 minutes)
- Architecture overview
- Key features
- Common patterns
- File structure
- Migration guide
- Token handling
- Error tracking setup
- Support guide

**When to read**: First thing! Start here.

---

### `QUICK_REFERENCE.md` (521 lines)
**Purpose**: 2-minute cheat sheet for common operations

**Contains**:
- 30-second setup
- Common operations (CRUD)
- Error handling
- Hook reference table
- Request functions
- QueryClient utilities
- API error types
- Creating new service template
- Common patterns
- Testing examples
- Performance tips
- Troubleshooting table

**When to use**: While coding, quick lookup

**Time to read**: 5 minutes

---

### `USAGE_GUIDE.md` (536 lines)
**Purpose**: Comprehensive guide with patterns and examples

**Contains**:
- Quick start setup
- Creating service layer
- Creating custom hooks
- Using in components
- 6 common patterns with code examples
- Error handling strategies
- Advanced topics (prefetching, pagination, infinite scroll)
- Form mutations with validation
- Error boundary setup
- Toast notifications
- Custom request configuration
- Request cancellation
- Request logging
- Adding custom headers
- Migration guide from old API client
- Performance tips
- Testing examples
- Troubleshooting

**When to read**: Learning new patterns, specific use cases

**Time to read**: 15-20 minutes

---

### `ARCHITECTURE.md` (669 lines)
**Purpose**: Deep dive into architecture and design decisions

**Contains**:
- Complete data flow diagram
- 6-layer breakdown with examples
  - Components
  - Custom hooks
  - Service layer
  - Request functions
  - Axios instance
  - Error system
- Key design decisions (6 major decisions explained)
- When to use each layer (decision table)
- File organization
- Adding new domain (step-by-step)
- Performance considerations (caching, deduplication, prefetching)
- Security considerations
- Testing examples
- Conclusion

**When to read**: Understanding why it's designed this way

**Time to read**: 20-30 minutes

---

### `EXAMPLE_COMPONENT.tsx` (491 lines)
**Purpose**: Full working example component

**Contains**:
- ProductManagement component with all operations
- Features:
  - List with search and pagination
  - Create dialog with form
  - Edit/delete buttons
  - Error handling
  - Loading states
  - Form validation
  - Optimistic updates
  - Cache invalidation
- Sub-components:
  - ProductRow
  - CreateProductForm

**When to use**: Copy and adapt for new domain

**Time to adapt**: 10-15 minutes per domain

---

## Quick Navigation

### "I want to..."

| Task | Go To | Time |
|------|-------|------|
| Start now | `README.md` | 5 min |
| Copy template | `EXAMPLE_COMPONENT.tsx` | 10 min |
| Find syntax | `QUICK_REFERENCE.md` | 2 min |
| Learn patterns | `USAGE_GUIDE.md` patterns | 15 min |
| Understand design | `ARCHITECTURE.md` | 30 min |
| Handle errors | `errors.ts` + `USAGE_GUIDE.md` | 10 min |
| Create service | `services/products.ts` template | 10 min |
| Test component | `QUICK_REFERENCE.md` testing | 5 min |
| Setup auth | `axios.ts` + `README.md` auth | 10 min |
| Debug | `QUICK_REFERENCE.md` debugging | 5 min |

---

## Import Paths

### Use these imports in your files:

```tsx
// From axios
import { apiClient } from '@/api/axios';

// From errors
import { ApiError, ApiErrorType, isApiError } from '@/api/errors';

// From requests
import { get, post, put, patch, deleteRequest } from '@/api/requests';

// From hooks
import { useGetQuery, usePostMutation, ... } from '@/api/hooks';

// From queryClient
import { queryClient } from '@/api/queryClient';

// From service (example)
import { useProductList, useCreateProduct, ... } from '@/api/services/products';

// From error boundary
import ErrorBoundary from '@/components/ErrorBoundary';

// From React Query (for cache management)
import { useQueryClient } from '@tanstack/react-query';
```

---

## File Creation Workflow

### When creating a new domain:

1. **Create `api/services/yourservice.ts`**
   - Copy template from `services/products.ts`
   - Define types: `YourItem`, `CreateDTO`, `UpdateDTO`
   - Create service with all methods
   - Create hooks for each operation

2. **Use in components**
   - Import hooks from service
   - Call hooks (never call API directly)
   - Handle error/loading states
   - Show user-friendly error messages

3. **Reference documentation as needed**
   - `QUICK_REFERENCE.md` for syntax
   - `USAGE_GUIDE.md` for patterns
   - `ARCHITECTURE.md` for understanding

---

## Total Lines of Code

| File | Lines | Purpose |
|------|-------|---------|
| axios.ts | 227 | HTTP client |
| errors.ts | 167 | Error handling |
| requests.ts | 199 | HTTP methods |
| hooks.ts | 307 | React Query |
| queryClient.ts | 101 | RQ config |
| ErrorBoundary.tsx | 186 | Error boundary |
| services/products.ts | 317 | Example service |
| **TOTAL CODE** | **1,504** | **Production ready** |
| README.md | 468 | Documentation |
| QUICK_REFERENCE.md | 521 | Cheat sheet |
| USAGE_GUIDE.md | 536 | Patterns |
| ARCHITECTURE.md | 669 | Design |
| EXAMPLE_COMPONENT.tsx | 491 | Example |
| **TOTAL DOCS** | **2,685** | **Comprehensive** |

---

## What's NOT in this layer

❌ Business logic (e.g., calculating totals)  
❌ UI state (use component state or Zustand)  
❌ Routing (use React Router)  
❌ Form handling (use React Hook Form)  
❌ Authentication logic (implement separately)  
❌ Authorization checks (implement separately)  

**These belong in other layers, not the HTTP layer.**

---

## Getting Help

1. **Syntax question?** → `QUICK_REFERENCE.md`
2. **Pattern question?** → `USAGE_GUIDE.md`
3. **Design question?** → `ARCHITECTURE.md`
4. **Implementation question?** → `EXAMPLE_COMPONENT.tsx`
5. **Still stuck?** → Check the example and pattern that's closest to your need

---

**Last Updated**: 2025  
**Status**: Complete and Production Ready ✅
