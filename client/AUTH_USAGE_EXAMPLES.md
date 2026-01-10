# Authentication & User Management - Usage Examples

This guide provides practical examples of how to use the authentication and user management system in your components.

## Table of Contents

1. [Login & Logout](#login--logout)
2. [Checking Authentication](#checking-authentication)
3. [Fetching Users](#fetching-users)
4. [Creating Users](#creating-users)
5. [Updating Users](#updating-users)
6. [Deleting Users](#deleting-users)
7. [Role-Based Access](#role-based-access)
8. [Protected Routes](#protected-routes)
9. [Error Handling](#error-handling)
10. [Advanced Patterns](#advanced-patterns)

---

## Login & Logout

### Example 1: Login Page Form

```typescript
import { useLogin } from '@/hooks/useUsers';
import { useAuthActions } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export function LoginForm() {
  const navigate = useNavigate();
  const { login: storeLogin } = useAuthActions();
  const { mutate: login, isPending, error } = useLogin();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    login(
      { username, password },
      {
        onSuccess: (response) => {
          // Store token and user data
          storeLogin(response.data);
          // Redirect to dashboard
          navigate('/');
        },
        onError: (error) => {
          console.error('Login failed:', error.userMessage);
        }
      }
    );
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        disabled={isPending}
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        disabled={isPending}
      />
      {error && <div className="error">{error.userMessage}</div>}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
```

### Example 2: Logout Button

```typescript
import { useAuthActions } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export function LogoutButton() {
  const navigate = useNavigate();
  const { logout } = useAuthActions();

  const handleLogout = () => {
    logout(); // Clears token, user data, and React Query cache
    navigate('/login');
  };

  return <button onClick={handleLogout}>Logout</button>;
}
```

---

## Checking Authentication

### Example 1: Check if User is Authenticated

```typescript
import { useCheckAuth, useCurrentUser } from '@/hooks/useAuth';

export function UserHeader() {
  const isAuthenticated = useCheckAuth();
  const user = useCurrentUser();

  if (!isAuthenticated) {
    return <div>Not logged in</div>;
  }

  return (
    <div>
      <h1>Welcome, {user?.fullName}!</h1>
      <p>Role: {user?.role}</p>
    </div>
  );
}
```

### Example 2: Show Different Content Based on Auth Status

```typescript
import { useCheckAuth } from '@/hooks/useAuth';

export function Navigation() {
  const isAuthenticated = useCheckAuth();

  return (
    <nav>
      <a href="/">Home</a>
      {isAuthenticated ? (
        <>
          <a href="/users">Users</a>
          <a href="/profile">Profile</a>
          <a href="/logout">Logout</a>
        </>
      ) : (
        <a href="/login">Login</a>
      )}
    </nav>
  );
}
```

---

## Fetching Users

### Example 1: List All Users with Pagination

```typescript
import { useGetUsers } from '@/hooks/useUsers';
import { GetUsersQueryParams } from '@/types/api/users';
import { useState } from 'react';

export function UsersList() {
  const [params, setParams] = useState<GetUsersQueryParams>({
    pageNumber: 1,
    pageSize: 10,
  });

  const { data: response, isPending, error } = useGetUsers(params);
  const users = response?.data.items || [];
  const totalPages = response?.data.totalPages || 0;

  if (isPending) return <div>Loading...</div>;
  if (error) return <div>Error: {error.userMessage}</div>;

  return (
    <div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.fullName}</td>
              <td>{user.email}</td>
              <td>{user.role}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <button
        onClick={() => setParams({ ...params, pageNumber: params.pageNumber - 1 })}
        disabled={params.pageNumber === 1}
      >
        Previous
      </button>
      <span>Page {params.pageNumber} of {totalPages}</span>
      <button
        onClick={() => setParams({ ...params, pageNumber: params.pageNumber + 1 })}
        disabled={params.pageNumber >= totalPages}
      >
        Next
      </button>
    </div>
  );
}
```

### Example 2: Search Users

```typescript
import { useGetUsers } from '@/hooks/useUsers';
import { useState, useEffect } from 'react';

export function UserSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [params, setParams] = useState({
    pageNumber: 1,
    pageSize: 10,
    searchTerm: '',
  });

  // Update search with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setParams({ ...params, searchTerm, pageNumber: 1 });
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: response } = useGetUsers(params);
  const users = response?.data.items || [];

  return (
    <div>
      <input
        type="text"
        placeholder="Search users..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.fullName} ({user.email})</li>
        ))}
      </ul>
    </div>
  );
}
```

### Example 3: Get Single User Details

```typescript
import { useGetUserById } from '@/hooks/useUsers';
import { useParams } from 'react-router-dom';

export function UserDetail() {
  const { userId } = useParams<{ userId: string }>();
  const { data: response, isPending, error } = useGetUserById(parseInt(userId!));
  const user = response?.data;

  if (isPending) return <div>Loading...</div>;
  if (error) return <div>Error: {error.userMessage}</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div>
      <h1>{user.fullName}</h1>
      <p>Email: {user.email}</p>
      <p>Username: {user.username}</p>
      <p>Phone: {user.phoneNumber}</p>
      <p>Role: {user.role}</p>
      <p>Active: {user.isActive ? 'Yes' : 'No'}</p>
      <p>Locked: {user.isLocked ? 'Yes' : 'No'}</p>
      {user.lastLoginDate && (
        <p>Last Login: {new Date(user.lastLoginDate).toLocaleDateString()}</p>
      )}
    </div>
  );
}
```

### Example 4: Get Users by Role

```typescript
import { useGetUsersByRole } from '@/hooks/useUsers';
import { UserRole } from '@/types/enums';

export function ManagersList() {
  const { data: response, isPending } = useGetUsersByRole(UserRole.Manager);
  const managers = response?.data || [];

  if (isPending) return <div>Loading managers...</div>;

  return (
    <ul>
      {managers.map((manager) => (
        <li key={manager.id}>{manager.fullName}</li>
      ))}
    </ul>
  );
}
```

---

## Creating Users

### Example 1: Create User Form

```typescript
import { useCreateUser } from '@/hooks/useUsers';
import { CreateUserRequestDTO } from '@/types/api/users';
import { UserRole, getAvailableRoles } from '@/types/enums';
import { useState } from 'react';
import { toast } from 'sonner';

export function CreateUserForm() {
  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: UserRole.Sales,
  });

  const { mutate: createUser, isPending, error } = useCreateUser({
    onSuccess: () => {
      toast.success('User created successfully');
      // Reset form
      setFormData({
        username: '',
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        role: UserRole.Sales,
      });
    },
    onError: (error) => {
      toast.error(error.userMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUser(formData as CreateUserRequestDTO);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error.userMessage}</div>}

      <input
        type="text"
        placeholder="Username"
        value={formData.username}
        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        required
        disabled={isPending}
      />

      <input
        type="text"
        placeholder="Full Name"
        value={formData.fullName}
        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
        required
        disabled={isPending}
      />

      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        required
        disabled={isPending}
      />

      <input
        type="tel"
        placeholder="Phone Number"
        value={formData.phoneNumber}
        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
        disabled={isPending}
      />

      <input
        type="password"
        placeholder="Password"
        value={formData.password}
        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        required
        disabled={isPending}
      />

      <select
        value={formData.role}
        onChange={(e) => setFormData({ ...formData, role: parseInt(e.target.value) as UserRole })}
        disabled={isPending}
      >
        {getAvailableRoles().map((role) => (
          <option key={role.value} value={role.value}>
            {role.label}
          </option>
        ))}
      </select>

      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create User'}
      </button>
    </form>
  );
}
```

---

## Updating Users

### Example 1: Edit User Form

```typescript
import { useUpdateUser } from '@/hooks/useUsers';
import { UpdateUserRequestDTO } from '@/types/api/users';
import { UserDTO } from '@/types/api/users';
import { useState } from 'react';
import { toast } from 'sonner';

interface EditUserFormProps {
  user: UserDTO;
  onClose: () => void;
}

export function EditUserForm({ user, onClose }: EditUserFormProps) {
  const [formData, setFormData] = useState({
    fullName: user.fullName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    isActive: user.isActive,
    isLocked: user.isLocked,
  });

  const { mutate: updateUser, isPending, error } = useUpdateUser(user.id, {
    onSuccess: () => {
      toast.success('User updated successfully');
      onClose();
    },
    onError: (error) => {
      toast.error(error.userMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser(formData as UpdateUserRequestDTO);
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error.userMessage}</div>}

      <input
        type="text"
        placeholder="Full Name"
        value={formData.fullName}
        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
        disabled={isPending}
      />

      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        disabled={isPending}
      />

      <input
        type="tel"
        placeholder="Phone Number"
        value={formData.phoneNumber}
        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
        disabled={isPending}
      />

      <label>
        <input
          type="checkbox"
          checked={formData.isActive}
          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          disabled={isPending}
        />
        Active
      </label>

      <label>
        <input
          type="checkbox"
          checked={formData.isLocked}
          onChange={(e) => setFormData({ ...formData, isLocked: e.target.checked })}
          disabled={isPending}
        />
        Locked
      </label>

      <button type="submit" disabled={isPending}>
        {isPending ? 'Updating...' : 'Update User'}
      </button>
      <button type="button" onClick={onClose} disabled={isPending}>
        Cancel
      </button>
    </form>
  );
}
```

---

## Deleting Users

### Example 1: Delete User with Confirmation

```typescript
import { useDeleteUser } from '@/hooks/useUsers';
import { UserDTO } from '@/types/api/users';
import { toast } from 'sonner';

interface DeleteUserButtonProps {
  user: UserDTO;
  onSuccess?: () => void;
}

export function DeleteUserButton({ user, onSuccess }: DeleteUserButtonProps) {
  const { mutate: deleteUser, isPending } = useDeleteUser(user.id, {
    onSuccess: () => {
      toast.success('User deleted successfully');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.userMessage);
    },
  });

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete ${user.fullName}?`)) {
      deleteUser();
    }
  };

  return (
    <button onClick={handleDelete} disabled={isPending} className="danger">
      {isPending ? 'Deleting...' : 'Delete'}
    </button>
  );
}
```

---

## Role-Based Access

### Example 1: Show Content Only for Admins

```typescript
import { useCurrentUser } from '@/hooks/useAuth';
import { UserRole } from '@/types/enums';

export function AdminPanel() {
  const user = useCurrentUser();
  const isAdmin = user?.role === UserRole.Admin;

  if (!isAdmin) {
    return <div>You do not have permission to access this page</div>;
  }

  return (
    <div>
      <h1>Admin Panel</h1>
      <p>Only admins can see this</p>
    </div>
  );
}
```

### Example 2: Conditional Buttons Based on Role

```typescript
import { useCurrentUser } from '@/hooks/useAuth';
import { UserRole } from '@/types/enums';

export function UserActions({ userId }: { userId: number }) {
  const currentUser = useCurrentUser();
  const isAdmin = currentUser?.role === UserRole.Admin;

  return (
    <div>
      <button>View Details</button>
      {isAdmin && <button>Edit User</button>}
      {isAdmin && <button>Delete User</button>}
    </div>
  );
}
```

---

## Protected Routes

### Example 1: Protect a Route

```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

### Example 2: Admin-Only Route

```typescript
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { UserRole } from '@/types/enums';
import { AdminPanel } from './pages/AdminPanel';

export function AdminRoute() {
  return (
    <ProtectedRoute requiredRole={UserRole.Admin}>
      <AdminPanel />
    </ProtectedRoute>
  );
}
```

---

## Error Handling

### Example 1: Display Validation Errors

```typescript
import { useCreateUser } from '@/hooks/useUsers';
import { ApiError } from '@/api/errors';
import { useState } from 'react';

export function UserFormWithValidation() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { mutate: createUser, error } = useCreateUser({
    onError: (error: ApiError) => {
      if (error.hasValidationErrors) {
        // Extract field-level errors
        const errors: Record<string, string> = {};
        Object.entries(error.validationErrors).forEach(([field, messages]) => {
          errors[field] = Array.isArray(messages) ? messages[0] : messages;
        });
        setFieldErrors(errors);
      }
    },
  });

  return (
    <form>
      <input
        type="text"
        placeholder="Username"
        onChange={(e) => {
          // Clear error when user starts typing
          setFieldErrors({ ...fieldErrors, username: '' });
        }}
      />
      {fieldErrors.username && <span className="error">{fieldErrors.username}</span>}
      {/* ... more fields ... */}
    </form>
  );
}
```

### Example 2: Retry Failed Requests

```typescript
import { useGetUsers } from '@/hooks/useUsers';
import { Button } from '@/components/ui/button';

export function UsersListWithRetry() {
  const { data, error, refetch } = useGetUsers({
    pageNumber: 1,
    pageSize: 10,
  });

  if (error) {
    return (
      <div>
        <p>Error: {error.userMessage}</p>
        {error.isRetryable && (
          <Button onClick={() => refetch()}>Retry</Button>
        )}
      </div>
    );
  }

  return <div>Users list...</div>;
}
```

---

## Advanced Patterns

### Example 1: Cache Invalidation After Mutation

```typescript
import { useCreateUser, userKeys } from "@/hooks/useUsers";
import { useQueryClient } from "@tanstack/react-query";

export function CreateUserWithCacheUpdate() {
  const queryClient = useQueryClient();
  const { mutate } = useCreateUser({
    onSuccess: () => {
      // Invalidate user lists to refetch
      queryClient.invalidateQueries({
        queryKey: userKeys.lists(),
      });

      // Also invalidate users by role if needed
      queryClient.invalidateQueries({
        queryKey: userKeys.byRole(2), // Manager role
      });
    },
  });

  // ...
}
```

### Example 2: Prefetch User Data on Hover

```typescript
import { useGetUserById, userKeys } from '@/hooks/useUsers';
import { useQueryClient } from '@tanstack/react-query';

export function UserLink({ userId }: { userId: number }) {
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    // Prefetch user data before user clicks
    queryClient.prefetchQuery({
      queryKey: userKeys.detail(userId),
      queryFn: () => fetch(`/api/Users/${userId}`).then(r => r.json()),
    });
  };

  return (
    <a onMouseEnter={handleMouseEnter} href={`/users/${userId}`}>
      View User
    </a>
  );
}
```

### Example 3: Change Password

```typescript
import { useChangePassword } from '@/hooks/useUsers';
import { useState } from 'react';
import { toast } from 'sonner';

export function ChangePasswordForm({ userId }: { userId: number }) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const { mutate: changePassword, isPending, error } = useChangePassword(userId, {
    onSuccess: () => {
      toast.success('Password changed successfully');
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (error) => {
      toast.error(error.userMessage);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    changePassword({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error.userMessage}</div>}

      <input
        type="password"
        placeholder="Current Password"
        value={formData.currentPassword}
        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
        disabled={isPending}
        required
      />

      <input
        type="password"
        placeholder="New Password"
        value={formData.newPassword}
        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
        disabled={isPending}
        required
      />

      <input
        type="password"
        placeholder="Confirm New Password"
        value={formData.confirmPassword}
        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
        disabled={isPending}
        required
      />

      <button type="submit" disabled={isPending}>
        {isPending ? 'Changing...' : 'Change Password'}
      </button>
    </form>
  );
}
```

---

## Summary

These examples cover the most common use cases. For more details, refer to:

- `client/AUTH_ARCHITECTURE.md` - System architecture and design
- Component source code - Full implementation details
- Hook implementations - Advanced patterns and configuration

Remember:

- Always use hooks, never call services directly
- Handle errors properly in your UI
- Show loading states to users
- Invalidate cache after mutations
- Use ProtectedRoute for security
