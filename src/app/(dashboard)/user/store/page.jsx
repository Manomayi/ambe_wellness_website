"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import DsheaDisclaimer from '@/components/common/DsheaDisclaimer';
import {
  collection,
  doc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  ShoppingCartIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

export default function UserStorePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (!user) return;
    
    // Fetch products
    fetchProducts();
    
    // Listen to cart count
    const cartQuery = collection(db, 'users', user.uid, 'cart');
    const unsubscribe = onSnapshot(cartQuery, (snapshot) => {
      const count = snapshot.docs.reduce((total, doc) => {
        return total + (doc.data().quantity || 0);
      }, 0);
      setCartCount(count);
    });

    return () => unsubscribe();
  }, [user]);

  async function fetchProducts() {
    try {
      // First try the 'products' collection
      let productsSnap = await getDocs(collection(db, 'products'));
      let items = [];
      
      if (productsSnap.empty) {
        // If no products found, try the 'store' collection structure from original code
        const storeSnap = await getDocs(collection(db, 'store'));
        storeSnap.forEach((docSnap, docIdx) => {
          const data = docSnap.data();
          (data.products || []).forEach((prod, prodIdx) => {
            const rawName = prod.product_name || `product_${prodIdx}`;
            const uniqueId = `${docSnap.id}_${rawName}_${prodIdx}`;
            items.push({
              id: uniqueId,
              name: rawName,
              product_name: rawName,
              variants: (prod.packs || []).map((pack, idx) => ({
                id: `pack_${prodIdx}_${idx}_${pack.size || ''}`,
                name: pack.size,
                price: parseFloat(pack.mrp) || 0,
                original_price: parseFloat(pack.mrp) || 0
              })),
              price: prod.packs?.[0]?.mrp || 0,
              category: 'all',
              imageUrl: prod.image_url || null
            });
          });
        });
      } else {
        // Use products collection data
        productsSnap.forEach((docSnap, docIdx) => {
          const data = docSnap.data();
          const rawName = data.name || data.product_name || `product_${docIdx}`;
          items.push({
            id: docSnap.id || `product_${docIdx}`,
            ...data,
            name: rawName,
            imageUrl: data.image_url || data.imageUrl || null
          });
        });
      }
      
      const categorySet = new Set(['all']);
      items.forEach(item => {
        if (item.category) {
          categorySet.add(item.category);
        }
      });
      
      console.log('Fetched products:', items); // Debug log
      setProducts(items);
      setCategories(Array.from(categorySet));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  }

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(search) || 
                         p.description?.toLowerCase().includes(search);
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <ProtectedRoute userType="user">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[#C8996A] border-t-transparent" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute userType="user">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-[#1A1A1A]">Store</h1>
          <button
            onClick={() => router.push('/user/cart')}
            className="bg-[#1A1A1A] hover:bg-[#353535] text-[#FFD3AC] py-2.5 px-5 rounded-lg flex items-center gap-2 font-medium text-sm transition shadow flex-shrink-0"
          >
            <ShoppingCartIcon className="h-5 w-5" />
            <span>View Cart</span>
            {cartCount > 0 && (
              <span className="bg-[#FFD3AC] text-[#1A1A1A] px-2 py-0.5 rounded-full text-sm font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#8C827A]" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value.toLowerCase())}
              className="w-full pl-10 pr-4 py-3 bg-white border border-[#E7E2D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8996A] text-sm text-[#1A1A1A]"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedCategory === category
                    ? 'bg-[#1A1A1A] text-[#FFD3AC]'
                    : 'bg-white border border-[#E7E2D9] text-[#535353] hover:bg-[#FAF8F5]'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white border border-[#E7E2D9] rounded-xl">
            <p className="text-gray-500">No products found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredProducts.map((product, index) => (
              <ProductCard key={`${product.id}-${index}`} product={product} />
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

function ProductCard({ product }) {
  const { user } = useAuth();
  const [selectedVariant, setSelectedVariant] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  const variants = product.variants || [];
  const selectedVariantData = variants.find(v => v.id === selectedVariant);
  const price = selectedVariantData?.price || product.price || 0;
  const originalPrice = selectedVariantData?.original_price || product.original_price || price;
  const discount = originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  async function addToCart() {
    if (variants.length > 0 && !selectedVariant) {
      alert('Please select a variant');
      return;
    }

    setAdding(true);
    try {
      const cartRef = collection(db, 'users', user.uid, 'cart');
      const q = query(
        cartRef,
        where('productId', '==', product.id),
        where('variantId', '==', selectedVariant || 'default')
      );
      
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        // Update existing cart item
        const docRef = snap.docs[0].ref;
        const currentQty = snap.docs[0].data().quantity;
        await updateDoc(docRef, { 
          quantity: currentQty + quantity,
          price: price,
          updatedAt: new Date()
        });
      } else {
        // Add new cart item
        await addDoc(cartRef, {
          productId: product.id,
          productName: product.name,
          variantId: selectedVariant || 'default',
          variantName: selectedVariantData?.name || 'Standard',
          price: price,
          originalPrice: originalPrice,
          quantity: quantity,
          imageUrl: product.imageUrl,
          addedAt: new Date()
        });
      }
      
      // Reset after adding
      setQuantity(1);
      setSelectedVariant('');
      alert('Added to cart successfully!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add to cart. Please try again.');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="bg-white border border-[#E7E2D9] rounded-xl shadow-sm overflow-hidden hover:shadow-md transition flex flex-col sm:flex-row min-w-0">
      {/* Product Image */}
      <div className="w-full sm:w-2/5 flex-shrink-0 bg-[#FAF8F5] relative flex items-center justify-center p-4 min-h-[240px]">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="text-4xl text-[#C8996A]">🌿</div>
        )}
        {discount > 0 && (
          <span className="absolute top-2 right-2 bg-[#FFD3AC] text-[#1A1A1A] text-xs font-bold px-2 py-1 rounded">
            {discount}% OFF
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 min-w-0 p-4 sm:p-5">
        <h3 className="font-semibold text-lg text-[#1A1A1A] mb-2">{product.name}</h3>
        {product.description && (
          <p className="text-sm text-[#6B6862] mb-3 line-clamp-2">{product.description}</p>
        )}

        {/* DSHEA / FDA disclaimer */}
        <DsheaDisclaimer className="mb-3" />

        {/* Price */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg font-bold text-[#1A1A1A]">${price}</span>
          {originalPrice > price && (
            <span className="text-sm text-[#8C827A] line-through">${originalPrice}</span>
          )}
        </div>

        {/* Variant Selection */}
        {variants.length > 0 && (
          <select
            value={selectedVariant}
            onChange={e => setSelectedVariant(e.target.value)}
            className="w-full mb-3 p-2 border border-[#E7E2D9] bg-[#FAF8F5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C8996A] text-sm text-[#1A1A1A] font-medium"
          >
            <option value="">Select Option</option>
            {variants.map((variant, vIdx) => (
              <option key={`${variant.id || 'variant'}-${vIdx}`} value={variant.id}>
                {variant.name} - ${variant.price}
              </option>
            ))}
          </select>
        )}

        {/* Quantity Selector */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-[#1A1A1A] font-medium">Quantity:</span>
          <div className="flex items-center border border-[#E7E2D9] rounded-full overflow-hidden bg-[#FAF8F5]">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              aria-label="Decrease quantity"
              className="w-9 h-9 hover:bg-[#E7E2D9] flex items-center justify-center text-lg font-bold text-[#1A1A1A] leading-none transition"
            >
              −
            </button>
            <span className="w-10 text-center font-bold text-sm text-[#1A1A1A]">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              aria-label="Increase quantity"
              className="w-9 h-9 hover:bg-[#E7E2D9] flex items-center justify-center text-lg font-bold text-[#1A1A1A] leading-none transition"
            >
              +
            </button>
          </div>
        </div>

        {/* Add to Cart Button */}
        <button
          onClick={addToCart}
          disabled={adding}
          className="w-full bg-[#FFD3AC] hover:bg-[#1A1A1A] text-[#1A1A1A] hover:text-white py-2.5 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
        >
          {adding ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}