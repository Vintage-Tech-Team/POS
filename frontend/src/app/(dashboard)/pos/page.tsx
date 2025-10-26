'use client';

import { useState, useEffect, useRef } from 'react';
import { productsApi, salesApi, customersApi } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  PlusIcon,
  MinusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

export default function POSPage() {
  const { items, addItem, updateQuantity, removeItem, clearCart, getTotal, getTotalTax } =
    useCartStore();
  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [loading, setLoading] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadCustomers();
    // Focus on barcode input on mount
    barcodeInputRef.current?.focus();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await customersApi.getAll();
      setCustomers(response.data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const handleBarcodeChange = async (value: string) => {
    setBarcodeInput(value);
    
    // Clear previous scanned product preview
    setScannedProduct(null);
    
    // If barcode has reasonable length, try to fetch product
    if (value.trim().length >= 3) {
      try {
        const response = await productsApi.getByBarcode(value.trim());
        const product = response.data;
        setScannedProduct(product);
      } catch (error) {
        // Product not found yet, keep typing
        setScannedProduct(null);
      }
    }
  };

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    try {
      let product = scannedProduct;
      
      // If no product loaded yet, fetch it
      if (!product) {
        const response = await productsApi.getByBarcode(barcodeInput.trim());
        product = response.data;
      }

      addItem({
        product_id: product.id,
        barcode: product.barcode,
        name: product.name,
        qty: 1,
        unit_price: product.sale_price,
        tax: (product.sale_price * product.tax_percent) / 100,
        discount: 0,
      });

      toast.success(`Added ${product.name} to cart`);
      setBarcodeInput('');
      setScannedProduct(null);
      barcodeInputRef.current?.focus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Product not found');
      setBarcodeInput('');
      setScannedProduct(null);
    }
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await productsApi.getAll({ search: term, limit: 10 });
      setSearchResults(response.data.data);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    }
  };

  const addProductFromSearch = (product: any) => {
    addItem({
      product_id: product.id,
      barcode: product.barcode,
      name: product.name,
      qty: 1,
      unit_price: product.sale_price,
      tax: (product.sale_price * product.tax_percent) / 100,
      discount: 0,
    });
    toast.success(`Added ${product.name} to cart`);
    setSearchTerm('');
    setSearchResults([]);
    barcodeInputRef.current?.focus();
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    const total = getTotal();
    const received = parseFloat(amountReceived) || total;

    if (received < total) {
      toast.error('Insufficient payment amount');
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        customer_id: selectedCustomer?.id,
        items: items.map((item) => ({
          product_id: item.product_id,
          qty: item.qty,
          unit_price: item.unit_price,
          tax: item.tax,
          discount: item.discount,
        })),
        payments: [
          {
            method: paymentMethod,
            amount: received,
          },
        ],
        idempotency_key: `pos-${Date.now()}-${Math.random()}`,
      };

      const response = await salesApi.createPOS(saleData);
      toast.success('Sale completed successfully!');

      // Show change if cash
      if (paymentMethod === 'cash' && received > total) {
        const change = received - total;
        toast.success(`Change: $${change.toFixed(2)}`);
      }

      // Clear cart and reset
      clearCart();
      setSelectedCustomer(null);
      setAmountReceived('');
      setBarcodeInput('');
      barcodeInputRef.current?.focus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Sale failed');
    } finally {
      setLoading(false);
    }
  };

  const total = getTotal();
  const totalTax = getTotalTax();
  const amountPaid = parseFloat(amountReceived) || 0;
  const change = amountPaid > total ? amountPaid - total : 0;

  return (
    <div className="h-full flex gap-6">
      {/* Left Side - Products */}
      <div className="flex-1 flex flex-col space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Point of Sale</h1>

        {/* Barcode Scanner */}
        <div className="bg-white rounded-lg shadow p-4">
          <form onSubmit={handleBarcodeSubmit}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scan Barcode
            </label>
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeInput}
              onChange={(e) => handleBarcodeChange(e.target.value)}
              placeholder="Scan or enter barcode..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
            />
          </form>
          
          {/* Scanned Product Preview */}
          {scannedProduct && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-green-900">{scannedProduct.name}</p>
                  <p className="text-sm text-green-700">
                    SKU: {scannedProduct.sku} | Stock: {scannedProduct.stock_quantity}
                  </p>
                  <p className="text-lg font-bold text-green-900 mt-1">
                    ${scannedProduct.sale_price}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleBarcodeSubmit}
                  className="ml-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                >
                  Add to Cart
                </button>
              </div>
            </div>
          )}
          
          {barcodeInput && !scannedProduct && barcodeInput.length >= 3 && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                Press Enter to search or keep typing...
              </p>
            </div>
          )}
        </div>

        {/* Product Search */}
        <div className="bg-white rounded-lg shadow p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Products
          </label>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name or SKU..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900"
            />
          </div>

          {searchResults.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-md max-h-80 overflow-y-auto shadow-lg">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <p className="text-xs font-medium text-gray-600 uppercase">
                  {searchResults.length} Products Found
                </p>
              </div>
              {searchResults.map((product: any) => (
                <button
                  key={product.id}
                  onClick={() => addProductFromSearch(product)}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        SKU: {product.sku} | Barcode: {product.barcode}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-lg font-bold text-green-600">
                          ${product.sale_price}
                        </span>
                        <span className={`text-sm ${product.stock_quantity > 0 ? 'text-gray-500' : 'text-red-500'}`}>
                          Stock: {product.stock_quantity}
                        </span>
                      </div>
                    </div>
                    <div className="ml-3 px-3 py-1 bg-primary-100 text-primary-700 rounded-lg text-sm font-medium">
                      Add
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {searchTerm.length >= 2 && searchResults.length === 0 && (
            <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-md text-center">
              <p className="text-sm text-gray-500">No products found for "{searchTerm}"</p>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 bg-white rounded-lg shadow overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Cart Items</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {items.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Cart is empty</p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.product_id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-500">${item.unit_price}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.qty - 1)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <MinusIcon className="h-4 w-4" />
                      </button>
                      <span className="w-12 text-center font-medium">{item.qty}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.qty + 1)}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <PlusIcon className="h-4 w-4" />
                      </button>
                      <span className="w-20 text-right font-semibold">
                        ${item.total.toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Checkout */}
      <div className="w-96 space-y-4">
        {/* Customer Selection */}
        <div className="bg-white rounded-lg shadow p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Customer (Optional)
          </label>
          <select
            value={selectedCustomer?.id || ''}
            onChange={(e) => {
              const customer = customers.find(
                (c: any) => c.id === parseInt(e.target.value)
              );
              setSelectedCustomer(customer || null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Walk-in Customer</option>
            {customers.map((customer: any) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-lg shadow p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="mobile_money">Mobile Money</option>
          </select>
        </div>

        {/* Amount Received */}
        {paymentMethod === 'cash' && (
          <div className="bg-white rounded-lg shadow p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount Received
            </label>
            <input
              type="number"
              step="0.01"
              value={amountReceived}
              onChange={(e) => setAmountReceived(e.target.value)}
              placeholder="Enter amount..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        )}

        {/* Totals */}
        <div className="bg-white rounded-lg shadow p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Subtotal:</span>
            <span className="font-medium">${(total - totalTax).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tax:</span>
            <span className="font-medium">${totalTax.toFixed(2)}</span>
          </div>
          <div className="border-t border-gray-200 pt-2 flex justify-between">
            <span className="font-semibold text-gray-900">Total:</span>
            <span className="font-bold text-xl text-gray-900">
              ${total.toFixed(2)}
            </span>
          </div>
          {paymentMethod === 'cash' && amountPaid > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-medium">${amountPaid.toFixed(2)}</span>
              </div>
              {change > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Change:</span>
                  <span className="font-medium text-green-600">
                    ${change.toFixed(2)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={handleCheckout}
            disabled={loading || items.length === 0}
            className="w-full py-3 px-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Complete Sale'}
          </button>
          <button
            onClick={clearCart}
            disabled={items.length === 0}
            className="w-full py-2 px-4 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear Cart
          </button>
        </div>
      </div>
    </div>
  );
}


