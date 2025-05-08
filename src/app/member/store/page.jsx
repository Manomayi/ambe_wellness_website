'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc
} from 'firebase/firestore';
import {
  BellIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';

export default function MemberStorePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);

  // redirect if not authenticated
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      if (!u) return router.push('/login');
      setUser(u);
      // fetch products
      fetchProducts();
    });
    return () => unsub();
  }, [router]);

  async function fetchProducts() {
    const storeSnap = await getDocs(collection(db, 'store'));
    const items = [];
    storeSnap.forEach(docSnap => {
      const data = docSnap.data();
      (data.products || []).forEach(prod => {
        items.push({
          productName: prod.product_name,
          packs: prod.packs || []
        });
      });
    });
    setProducts(items);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-4 border-green-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-gray-800">Store</h1>
        <button
          onClick={() => router.push('/member/menu/cart')}
          className="relative p-2 rounded-full hover:bg-gray-100 transition"
        >
          <ShoppingCartIcon className="h-6 w-6 text-gray-600" />
          {/* Optionally badge count here */}
        </button>
      </div>

      {/* Search */}
      <div className="w-full max-w-md">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value.toLowerCase())}
          className="w-full p-3 border text-black border-gray-300 bg-white rounded-lg focus:outline-none focus:border-green-600"
        />
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products
          .filter(p => p.productName.toLowerCase().includes(search))
          .map((prod, idx) => (
            <ProductCard key={idx} product={prod} user={user} />
          ))}
      </div>
    </div>
  );
}

function ProductCard({ product, user }) {
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(0);

  async function addToCart() {
    if (!selectedSize || quantity < 1) {
      alert('Select size and quantity.');
      return;
    }
    const cartRef = collection(db, 'patients', user.uid, 'cart');
    const q = query(
      cartRef,
      where('productName', '==', product.productName),
      where('size', '==', selectedSize)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const docRef = snap.docs[0].ref;
      const currentQty = snap.docs[0].data().quantity;
      await updateDoc(docRef, { quantity: currentQty + quantity });
    } else {
      await addDoc(cartRef, {
        productName: product.productName,
        size: selectedSize,
        quantity
      });
    }
    alert(`${quantity} x ${selectedSize} added to cart!`);
    setQuantity(0);
    setSelectedSize('');
  }

  return (
    <div className="bg-white shadow-lg rounded-xl p-6 flex flex-col">
      <h3 className="text-lg font-medium text-gray-900 mb-2">{product.productName}</h3>
      <select
        value={selectedSize}
        onChange={e => setSelectedSize(e.target.value)}
        className="mt-2 p-2 border text-gray-600 border-gray-100 rounded-lg focus:outline-none focus:border-green-600"
      >
        <option value="" disabled>Select Size</option>
        {product.packs.map((pack, i) => (
          <option key={i} value={pack.size}>{pack.size} - ${pack.mrp}</option>
        ))}
      </select>
      <div className="mt-4 flex items-center justify-center space-x-4 py-4">
        <button
          onClick={() => setQuantity(q => Math.max(q - 1, 0))}
          className="p-2 bg-gray-100 text-black rounded-full hover:bg-gray-200 transition"
        >-
        </button>
        <span className="text-gray-800">{quantity}</span>
        <button
          onClick={() => setQuantity(q => q + 1)}
          className="p-2 bg-gray-100 text-black rounded-full hover:bg-gray-200 transition"
        >+</button>
      </div>
      <button
        onClick={addToCart}
        className="mt-auto bg-green-600 uppercase font-bold text-sm border border-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition flex items-center justify-center space-x-2"
      >
        <span>Add to Cart</span>
      </button>
    </div>
  );
}