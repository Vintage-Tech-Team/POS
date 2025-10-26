'use client';

import { useState, useEffect } from 'react';
import { reportsApi, accountingApi } from '@/lib/api';
import toast from 'react-hot-toast';

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [salesSummary, setSalesSummary] = useState<any>(null);
  const [topProducts, setTopProducts] = useState([]);
  const [profitLoss, setProfitLoss] = useState<any>(null);

  useEffect(() => {
    // Set default dates (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
  }, []);

  const loadReports = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select date range');
      return;
    }

    setLoading(true);
    try {
      const [sales, products, pnl] = await Promise.all([
        reportsApi.getSalesSummary(startDate, endDate),
        reportsApi.getTopProducts(startDate, endDate, 5),
        accountingApi.getProfitAndLoss(startDate, endDate),
      ]);

      setSalesSummary(sales.data);
      setTopProducts(products.data);
      setProfitLoss(pnl.data);
    } catch (error) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={loadReports}
              disabled={loading}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Generate Reports'}
            </button>
          </div>
        </div>
      </div>

      {/* Sales Summary */}
      {salesSummary && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sales Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-blue-600">
                ${salesSummary.total_sales?.toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Net Sales</p>
              <p className="text-2xl font-bold text-green-600">
                ${salesSummary.net_sales?.toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-purple-600">
                {salesSummary.total_transactions}
              </p>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600">Avg Sale</p>
              <p className="text-2xl font-bold text-orange-600">
                ${salesSummary.average_sale?.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Selling Products */}
      {topProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Top Selling Products
          </h2>
          <div className="space-y-3">
            {topProducts.map((product: any, index) => (
              <div
                key={product.product_id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                  <div>
                    <p className="font-medium text-gray-900">{product.product_name}</p>
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {product.total_quantity_sold} units
                  </p>
                  <p className="text-sm text-green-600">
                    ${product.total_revenue?.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profit & Loss */}
      {profitLoss && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Profit & Loss Statement
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Income</h3>
              <div className="pl-4 space-y-1">
                {profitLoss.income?.accounts?.map((account: any) => (
                  <div
                    key={account.name}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-gray-600">{account.name}</span>
                    <span className="font-medium">
                      ${account.amount?.toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                  <span>Total Income</span>
                  <span className="text-green-600">
                    ${profitLoss.income?.total?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Expenses</h3>
              <div className="pl-4 space-y-1">
                {profitLoss.expense?.accounts?.map((account: any) => (
                  <div
                    key={account.name}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-gray-600">{account.name}</span>
                    <span className="font-medium">
                      ${account.amount?.toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold pt-2 border-t">
                  <span>Total Expenses</span>
                  <span className="text-red-600">
                    ${profitLoss.expense?.total?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t-2 border-gray-300">
              <div className="flex justify-between text-lg font-bold">
                <span>Net Profit</span>
                <span
                  className={
                    profitLoss.profit >= 0 ? 'text-green-600' : 'text-red-600'
                  }
                >
                  ${profitLoss.profit?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

