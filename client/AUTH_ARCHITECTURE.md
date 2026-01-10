# Authentication & User Management Architecture

## Overview

This document describes the enterprise-grade authentication and user management system implementation. The architecture follows React Query and TypeScript best practices for production applications.

## Key Features

✅ **JWT Token-Based Authentication**
- Tokens stored in localStorage
- Automatic token injection in API requests
- Logout clears all sensitive data

✅ **App Startup Auth Check**
- Checks for valid token on app load
- Redirects to login if token missing/invalid
- Shows loading screen during auth verification

✅ **Protected Routes**
- Components wrapped with `ProtectedRoute` 
- Automatic redirect to login if not authenticated
- Role-based access control support

✅ **Complete User Management API**
- List users with server-side pagination
- Create, read, update, delete operations
- Search and filtering
- Role-based user filtering
- Change password functionality

✅ **Type-Safe Implementation**
- Full TypeScript coverage (no `any`)
- DTOs for all API requests/responses
- Enum for user roles with readable names

✅ **React Query Integration**
- Automatic caching and stale-while-revalidate
- Optimistic updates
- Background refetching
- Normalized error handling

## Architecture Diagram

```
User Browser
    ↓
  [Login Page] ← (No token or invalid token)
    ↓ (Submit credentials)
  [useLogin Hook]
    ↓ (Call mutation)
  [userService.login()]
    ↓ (HTTP POST)
  [Axios Instance] → [https://mds.vtoxi.com/api/Users/login]
    ↓ (Response + Token)
  [Store token in localStorage]
    ↓
  [setCurrentUser in Zustand store]
    ↓
  [useAuthActions updates auth state]
    ↓
  [Redirect to /dashboard]
    ↓
  [ProtectedRoute checks auth]
    ↓ (Token exists)
  [Dashboard Page]
    ↓ (Make API calls)
  [useGetUsers Hook]
    ↓ (Token auto-injected)
  [Axios Instance] → [https://mds.vtoxi.com/api/Users]
```

## Folder Structure

```
client/
├── api/
│   ├── axios.ts                    # Axios instance with interceptors
│   ├── errors.ts                   # Normalized error handling
│   ├── requests.ts                 # Generic GET, POST, PUT, DELETE
│   ├── hooks.ts                    # React Query hook utilities
│   ├── queryClient.ts              # React Query configuration
│   └── services/
│       └── users.service.ts        # User management API calls
├── types/
│   ├── enums.ts                    # UserRole enum and helpers
│   └── api/
│       └── users.ts                # Request/Response DTOs
├── hooks/
│   ├── useAuth.ts                  # Auth state & initialization
│   ├── useUsers.ts                 # React Query hooks for users
│   └── useStore.ts                 # Zustand store
├── context/
│   └── AuthContext.tsx             # Auth context & permissions
├── components/
│   ├── ProtectedRoute.tsx          # Route protection wrapper
│   ├── AuthLoadingScreen.tsx       # Loading indicator during auth check
│   └── ...
├── pages/
│   ├── Login.tsx                   # Login page component
│   ├── users/
│   │   └── UsersPage.tsx           # User management page
│   └── ...
└── App.tsx                         # Main app with routing
```

## Data Flow

### Authentication Flow

```
1. App Startup
   ├─ App.tsx renders
   ├─ useAuthInitialize() hook runs
   ├─ Checks localStorage for token
   ├─ If found, validates token
   ├─ If valid, restores user session
   ├─ Sets isInitialized = true
   └─ Hides AuthLoadingScreen

2. AppRoutes evaluates routes
   ├─ ProtectedRoute checks isAuthenticated
   ├─ If authenticated → render Dashboard
   └─ If not authenticated → redirect to /login

3. User visits /login
   ├─ PublicRoute checks if already authenticated
   ├─ If yes → redirect to dashboard
   ├─ If no → render LoginPage

4. User submits login form
   ├─ useLogin hook calls userService.login()
   ├─ Sends POST request to /api/Users/login
   ├─ API returns token + user data
   ├─ useAuthActions.login() stores token & user
   ├─ localStorage updated with token
   ├─ Zustand store updated with user
   ├─ Navigate to dashboard
   └─ useCheckAuth() now returns true

5. User navigates to protected page
   ├─ ProtectedRoute verifies authentication
   ├─ Token in localStorage = authenticated
   ├─ useGetUsers hook runs
   ├─ Axios interceptor adds Authorization header
   ├─ API call succeeds with user's data
   └─ Component renders with data
```

### User Management Data Flow

