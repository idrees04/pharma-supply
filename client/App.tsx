import "./global.css";
import React, { Suspense, lazy, StrictMode } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";

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
const PurchaseOrderPrintPage = lazy(() => import("./pages/orders/PurchaseOrderPrintPage"));
const DeliveryChallanList = lazy(() => import("./pages/delivery/DeliveryChallanList"));
const InvoiceList = lazy(() => import("./pages/invoices/InvoiceList"));
const InvoiceDetailPage = lazy(() => import("./pages/invoices/InvoiceDetailPage"));
const ExpenseList = lazy(() => import("./pages/finance/ExpenseList"));
const IncomeList = lazy(() => import("./pages/finance/IncomeList"));
const PaymentList = lazy(() => import("./pages/finance/PaymentList"));
const BankAccountList = lazy(() => import("./pages/finance/BankAccountList"));
const AccountTransfersList = lazy(() => import("./pages/finance/AccountTransfersList"));
const Reports = lazy(() => import("./pages/reports/Reports"));
const VendorLedgerReport = lazy(() => import("./pages/reports/VendorLedgerReport"));
const HospitalLedgerReport = lazy(() => import("./pages/reports/HospitalLedgerReport"));
const ProductList = lazy(() => import("./pages/inventory/ProductList"));
const InventoryList = lazy(() => import("./pages/inventory/InventoryList"));
const StockLedgerPage = lazy(() => import("./pages/inventory/StockLedgerPage"));
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


      <Route
        element={
          <ProtectedRoute>
            <MainLayout>
              <Suspense fallback={<PageLoader />}>
                <Outlet />
              </Suspense>
            </MainLayout>
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />

        <Route
          path="/users"
          element={
            <ProtectedRoute module="users" permission="read">
              <UsersPage />
            </ProtectedRoute>
          }
        />
        <Route path="/inventory">
          <Route
            index
            element={
              <ProtectedRoute module="inventory" permission="read">
                <InventoryList />
              </ProtectedRoute>
            }
          />
          <Route
            path="stock-ledger/:productId"
            element={
              <ProtectedRoute module="inventory" permission="read">
                <StockLedgerPage />
              </ProtectedRoute>
            }
          />
          <Route path="products">
            <Route
              index
              element={
                <ProtectedRoute module="products" permission="read">
                  <ProductList />
                </ProtectedRoute>
              }
            />
            <Route
              path=":id"
              element={
                <ProtectedRoute module="products" permission="read">
                  <ProductDetails />
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
                <SupplierList />
              </ProtectedRoute>
            }
          />
          <Route
            path=":id"
            element={
              <ProtectedRoute module="suppliers" permission="read">
                <SupplierDetails />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="/hospitals">
          <Route
            index
            element={
              <ProtectedRoute module="hospitals" permission="read">
                <HospitalList />
              </ProtectedRoute>
            }
          />
          <Route
            path=":id"
            element={
              <ProtectedRoute module="hospitals" permission="read">
                <HospitalDetails />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="/supply-orders">
          <Route
            index
            element={
              <ProtectedRoute module="supplyOrders" permission="read">
                <SupplyOrderList />
              </ProtectedRoute>
            }
          />
          <Route
            path="create"
            element={
              <ProtectedRoute module="supplyOrders" permission="create">
                <SupplyOrderForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="view/:id"
            element={
              <ProtectedRoute module="supplyOrders" permission="read">
                <SupplyOrderView />
              </ProtectedRoute>
            }
          />
          <Route
            path="edit/:id"
            element={
              <ProtectedRoute module="supplyOrders" permission="update">
                <SupplyOrderForm />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route path="/orders/purchase">
          <Route
            index
            element={
              <ProtectedRoute module="purchaseOrders" permission="read">
                <PurchaseOrderList />
              </ProtectedRoute>
            }
          />
          <Route
            path="create"
            element={
              <ProtectedRoute module="purchaseOrders" permission="create">
                <PurchaseOrderForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="view/:id/print"
            element={
              <ProtectedRoute module="purchaseOrders" permission="read">
                <PurchaseOrderPrintPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="view/:id"
            element={
              <ProtectedRoute module="purchaseOrders" permission="read">
                <PurchaseOrderView />
              </ProtectedRoute>
            }
          />
          <Route
            path="edit/:id"
            element={
              <ProtectedRoute module="purchaseOrders" permission="update">
                <PurchaseOrderForm />
              </ProtectedRoute>
            }
          />
        </Route>
        <Route
          path="/delivery"
          element={
            <ProtectedRoute module="deliveryChallans" permission="read">
              <DeliveryChallanList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices/:id"
          element={
            <ProtectedRoute module="invoices" permission="read">
              <InvoiceDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <ProtectedRoute module="invoices" permission="read">
              <InvoiceList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/expenses"
          element={
            <ProtectedRoute module="expenses" permission="read">
              <ExpenseList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/incomes"
          element={
            <ProtectedRoute module="incomes" permission="read">
              <IncomeList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/payments"
          element={
            <ProtectedRoute module="payments" permission="read">
              <PaymentList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/accounts"
          element={
            <ProtectedRoute module="bankAccounts" permission="read">
              <BankAccountList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance/transfers"
          element={
            <ProtectedRoute module="transfers" permission="read">
              <AccountTransfersList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/vendor-ledger"
          element={
            <ProtectedRoute module="reports" permission="read">
              <VendorLedgerReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/hospital-ledger"
          element={
            <ProtectedRoute module="reports" permission="read">
              <HospitalLedgerReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute module="reports" permission="read">
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/product-types"
          element={
            <ProtectedRoute module="products" permission="read">
              <ProductTypesList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/units"
          element={
            <ProtectedRoute module="products" permission="read">
              <UnitsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/expense-categories"
          element={
            <ProtectedRoute module="expenses" permission="read">
              <ExpenseCategoriesList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/income-categories"
          element={
            <ProtectedRoute module="incomeCategories" permission="read">
              <IncomeCategoriesList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/tax-configuration"
          element={
            <ProtectedRoute module="products" permission="read">
              <TaxConfigurationList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/system-configuration"
          element={
            <ProtectedRoute module="systemConfiguration" permission="read">
              <SystemConfigurationPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all route - intentionally outside the layout, matching prior behavior */}
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
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
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
