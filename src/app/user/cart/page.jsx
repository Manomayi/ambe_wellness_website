"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import {
  collection,
  query,
  onSnapshot,
  deleteDoc,
  updateDoc,
  doc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { TrashIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import { loadStripe } from '@stripe/stripe-js';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function CartPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [tax, setTax] = useState(0);

  useEffect(() => {
    if (!user) return;

    // Listen to cart items
    const cartQuery = query(collection(db, 'users', user.uid, 'cart'));
    
    const unsubscribe = onSnapshot(cartQuery, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCartItems(items);
      
      // Calculate totals
      const sub = items.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
      
      setSubtotal(sub);
      setTax(sub * 0.08); // 8% tax
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      await removeItem(itemId);
      return;
    }
    
    try {
      await updateDoc(doc(db, 'users', user.uid, 'cart', itemId), {
        quantity: newQuantity,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeItem = async (itemId) => {
    if (confirm('Remove this item from cart?')) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'cart', itemId));
      } catch (error) {
        console.error('Error removing item:', error);
      }
    }
  };

  const clearCart = async () => {
    if (confirm('Clear all items from cart?')) {
      try {
        const promises = cartItems.map(item => 
          deleteDoc(doc(db, 'users', user.uid, 'cart', item.id))
        );
        await Promise.all(promises);
      } catch (error) {
        console.error('Error clearing cart:', error);
      }
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    setProcessing(true);
    try {
      // Call cloud function to create Stripe checkout session
      const createCheckoutSession = httpsCallable(functions, 'createCheckoutSession');
      const { data } = await createCheckoutSession({
        items: cartItems.map(item => ({
          name: item.productName,
          variant: item.variantName,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl
        })),
        customerEmail: user.email,
        userId: user.uid
      });

      if (data.sessionId) {
        // Redirect to Stripe Checkout
        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.sessionId
        });
        
        if (error) {
          console.error('Stripe error:', error);
          alert('Checkout failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Failed to process checkout. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const total = subtotal + tax - discount;

  if (loading) {
    return (
      <ProtectedRoute userType="user">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute userType="user">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Shopping Cart</h1>
          {cartItems.length > 0 && (
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              Clear Cart
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-700 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-6">Add some products to get started</p>
            <button
              onClick={() => router.push('/user/store')}
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow">
                {cartItems.map((item) => (
                  <div key={item.id} className="p-6 border-b last:border-b-0">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.imageUrl && (
                          <img
                            src={item.imageUrl}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{item.productName}</h3>
                        {item.variantName !== 'Standard' && (
                          <p className="text-sm text-gray-600">{item.variantName}</p>
                        )}
                        <p className="text-green-600 font-medium mt-1">${item.price}</p>
                      </div>

                      {/* Quantity and Actions */}
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                          >
                            <MinusIcon className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <p className="text-sm text-gray-600">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span>
                      <span>-${discount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Tax</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-3">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={processing || cartItems.length === 0}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {processing ? 'Processing...' : 'Proceed to Checkout'}
                </button>

                <button
                  onClick={() => router.push('/user/store')}
                  className="w-full mt-3 text-gray-600 hover:text-gray-800 text-sm"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}