```
UsersPage Component
    ↓
useGetUsers(pagination) Hook
    ↓
React Query uses queryKey: ['users', 'list', pagination]
    ↓ (Checks cache)
If cached data exists (staleTime < 5min)
    ├─ Return cached data
    └─ Run background refetch
Else
    ├─ Call queryFn
    └─ userService.getAll(pagination)
        ├─ Build query string
        ├─ POST request to /api/Users
        ├─ Axios interceptor adds Authorization header
        ├─ API returns paginated list
        └─ React Query stores in cache
            ↓
        Display in component
            ↓
        useCreateUser Hook (mutations)
            ├─ User clicks "Add User"
            ├─ mutate(formData)
            ├─ userService.create(data)
            ├─ On success:
            │  ├─ Invalidate user lists cache
            │  ├─ Show success toast
            │  └─ Close dialog
            └─ On error:
               └─ Show error toast
```

## Type Safety

### Request DTOs (client → server)

```typescript
// Creating a user
const payload: CreateUserRequestDTO = {
  username: 'jdoe',
  fullName: 'John Doe',
  email: 'john@example.com',
  phoneNumber: '555-0123',
  password: 'Pass123!',
  role: UserRole.Manager // Type-safe enum
};

// Updating a user
const updatePayload: UpdateUserRequestDTO = {
  fullName: 'Jane Doe',
  email: 'jane@example.com',
  phoneNumber: '555-9876',
  role: UserRole.Manager,
  isActive: true,
  isLocked: false
};
```

### Response DTOs (server → client)

```typescript
// Single user response
const response: ApiResponseWrapperDTO<UserDTO> = {
  success: true,
  message: 'User created',
  data: {
    id: 1,
    username: 'jdoe',
    fullName: 'John Doe',
    email: 'john@example.com',
    phoneNumber: '555-0123',
    role: UserRole.Manager, // Numeric value
    lastLoginDate: '2025-01-10T...',
    isActive: true,
    isLocked: false
  },
  timestamp: '2025-01-10T...'
};

// Paginated list response
const listResponse: ApiResponseWrapperDTO<PaginatedListDTO<UserDTO>> = {
  success: true,
  message: 'Users retrieved',
  data: {
    items: [...],
    pageNumber: 1,
    pageSize: 10,
    totalCount: 45,
    totalPages: 5,
    hasPrevious: false,
    hasNext: true
  },
  timestamp: '2025-01-10T...'
};
```

## API Configuration

### Base URL

The API base URL is configured in `client/api/axios.ts`:

```typescript
const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://mds.vtoxi.com',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
};
```

To use a different base URL in development:

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:3000
```

### Token Management

Tokens are automatically:
- **Injected** in request headers via interceptor
- **Stored** in localStorage after login
- **Cleared** on logout or 401 response
- **Validated** on app startup

## Error Handling

### ApiError Class

All HTTP errors are normalized to `ApiError` instances:

```typescript
try {
  const user = await useGetUsers(...);
} catch (error) {
  if (error instanceof ApiError) {
    console.log(error.type);           // UNAUTHORIZED, BAD_REQUEST, etc.
    console.log(error.userMessage);    // User-friendly message
    console.log(error.validationErrors); // Field-level errors
    console.log(error.isRetryable);    // Should we retry?
    console.log(error.isAuthError);    // Should we redirect to login?
  }
}
```

### Component Error Handling

```typescript
const { data, error, isPending } = useGetUsers(params);

if (error) {
  return (
    <Alert variant="destructive">
      <AlertDescription>{error.userMessage}</AlertDescription>
    </Alert>
  );
}
```

## Security Considerations

### Token Storage

⚠️ **Current Implementation**: localStorage
- ✅ Simple, accessible across tabs
- ❌ Vulnerable to XSS attacks

### Production Recommendations

```typescript
// 1. Use HttpOnly Cookies (preferred)
// Set by server, automatically sent with requests
// Not accessible via JavaScript

// 2. Use sessionStorage instead of localStorage
// Cleared when browser tab closes
localStorage.setItem('authToken', token); // Current
sessionStorage.setItem('authToken', token); // Better

// 3. Add CSRF protection
// Include CSRF token in headers with state-changing requests

// 4. Implement token refresh
// Short-lived access tokens + long-lived refresh tokens
// Refresh token silently before expiration

// 5. Enable HTTPS everywhere
// All API calls must use HTTPS in production
```

## Common Patterns

### Pattern 1: Fetch Data with Loading State

```typescript
function UserProfile({ userId }: { userId: number }) {
  const { data: response, isPending, error } = useGetUserById(userId);
  const user = response?.data;

  if (isPending) return <Skeleton />;
  if (error) return <Error error={error} />;
  
  return <UserCard user={user} />;
}
```

### Pattern 2: Mutation with Optimistic Updates

```typescript
function UpdateUserForm({ userId }: { userId: number }) {
  const queryClient = useQueryClient();
  const { mutate, isPending } = useUpdateUser(userId, {
    onSuccess: () => {
      // Refetch to confirm server state
      queryClient.invalidateQueries({ queryKey: userKeys.detail(userId) });
      toast.success('Updated');
    },
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      mutate(formData);
    }}>
      ...
    </form>
  );
}
```

### Pattern 3: Role-Based Access Control

```typescript
function AdminPanel() {
  const user = useCurrentUser();

  if (!user || user.role !== UserRole.Admin) {
    return <Unauthorized />;
  }

  return <AdminContent />;
}

