import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthProvider } from "@/context/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { queryClient } from "@/api/queryClient";
import { useAuthInitialize } from "@/hooks/useAuth";
import { AuthLoadingScreen } from "@/components/AuthLoadingScreen";
import { ProtectedRoute, PublicRoute } from "@/components/ProtectedRoute";
import { ClickSpark } from "@/components/effects/ClickSpark";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/Login";
import TenderList from "./pages/tender/TenderList";
import PurchaseOrderList from "./pages/orders/PurchaseOrderList";
import PurchaseOrderForm from "./pages/orders/PurchaseOrderForm";
import SalesOrderList from "./pages/orders/SalesOrderList";
import DeliveryChallanList from "./pages/delivery/DeliveryChallanList";
import SalesTaxInvoiceList from "./pages/invoices/SalesTaxInvoiceList";
import DailyExpenseList from "./pages/finance/DailyExpenseList";
import PaymentList from "./pages/finance/PaymentList";
import BankAccountList from "./pages/finance/BankAccountList";
import InternalTransferList from "./pages/finance/InternalTransferList";
import SalaryVoucherList from "./pages/payroll/SalaryVoucherList";
import Reports from "./pages/reports/Reports";
import ProductList from "./pages/inventory/ProductList";
import InventoryList from "./pages/inventory/InventoryList";
import SupplierList from "./pages/suppliers/SupplierList";
import SupplierDetails from "./pages/suppliers/SupplierDetails";
import HospitalList from "./pages/hospitals/HospitalList";
import SupplyOrderList from "./pages/supply/SupplyOrderList";
import UsersPage from "./pages/users/UsersPage";
import ProductTypesList from "./pages/settings/ProductTypesList";
import UnitsList from "./pages/settings/UnitsList";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";

/**
 * AppRoutes Component
 *
 * Handles all routing after authentication has been checked.
 * All protected routes are wrapped with ProtectedRoute component.
 */
const AppRoutes = () => (
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
    <Route
      path="/inventory/products"
      element={
        <ProtectedRoute module="products" permission="read">
          <MainLayout>
            <ProductList />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/inventory"
      element={
        <ProtectedRoute module="inventory" permission="read">
          <MainLayout>
            <InventoryList />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/suppliers"
      element={
        <ProtectedRoute module="suppliers" permission="read">
          <MainLayout>
            <SupplierList />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/hospitals"
      element={
        <ProtectedRoute module="hospitals" permission="read">
          <MainLayout>
            <HospitalList />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/suppliers/:id"
      element={
        <ProtectedRoute module="suppliers" permission="read">
          <MainLayout>
            <SupplierDetails />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/supply-orders"
      element={
        <ProtectedRoute module="supplyOrders" permission="read">
          <MainLayout>
            <SupplyOrderList />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/tender"
      element={
        <ProtectedRoute module="tenders" permission="read">
          <MainLayout>
            <TenderList />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/orders/purchase"
      element={
        <ProtectedRoute module="purchaseOrders" permission="read">
          <MainLayout>
            <PurchaseOrderList />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/orders/purchase/create"
      element={
        <ProtectedRoute module="purchaseOrders" permission="create">
          <MainLayout>
            <PurchaseOrderForm />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/orders/purchase/edit/:id"
      element={
        <ProtectedRoute module="purchaseOrders" permission="update">
          <MainLayout>
            <PurchaseOrderForm />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/orders/purchase/view/:id"
      element={
        <ProtectedRoute module="purchaseOrders" permission="read">
          <MainLayout>
            <PurchaseOrderForm />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/orders/sales"
      element={
        <ProtectedRoute module="salesOrders" permission="read">
          <MainLayout>
            <SalesOrderList />
          </MainLayout>
        </ProtectedRoute>
      }
    />
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
      path="/invoices"
      element={
        <ProtectedRoute module="invoices" permission="read">
          <MainLayout>
            <SalesTaxInvoiceList />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/finance/expenses"
      element={
        <ProtectedRoute module="expenses" permission="read">
          <MainLayout>
            <DailyExpenseList />
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
            <InternalTransferList />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/payroll"
      element={
        <ProtectedRoute module="salaryVouchers" permission="read">
          <MainLayout>
            <SalaryVoucherList />
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
    {/* Catch-all route */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

/**
 * AppContent Component
 *
 * Wraps AppRoutes and handles authentication initialization.
 * Shows loading screen while checking for valid token.
 */
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
 *
 * Root component that sets up:
 * - Error boundary
 * - React Query provider
 * - Tooltip provider
 * - Auth provider
 * - Toast notifications
 * - Browser router
 */
const App = () => (
  <ErrorBoundary
    onError={(error, errorInfo) => {
      console.error("App error boundary caught:", error, errorInfo);
    }}
  >
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  </ErrorBoundary>
);

createRoot(document.getElementById("root")!).render(<App />);
