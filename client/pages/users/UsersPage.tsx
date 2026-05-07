/**
 * Users Management Page
 *
 * Comprehensive user management interface with:
 * - List all users with pagination, search, and filtering
 * - Create new users
 * - Edit existing users
 * - Delete users
 * - View user details
 * - Role-based access control
 *
 * Data Flow:
 * useGetUsers (hook) → userService.getAll (API) → https://mds.vtoxi.com/api/Users
 */

import React, { useState, useCallback } from "react";
import {
  useGetUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
} from "@/hooks/useUsers";
import { useAuthActions } from "@/hooks/useAuth";
import {
  UserDTO,
  CreateUserRequestDTO,
  UpdateUserRequestDTO,
  GetUsersQueryParams,
} from "@/types/api/users";
import { UserRole, roleNames, getAvailableRoles } from "@/types/enums";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { EnumSelect } from "@/components/ui/enum-select";
import { useUserRoleOptions } from "@/hooks/dropdown";
import { toast } from "sonner";
import {
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Form Dialog Component
 * Reusable dialog for creating and editing users
 */
interface UserFormDialogProps {
  open: boolean;
  user?: UserDTO;
  onClose: () => void;
  onSubmit: (
    data: CreateUserRequestDTO | UpdateUserRequestDTO,
  ) => Promise<void>;
  isLoading: boolean;
  error?: Error | null;
}

function UserFormDialog({
  open,
  user,
  onClose,
  onSubmit,
  isLoading,
  error,
}: UserFormDialogProps) {
  const isEditing = !!user;
  const { data: userRoleOptions, isLoading: isLoadingUserRoles } = useUserRoleOptions();
  const [formData, setFormData] = useState<any>({
    username: user?.username || "",
    fullName: user?.fullName || "",
    email: user?.email || "",
    phoneNumber: user?.phoneNumber || "",
    password: "",
    role: user?.role || UserRole.Sales,
    isActive: user?.isActive ?? true,
    isLocked: user?.isLocked ?? false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const submitData = isEditing
      ? {
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          role: formData.role,
          isActive: formData.isActive,
          isLocked: formData.isLocked,
        }
      : {
          username: formData.username,
          fullName: formData.fullName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          password: formData.password,
          role: formData.role,
        };

    await onSubmit(submitData as any);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit User" : "Create New User"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update user information"
              : "Add a new user to the system"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>{error.message}</div>
            </div>
          )}

          {/* Username Field */}
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                placeholder="johndoe"
                disabled={isLoading}
                required
              />
            </div>
          )}

          {/* Full Name Field */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name *</Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              placeholder="John Doe"
              disabled={isLoading}
              required
            />
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="john@example.com"
              disabled={isLoading}
              required
            />
          </div>

          {/* Phone Number Field */}
          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              placeholder="+1 (555) 123-4567"
              disabled={isLoading}
            />
          </div>

          {/* Password Field (only on create) */}
          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="••••••••"
                disabled={isLoading}
                required
              />
            </div>
          )}

          {/* Role Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="role">Role *</Label>
            <EnumSelect
              items={userRoleOptions}
              value={formData.role}
              onValueChange={(value) =>
                setFormData({ ...formData, role: value })
              }
              isLoading={isLoadingUserRoles}
              disabled={isLoading}
              placeholder="Select role"
              searchPlaceholder="Search roles..."
            />
          </div>

          {/* Status Fields (only on edit) */}
          {isEditing && (
            <>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: checked })
                    }
                    disabled={isLoading}
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    Active
                  </Label>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isLocked"
                    checked={formData.isLocked}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isLocked: checked })
                    }
                    disabled={isLoading}
                  />
                  <Label htmlFor="isLocked" className="cursor-pointer">
                    Locked
                  </Label>
                </div>
              </div>
            </>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? "Update User" : "Create User"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/**
 * UsersPage Component
 */
