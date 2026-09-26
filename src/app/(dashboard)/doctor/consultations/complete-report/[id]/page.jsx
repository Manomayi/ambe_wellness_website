"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/common/ProtectedRoute';
import AmbeBackButton from '@/components/common/AmbeBackButton';
import WebLayoutWrapper from '@/components/common/WebLayoutWrapper';
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  writeBatch,
  serverTimestamp,
  Timestamp,
  increment,
  addDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { classifyOutcome } from '@/lib/refundPolicy';
import { generateCartItemId } from '@/lib/cartUtils';
import ProductDetailsModal from '@/components/user/store/ProductDetailsModal';
import {
  XMarkIcon,
  CheckIcon,
  PlusIcon,
  MinusIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  ShoppingBagIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  AdjustmentsHorizontalIcon,
  ShoppingCartIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

// SVG Icons matching Flutter mobile app exactly
function MedicalBriefcaseIcon({ className = "w-7 h-7 text-[#FFD3AC]" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006A2.18 2.18 0 0118.75 15h-13.5a2.18 2.18 0 01-1.5-.615m16.5 0c-.394.394-.928.615-1.5.615H5.25a2.18 2.18 0 01-1.5-.615m0 0a2.18 2.18 0 01-.75-1.661V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v1.069m6 0H7.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v5m-2.5-2.5h5" />
    </svg>
  );
}

function LifestyleIcon({ className = "w-5 h-5 text-[#FFD3AC]" }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  );
}

function DietIcon({ className = "w-5 h-5 text-[#FFD3AC]" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41 9.77-9.75zm.52-5.55c.78-.78 2.05-.78 2.83 0 .78.78.78 2.05 0 2.83-.78.78-2.05.78-2.83 0-.79-.79-.79-2.05 0-2.83z"/>
    </svg>
  );
}

function ExerciseIcon({ className = "w-5 h-5 text-[#FFD3AC]" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29l-1.43-1.43z"/>
    </svg>
  );
}

function YogaMeditationIcon({ className = "w-5 h-5 text-[#FFD3AC]" }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm8 15.5c-.5-1.2-1.6-2-3-2.3l-2.2-.4.6-2.8 2.6 1c.5.2 1.1 0 1.3-.5.2-.5 0-1.1-.5-1.3l-3.3-1.3c-.4-.1-.8 0-1.1.2l-2.4 1.8-2.4-1.8c-.3-.2-.7-.3-1.1-.2L5.2 16c-.5.2-.7.8-.5 1.3.2.5.8.7 1.3.5l2.6-1 .6 2.8-2.2.4c-1.4.3-2.5 1.1-3 2.3-.3.8-.1 1.7.5 2.2.6.5 1.5.5 2.1 0l2.3-1.9 1.1 1.4h4l1.1-1.4 2.3 1.9c.3.2.7.4 1.1.4.3 0 .7-.1 1-.3.6-.6.8-1.5.5-2.3z"/>
    </svg>
  );
}

const CATEGORIES = [
  { key: 'lifestyle', label: 'Lifestyle', icon: LifestyleIcon },
  { key: 'diet', label: 'Diet', icon: DietIcon },
  { key: 'exercise', label: 'Exercise', icon: ExerciseIcon },
  { key: 'yoga_meditation', label: 'Yoga & Meditation', icon: YogaMeditationIcon },
];

const HEALTH_FIELDS = [
  { key: 'generalHealth', label: 'General Health' },
  { key: 'womensHealth', label: "Women's Health" },
  { key: 'mensHealth', label: "Men's Health" },
  { key: 'muscularSkeletal', label: 'Muscular Skeletal' },
  { key: 'heartHealth', label: 'Heart Health' },
  { key: 'skinHairHealth', label: 'Skin & Hair Health' },
  { key: 'mentalEmotionalHealth', label: 'Mental & Emotional Health' },
  { key: 'digestiveMetabolic', label: 'Digestive & Metabolic' },
  { key: 'oncology', label: 'Oncology' },
  { key: 'disabilities', label: 'Disabilities' },
  { key: 'behavorial', label: 'Behavioral' },
];

