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

interface Store {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  primaryColor: string;
  tagline: string | null;
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  stock: number;
  category: string | null;
  storeId: string;
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  shopperName: string;
  shopperEmail: string;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [checkingStore, setCheckingStore] = useState(true);

  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#4F46E5');
  const [logo, setLogo] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productStock, setProductStock] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productImage, setProductImage] = useState('');
  const [productError, setProductError] = useState('');
  const [productSubmitting, setProductSubmitting] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (!token || !storedUser) {
      router.push('/signup');
      return;
    }
    setUser(JSON.parse(storedUser));

    api
      .get('/stores/mine')
      .then((res) => {
        if (res.data.stores && res.data.stores.length > 0) {
          setStore(res.data.stores[0]);
        }
      })
      .catch((err) => {
        console.error('Failed to load stores', err);
      })
      .finally(() => setCheckingStore(false));
  }, [router]);

  useEffect(() => {
    if (store) {
      loadProducts(store.id);
      loadOrders(store.id);
    }
  }, [store]);

  function loadProducts(storeId: string) {
    setLoadingProducts(true);
    api
      .get(`/products/store/${storeId}`)
      .then((res) => setProducts(res.data.products))
      .catch((err) => console.error('Failed to load products', err))
      .finally(() => setLoadingProducts(false));
  }

  function loadOrders(storeId: string) {
    setLoadingOrders(true);
    api
      .get(`/orders/store/${storeId}`)
      .then((res) => setOrders(res.data.orders))
      .catch((err) => console.error('Failed to load orders', err))
      .finally(() => setLoadingOrders(false));
  }

  async function handleCreateStore(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post('/stores', {
        name: name,
        tagline: tagline || undefined,
        primaryColor: primaryColor,
        logo: logo || undefined,
      });
      setStore(res.data.store);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  function resetProductForm() {
    setEditingProductId(null);
    setProductName('');
    setProductDescription('');
    setProductPrice('');
    setProductStock('');
    setProductCategory('');
    setProductImage('');
    setProductError('');
    setShowProductForm(false);
  }

  function startEditProduct(product: Product) {
    setEditingProductId(product.id);
    setProductName(product.name);
    setProductDescription(product.description || '');
    setProductPrice(String(product.price));
    setProductStock(String(product.stock));
    setProductCategory(product.category || '');
    setProductImage(product.image || '');
    setProductError('');
    setShowProductForm(true);
  }

  async function handleProductSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!store) return;
    setProductError('');

    const price = parseFloat(productPrice);
    if (isNaN(price) || price < 0) {
      setProductError('Price must be a number of 0 or more');
      return;
    }

    setProductSubmitting(true);
    try {
      const payload = {
        name: productName,
        description: productDescription || undefined,
        price,
        stock: productStock ? parseInt(productStock, 10) : 0,
        category: productCategory || undefined,
        image: productImage || undefined,
      };

      if (editingProductId) {
        await api.put(`/products/${editingProductId}`, payload);
      } else {
        await api.post(`/products/store/${store.id}`, payload);
      }

      resetProductForm();
      loadProducts(store.id);
    } catch (err: any) {
      setProductError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setProductSubmitting(false);
    }
  }

  async function handleDeleteProduct(productId: string) {
    if (!store) return;
    if (!confirm('Delete this product? This cannot be undone.')) return;

    try {
      await api.delete(`/products/${productId}`);
      loadProducts(store.id);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete product');
    }
  }

  if (!user || checkingStore) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome, {user.name}
        </h1>
        <p className="text-gray-600 mb-6">{user.email}</p>

        {store ? (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Your store: {store.name}
            </h2>
            <p className="text-gray-700 mb-1">
              Public page:{' '}
              <a href={'/store/' + store.slug} className="text-indigo-600 underline">
                /store/{store.slug}
              </a>
            </p>
            {store.tagline && (
              <p className="text-gray-500 italic mb-4">{store.tagline}</p>
            )}
            <div
              className="w-8 h-8 rounded-full border"
              style={{ backgroundColor: store.primaryColor }}
              title="Primary color"
            />
          </div>
        ) : (
          <div>
            <p className="text-gray-700 mb-4">
              You haven&apos;t created a store yet. Set one up below.
            </p>
            <form onSubmit={handleCreateStore} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Store name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Tagline (optional)
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Logo URL (optional)
                </label>
                <input
                  type="text"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Primary color
                </label>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-16 h-10 border border-gray-300 rounded"
                />
              </div>
              {error && <p className="text-red-600 text-sm">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-black text-white rounded py-2 font-medium disabled:opacity-50"
              >
                {submitting ? 'Creating store...' : 'Create store'}
              </button>
            </form>
          </div>
        )}
      </div>

      {store && (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Products</h2>
            <button
              onClick={() => {
                if (showProductForm) {
                  resetProductForm();
                } else {
                  setShowProductForm(true);
                }
              }}
              className="bg-black text-white rounded px-4 py-2 text-sm font-medium"
            >
              {showProductForm ? 'Cancel' : '+ Add product'}
            </button>
          </div>

          {showProductForm && (
            <form
              onSubmit={handleProductSubmit}
              className="space-y-4 mb-8 border border-gray-200 rounded-lg p-4"
            >
              <h3 className="font-medium text-gray-900">
                {editingProductId ? 'Edit product' : 'New product'}
              </h3>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Description
                </label>
                <textarea
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Stock
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productStock}
                    onChange={(e) => setProductStock(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Category
                </label>
                <input
                  type="text"
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Image URL
                </label>
                <input
                  type="text"
                  value={productImage}
                  onChange={(e) => setProductImage(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-gray-900 bg-white"
                />
              </div>
              {productError && (
                <p className="text-red-600 text-sm">{productError}</p>
              )}
              <button
                type="submit"
                disabled={productSubmitting}
                className="w-full bg-indigo-600 text-white rounded py-2 font-medium disabled:opacity-50"
              >
                {productSubmitting
                  ? 'Saving...'
                  : editingProductId
                  ? 'Save changes'
                  : 'Add product'}
              </button>
            </form>
          )}

          {loadingProducts ? (
            <p className="text-gray-500">Loading products...</p>
          ) : products.length === 0 ? (
            <p className="text-gray-500">No products yet. Add your first one above.</p>
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between border border-gray-200 rounded-lg p-4"
                >
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">
                      ${product.price.toFixed(2)} · {product.stock} in stock
                      {product.category ? ` · ${product.category}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startEditProduct(product)}
                      className="text-sm text-indigo-600 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-sm text-red-600 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {store && (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Your orders</h2>

          {loadingOrders ? (
            <p className="text-gray-500">Loading orders...</p>
          ) : orders.length === 0 ? (
            <p className="text-gray-500">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{order.shopperName}</p>
                      <p className="text-xs text-gray-500">{order.shopperEmail}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ${order.total.toFixed(2)}
                      </p>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {order.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {order.items.map((item) => (
                      <div key={item.id}>
                        {item.quantity}× {item.name} — ${item.price.toFixed(2)} each
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}