export default function UsersPage() {
  const [pagination, setPagination] = useState<GetUsersQueryParams>({
    pageNumber: 1,
    pageSize: 10,
    searchTerm: "",
  });

  const [selectedUser, setSelectedUser] = useState<UserDTO | undefined>();
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserDTO | null>(null);

  // Fetch users
  const {
    data: response,
    isPending: isLoadingUsers,
    error: fetchError,
  } = useGetUsers(pagination);
  const users = response?.data.items || [];
  const totalCount = response?.data.totalCount || 0;
  const totalPages = response?.data.totalPages || 0;

  // Mutations
  const { mutate: createUser, isPending: isCreating } = useCreateUser({
    onSuccess: () => {
      toast.success("User created successfully");
      setFormDialogOpen(false);
      setSelectedUser(undefined);
    },
    onError: (error) => {
      toast.error(error.userMessage);
    },
  });

  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser(
    selectedUser?.id || 0,
    {
      onSuccess: () => {
        toast.success("User updated successfully");
        setFormDialogOpen(false);
        setSelectedUser(undefined);
      },
      onError: (error) => {
        toast.error(error.userMessage);
      },
    },
  );

  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser(
    userToDelete?.id || 0,
    {
      onSuccess: () => {
        toast.success("User deleted successfully");
        setDeleteDialogOpen(false);
        setUserToDelete(null);
      },
      onError: (error) => {
        toast.error(error.userMessage);
      },
    },
  );

  const handleCreateClick = () => {
    setSelectedUser(undefined);
    setFormDialogOpen(true);
  };

  const handleEditClick = (user: UserDTO) => {
    setSelectedUser(user);
    setFormDialogOpen(true);
  };

  const handleDeleteClick = (user: UserDTO) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (
    data: CreateUserRequestDTO | UpdateUserRequestDTO,
  ) => {
    if (selectedUser) {
      updateUser(data as UpdateUserRequestDTO);
    } else {
      createUser(data as CreateUserRequestDTO);
    }
  };

  const handleConfirmDelete = () => {
    if (userToDelete) {
      deleteUser();
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground mt-1">
            Manage system users and their roles
          </p>
        </div>
        <Button onClick={handleCreateClick} className="gap-2">
          <Plus className="h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Search Card */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or username..."
                value={pagination.searchTerm || ""}
                onChange={(e) =>
                  setPagination({
                    ...pagination,
                    searchTerm: e.target.value,
                    pageNumber: 1,
                  })
                }
                className="pl-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            Showing {users.length} of {totalCount} users
          </CardDescription>
        </CardHeader>

        <CardContent>
          {fetchError && (
            <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive mb-4 flex gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>{fetchError.userMessage}</div>
            </div>
          )}

          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-sm">
                        {user.username}
                      </TableCell>
                      <TableCell>{user.fullName}</TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{roleNames[user.role]}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {user.isActive ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                          {user.isLocked && (
                            <Badge variant="destructive">Locked</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.lastLoginDate
                          ? new Date(user.lastLoginDate).toLocaleDateString()
                          : "Never"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditClick(user)}
                            className="gap-1"
                          >
                            <Pencil className="h-4 w-4" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteClick(user)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="border-t px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Page {pagination.pageNumber} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination({
                    ...pagination,
                    pageNumber: pagination.pageNumber - 1,
                  })
                }
                disabled={pagination.pageNumber === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setPagination({
                    ...pagination,
                    pageNumber: pagination.pageNumber + 1,
                  })
                }
                disabled={pagination.pageNumber >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* User Form Dialog */}
      <UserFormDialog
        open={formDialogOpen}
        user={selectedUser}
        onClose={() => {
          setFormDialogOpen(false);
          setSelectedUser(undefined);
        }}
        onSubmit={handleFormSubmit}
        isLoading={isCreating || isUpdating}
        error={null}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{userToDelete?.fullName}</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogContent className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogContent>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