export default function CompleteReportPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const rawUserUid = searchParams.get('userUid') || searchParams.get('user_uid') || searchParams.get('userId') || '';
  const rawUserName = searchParams.get('userName') || searchParams.get('user_name') || 'Patient';
  const rawTimeMillis = searchParams.get('time') || '';

  const [appointmentData, setAppointmentData] = useState(null);
  const [resolvedUserUid, setResolvedUserUid] = useState(rawUserUid);
  const [resolvedUserName, setResolvedUserName] = useState(rawUserName);
  const [resolvedTime, setResolvedTime] = useState(null);

  // Derived effective values that always stay up-to-date
  const userUid = resolvedUserUid || rawUserUid || appointmentData?.user_id || appointmentData?.userId || appointmentData?.user_uid || appointmentData?.patient_id || appointmentData?.patient_uid || '';
  const userName = (resolvedUserName && resolvedUserName !== 'Patient') ? resolvedUserName : (rawUserName && rawUserName !== 'Patient' ? rawUserName : (appointmentData?.user_name || appointmentData?.userName || appointmentData?.patient_name || 'Patient'));
  const timeMillis = rawTimeMillis || (resolvedTime?.toMillis ? String(resolvedTime.toMillis()) : (appointmentData?.time?.toMillis ? String(appointmentData.time.toMillis()) : ''));

  // Effect to resolve appointment data if not fully provided in query params
  useEffect(() => {
    if (!params.id) return;
    const fetchAppointmentDetails = async () => {
      try {
        let apptDoc = null;
        const apptId = String(params.id);
        const decodedApptId = decodeURIComponent(apptId);

        // 1. Try doctors/{doctorUid}/appointments_reports_to_finish/{id} (both raw and decoded)
        if (user?.uid) {
          try {
            const finishSnap = await getDoc(doc(db, 'doctors', user.uid, 'appointments_reports_to_finish', apptId));
            if (finishSnap.exists()) {
              apptDoc = { ...finishSnap.data(), _sourceDocId: finishSnap.id };
            } else if (decodedApptId !== apptId) {
              const finishSnapDecoded = await getDoc(doc(db, 'doctors', user.uid, 'appointments_reports_to_finish', decodedApptId));
              if (finishSnapDecoded.exists()) {
                apptDoc = { ...finishSnapDecoded.data(), _sourceDocId: finishSnapDecoded.id };
              }
            }
          } catch (e) {
            console.warn('Could not read from appointments_reports_to_finish:', e);
          }
        }

        // 2. Try consultations/{id} (both raw and decoded)
        if (!apptDoc) {
          try {
            let consSnap = await getDoc(doc(db, 'consultations', apptId));
            if (!consSnap.exists() && decodedApptId !== apptId) {
              consSnap = await getDoc(doc(db, 'consultations', decodedApptId));
            }
            if (consSnap.exists()) {
              apptDoc = consSnap.data();
            }
          } catch (e) {
            console.warn('Could not read from consultations:', e);
          }
        }

        // 3. Try doctors/{doctorUid}/appointments_upcoming/{id}
        if (!apptDoc && user?.uid) {
          try {
            let upSnap = await getDoc(doc(db, 'doctors', user.uid, 'appointments_upcoming', apptId));
            if (!upSnap.exists() && decodedApptId !== apptId) {
              upSnap = await getDoc(doc(db, 'doctors', user.uid, 'appointments_upcoming', decodedApptId));
            }
            if (upSnap.exists()) {
              apptDoc = upSnap.data();
            }
          } catch (e) {
            console.warn('Could not read from appointments_upcoming:', e);
          }
        }

        // 4. Collection fallback: scan doctors/{doctorUid}/appointments_reports_to_finish for matching document
        if (!apptDoc && user?.uid) {
          try {
            const repSnap = await getDocs(collection(db, 'doctors', user.uid, 'appointments_reports_to_finish'));
            const matchedDoc = repSnap.docs.find((d) => {
              const dData = d.data();
              return (
                d.id === apptId ||
                d.id === decodedApptId ||
                dData.appointment_id === apptId ||
                dData.appointment_id === decodedApptId ||
                dData.original_appointment_id === apptId ||
                dData.original_appointment_id === decodedApptId ||
                dData.consultation_id === apptId ||
                dData.consultation_id === decodedApptId ||
                (rawUserUid && (dData.user_id === rawUserUid || dData.userId === rawUserUid))
              );
            }) || (repSnap.docs.length === 1 ? repSnap.docs[0] : null);

            if (matchedDoc) {
              apptDoc = { ...matchedDoc.data(), _sourceDocId: matchedDoc.id };
            }
          } catch (e) {
            console.warn('Could not scan appointments_reports_to_finish:', e);
          }
        }

        if (apptDoc) {
          setAppointmentData(apptDoc);
          const foundUid = apptDoc.user_id || apptDoc.userId || apptDoc.user_uid || apptDoc.patient_id || apptDoc.patient_uid;
          if (foundUid) {
            setResolvedUserUid((prev) => prev || foundUid);
          }
          const foundName = apptDoc.user_name || apptDoc.userName || apptDoc.patient_name;
          if (foundName) {
            setResolvedUserName((prev) => (!prev || prev === 'Patient') ? foundName : prev);
          }
          if (apptDoc.time) {
            setResolvedTime(apptDoc.time);
          }
        }
      } catch (err) {
        console.error('Error resolving appointment details:', err);
      }
    };

    fetchAppointmentDetails();
  }, [params.id, user?.uid, rawUserUid]);

  // Step state: 1: Recommendations, 2: Your Notes, 3: Store Recommendations, 4: Consultation Summary
  const [step, setStep] = useState(1);

  // Lock body scroll in Step 3 so ONLY the products grid is scrollable
  useEffect(() => {
    // Always instantly reset window scroll on any step change to prevent mobile Safari viewport clipping
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    if (step === 3) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [step]);

  // Recommendations state
  const [notesByCategory, setNotesByCategory] = useState({
    lifestyle: '',
    diet: '',
    exercise: '',
    yoga_meditation: '',
  });

  // Doctor referral state
  const [selectedReferral, setSelectedReferral] = useState(null);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralSearch, setReferralSearch] = useState('');
  const [referralTab, setReferralTab] = useState('specialty'); // 'specialty' | 'doctor'
  const [allDoctors, setAllDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  // Step 2: Notes
  const [overallNotes, setOverallNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  // Step 3: Store Products
  const [storeProducts, setStoreProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedCategoryId, setExpandedCategoryId] = useState(null);
  const [sortOption, setSortOption] = useState('Popularity'); // 'Popularity' | 'NameAtoZ' | 'None'
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [pickerSelections, setPickerSelections] = useState({});
  const [selectedProductForModal, setSelectedProductForModal] = useState(null);

  // Active expanded category document
  const activeExpandedCategory = useMemo(() => {
    if (!expandedCategoryId) return null;
    return categories.find((c) => c.id === expandedCategoryId) || null;
  }, [categories, expandedCategoryId]);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load store products & categories from Firestore (matching user store page 1:1)
  useEffect(() => {
    const loadProducts = async () => {
      try {
        // 1. Fetch categories directly from 'categories' collection
        let loadedCats = [];
        try {
          const catSnap = await getDocs(collection(db, 'categories'));
          loadedCats = catSnap.docs
            .map((doc) => {
              const data = doc.data();
              const rawSubs = data.subcategories;
              const subs = Array.isArray(rawSubs)
                ? rawSubs.map((s) => String(s || '').trim()).filter(Boolean)
                : [];
              return {
                id: doc.id,
                name: data.name || '',
                subcategories: subs,
              };
            })
            .filter((c) => c.name.length > 0);
        } catch (catErr) {
          console.error('Error loading categories:', catErr);
        }

        // 2. Fetch products from 'store'
        const snap = await getDocs(collection(db, 'store'));
        const flattened = [];
        const foundCategories = new Set();

        snap.docs.forEach((shopDoc) => {
          const shopData = shopDoc.data();
          if (shopData.is_active === false) return;

          const products = Array.isArray(shopData.products) ? shopData.products : [];
          if (products.length > 0) {
            products.forEach((product, index) => {
              if (product?.product_name && Array.isArray(product.packs)) {
                const cat = product.category || shopData.category || '';
                const sub = product.subcategory || product.sub_category || shopData.subcategory || '';
                if (cat) foundCategories.add(cat);
                const imageUrl =
                  product.image_url ||
                  product.imageUrl ||
                  (Array.isArray(product.image_urls) ? product.image_urls[0] : null) ||
                  product.image ||
                  null;
                flattened.push({
                  ...product,
                  salesCount: Number(product.sales_count ?? product.salesCount) || 0,
                  rating: Number(product.rating ?? product.avg_rating) || 0,
                  reviewCount: Number(product.review_count ?? product.reviewCount) || 0,
                  category: cat,
                  subcategory: sub,
                  imageUrl,
                  shop_id: shopDoc.id,
                  productKey: `${shopDoc.id}_${index}`,
                });
              }
            });
          } else if (shopData.product_name || shopData.name) {
            const rawName = shopData.product_name || shopData.name;
            const cat = shopData.category || '';
            const sub = shopData.subcategory || shopData.sub_category || '';
            if (cat) foundCategories.add(cat);
            const imageUrl =
              shopData.image_url ||
              shopData.imageUrl ||
              (Array.isArray(shopData.image_urls) ? shopData.image_urls[0] : null) ||
              shopData.image ||
              null;
            flattened.push({
              ...shopData,
              salesCount: Number(shopData.sales_count ?? shopData.salesCount) || 0,
              rating: Number(shopData.rating ?? shopData.avg_rating) || 0,
              reviewCount: Number(shopData.review_count ?? shopData.reviewCount) || 0,
              product_name: rawName,
              category: cat,
              subcategory: sub,
              imageUrl,
              shop_id: shopDoc.id,
              productKey: shopDoc.id,
            });
          }
        });

        // 3. Fallback to 'products' collection if store was empty
        if (flattened.length === 0) {
          const pSnap = await getDocs(collection(db, 'products')).catch(() => null);
          if (pSnap && !pSnap.empty) {
            pSnap.docs.forEach((d, idx) => {
              const data = d.data();
              const rawName = data.product_name || data.name || data.title;
              const cat = data.category || '';
              const sub = data.subcategory || data.sub_category || '';
              if (cat) foundCategories.add(cat);
              const imageUrl =
                data.image_url ||
                data.imageUrl ||
                (Array.isArray(data.image_urls) ? data.image_urls[0] : null) ||
                data.image ||
                null;
              flattened.push({
                ...data,
                salesCount: Number(data.sales_count ?? data.salesCount) || 0,
                rating: Number(data.rating ?? data.avg_rating) || 0,
                reviewCount: Number(data.review_count ?? data.reviewCount) || 0,
                product_name: rawName,
                category: cat,
                subcategory: sub,
                imageUrl,
                shop_id: d.id,
                productKey: `prod_${idx}`,
              });
            });
          }
        }

        // Add any discovered categories not yet in loadedCats
        foundCategories.forEach((catName) => {
          if (!loadedCats.some((c) => c.name.toLowerCase() === catName.toLowerCase())) {
            loadedCats.push({
              id: catName,
              name: catName,
              subcategories: [],
            });
          }
        });

        setStoreProducts(flattened);
        setCategories(loadedCats);
      } catch (err) {
        console.error('Error loading store products:', err);
      } finally {
        setProductsLoading(false);
      }
    };
    loadProducts();
  }, []);

  // Load doctors for referral modal
  useEffect(() => {
    if (!showReferralModal || allDoctors.length > 0) return;
    const loadDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const snap = await getDocs(collection(db, 'doctors'));
        const docsList = snap.docs.map((d) => ({
          uid: d.id,
          ...d.data(),
        })).filter((d) => d.uid !== user?.uid); // Don't refer to oneself
        setAllDoctors(docsList);
      } catch (err) {
        console.error('Error loading doctors:', err);
      } finally {
        setLoadingDoctors(false);
      }
    };
    loadDoctors();
  }, [showReferralModal, allDoctors.length, user?.uid]);

  const updateCategory = (key, value) => {
    setNotesByCategory((prev) => ({ ...prev, [key]: value }));
  };

  const setPickerSelection = (productKey, field, value) => {
    setPickerSelections((prev) => ({
      ...prev,
      [productKey]: { ...prev[productKey], [field]: value },
    }));
  };

  const addProductToRecommendations = (product, explicitSize, explicitQuantity) => {
    const selection = pickerSelections[product.productKey] || {};
    const size = explicitSize || selection.size || product.packs?.[0]?.size || 'Standard';
    const quantity = explicitQuantity != null ? Number(explicitQuantity) : (Number(selection.quantity) > 0 ? Number(selection.quantity) : 1);
    if (!size || quantity <= 0) return;

    const pack = product.packs?.find((p) => p.size === size) || product.packs?.[0] || {};

    const itemId = generateCartItemId(product.product_name, size, product.product_id);
    const newItem = {
      item_id: itemId,
      product_id: product.product_id || null,
      product_name: product.product_name,
      size,
      mrp: Number(pack.mrp) || 0,
      price: pack.price != null ? Number(pack.price) : (Number(product.price) || null),
      shop_id: product.shop_id || null,
      imageUrl: product.imageUrl || null,
      image_url: product.imageUrl || null,
      quantity,
      doctor_recommended: true,
    };

    setRecommendedProducts((prev) => {
      const existingIndex = prev.findIndex((item) => item.item_id === itemId);
      if (existingIndex === -1) return [...prev, newItem];
      const updated = [...prev];
      updated[existingIndex] = { ...newItem, quantity: updated[existingIndex].quantity + quantity };
      return updated;
    });

    setPickerSelections((prev) => ({ ...prev, [product.productKey]: {} }));
  };

  const removeRecommendedProduct = (itemId) => {
    setRecommendedProducts((prev) => prev.filter((item) => item.item_id !== itemId));
  };

  const totalCartCount = useMemo(() => {
    return recommendedProducts.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0);
  }, [recommendedProducts]);

  const filteredProducts = useMemo(() => {
    const searchLower = productSearch.toLowerCase().trim();

    const filtered = storeProducts.filter((p) => {
      if (p.is_active === false || p.isActive === false) return false;

      // Search match
      const matchesSearch =
        !searchLower ||
        (p.product_name && p.product_name.toLowerCase().includes(searchLower)) ||
        (p.category && p.category.toLowerCase().includes(searchLower)) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(searchLower)) ||
        (p.description && p.description.toLowerCase().includes(searchLower));

      // Category match
      let matchesCategory = true;
      if (selectedCategory && selectedCategory !== 'All') {
        const sel = selectedCategory.toLowerCase().trim();
        const cat = (p.category || '').toLowerCase().trim();
        const sub = (p.subcategory || '').toLowerCase().trim();

        // 1. Direct or partial match
        let directMatch = cat === sel || sub === sel || cat.includes(sel) || sub.includes(sel);

        // 2. If user clicked a parent category that has subcategories (e.g. Shop By Needs)
        if (!directMatch && activeExpandedCategory && activeExpandedCategory.name.toLowerCase() === sel) {
          const subList = (activeExpandedCategory.subcategories || []).map((s) => s.toLowerCase());
          if (subList.some((s) => cat.includes(s) || sub.includes(s) || s.includes(cat) || s.includes(sub))) {
            directMatch = true;
          }
        }

        matchesCategory = directMatch;
      }

      return matchesSearch && matchesCategory;
    });

    return [...filtered].sort((a, b) => {
      if (sortOption === 'PriceLowToHigh') {
        const aPrice = (a.packs && a.packs.length > 0 && a.packs[0].price != null) ? Number(a.packs[0].price) : (Number(a.price) || 0);
        const bPrice = (b.packs && b.packs.length > 0 && b.packs[0].price != null) ? Number(b.packs[0].price) : (Number(b.price) || 0);
        return aPrice - bPrice;
      }
      if (sortOption === 'PriceHighToLow') {
        const aPrice = (a.packs && a.packs.length > 0 && a.packs[0].price != null) ? Number(a.packs[0].price) : (Number(a.price) || 0);
        const bPrice = (b.packs && b.packs.length > 0 && b.packs[0].price != null) ? Number(b.packs[0].price) : (Number(b.price) || 0);
        return bPrice - aPrice;
      }
      if (sortOption === 'Popularity') {
        const bySales = (b.salesCount || 0) - (a.salesCount || 0);
        if (bySales !== 0) return bySales;
        const byRating = (b.rating || 0) - (a.rating || 0);
        if (byRating !== 0) return byRating;
        const byReviews = (b.reviewCount || 0) - (a.reviewCount || 0);
        if (byReviews !== 0) return byReviews;
        return (a.product_name || a.name || '').localeCompare(b.product_name || b.name || '');
      }
      if (sortOption === 'NameAtoZ') {
        return (a.product_name || a.name || '').localeCompare(b.product_name || b.name || '');
      }
      return 0;
    });
  }, [storeProducts, productSearch, selectedCategory, activeExpandedCategory, sortOption]);

  const filteredDoctors = useMemo(() => {
    if (!referralSearch.trim()) return allDoctors;
    const q = referralSearch.toLowerCase();
    return allDoctors.filter((docItem) => {
      const name = `${docItem.first_name || ''} ${docItem.last_name || ''} ${docItem.name || ''}`.toLowerCase();
      const specialty = (docItem.field || []).join(' ').toLowerCase();
      const title = (docItem.professional_title || docItem.title || '').toLowerCase();
      return name.includes(q) || specialty.includes(q) || title.includes(q);
    });
  }, [allDoctors, referralSearch]);

  const filteredSpecialties = useMemo(() => {
    if (!referralSearch.trim()) return HEALTH_FIELDS;
    const q = referralSearch.toLowerCase();
    return HEALTH_FIELDS.filter((f) => f.label.toLowerCase().includes(q));
  }, [referralSearch]);

  const handleAssignDoctor = (docItem) => {
    const doctorName = docItem.name || `Dr. ${docItem.first_name || ''} ${docItem.last_name || ''}`.trim();
    setSelectedReferral({
      patient_uid: userUid,
      patient_name: userName,
      referred_to_doctor_uid: docItem.uid,
      referred_to_doctor_name: doctorName,
      status: 'pending',
    });
    setShowReferralModal(false);
  };

  const handleAssignSpecialty = (field) => {
    setSelectedReferral({
      patient_uid: userUid,
      patient_name: userName,
      referred_specialty: field.key,
      referred_specialty_label: field.label,
      status: 'pending',
    });
    setShowReferralModal(false);
  };

  const handleNextFromStep1 = () => {
    const missing = CATEGORIES.filter((c) => !notesByCategory[c.key].trim());
    if (missing.length > 0) {
      setError(`Please provide recommendations for: ${missing.map((c) => c.label).join(', ')}`);
      return;
    }
    setError('');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    setStep(2);
  };

  const handleNextFromStep2 = () => {
    setError('');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    setStep(3);
  };

  const handleNextFromStep3 = () => {
    setError('');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    setStep(4);
  };

  const handleBack = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    if (step > 1) {
      setStep((prev) => prev - 1);
    } else {
      router.push('/doctor/consultations');
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    const effectiveUserUid = userUid;
    const effectiveUserName = userName;

    const missing = CATEGORIES.filter((c) => !notesByCategory[c.key].trim());
    if (missing.length > 0) {
      setStep(1);
      setError(`Please provide recommendations for: ${missing.map((c) => c.label).join(', ')}`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const doctorUid = user.uid;
      const doctorName = user.displayName || 'Doctor';
      const oldAppointmentId = params.id;
      const documentId = oldAppointmentId;

      // Resolve Timestamp
      let time = Timestamp.now();
      if (timeMillis && !isNaN(Number(timeMillis))) {
        time = Timestamp.fromMillis(Number(timeMillis));
      } else if (resolvedTime?.toDate) {
        time = resolvedTime;
      } else if (appointmentData?.time?.toDate) {
        time = appointmentData.time;
      }

      const recommendations = {};
      for (const cat of CATEGORIES) {
        recommendations[cat.key] = { notes: notesByCategory[cat.key].trim() };
      }

      // Fetch existing appointment data if not already cached
      let existingApptData = appointmentData || {};
      if (effectiveUserUid) {
        try {
          const upSnap = await getDoc(doc(db, 'users', effectiveUserUid, 'appointments_upcoming', oldAppointmentId));
          if (upSnap.exists()) {
            existingApptData = { ...upSnap.data(), ...existingApptData };
          }
        } catch (_) {}
      }
      try {
        const cSnap = await getDoc(doc(db, 'consultations', oldAppointmentId));
        if (cSnap.exists()) {
          existingApptData = { ...cSnap.data(), ...existingApptData };
        }
      } catch (_) {}

      const userJoined = existingApptData.user_joined === true;
      const doctorJoined = existingApptData.doctor_joined === true;
      const outcomeStatus = classifyOutcome({ userJoined, doctorJoined });

      // Normalized store recommendations matching Flutter checkout_page.dart
      const normalizedStoreRecommendations = recommendedProducts.map((item) => ({
        ...item,
        item_id: item.item_id || `${item.shop_id || 'prod'}_${item.product_name || 'item'}_${Date.now()}`,
        doctor_recommended: true,
      }));

      // Prepare appointmentReportData (matches Flutter checkout_page.dart 1:1)
      const appointmentReportData = {
        ...existingApptData,
        user_id: effectiveUserUid,
        user_name: effectiveUserName,
        doctor_uid: doctorUid,
        doctor_id: doctorUid,
        doctor_name: doctorName,
        status: outcomeStatus,
        consultation_outcome: outcomeStatus,
        time,
        document_id: documentId,
        appointment_id: documentId,
        consultation_id: documentId,
        original_appointment_id: oldAppointmentId,
        user_joined: userJoined,
        doctor_joined: doctorJoined,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        recommendations,
        notes: overallNotes.trim(),
        ...(internalNotes.trim() ? { internal_notes: internalNotes.trim() } : {}),
        store_recommendations: normalizedStoreRecommendations,
        recommendations_added_to_cart: true,
        reviewed_by_user: false,
        ...(selectedReferral ? { referral: selectedReferral } : {}),
      };

      const batch = writeBatch(db);

      // 1. Remove from doctor's upcoming appointments
      batch.delete(doc(db, 'doctors', doctorUid, 'appointments_upcoming', oldAppointmentId));
      if (documentId && documentId !== oldAppointmentId) {
        batch.delete(doc(db, 'doctors', doctorUid, 'appointments_upcoming', documentId));
      }

      // 2. Remove from user's upcoming appointments (if user UID exists)
      if (effectiveUserUid) {
        batch.delete(doc(db, 'users', effectiveUserUid, 'appointments_upcoming', oldAppointmentId));
        if (documentId && documentId !== oldAppointmentId) {
          batch.delete(doc(db, 'users', effectiveUserUid, 'appointments_upcoming', documentId));
        }
      }

      // 3. Remove from doctor's appointments_reports_to_finish
      const reportIdsToDelete = new Set();
      const rawParamId = params?.id ? String(params.id) : '';
      const decodedParamId = rawParamId ? decodeURIComponent(rawParamId) : '';
      if (rawParamId) reportIdsToDelete.add(rawParamId);
      if (decodedParamId) reportIdsToDelete.add(decodedParamId);
      if (oldAppointmentId) reportIdsToDelete.add(oldAppointmentId);
      if (documentId) reportIdsToDelete.add(documentId);
      if (appointmentData?._sourceDocId) reportIdsToDelete.add(appointmentData._sourceDocId);
      if (appointmentData?.appointment_id) reportIdsToDelete.add(String(appointmentData.appointment_id));
      if (appointmentData?.original_appointment_id) reportIdsToDelete.add(String(appointmentData.original_appointment_id));
      if (appointmentData?.consultation_id) reportIdsToDelete.add(String(appointmentData.consultation_id));
      if (appointmentData?.document_id) reportIdsToDelete.add(String(appointmentData.document_id));

      try {
        const repSnap = await getDocs(
          collection(db, 'doctors', doctorUid, 'appointments_reports_to_finish')
        );
        repSnap.docs.forEach((d) => {
          const data = d.data();
          const docId = d.id;
          const decodedDocId = decodeURIComponent(docId);

          const isDirectMatch =
            reportIdsToDelete.has(docId) ||
            reportIdsToDelete.has(decodedDocId);

          const isFieldMatch =
            (data.appointment_id && (reportIdsToDelete.has(String(data.appointment_id)) || reportIdsToDelete.has(decodeURIComponent(String(data.appointment_id))))) ||
            (data.original_appointment_id && (reportIdsToDelete.has(String(data.original_appointment_id)) || reportIdsToDelete.has(decodeURIComponent(String(data.original_appointment_id))))) ||
            (data.consultation_id && (reportIdsToDelete.has(String(data.consultation_id)) || reportIdsToDelete.has(decodeURIComponent(String(data.consultation_id))))) ||
            (data.document_id && (reportIdsToDelete.has(String(data.document_id)) || reportIdsToDelete.has(decodeURIComponent(String(data.document_id))))) ||
            (effectiveUserUid && (data.user_id === effectiveUserUid || data.user_uid === effectiveUserUid || data.userId === effectiveUserUid));

          // If there is only 1 report in appointments_reports_to_finish, it unequivocally is this report
          const isOnlyReport = repSnap.docs.length === 1;

          if (isDirectMatch || isFieldMatch || isOnlyReport) {
            reportIdsToDelete.add(docId);
          }
        });
      } catch (err) {
        console.warn('Could not query appointments_reports_to_finish:', err);
      }

      for (const rId of reportIdsToDelete) {
        batch.delete(doc(db, 'doctors', doctorUid, 'appointments_reports_to_finish', rId));
      }

      // 4. Create/update in doctor's appointments_history collection
      batch.set(
        doc(db, 'doctors', doctorUid, 'appointments_history', documentId),
        appointmentReportData,
        { merge: true }
      );

      // 5. Create/update in user's appointments_history collection (if user UID exists)
      if (effectiveUserUid) {
        batch.set(
          doc(db, 'users', effectiveUserUid, 'appointments_history', documentId),
          appointmentReportData,
          { merge: true }
        );

        // 5b. Create notification for the patient in users/{userUid}/notifications
        const notifRef = doc(collection(db, 'users', effectiveUserUid, 'notifications'));
        batch.set(notifRef, {
          title: "Doctor's Recommendations Ready",
          body: `Please review your doctor's recommendations from your consultation with ${doctorName}.`,
          type: 'doctor_recommendation',
          report_id: documentId,
          document_id: documentId,
          appointment_id: documentId,
          doctor_name: doctorName,
          doctor_uid: doctorUid,
          is_read: false,
          created_at: serverTimestamp(),
        });

        // 5c. Set pending recommendation flag on the user document for home card
        batch.set(
          doc(db, 'users', effectiveUserUid),
          {
            pending_recommendation: {
              report_id: documentId,
              document_id: documentId,
              appointment_id: documentId,
              doctor_name: doctorName,
              doctor_uid: doctorUid,
              created_at: serverTimestamp(),
              reviewed: false,
            },
          },
          { merge: true }
        );
      }

      // 5b. Update master consultations document with report fields
      if (oldAppointmentId || documentId) {
        const consId = oldAppointmentId || documentId;
        batch.set(
          doc(db, 'consultations', consId),
          {
            status: outcomeStatus,
            consultation_outcome: outcomeStatus,
            call_status: 'ended',
            call_ended_by: 'doctor',
            call_ended_at: serverTimestamp(),
            doctor_id: doctorUid,
            doctor_name: doctorName,
            user_id: effectiveUserUid,
            user_name: effectiveUserName,
            history_appointment_id: documentId,
            appointment_id: documentId,
            consultation_id: documentId,
            recommendations,
            notes: overallNotes.trim(),
            ...(internalNotes.trim() ? { internal_notes: internalNotes.trim() } : {}),
            store_recommendations: normalizedStoreRecommendations,
            recommendations_added_to_cart: true,
            updated_at: serverTimestamp(),
            ...(selectedReferral ? { referral: selectedReferral } : {}),
          },
          { merge: true }
        );
      }

      // 6. Add recommended products to user's cart (if user UID exists)
      if (effectiveUserUid) {
        for (const item of normalizedStoreRecommendations) {
          batch.set(
            doc(db, 'users', effectiveUserUid, 'cart', item.item_id),
            item,
            { merge: true }
          );
        }
      }

      // 7. Decrement doctor's pending finish_report count
      batch.set(
        doc(db, 'doctors', doctorUid),
        {
          pending: {
            finish_report: increment(-1),
          },
        },
        { merge: true }
      );

      // COMMIT PRIMARY BATCH (matches Flutter checkout_page.dart line 245)
      await batch.commit();

      // Safeguard: direct deleteDoc on all matching report IDs
      for (const rId of reportIdsToDelete) {
        try {
          await deleteDoc(doc(db, 'doctors', doctorUid, 'appointments_reports_to_finish', rId));
        } catch (_) {}
      }

      // Background tasks (matching Flutter unawaited lines 256-320)
      // Any error here should NEVER block doctor from completing consultation
      try {
        if (effectiveUserUid) {
          const patientRef = doc(db, 'doctors', doctorUid, 'patients', effectiveUserUid);
          const patientSnap = await getDoc(patientRef);
          if (!patientSnap.exists()) {
            await setDoc(patientRef, {
              uid: effectiveUserUid,
              name: effectiveUserName,
              added_at: serverTimestamp(),
              last_consultation: serverTimestamp(),
            });
          } else {
            await updateDoc(patientRef, {
              last_consultation: serverTimestamp(),
            });
          }
        }
      } catch (patientErr) {
        console.warn('Non-fatal error updating doctor patient list:', patientErr);
      }

      // If referral was created, add to referrals collection
      if (selectedReferral) {
        try {
          await addDoc(collection(db, 'referrals'), {
            ...selectedReferral,
            patient_uid: effectiveUserUid,
            patient_name: effectiveUserName,
            referring_doctor_uid: doctorUid,
            referring_doctor_name: doctorName,
            created_at: serverTimestamp(),
          });
        } catch (refErr) {
          console.warn('Non-fatal error creating referral document:', refErr);
        }
      }

      router.push('/doctor/consultations');
    } catch (err) {
      console.error('Error submitting report:', err);
      setError('Failed to submit report: ' + (err.message || 'Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const getPageTitle = () => {
    switch (step) {
      case 1:
        return 'Recommendations';
      case 2:
        return 'Your Notes';
      case 3:
        return 'Store Recommendations';
      case 4:
        return `${userName?.split(' ')?.[0] || 'Patient'}'s Cart`;
      default:
        return 'Recommendations';
    }
  };

  return (
    <ProtectedRoute userType="doctor">
      <WebLayoutWrapper
        className={step === 3 ? 'h-full overflow-hidden' : ''}
        contentClassName={step === 3 ? 'h-full !py-0 flex flex-col' : ''}
      >
        <div
          className={`max-w-2xl mx-auto w-full relative ${
            step === 3
              ? 'h-[calc(100dvh-6rem)] md:h-[calc(100dvh-6.5rem)] flex flex-col overflow-hidden px-2 sm:px-4'
              : 'space-y-4 pb-40 md:pb-28 min-h-screen'
          }`}
        >
          {/* Top Bar (Sticky) */}
          <div
            className={`sticky top-0 md:top-16 z-30 bg-[#1E1E1E]/95 backdrop-blur-md border-b border-white/10 shadow-sm transition-all ${
              step === 3
                ? '-mx-2 sm:-mx-4 px-2 sm:px-4 pt-3.5 pb-2.5 mb-1 shrink-0'
                : '-mx-4 sm:-mx-6 px-4 sm:px-6 -mt-4 sm:-mt-6 pt-4 sm:pt-6 pb-3 mb-2 shrink-0'
            }`}
          >
            <div className="relative flex items-center justify-between">
              <AmbeBackButton onClick={handleBack} />
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-wide text-center flex-1">
                {getPageTitle()}
              </h1>
              {step === 3 ? (
                <button
                  type="button"
                  onClick={handleNextFromStep3}
                  className="relative p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-[#FFD3AC] transition cursor-pointer flex items-center justify-center shrink-0"
                  title="View Cart"
                  aria-label="View Cart"
                >
                  <ShoppingCartIcon className="w-6 h-6 text-[#FFD3AC]" />
                  {totalCartCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-[#FFD3AC] text-[#1E1E1E] text-xs font-black w-5 h-5 rounded-full flex items-center justify-center shadow-md">
                      {totalCartCount}
                    </span>
                  )}
                </button>
              ) : (
                <div className="w-10 h-10 shrink-0" />
              )}
            </div>
          </div>

          {error && (
            <div className="shrink-0 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
              {error}
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════
              STEP 1: RECOMMENDATIONS + REFER TO ANOTHER DOCTOR
             ═════════════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Header Card */}
              <div
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
                className="border border-white/20 rounded-[20px] p-6 text-center shadow-lg backdrop-blur-md"
              >
                <div
                  style={{
                    backgroundColor: 'rgba(255, 211, 172, 0.15)',
                    border: '1px solid rgba(255, 211, 172, 0.4)',
                  }}
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                >
                  <MedicalBriefcaseIcon className="w-7 h-7 text-[#FFD3AC]" />
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-2">
                  Consultation for {userName}
                </h2>
                <p className="text-white/70 text-xs sm:text-sm font-sans max-w-md mx-auto">
                  Please provide comprehensive recommendations across all health domains
                </p>
              </div>

              {/* 4 Domain Cards */}
              {CATEGORIES.map(({ key, label, icon: Icon }) => (
                <div
                  key={key}
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
                  className="border border-white/20 rounded-[18px] p-5 shadow-sm backdrop-blur-md"
                >
                  <div className="flex items-center gap-3.5 mb-3.5">
                    <div
                      style={{
                        backgroundColor: 'rgba(255, 211, 172, 0.15)',
                        border: '1px solid rgba(255, 211, 172, 0.3)',
                      }}
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    >
                      <Icon className="w-5 h-5 text-[#FFD3AC]" />
                    </div>
                    <h3 className="font-bold text-white text-base sm:text-lg tracking-wide font-sans">
                      {label}
                    </h3>
                  </div>
                  <textarea
                    value={notesByCategory[key]}
                    onChange={(e) => updateCategory(key, e.target.value)}
                    rows={3}
                    placeholder="Add your recommendations and notes here..."
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: '#ffffff',
                    }}
                    className="w-full rounded-xl border border-white/15 p-4 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-[#FFD3AC] focus:ring-1 focus:ring-[#FFD3AC] transition resize-none font-sans"
                  />
                </div>
              ))}

              {/* Refer to Another Doctor Card */}
              {selectedReferral ? (
                <div
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                  className="border-2 border-[#FFD3AC] rounded-[18px] p-5 shadow-md backdrop-blur-md"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        style={{ backgroundColor: 'rgba(255, 211, 172, 0.2)' }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      >
                        <UserPlusIcon className="w-5 h-5 text-[#FFD3AC]" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-[#FFD3AC] uppercase tracking-wider block">
                          Referral Assigned
                        </span>
                        <h4 className="font-bold text-white text-base">
                          {selectedReferral.referred_to_doctor_name ||
                            `${selectedReferral.referred_specialty_label} Specialist`}
                        </h4>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedReferral(null)}
                      className="text-white/60 hover:text-white p-1 rounded-lg transition"
                      title="Remove referral"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-white/60 text-xs mt-1 mb-3">
                    This patient will be referred to this specialist upon submitting the consultation.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowReferralModal(true)}
                    className="border border-[#FFD3AC]/60 text-[#FFD3AC] hover:bg-[#FFD3AC]/10 text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
                  >
                    Change Referral
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => setShowReferralModal(true)}
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
                  className="border border-white/20 rounded-[18px] p-4 text-center cursor-pointer hover:border-[#FFD3AC]/60 transition backdrop-blur-md group"
                >
                  <div className="flex items-center justify-center gap-3 py-1">
                    <UserPlusIcon className="w-5 h-5 text-[#FFD3AC] group-hover:scale-110 transition-transform" />
                    <span className="text-white font-bold text-base tracking-wide font-sans">
                      Refer to Another Doctor
                    </span>
                  </div>
                </div>
              )}

              {/* Floating Action Button -> Step 2 */}
              <button
                type="button"
                onClick={handleNextFromStep1}
                className="fixed bottom-24 md:bottom-8 right-5 md:right-8 z-40 w-14 h-14 rounded-2xl bg-[#FFD3AC] hover:bg-[#ffc999] text-[#1E1E1E] flex items-center justify-center shadow-2xl transition transform hover:scale-105 active:scale-95 cursor-pointer"
                title="Next"
                aria-label="Next step"
              >
                <svg className="w-6 h-6 text-[#1E1E1E]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════
              STEP 2: YOUR NOTES
             ═════════════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-4">
              {/* Info Banner */}
              <div
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
                className="border border-white/20 rounded-[18px] p-4 flex items-center gap-3 backdrop-blur-md"
              >
                <InformationCircleIcon className="w-6 h-6 text-[#FFD3AC] shrink-0" />
                <p className="text-white/70 text-sm font-sans">
                  Include any additional user details that should be saved and shared with them for future reference.
                </p>
              </div>

              {/* Notes Textarea */}
              <div
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
                className="border border-white/20 rounded-[18px] p-5 shadow-sm backdrop-blur-md"
              >
                <textarea
                  value={overallNotes}
                  onChange={(e) => setOverallNotes(e.target.value)}
                  rows={8}
                  placeholder="Enter your notes here..."
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#ffffff',
                  }}
                  className="w-full rounded-xl border border-white/15 p-4 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-[#FFD3AC] focus:ring-1 focus:ring-[#FFD3AC] transition resize-none font-sans"
                />
              </div>

              {/* Internal Notes Section (Doctor & Admin Only) */}
              <div
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
                className="border border-white/20 rounded-[18px] p-4 flex items-start gap-3 backdrop-blur-md mt-6"
              >
                <svg className="w-5 h-5 text-[#FFD3AC] shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm font-sans">Internal Notes</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFD3AC]/20 text-[#FFD3AC] font-medium border border-[#FFD3AC]/30">
                      Visible to You
                    </span>
                  </div>
                  <p className="text-white/70 text-xs font-sans mt-0.5">
                    Only visible to you. Not visible to the patient.
                  </p>
                </div>
              </div>

              {/* Internal Notes Textarea */}
              <div
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
                className="border border-white/20 rounded-[18px] p-5 shadow-sm backdrop-blur-md"
              >
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  rows={6}
                  placeholder="Enter internal notes (visible only to you)..."
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#ffffff',
                  }}
                  className="w-full rounded-xl border border-white/15 p-4 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-[#FFD3AC] focus:ring-1 focus:ring-[#FFD3AC] transition resize-none font-sans"
                />
              </div>

              {/* Floating Action Button -> Step 3 */}
              <button
                type="button"
                onClick={handleNextFromStep2}
                className="fixed bottom-24 md:bottom-8 right-5 md:right-8 z-40 w-14 h-14 rounded-2xl bg-[#FFD3AC] hover:bg-[#ffc999] text-[#1E1E1E] flex items-center justify-center shadow-2xl transition transform hover:scale-105 active:scale-95 cursor-pointer"
                title="Next: Store Recommendations"
                aria-label="Next step"
              >
                <svg className="w-6 h-6 text-[#1E1E1E]" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════
              STEP 3: STORE RECOMMENDATIONS
             ═════════════════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="flex-1 min-h-0 flex flex-col space-y-2.5 overflow-hidden">
              <p className="shrink-0 text-white/60 text-xs sm:text-sm text-center -mt-1">
                Recommend products for your patient from the store
              </p>

              {/* Search Bar */}
              <div className="shrink-0 relative">
                <MagnifyingGlassIcon className="w-5 h-5 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products to recommend..."
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    color: '#ffffff',
                  }}
                  className="w-full rounded-xl border border-white/20 pl-11 pr-4 py-2.5 sm:py-3 text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-[#FFD3AC] focus:ring-1 focus:ring-[#FFD3AC] transition"
                />
              </div>

              {/* Category Filter Pills & Expandable Subcategories */}
              <div className="shrink-0 space-y-2">
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar items-center">
                  {/* Tune / Filter button - circular dark icon button matching Flutter */}
                  <button
                    type="button"
                    onClick={() => setShowFilterModal(true)}
                    className="w-9 h-9 rounded-full bg-[#262626] hover:bg-[#333333] border border-white/10 flex items-center justify-center shrink-0 text-white transition cursor-pointer shadow-sm"
                    aria-label="Sort options"
                    title="Sort options"
                  >
                    <AdjustmentsHorizontalIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  {/* All category pill */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('All');
                      setExpandedCategoryId(null);
                    }}
                    className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer shrink-0 shadow-sm ${
                      selectedCategory === 'All'
                        ? 'bg-[#FFD3AC] text-[#1E1E1E]'
                        : 'bg-[#262626] text-white hover:bg-[#333333] border border-white/10'
                    }`}
                  >
                    All
                  </button>

                  {/* Dynamic Category Pills (Shop By Needs, etc.) */}
                  {categories.map((cat) => {
                    const subs = cat.subcategories || [];
                    const hasSubs = subs.length > 0;
                    const isOpen = expandedCategoryId === cat.id;
                    const subSelected = hasSubs && subs.includes(selectedCategory);
                    const isHighlighted = isOpen || subSelected || selectedCategory === cat.name;

                    return (
                      <button
                        key={cat.id || cat.name}
                        type="button"
                        onClick={() => {
                          if (!hasSubs) {
                            setSelectedCategory(cat.name);
                            setExpandedCategoryId(null);
                            return;
                          }
                          if (isOpen) {
                            setExpandedCategoryId(null);
                            setSelectedCategory('All');
                          } else {
                            setExpandedCategoryId(cat.id);
                            setSelectedCategory(cat.name);
                          }
                        }}
                        className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-sm ${
                          isHighlighted
                            ? 'bg-[#FFD3AC] text-[#1E1E1E]'
                            : 'bg-[#262626] text-white hover:bg-[#333333] border border-white/10'
                        }`}
                      >
                        <span>{cat.name}</span>
                        {hasSubs && (
                          isOpen ? (
                            <ChevronUpIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                          ) : (
                            <ChevronDownIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                          )
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Expanded Subcategory Pills Wrap Row */}
                {activeExpandedCategory && activeExpandedCategory.subcategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {activeExpandedCategory.subcategories.map((sub) => {
                      const isSelected = selectedCategory === sub;
                      return (
                        <button
                          key={sub}
                          type="button"
                          onClick={() => {
                            if (selectedCategory === sub) {
                              setSelectedCategory(activeExpandedCategory.name);
                            } else {
                              setSelectedCategory(sub);
                            }
                          }}
                          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer shadow-sm ${
                            isSelected
                              ? 'bg-[#FFD3AC] text-[#1E1E1E]'
                              : 'bg-[#2D2D30] text-white hover:bg-[#353538] border border-white/10'
                          }`}
                        >
                          {sub}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Products List - Only this area scrolls! */}
              <div
                className="flex-1 min-h-0 overflow-y-auto pr-1 pb-6"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'rgba(255, 211, 172, 0.4) transparent',
                }}
              >
                {productsLoading ? (
                  <p className="text-center text-sm text-white/60 py-8">Loading products...</p>
                ) : filteredProducts.length === 0 ? (
                  <p className="text-center text-sm text-white/60 py-8">No products found.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 pb-6">
                  {filteredProducts.map((product) => {
                    const selection = pickerSelections[product.productKey] || {};
                    const selectedSize = selection.size || product.packs?.[0]?.size || 'Standard';
                    const selectedQty = selection.quantity || 1;
                    const pack = product.packs?.find((p) => p.size === selectedSize) || product.packs?.[0] || {};

                    // Calculate if and how many already added
                    const alreadyAddedItems = recommendedProducts.filter(
                      (item) => item.product_name === product.product_name
                    );
                    const totalAddedQty = alreadyAddedItems.reduce((acc, curr) => acc + curr.quantity, 0);

                    return (
                      <div
                        key={product.productKey}
                        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
                        className={`border ${
                          totalAddedQty > 0 ? 'border-[#FFD3AC]' : 'border-white/15'
                        } rounded-[20px] overflow-hidden hover:border-[#FFD3AC]/60 transition flex flex-col justify-between shadow-xl backdrop-blur-md group`}
                      >
                        {/* Product Image Area matching user side store */}
                        <div
                          onClick={() => setSelectedProductForModal(product)}
                          className="w-full bg-gradient-to-b from-neutral-800 to-neutral-700 relative flex items-center justify-center p-2.5 h-32 sm:h-36 overflow-hidden cursor-pointer"
                        >
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.product_name}
                              className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.parentElement?.querySelector('.fallback-herbal-icon');
                                if (fallback) fallback.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <div className={`text-center px-2 fallback-herbal-icon ${product.imageUrl ? 'hidden' : ''}`}>
                            <span className="text-3xl sm:text-4xl mb-1 block">🌿</span>
                            <span className="text-[10px] font-semibold text-[#FFD3AC] line-clamp-1">
                              {product.product_name}
                            </span>
                          </div>

                          {/* Added Badge */}
                          {totalAddedQty > 0 && (
                            <span className="absolute top-2.5 right-2.5 bg-[#FFD3AC] text-[#1E1E1E] text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                              <CheckIcon className="w-3 h-3 stroke-[3]" />
                              <span>{totalAddedQty} Added</span>
                            </span>
                          )}
                        </div>

                        {/* Product Info Area */}
                        <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
                          <div>
                            <h4
                              onClick={() => setSelectedProductForModal(product)}
                              className="font-bold text-xs sm:text-sm text-white line-clamp-2 leading-snug group-hover:text-[#FFD3AC] transition-colors mb-1 cursor-pointer"
                            >
                              {product.product_name}
                            </h4>

                            {/* Size / Variant dropdown */}
                            {(product.packs || []).length > 1 && (
                              <div className="mt-1.5">
                                <select
                                  value={selectedSize || ''}
                                  onChange={(e) => setPickerSelection(product.productKey, 'size', e.target.value)}
                                  style={{ backgroundColor: '#252528', color: '#ffffff' }}
                                  className="w-full p-1.5 rounded-xl border border-white/15 focus:outline-none focus:border-[#FFD3AC] text-xs text-white font-medium cursor-pointer"
                                >
                                  {(product.packs || []).map((p, vIdx) => (
                                    <option key={`${p.size}-${vIdx}`} value={p.size} className="bg-[#1E1E1E] text-white">
                                      {p.size}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>

                          {/* Bottom Controls */}
                          <div className="pt-2 border-t border-white/10">
                            <div className="flex items-center gap-2">
                              {/* Quantity Stepper */}
                              <div className="flex items-center rounded-xl border border-white/15 overflow-hidden bg-black/40">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newQty = Math.max(1, selectedQty - 1);
                                    setPickerSelection(product.productKey, 'quantity', newQty);
                                  }}
                                  className="p-1.5 text-white/60 hover:text-white transition cursor-pointer"
                                >
                                  <MinusIcon className="w-3.5 h-3.5" />
                                </button>
                                <span className="px-1.5 text-xs font-bold text-white min-w-[18px] text-center">
                                  {selectedQty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPickerSelection(product.productKey, 'quantity', selectedQty + 1);
                                  }}
                                  className="p-1.5 text-white/60 hover:text-white transition cursor-pointer"
                                >
                                  <PlusIcon className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Add Button */}
                              <button
                                type="button"
                                onClick={() => addProductToRecommendations(product)}
                                className="flex-1 bg-[#FFD3AC] hover:bg-[#ffc999] text-[#1E1E1E] text-xs font-bold py-2 px-2 rounded-xl transition flex items-center justify-center gap-1 shadow-md cursor-pointer"
                              >
                                <PlusIcon className="w-3.5 h-3.5 stroke-[2.5]" />
                                <span>Add</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

          {/* ═════════════════════════════════════════════════════════════════════
              STEP 4: CART & CONSULTATION SUMMARY & SUBMIT
             ═════════════════════════════════════════════════════════════════════ */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-white/60 text-xs sm:text-sm text-center -mt-2">
                Review recommended products and consultation details before completing
              </p>

              {/* Cart Items List - Matching Flutter App Image 3 */}
              <div className="space-y-3">
                {recommendedProducts.length === 0 ? (
                  <div
                    style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
                    className="border border-white/20 rounded-2xl p-8 text-center backdrop-blur-md"
                  >
                    <p className="text-white/70 font-medium text-base">The cart is empty</p>
                    <p className="text-white/40 text-xs mt-1">No products recommended for this patient</p>
                  </div>
                ) : (
                  recommendedProducts.map((item) => (
                    <div
                      key={item.item_id}
                      style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
                      className="border border-white/20 rounded-2xl p-4 flex items-center justify-between gap-4 backdrop-blur-md shadow-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-base text-white truncate">
                          {item.product_name}
                        </h4>
                        <p className="text-sm text-[#FFD3AC] font-medium mt-1">
                          Size: {item.size} &nbsp;•&nbsp; Qty: {item.quantity}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRecommendedProduct(item.item_id)}
                        className="text-red-400 hover:text-red-300 p-2 rounded-xl hover:bg-red-500/10 transition cursor-pointer shrink-0"
                        title="Remove item"
                        aria-label={`Remove ${item.product_name}`}
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Patient Info */}
              <div
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
                className="border border-white/20 rounded-[18px] p-5 shadow-sm backdrop-blur-md"
              >
                <h3 className="text-xs font-bold text-[#FFD3AC] uppercase tracking-wider mb-2">
                  Patient & Consultation
                </h3>
                <p className="font-serif text-xl font-bold text-white">{userName}</p>
                <p className="text-xs text-white/60 mt-0.5">Appointment ID: {params.id}</p>
              </div>

              {/* Recommendations Summary */}
              <div
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
                className="border border-white/20 rounded-[18px] p-5 shadow-sm backdrop-blur-md space-y-4"
              >
                <h3 className="text-xs font-bold text-[#FFD3AC] uppercase tracking-wider">
                  Recommendations Breakdown
                </h3>
                {CATEGORIES.map(({ key, label }) => (
                  <div key={key} className="border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
                    <span className="font-semibold text-white/90 text-sm block mb-1">{label}</span>
                    <p className="text-xs sm:text-sm text-white/70 whitespace-pre-wrap">
                      {notesByCategory[key] || <span className="italic text-white/40">None</span>}
                    </p>
                  </div>
                ))}
              </div>

              {/* Notes Summary */}
              <div
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
                className="border border-white/20 rounded-[18px] p-5 shadow-sm backdrop-blur-md"
              >
                <h3 className="text-xs font-bold text-[#FFD3AC] uppercase tracking-wider mb-2">
                  Doctor Notes
                </h3>
                <p className="text-xs sm:text-sm text-white/70 whitespace-pre-wrap">
                  {overallNotes || <span className="italic text-white/40">No additional notes</span>}
                </p>
              </div>

              {/* Internal Notes Summary (Doctor & Admin Only) */}
              {internalNotes.trim() && (
                <div
                  style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
                  className="border border-[#FFD3AC]/30 rounded-[18px] p-5 shadow-sm backdrop-blur-md"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xs font-bold text-[#FFD3AC] uppercase tracking-wider">
                      Internal Notes
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFD3AC]/20 text-[#FFD3AC] font-medium border border-[#FFD3AC]/30">
                      Visible to You
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-white/70 whitespace-pre-wrap">
                    {internalNotes}
                  </p>
                </div>
              )}

              {/* Referral Summary */}
              <div
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.45)' }}
                className="border border-white/20 rounded-[18px] p-5 shadow-sm backdrop-blur-md"
              >
                <h3 className="text-xs font-bold text-[#FFD3AC] uppercase tracking-wider mb-2">
                  Referral Status
                </h3>
                {selectedReferral ? (
                  <p className="text-sm font-semibold text-white">
                    Assigned to:{' '}
                    <span className="text-[#FFD3AC]">
                      {selectedReferral.referred_to_doctor_name ||
                        `${selectedReferral.referred_specialty_label} Specialist`}
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-white/40 italic">No specialist referral assigned</p>
                )}
              </div>

              {/* Final Complete Button - Matching Flutter COMPLETE */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-[#FFD3AC] hover:bg-[#ffc999] disabled:opacity-50 text-[#1E1E1E] font-bold text-base py-4 rounded-2xl shadow-2xl transition transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer mt-6 uppercase tracking-wider flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-[#1E1E1E]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Submitting...</span>
                  </>
                ) : (
                  'COMPLETE'
                )}
              </button>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════════
              REFERRAL MODAL (SELECT SPECIALIST OR DOCTOR)
             ═════════════════════════════════════════════════════════════════════ */}
          {showReferralModal && (
            <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div
                style={{ backgroundColor: '#1E1E1E' }}
                className="border border-white/20 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl"
              >
                {/* Modal Header */}
                <div className="p-5 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-white">Refer to Specialist</h3>
                    <p className="text-xs text-white/60 mt-0.5">Referring {userName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowReferralModal(false)}
                    className="text-white/60 hover:text-white p-1 rounded-lg"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                {/* Search & Tabs */}
                <div className="p-4 border-b border-white/10 space-y-3">
                  <div className="relative">
                    <MagnifyingGlassIcon className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={referralSearch}
                      onChange={(e) => setReferralSearch(e.target.value)}
                      placeholder="Search specialties or doctors..."
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        color: '#ffffff',
                      }}
                      className="w-full rounded-xl border border-white/15 pl-9 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#FFD3AC]"
                    />
                  </div>

                  <div className="flex rounded-xl bg-black/40 p-1 border border-white/10">
                    <button
                      type="button"
                      onClick={() => setReferralTab('specialty')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                        referralTab === 'specialty'
                          ? 'bg-[#FFD3AC] text-[#1E1E1E]'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      By Specialty
                    </button>
                    <button
                      type="button"
                      onClick={() => setReferralTab('doctor')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                        referralTab === 'doctor'
                          ? 'bg-[#FFD3AC] text-[#1E1E1E]'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      By Doctor
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-4 overflow-y-auto max-h-[50vh] space-y-2">
                  {referralTab === 'specialty' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {filteredSpecialties.map((field) => (
                        <button
                          key={field.key}
                          type="button"
                          onClick={() => handleAssignSpecialty(field)}
                          className="text-left p-3.5 rounded-xl border border-white/10 hover:border-[#FFD3AC] hover:bg-[#FFD3AC]/10 transition flex items-center justify-between group"
                        >
                          <span className="text-white text-xs sm:text-sm font-semibold group-hover:text-[#FFD3AC]">
                            {field.label}
                          </span>
                          <span className="text-xs text-[#FFD3AC] opacity-0 group-hover:opacity-100 transition">
                            Select →
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : loadingDoctors ? (
                    <p className="text-center text-xs text-white/60 py-6">Loading doctors...</p>
                  ) : filteredDoctors.length === 0 ? (
                    <p className="text-center text-xs text-white/60 py-6">No doctors found.</p>
                  ) : (
                    <div className="space-y-2">
                      {filteredDoctors.map((docItem) => {
                        const dName = docItem.name || `Dr. ${docItem.first_name || ''} ${docItem.last_name || ''}`.trim();
                        const title = docItem.professional_title || docItem.title || 'Specialist';
                        return (
                          <div
                            key={docItem.uid}
                            className="p-3.5 rounded-xl border border-white/10 flex items-center justify-between gap-3 hover:border-[#FFD3AC] transition"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#FFD3AC]/20 border border-[#FFD3AC]/40 flex items-center justify-center text-[#FFD3AC] font-bold text-sm shrink-0">
                                {dName.charAt(0) || 'D'}
                              </div>
                              <div>
                                <h4 className="font-bold text-white text-sm">{dName}</h4>
                                <p className="text-xs text-white/60">{title}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleAssignDoctor(docItem)}
                              className="bg-[#FFD3AC] hover:bg-[#ffc999] text-[#1E1E1E] text-xs font-bold px-3 py-1.5 rounded-lg transition"
                            >
                              Select
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sort By Modal - matching Flutter filter_modal.dart 1:1 */}
          {showFilterModal && (
            <div
              className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
              onClick={() => setShowFilterModal(false)}
            >
              <div
                className="w-full sm:max-w-md bg-[#1E1E1E] border border-white/10 rounded-t-[30px] sm:rounded-3xl p-6 shadow-2xl text-white"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Mobile Drag Bar Handle */}
                <div className="sm:hidden w-12 h-1 bg-neutral-600 rounded-full mx-auto mb-4" />

                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Sort By</h2>
                  <button
                    type="button"
                    onClick={() => setShowFilterModal(false)}
                    className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-3">
                  {[
                    { value: 'Popularity', label: 'Best Sellers' },
                    { value: 'NameAtoZ', label: 'Name: A to Z' },
                    { value: 'None', label: 'Default Order' },
                  ].map((opt) => {
                    const isSelected = sortOption === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => {
                          setSortOption(opt.value);
                          setShowFilterModal(false);
                        }}
                        className={`w-full flex items-center justify-between p-4 rounded-xl text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#FFD3AC] text-[#1E1E1E] font-semibold'
                            : 'bg-[#2D2D30] text-white hover:bg-[#38383c]'
                        }`}
                      >
                        <span className="text-base">{opt.label}</span>
                        {isSelected && <CheckIcon className="w-5 h-5 stroke-[2.5]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {/* Product Details Modal for Doctor Recommendation */}
          {selectedProductForModal && (
            <ProductDetailsModal
              product={selectedProductForModal}
              isDoctor={true}
              isDoctorRecommendation={true}
              onClose={() => setSelectedProductForModal(null)}
              onAddToCart={({ product, size, quantity }) => {
                addProductToRecommendations(product, size, quantity);
                setSelectedProductForModal(null);
              }}
            />
          )}
        </div>
      </WebLayoutWrapper>
    </ProtectedRoute>
  );
}
