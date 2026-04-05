import React from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export interface RevenueExpenseData {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface CategoryData {
  name: string;
  value: number;
  percentage?: number;
}

export function RevenueExpenseChart({ data }: { data: RevenueExpenseData[] }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Revenue vs Expenses</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value) => formatCurrency(value as number)} />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} name="Revenue" />
          <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
          <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2} name="Profit" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function ProfitMarginChart({ data }: { data: { label: string; value: number }[] }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Profit Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${(value as number).toFixed(1)}%`} />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function CategoryBreakdownChart({ data }: { data: CategoryData[] }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
          <YAxis />
          <Tooltip formatter={(value) => formatCurrency(value as number)} />
          <Bar dataKey="value" fill="#3b82f6" name="Amount" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

export function TrendChart({ data }: { data: { date: string; amount: number }[] }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Trend Analysis</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value) => formatCurrency(value as number)} />
          <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
