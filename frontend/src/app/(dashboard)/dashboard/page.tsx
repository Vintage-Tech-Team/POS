'use client';

import { useEffect, useState } from 'react';
import { reportsApi, inventoryApi } from '@/lib/api';
import {
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todaySales: 0,
    monthlySales: 0,
    lowStockCount: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split('T')[0];

      const [todayReport, monthReport, lowStock] = await Promise.all([
        reportsApi.getSalesSummary(today, today),
        reportsApi.getSalesSummary(firstDayOfMonth, today),
        inventoryApi.getLowStock(),
      ]);

      setStats({
        todaySales: todayReport.data.total_sales || 0,
        monthlySales: monthReport.data.total_sales || 0,
        lowStockCount: lowStock.data.length || 0,
      });
      setLowStockProducts(lowStock.data.slice(0, 5));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-primary-500 rounded-md p-3">
              <ShoppingCartIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">Today's Sales</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${stats.todaySales.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
              <CurrencyDollarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">Monthly Sales</p>
              <p className="text-2xl font-semibold text-gray-900">
                ${stats.monthlySales.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-500 rounded-md p-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">Low Stock Items</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.lowStockCount}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-500">Quick Actions</p>
              <Link
                href="/pos"
                className="text-sm font-semibold text-primary-600 hover:text-primary-700"
              >
                Open POS →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Low Stock Alert
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {lowStockProducts.map((product: any) => (
                <div
                  key={product.product_id}
                  className="flex items-center justify-between p-4 bg-red-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{product.product_name}</p>
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600">
                      Stock: {product.stock_quantity}
                    </p>
                    <p className="text-xs text-gray-500">
                      Reorder at: {product.reorder_level}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/inventory"
              className="mt-4 block text-center text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              View All Inventory →
            </Link>
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/pos"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <ShoppingCartIcon className="h-8 w-8 text-primary-600 mb-2" />
          <h3 className="text-lg font-semibold text-gray-900">New Sale</h3>
          <p className="text-sm text-gray-500">Open POS to make a sale</p>
        </Link>

        <Link
          href="/products"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <ChartBarIcon className="h-8 w-8 text-green-600 mb-2" />
          <h3 className="text-lg font-semibold text-gray-900">Products</h3>
          <p className="text-sm text-gray-500">Manage your inventory</p>
        </Link>

        <Link
          href="/reports"
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
        >
          <CurrencyDollarIcon className="h-8 w-8 text-purple-600 mb-2" />
          <h3 className="text-lg font-semibold text-gray-900">Reports</h3>
          <p className="text-sm text-gray-500">View sales and inventory reports</p>
        </Link>
      </div>
    </div>
  );
}


