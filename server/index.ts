import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import mastersRouter from "./routes/masters";
import ordersRouter from "./routes/orders";
import financeRouter from "./routes/finance";
import documentsRouter from "./routes/documents";
import inventoryRouter from "./routes/inventory";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Master Data Routes (Products, Suppliers, Hospitals)
  app.use("/api", mastersRouter);

  // Order Management Routes (Sales, Supply, Purchase Orders)
  app.use("/api", ordersRouter);

  // Finance Routes (Expenses, Salary, Bank Accounts, Transfers, Payments)
  app.use("/api", financeRouter);

  // Document Routes (Delivery Challan, Tax Invoices, Tenders)
  app.use("/api", documentsRouter);

  // Inventory Routes
  app.use("/api", inventoryRouter);

  return app;
}
