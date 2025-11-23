'use client';

import { useState, useEffect, Fragment } from 'react';
import { purchasesApi, suppliersApi, productsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Dialog, Transition } from '@headlessui/react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Purchase {
  id: number;
  invoice_no: string;
  date: string;
  supplier_id: number;
  supplier?: { name: string };
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  status: string;
  items?: any[];
}

interface PurchaseItem {
  product_id: number;
  product_name?: string;
  qty: number;
  unit_price: number;
  tax: number;
  discount: number;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const { hasRole } = useAuthStore();
  
  const [formData, setFormData] = useState({
    invoice_no: '',
    date: new Date().toISOString().split('T')[0],
    supplier_id: '',
    warehouse_id: '1',
    notes: '',
  });

  const [items, setItems] = useState<PurchaseItem[]>([]);

  const canCreate = hasRole(['admin', 'manager']);

  useEffect(() => {
    loadPurchases();
    loadSuppliers();
    loadProducts();
  }, []);

  const loadPurchases = async () => {
    try {
      const response = await purchasesApi.getAll();
      setPurchases(response.data);
    } catch (error) {
      toast.error('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await suppliersApi.getAll();
      setSuppliers(response.data);
    } catch (error) {
      console.error('Failed to load suppliers');
    }
  };

  const loadProducts = async () => {
    try {
      const response = await productsApi.getAll();
      setProducts(response.data);
    } catch (error) {
      console.error('Failed to load products');
    }
  };

  const openModal = () => {
    // Generate invoice number
    const invoiceNo = `PUR-${Date.now()}`;
    setFormData({
      invoice_no: invoiceNo,
      date: new Date().toISOString().split('T')[0],
      supplier_id: '',
      warehouse_id: '1',
      notes: '',
    });
    setItems([]);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      invoice_no: '',
      date: new Date().toISOString().split('T')[0],
      supplier_id: '',
      warehouse_id: '1',
      notes: '',
    });
    setItems([]);
  };

  const addItem = () => {
    setItems([
      ...items,
      { product_id: 0, qty: 1, unit_price: 0, tax: 0, discount: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PurchaseItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Update product name if product_id changes
    if (field === 'product_id') {
      const product = products.find((p) => p.id === parseInt(value));
      if (product) {
        newItems[index].product_name = product.name;
        newItems[index].unit_price = parseFloat(product.cost_price || 0);
      }
    }
    
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => {
      const subtotal = item.qty * item.unit_price;
      return total + subtotal + item.tax - item.discount;
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.supplier_id) {
      toast.error('Please select a supplier');
      return;
    }

    if (items.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    if (items.some((item) => !item.product_id || item.qty <= 0)) {
      toast.error('Please fill in all item details');
      return;
    }

    try {
      const purchaseData = {
        ...formData,
        supplier_id: parseInt(formData.supplier_id),
        warehouse_id: parseInt(formData.warehouse_id),
        items: items.map((item) => ({
          product_id: item.product_id,
          qty: parseFloat(item.qty.toString()),
          unit_price: parseFloat(item.unit_price.toString()),
          tax: parseFloat(item.tax.toString()),
          discount: parseFloat(item.discount.toString()),
        })),
      };

      await purchasesApi.create(purchaseData);
      toast.success('Purchase created successfully');
      closeModal();
      loadPurchases();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create purchase';
      toast.error(message);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading purchases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Purchases</h1>
        {canCreate && (
          <button
            onClick={openModal}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            New Purchase
          </button>
        )}
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Invoice No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Supplier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No purchases found.
                </td>
              </tr>
            ) : (
              purchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {purchase.invoice_no}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {format(new Date(purchase.date), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {purchase.supplier?.name || '-'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {purchase.items?.length || 0} items
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    ${parseFloat(purchase.total_amount?.toString() || '0').toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                        purchase.status
                      )}`}
                    >
                      {purchase.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Create Purchase */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900 mb-4"
                  >
                    Create New Purchase
                  </Dialog.Title>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Invoice No *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.invoice_no}
                          onChange={(e) =>
                            setFormData({ ...formData, invoice_no: e.target.value })
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Date *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.date}
                          onChange={(e) =>
                            setFormData({ ...formData, date: e.target.value })
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Supplier *
                        </label>
                        <select
                          required
                          value={formData.supplier_id}
                          onChange={(e) =>
                            setFormData({ ...formData, supplier_id: e.target.value })
                          }
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                        >
                          <option value="">Select Supplier</option>
                          {suppliers.map((supplier) => (
                            <option key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        rows={2}
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData({ ...formData, notes: e.target.value })
                        }
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm border px-3 py-2"
                      />
                    </div>

                    {/* Items Section */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Items *
                        </label>
                        <button
                          type="button"
                          onClick={addItem}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          + Add Item
                        </button>
                      </div>

                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {items.map((item, index) => (
                          <div
                            key={index}
                            className="grid grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded"
                          >
                            <div className="col-span-4">
                              <select
                                value={item.product_id}
                                onChange={(e) =>
                                  updateItem(index, 'product_id', parseInt(e.target.value))
                                }
                                className="block w-full rounded-md border-gray-300 text-sm border px-2 py-1"
                              >
                                <option value={0}>Select Product</option>
                                {products.map((product) => (
                                  <option key={product.id} value={product.id}>
                                    {product.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="col-span-2">
                              <input
                                type="number"
                                placeholder="Qty"
                                min="1"
                                value={item.qty}
                                onChange={(e) =>
                                  updateItem(index, 'qty', parseFloat(e.target.value))
                                }
                                className="block w-full rounded-md border-gray-300 text-sm border px-2 py-1"
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="number"
                                placeholder="Price"
                                min="0"
                                step="0.01"
                                value={item.unit_price}
                                onChange={(e) =>
                                  updateItem(index, 'unit_price', parseFloat(e.target.value))
                                }
                                className="block w-full rounded-md border-gray-300 text-sm border px-2 py-1"
                              />
                            </div>
                            <div className="col-span-2">
                              <input
                                type="number"
                                placeholder="Tax"
                                min="0"
                                step="0.01"
                                value={item.tax}
                                onChange={(e) =>
                                  updateItem(index, 'tax', parseFloat(e.target.value))
                                }
                                className="block w-full rounded-md border-gray-300 text-sm border px-2 py-1"
                              />
                            </div>
                            <div className="col-span-1">
                              <input
                                type="number"
                                placeholder="Disc"
                                min="0"
                                step="0.01"
                                value={item.discount}
                                onChange={(e) =>
                                  updateItem(index, 'discount', parseFloat(e.target.value))
                                }
                                className="block w-full rounded-md border-gray-300 text-sm border px-2 py-1"
                              />
                            </div>
                            <div className="col-span-1 flex justify-center">
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total */}
                    <div className="border-t pt-4">
                      <div className="flex justify-end">
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Total Amount</p>
                          <p className="text-2xl font-bold text-gray-900">
                            ${calculateTotal().toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                      <button
                        type="button"
                        onClick={closeModal}
                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                      >
                        Create Purchase
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
