'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

interface StoreInfo {
  id: string;
  name: string;
  slug: string;
  owner: { id: string; name: string; email: string };
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  storeId: string;
  shopperName: string;
  shopperEmail: string;
  total: number;
  status: string;
  createdAt: string;
  store: { id: string; name: string; slug: string };
  items: OrderItem[];
}

interface StoreRevenue {
  storeId: string;
  storeName: string;
  slug: string;
  revenue: number;
  orderCount: number;
}

export default function CrmDashboardPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  const [allStores, setAllStores] = useState<StoreInfo[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [selectedStore, setSelectedStore] = useState('');

  const [grandTotal, setGrandTotal] = useState(0);
  const [revenueByStore, setRevenueByStore] = useState<StoreRevenue[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      router.push('/signup');
      return;
    }

    const user: User = JSON.parse(storedUser);
    if (user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }

    setAuthorized(true);
    setChecking(false);
  }, [router]);

  useEffect(() => {
    if (!authorized) return;
    loadStoresAndRevenue();
    loadOrders();
  }, [authorized]);

  useEffect(() => {
    if (!authorized) return;
    loadOrders();
  }, [selectedStore]);

  function loadStoresAndRevenue() {
    Promise.all([api.get('/crm/stores'), api.get('/crm/revenue')])
      .then(([storesRes, revenueRes]) => {
        const stores: StoreInfo[] = storesRes.data.stores;
        setAllStores(stores);

        const revenueMap = new Map<string, StoreRevenue>();
        for (const s of revenueRes.data.byStore as StoreRevenue[]) {
          revenueMap.set(s.storeId, s);
        }

        // Build a complete list: every store gets an entry, defaulting to 0 if it has no orders
        const merged: StoreRevenue[] = stores.map((store) => {
          const existing = revenueMap.get(store.id);
          return (
            existing || {
              storeId: store.id,
              storeName: store.name,
              slug: store.slug,
              revenue: 0,
              orderCount: 0,
            }
          );
        });

        setRevenueByStore(merged);
        setGrandTotal(revenueRes.data.grandTotal);
      })
      .catch((err) => console.error('Failed to load stores/revenue', err));
  }

  function loadOrders() {
    setLoadingOrders(true);
    const query = selectedStore ? `?storeId=${selectedStore}` : '';
    api
      .get(`/crm/orders${query}`)
      .then((res) => setOrders(res.data.orders))
      .catch((err) => console.error('Failed to load orders', err))
      .finally(() => setLoadingOrders(false));
  }

  if (checking || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">CRM Dashboard</h1>
        <p className="text-gray-500 text-sm mb-8">
          Aggregated orders and revenue across every store on the platform.
        </p>

        {/* Revenue summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-xs text-gray-400 mb-1">Total revenue</p>
            <p className="text-3xl font-semibold text-gray-900">
              ${grandTotal.toFixed(2)}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-xs text-gray-400 mb-1">Total stores</p>
            <p className="text-3xl font-semibold text-gray-900">{allStores.length}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <p className="text-xs text-gray-400 mb-1">Total orders</p>
            <p className="text-3xl font-semibold text-gray-900">
              {revenueByStore.reduce((sum, s) => sum + s.orderCount, 0)}
            </p>
          </div>
        </div>

        {/* Revenue by store — now includes every store, even with zero orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Revenue by store</h2>
          {revenueByStore.length === 0 ? (
            <p className="text-gray-400 text-sm">No stores yet.</p>
          ) : (
            <div className="space-y-1">
              {revenueByStore.map((s) => (
                <div
                  key={s.storeId}
                  className="flex items-center justify-between py-3 border-b last:border-0 border-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{s.storeName}</p>
                    <p className="text-xs text-gray-400">
                      /store/{s.slug} · {s.orderCount} order
                      {s.orderCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900 text-sm">
                    ${s.revenue.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Orders table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">All orders</h2>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white"
            >
              <option value="">All stores</option>
              {allStores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {loadingOrders ? (
            <p className="text-gray-400 text-sm">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="text-gray-400 text-sm">No orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs border-b border-gray-100">
                    <th className="pb-2 pr-4 font-medium">Store</th>
                    <th className="pb-2 pr-4 font-medium">Shopper</th>
                    <th className="pb-2 pr-4 font-medium">Items</th>
                    <th className="pb-2 pr-4 font-medium">Total</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 pr-4 text-gray-900">{order.store.name}</td>
                      <td className="py-3 pr-4">
                        <p className="text-gray-900">{order.shopperName}</p>
                        <p className="text-xs text-gray-400">{order.shopperEmail}</p>
                      </td>
                      <td className="py-3 pr-4 text-gray-600 text-xs">
                        {order.items.map((item) => (
                          <div key={item.id}>
                            {item.quantity}× {item.name}
                          </div>
                        ))}
                      </td>
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        ${order.total.toFixed(2)}
                      </td>
                      <td className="py-3 pr-4">
                        <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400 text-xs">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}