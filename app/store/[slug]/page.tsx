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

export default function PublicStorePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

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
          <p className="text-gray-500">
            No store exists at this address.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Store header / branding */}
      <div
        className="px-4 py-12 text-white"
        style={{ backgroundColor: store.primaryColor }}
      >
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          {store.logo && (
            <img
              src={store.logo}
              alt={store.name}
              className="w-16 h-16 rounded-full bg-white object-cover"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold">{store.name}</h1>
            {store.tagline && (
              <p className="opacity-90 mt-1">{store.tagline}</p>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
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

      {/* Product grid */}
      <div className="max-w-5xl mx-auto px-4 pb-12">
        {products.length === 0 ? (
          <p className="text-gray-500 text-center py-12">
            No products found.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow overflow-hidden flex flex-col"
              >
                <div className="w-full h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-400 text-sm">No image</span>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  {product.category && (
                    <span className="text-xs text-gray-500 mb-1">
                      {product.category}
                    </span>
                  )}
                  {product.description && (
                    <p className="text-sm text-gray-600 mt-1 flex-1">
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span
                      className="font-bold"
                      style={{ color: store.primaryColor }}
                    >
                      ${product.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-gray-500">
                      {product.stock > 0
                        ? `${product.stock} in stock`
                        : 'Out of stock'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}