// Or with protected route:
<Route
  path="/admin/users"
  element={
    <ProtectedRoute requiredRole={UserRole.Admin}>
      <UserManagement />
    </ProtectedRoute>
  }
/>
```

### Pattern 4: Search and Pagination

```typescript
function UsersList() {
  const [filters, setFilters] = useState<GetUsersQueryParams>({
    pageNumber: 1,
    pageSize: 25,
    searchTerm: '',
    sortBy: 'fullName',
    sortDescending: false,
  });

  const { data: response } = useGetUsers(filters);
  const users = response?.data.items || [];

  return (
    <>
      <input
        placeholder="Search..."
        onChange={(e) =>
          setFilters({
            ...filters,
            searchTerm: e.target.value,
            pageNumber: 1 // Reset to first page
          })
        }
      />
      <table>
        {users.map(user => <tr key={user.id}>...</tr>)}
      </table>
      <button
        onClick={() => setFilters({ ...filters, pageNumber: filters.pageNumber + 1 })}
      >
        Next Page
      </button>
    </>
  );
}
```

## Testing

### Testing User Login

```typescript
describe('Login Flow', () => {
  it('should login and redirect to dashboard', async () => {
    // Mock the API
    vi.mock('@/api/services/users.service', () => ({
      userService: {
        login: vi.fn().mockResolvedValue({
          data: {
            userId: 1,
            username: 'admin',
            token: 'jwt_token'
          }
        })
      }
    }));

    // Render login page
    render(<LoginPage />);

    // Fill form
    await userEvent.type(screen.getByPlaceholderText(/username/i), 'admin');
    await userEvent.type(screen.getByPlaceholderText(/password/i), 'pass123');

    // Submit
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

    // Assert
    expect(localStorage.getItem('authToken')).toBe('jwt_token');
  });
});
```

### Testing Protected Route

```typescript
describe('ProtectedRoute', () => {
  it('should redirect to login if not authenticated', () => {
    // Mock useCheckAuth to return false
    vi.mock('@/hooks/useAuth', () => ({
      useCheckAuth: () => false
    }));

    // Try to access protected route
    render(
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    );

    // Should redirect to login
    expect(window.location.pathname).toBe('/login');
  });
});
```

## Extending the System

### Adding a New User Endpoint

1. **Add DTO in `types/api/users.ts`**:
```typescript
export interface GetUserStatsDTO {
  totalLogins: number;
  lastActivityDate: string;
}
```

2. **Add service method in `api/services/users.service.ts`**:
```typescript
async getUserStats(id: number): Promise<ApiResponseWrapperDTO<GetUserStatsDTO>> {
  return get<ApiResponseWrapperDTO<GetUserStatsDTO>>(`/api/Users/${id}/stats`);
}
```

3. **Add hook in `hooks/useUsers.ts`**:
```typescript
export function useGetUserStats(id: number) {
  return useQuery({
    queryKey: ['users', 'stats', id],
    queryFn: () => userService.getUserStats(id),
  });
}
```

4. **Use in component**:
```typescript
const { data } = useGetUserStats(userId);
```

### Adding Role-Based Feature Flags

```typescript
// In useAuth hook
const canEditUsers = useCallback(() => {
  return currentUser?.role === UserRole.Admin;
}, [currentUser]);

// In component
if (!canEditUsers()) {
  return <NoPermission />;
}
```

## Deployment

### Environment Variables

Create `.env.production`:

```
VITE_API_BASE_URL=https://api.yourdomain.com
```

Build for production:

```bash
pnpm build
pnpm start
```

## Troubleshooting

### Issue: Token not persisting across page refreshes

**Solution**: Ensure `useAuthInitialize()` is called in App.tsx and `isInitialized` is checked.

### Issue: 401 errors but token in localStorage

**Solution**: Token might be expired. Implement token refresh logic:
```typescript
// In axios.ts response interceptor
if (error.response?.status === 401) {
  // Attempt token refresh
  const newToken = await refreshToken();
  if (newToken) {
    return apiClient.request(config); // Retry with new token
  }
  handleAuthError(); // If refresh fails, logout
}
```

### Issue: React Query cache not updating after mutation

**Solution**: Ensure mutations invalidate correct query keys:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: userKeys.lists() });
}
```

---

## Summary

This authentication system provides:
- ✅ Enterprise-grade security (with production improvements)
- ✅ Type-safe implementation (100% TypeScript)
- ✅ Best practices (React Query, DTOs, error handling)
- ✅ Production-ready scalability
- ✅ Comprehensive user management
- ✅ Role-based access control

For questions or contributions, refer to the code comments and example implementations.
