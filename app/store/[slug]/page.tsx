'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';

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
}

interface CartLine {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  maxStock: number;
}

export default function PublicStorePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const [cart, setCart] = useState<CartLine[]>([]);
  const [showCart, setShowCart] = useState(false);

  const [showCheckoutForm, setShowCheckoutForm] = useState(false);
  const [shopperName, setShopperName] = useState('');
  const [shopperEmail, setShopperEmail] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutSubmitting, setCheckoutSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState<{ id: string; total: number } | null>(null);

  const [detailProduct, setDetailProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);

    api
      .get(`/stores/public/${slug}`)
      .then((res) => {
        setStore(res.data.store);
      })
      .catch(() => {
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!slug || notFound) return;

    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);

    api
      .get(`/products/public/${slug}?${params.toString()}`)
      .then((res) => {
        setProducts(res.data.products);
      })
      .catch((err) => {
        console.error('Failed to load products', err);
      });
  }, [slug, search, category, notFound]);

  const categories = Array.from(
    new Set(products.map((p) => p.category).filter((c): c is string => !!c))
  );

  function addToCart(product: Product) {
    setCart((prev) => {
      const existing = prev.find((line) => line.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map((line) =>
          line.productId === product.id
            ? { ...line, quantity: line.quantity + 1 }
            : line
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          maxStock: product.stock,
        },
      ];
    });
  }

  function updateQuantity(productId: string, quantity: number) {
    if (quantity < 1) {
      setCart((prev) => prev.filter((line) => line.productId !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((line) =>
        line.productId === productId
          ? { ...line, quantity: Math.min(quantity, line.maxStock) }
          : line
      )
    );
  }

  function removeFromCart(productId: string) {
    setCart((prev) => prev.filter((line) => line.productId !== productId));
  }

  const cartTotal = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setCheckoutError('');

    if (cart.length === 0) {
      setCheckoutError('Your cart is empty');
      return;
    }

    setCheckoutSubmitting(true);
    try {
      const res = await api.post(`/orders/checkout/${slug}`, {
        shopperName,
        shopperEmail,
        items: cart.map((line) => ({
          productId: line.productId,
          quantity: line.quantity,
        })),
      });

      setOrderComplete({ id: res.data.order.id, total: res.data.order.total });
      setCart([]);
      setShowCheckoutForm(false);
      setShowCart(false);

      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      api
        .get(`/products/public/${slug}?${params.toString()}`)
        .then((res) => setProducts(res.data.products));
    } catch (err: any) {
      setCheckoutError(err.response?.data?.error || 'Checkout failed');
    } finally {
      setCheckoutSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700">
        Loading...
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-700">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Store not found</h1>
          <p className="text-gray-500">No store exists at this address.</p>
        </div>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order placed!</h1>
          <p className="text-gray-600 mb-4">
            Thanks for your order. Confirmation total:{' '}
            <span className="font-semibold">${orderComplete.total.toFixed(2)}</span>
          </p>
          <p className="text-xs text-gray-400 mb-6">Order ID: {orderComplete.id}</p>
          <button
            onClick={() => setOrderComplete(null)}
            className="w-full text-white rounded py-2 font-medium"
            style={{ backgroundColor: store.primaryColor }}
          >
            Continue shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className="px-4 py-12 text-white relative"
        style={{ backgroundColor: store.primaryColor }}
      >
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {store.logo && (
              <img
                src={store.logo}
                alt={store.name}
                className="w-16 h-16 rounded-full bg-white object-cover"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold">{store.name}</h1>
              {store.tagline && <p className="opacity-90 mt-1">{store.tagline}</p>}
            </div>
          </div>

          <button
            onClick={() => setShowCart(true)}
            className="bg-white rounded-full px-4 py-2 font-medium flex items-center gap-2"
            style={{ color: store.primaryColor }}
          >
            🛒 Cart {cartCount > 0 && `(${cartCount})`}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded px-3 py-2 bg-white text-gray-900"
        />
        {categories.length > 0 && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 bg-white text-gray-900"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-12">
        {products.length === 0 ? (
          <p className="text-gray-500 text-center py-12">No products found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.map((product) => {
              const inCart = cart.find((line) => line.productId === product.id);
              return (
                <div
                  key={product.id}
                  className="bg-white rounded-lg shadow overflow-hidden flex flex-col"
                >
                  <button
                    onClick={() => setDetailProduct(product)}
                    className="w-full h-40 bg-gray-100 flex items-center justify-center overflow-hidden"
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-sm">No image</span>
                    )}
                  </button>
                  <div className="p-4 flex flex-col flex-1">
                    <button
                      onClick={() => setDetailProduct(product)}
                      className="text-left"
                    >
                      <h3 className="font-semibold text-gray-900 hover:underline">
                        {product.name}
                      </h3>
                    </button>
                    {product.category && (
                      <span className="text-xs text-gray-500 mb-1">{product.category}</span>
                    )}
                    {product.description && (
                      <p className="text-sm text-gray-600 mt-1 flex-1">{product.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-bold" style={{ color: store.primaryColor }}>
                        ${product.price.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </span>
                    </div>
                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.stock === 0 || (inCart?.quantity ?? 0) >= product.stock}
                      className="mt-3 w-full text-white rounded py-2 text-sm font-medium disabled:opacity-40"
                      style={{ backgroundColor: store.primaryColor }}
                    >
                      {inCart ? `In cart (${inCart.quantity})` : 'Add to cart'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product detail modal */}
      {detailProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setDetailProduct(null)}
          />
          <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full overflow-hidden">
            <button
              onClick={() => setDetailProduct(null)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl leading-none z-10"
            >
              ×
            </button>
            <div className="w-full h-64 bg-gray-100 flex items-center justify-center overflow-hidden">
              {detailProduct.image ? (
                <img
                  src={detailProduct.image}
                  alt={detailProduct.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400">No image</span>
              )}
            </div>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {detailProduct.name}
              </h2>
              {detailProduct.category && (
                <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded mb-3">
                  {detailProduct.category}
                </span>
              )}
              {detailProduct.description && (
                <p className="text-gray-600 mb-4">{detailProduct.description}</p>
              )}
              <div className="flex items-center justify-between mb-4">
                <span
                  className="text-2xl font-bold"
                  style={{ color: store.primaryColor }}
                >
                  ${detailProduct.price.toFixed(2)}
                </span>
                <span className="text-sm text-gray-500">
                  {detailProduct.stock > 0
                    ? `${detailProduct.stock} in stock`
                    : 'Out of stock'}
                </span>
              </div>
              <button
                onClick={() => {
                  addToCart(detailProduct);
                  setDetailProduct(null);
                }}
                disabled={detailProduct.stock === 0}
                className="w-full text-white rounded py-3 font-medium disabled:opacity-40"
                style={{ backgroundColor: store.primaryColor }}
              >
                Add to cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowCart(false)}
          />
          <div className="relative bg-white w-full max-w-md h-full shadow-xl flex flex-col">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Your Cart</h2>
              <button
                onClick={() => setShowCart(false)}
                className="text-gray-400 hover:text-gray-700 text-xl"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <p className="text-gray-500">Your cart is empty.</p>
              ) : (
                cart.map((line) => (
                  <div key={line.productId} className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{line.name}</p>
                      <p className="text-gray-500 text-xs">${line.price.toFixed(2)} each</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(line.productId, line.quantity - 1)}
                        className="w-7 h-7 border border-gray-300 rounded text-gray-700"
                      >
                        −
                      </button>
                      <span className="w-6 text-center text-sm">{line.quantity}</span>
                      <button
                        onClick={() => updateQuantity(line.productId, line.quantity + 1)}
                        disabled={line.quantity >= line.maxStock}
                        className="w-7 h-7 border border-gray-300 rounded text-gray-700 disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(line.productId)}
                      className="text-red-500 text-xs font-medium ml-2"
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t">
                <div className="flex justify-between mb-4 font-semibold text-gray-900">
                  <span>Total</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>

                {!showCheckoutForm ? (
                  <button
                    onClick={() => setShowCheckoutForm(true)}
                    className="w-full text-white rounded py-2 font-medium"
                    style={{ backgroundColor: store.primaryColor }}
                  >
                    Checkout
                  </button>
                ) : (
                  <form onSubmit={handleCheckout} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700">
                        Your name
                      </label>
                      <input
                        type="text"
                        value={shopperName}
                        onChange={(e) => setShopperName(e.target.value)}
                        required
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-gray-700">
                        Email
                      </label>
                      <input
                        type="email"
                        value={shopperEmail}
                        onChange={(e) => setShopperEmail(e.target.value)}
                        required
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 bg-white"
                      />
                    </div>
                    {checkoutError && (
                      <p className="text-red-600 text-xs">{checkoutError}</p>
                    )}
                    <button
                      type="submit"
                      disabled={checkoutSubmitting}
                      className="w-full text-white rounded py-2 font-medium disabled:opacity-50"
                      style={{ backgroundColor: store.primaryColor }}
                    >
                      {checkoutSubmitting ? 'Placing order...' : 'Place order'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}