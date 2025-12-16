import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { AuthProvider } from "@/context/AuthContext";
import Dashboard from "./pages/Dashboard";
import TenderList from "./pages/tender/TenderList";
import PurchaseOrderList from "./pages/orders/PurchaseOrderList";
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
import HospitalList from "./pages/hospitals/HospitalList";
import SupplyOrderList from "./pages/supply/SupplyOrderList";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route
              path="/"
              element={
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              }
            />
            <Route
              path="/inventory/products"
              element={
                <MainLayout>
                  <ProductList />
                </MainLayout>
              }
            />
            <Route
              path="/inventory"
              element={
                <MainLayout>
                  <InventoryList />
                </MainLayout>
              }
            />
            <Route
              path="/suppliers"
              element={
                <MainLayout>
                  <SupplierList />
                </MainLayout>
              }
            />
            <Route
              path="/hospitals"
              element={
                <MainLayout>
                  <HospitalList />
                </MainLayout>
              }
            />
            <Route
              path="/supply-orders"
              element={
                <MainLayout>
                  <SupplyOrderList />
                </MainLayout>
              }
            />
            <Route
              path="/tender"
              element={
                <MainLayout>
                  <TenderList />
                </MainLayout>
              }
            />
            <Route
              path="/orders/purchase"
              element={
                <MainLayout>
                  <PurchaseOrderList />
                </MainLayout>
              }
            />
            <Route
              path="/orders/sales"
              element={
                <MainLayout>
                  <SalesOrderList />
                </MainLayout>
              }
            />
            <Route
              path="/delivery"
              element={
                <MainLayout>
                  <DeliveryChallanList />
                </MainLayout>
              }
            />
            <Route
              path="/invoices"
              element={
                <MainLayout>
                  <SalesTaxInvoiceList />
                </MainLayout>
              }
            />
            <Route
              path="/finance/expenses"
              element={
                <MainLayout>
                  <DailyExpenseList />
                </MainLayout>
              }
            />
            <Route
              path="/finance/payments"
              element={
                <MainLayout>
                  <PaymentList />
                </MainLayout>
              }
            />
            <Route
              path="/finance/accounts"
              element={
                <MainLayout>
                  <BankAccountList />
                </MainLayout>
              }
            />
            <Route
              path="/finance/transfers"
              element={
                <MainLayout>
                  <InternalTransferList />
                </MainLayout>
              }
            />
            <Route
              path="/payroll"
              element={
                <MainLayout>
                  <SalaryVoucherList />
                </MainLayout>
              }
            />
            <Route
              path="/reports"
              element={
                <MainLayout>
                  <Reports />
                </MainLayout>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
