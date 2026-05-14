import "./global.css";
import React, { Suspense, lazy, StrictMode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthProvider } from "@/context/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { queryClient } from "@/api/queryClient";
import { useAuthInitialize } from "@/hooks/useAuth";
import { AuthLoadingScreen } from "@/components/AuthLoadingScreen";
import { ProtectedRoute, PublicRoute } from "@/components/ProtectedRoute";
import { ClickSpark } from "@/components/effects/ClickSpark";

// Lazy-loaded components
const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const LoginPage = lazy(() => import("./pages/Login"));
const PurchaseOrderList = lazy(() => import("./pages/orders/PurchaseOrderList"));
const PurchaseOrderForm = lazy(() => import("./pages/orders/PurchaseOrderForm"));
const PurchaseOrderView = lazy(() => import("./pages/orders/PurchaseOrderView"));
const DeliveryChallanList = lazy(() => import("./pages/delivery/DeliveryChallanList"));
const InvoiceList = lazy(() => import("./pages/invoices/InvoiceList"));
const InvoiceDetailPage = lazy(() => import("./pages/invoices/InvoiceDetailPage"));
const ExpenseList = lazy(() => import("./pages/finance/ExpenseList"));
const IncomeList = lazy(() => import("./pages/finance/IncomeList"));
const PaymentList = lazy(() => import("./pages/finance/PaymentList"));
const BankAccountList = lazy(() => import("./pages/finance/BankAccountList"));
const AccountTransfersList = lazy(() => import("./pages/finance/AccountTransfersList"));
const Reports = lazy(() => import("./pages/reports/Reports"));
const ProductList = lazy(() => import("./pages/inventory/ProductList"));
const InventoryList = lazy(() => import("./pages/inventory/InventoryList"));
const SupplierList = lazy(() => import("./pages/suppliers/SupplierList"));
const SupplierDetails = lazy(() => import("./pages/suppliers/SupplierDetails"));
const HospitalList = lazy(() => import("./pages/hospitals/HospitalList"));
const HospitalDetails = lazy(() => import("./pages/hospitals/HospitalDetails"));
const ProductDetails = lazy(() => import("./pages/inventory/ProductDetails"));
const SupplyOrderList = lazy(() => import("./pages/supply/SupplyOrderList"));
const SupplyOrderForm = lazy(() => import("./pages/supply/SupplyOrderForm"));
const SupplyOrderView = lazy(() => import("./pages/supply/SupplyOrderView"));
const UsersPage = lazy(() => import("./pages/users/UsersPage"));
const ProductTypesList = lazy(() => import("./pages/settings/ProductTypesList"));
const UnitsList = lazy(() => import("./pages/settings/UnitsList"));
const ExpenseCategoriesList = lazy(() => import("./pages/settings/ExpenseCategoriesList"));
const IncomeCategoriesList = lazy(() => import("./pages/settings/IncomeCategoriesList"));
const TaxConfigurationList = lazy(() => import("./pages/settings/TaxConfigurationList"));
const SystemConfigurationPage = lazy(() => import("./pages/settings/SystemConfigurationPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));

/**
 * Loading Fallback for Suspense
 */
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
);

const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Routes - Require Authentication + Permissions */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />

      <Route
        path="/users"
        element={
          <ProtectedRoute module="users" permission="read">
            <MainLayout>
              <UsersPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/inventory">
        <Route
          index
          element={
            <ProtectedRoute module="inventory" permission="read">
              <MainLayout>
                <InventoryList />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route path="products">
          <Route
            index
            element={
              <ProtectedRoute module="products" permission="read">
                <MainLayout>
                  <ProductList />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path=":id"
            element={
              <ProtectedRoute module="products" permission="read">
                <MainLayout>
                  <ProductDetails />
                </MainLayout>
              </ProtectedRoute>
            }
          />
        </Route>
      </Route>
      <Route path="/suppliers">
        <Route
          index
          element={
            <ProtectedRoute module="suppliers" permission="read">
              <MainLayout>
                <SupplierList />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path=":id"
          element={
            <ProtectedRoute module="suppliers" permission="read">
              <MainLayout>
                <SupplierDetails />
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="/hospitals">
        <Route
          index
          element={
            <ProtectedRoute module="hospitals" permission="read">
              <MainLayout>
                <HospitalList />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path=":id"
          element={
            <ProtectedRoute module="hospitals" permission="read">
              <MainLayout>
                <HospitalDetails />
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="/supply-orders">
        <Route
          index
          element={
            <ProtectedRoute module="supplyOrders" permission="read">
              <MainLayout>
                <SupplyOrderList />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="create"
          element={
            <ProtectedRoute module="supplyOrders" permission="create">
              <MainLayout>
                <SupplyOrderForm />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="view/:id"
          element={
            <ProtectedRoute module="supplyOrders" permission="read">
              <MainLayout>
                <SupplyOrderView />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="edit/:id"
          element={
            <ProtectedRoute module="supplyOrders" permission="update">
              <MainLayout>
                <SupplyOrderForm />
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Route>
      <Route path="/orders/purchase">
        <Route
          index
          element={
            <ProtectedRoute module="purchaseOrders" permission="read">
              <MainLayout>
                <PurchaseOrderList />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="create"
          element={
            <ProtectedRoute module="purchaseOrders" permission="create">
              <MainLayout>
                <PurchaseOrderForm />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="view/:id"
          element={
            <ProtectedRoute module="purchaseOrders" permission="read">
              <MainLayout>
                <PurchaseOrderView />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="edit/:id"
          element={
            <ProtectedRoute module="purchaseOrders" permission="update">
              <MainLayout>
                <PurchaseOrderForm />
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Route>
      <Route
        path="/delivery"
        element={
          <ProtectedRoute module="deliveryChallans" permission="read">
            <MainLayout>
              <DeliveryChallanList />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices/:id"
        element={
          <ProtectedRoute module="invoices" permission="read">
            <MainLayout>
              <InvoiceDetailPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/invoices"
        element={
          <ProtectedRoute module="invoices" permission="read">
            <MainLayout>
              <InvoiceList />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/expenses"
        element={
          <ProtectedRoute module="expenses" permission="read">
            <MainLayout>
              <ExpenseList />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/incomes"
        element={
          <ProtectedRoute module="incomes" permission="read">
            <MainLayout>
              <IncomeList />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/payments"
        element={
          <ProtectedRoute module="payments" permission="read">
            <MainLayout>
              <PaymentList />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/accounts"
        element={
          <ProtectedRoute module="bankAccounts" permission="read">
            <MainLayout>
              <BankAccountList />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/finance/transfers"
        element={
          <ProtectedRoute module="transfers" permission="read">
            <MainLayout>
              <AccountTransfersList />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute module="reports" permission="read">
            <MainLayout>
              <Reports />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/product-types"
        element={
          <ProtectedRoute module="products" permission="read">
            <MainLayout>
              <ProductTypesList />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/units"
        element={
          <ProtectedRoute module="products" permission="read">
            <MainLayout>
              <UnitsList />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/expense-categories"
        element={
          <ProtectedRoute module="expenses" permission="read">
            <MainLayout>
              <ExpenseCategoriesList />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/income-categories"
        element={
          <ProtectedRoute module="incomeCategories" permission="read">
            <MainLayout>
              <IncomeCategoriesList />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/tax-configuration"
        element={
          <ProtectedRoute module="products" permission="read">
            <MainLayout>
              <TaxConfigurationList />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/system-configuration"
        element={
          <ProtectedRoute module="systemConfiguration" permission="read">
            <MainLayout>
              <SystemConfigurationPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      {/* Catch-all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

const AppContent = () => {
  const auth = useAuthInitialize();

  // Show loading screen while checking authentication
  if (!auth.isInitialized) {
    return <AuthLoadingScreen />;
  }

  return <AppRoutes />;
};

/**
 * Main App Component
 */
const App = () => (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      console.error("App error boundary caught:", error, errorInfo);
    }}
  >
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <ClickSpark />
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppContent />
            </BrowserRouter>
          </AuthProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
