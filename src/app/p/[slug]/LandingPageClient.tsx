"use client";

import {
  runWhenFbqReady,
  trackInitiateCheckout,
  trackPurchase,
  trackViewContent,
} from "@/lib/gtm-datalayer";
import { calculateDiscountedPrice, formatCurrency } from "@/lib/utils";
import axios from "axios";
import {
  CheckCircle2,
  Facebook,
  Instagram,
  ShoppingCart,
  Youtube
} from "lucide-react";

const TikTokIcon = ({ size = 20, className = "" }) => (
  <svg
    width={size}
    height={size}
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.589 6.686a4.793 4.793 0 01-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 01-5.201 1.743l-.002-.001.002.001a2.895 2.895 0 013.183-4.51v-3.5a6.329 6.329 0 00-5.394 10.692 6.33 6.33 0 0010.857-4.424V8.687a8.182 8.182 0 004.773 1.526V6.79a4.831 4.831 0 01-1.003-.104z" />
  </svg>
);

import GenericSlider from "@/components/shared/GenericSlider";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import ComboBillingForm from "./_components/ComboBillingForm";
import ComboProductCard from "./_components/ComboProductCard";

interface LandingPageClientProps {
  landing: any;
  settings: any;
  product?: any;
}

function getProductPrice(p: any): number {
  const hasVariants = p.productType === "variant" && p.variants?.length > 0;
  const hasSelectedVariant =
    p.selectedVariants && Object.keys(p.selectedVariants).length > 0;

  if (hasVariants && hasSelectedVariant) {
    // Customer has chosen a variant — find the exact match and use its price
    const activeVariant =
        p.variants.length > 0
          ? p.variants.find((v: any) => {
              if (v.attributes && Object.keys(v.attributes).length > 0) {
                 return Object.entries(p.selectedVariants || {}).every(([slug, val]) => v.attributes[slug] === val);
              }
              return false;
            })
          : null;
    if (activeVariant?.price && activeVariant.price > 0) return activeVariant.price;
  }

  // Use product-level base price if set
  if (p.price && p.price > 0) return p.price;
  // Use mrp with discount as next fallback
  if (p.mrp && p.mrp > 0) {
    const discountValue = p.discountValue ?? 0;
    const discountType = p.discountType || "percentage";
    return calculateDiscountedPrice(p.mrp, discountValue, discountType);
  }
  // Last resort: product has no base price set — use first variant's price
  // (common for variant-only products where price is stored per-variant)
  if (hasVariants) {
    const firstVariantWithPrice = p.variants.find((v: any) => v.price && v.price > 0);
    if (firstVariantWithPrice) return firstVariantWithPrice.price;
  }
  return 0;
}

function getRequiredVariantTypes(p: any): string[] {
  if (!p.variants?.length) return [];
  return [
    ...new Set(
      p.variants.flatMap((v: any) => {
        if (v.attributes && Object.keys(v.attributes).length > 0) {
            return Object.keys(v.attributes);
        }
        return [];
      }),
    ),
  ] as string[];
}

export default function LandingPageClient({
  landing,
  settings,
  product,
}: LandingPageClientProps) {
  const router = useRouter();
  const isCombo = landing.templateType === "combo";

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{
    orderId: string;
    total: number;
  } | null>(null);
  const [hasInitiatedCheckout, setHasInitiatedCheckout] = useState(false);
  // Prevents Meta Pixel Purchase from firing more than once per page session.
  // A customer who hits the button multiple times (e.g. after a phone-number
  // error) could create two separate orders with two separate orderId keys,
  // bypassing the per-orderId sessionStorage guard. This ref is the final
  // single-fire lock regardless of how many orders are created.
  const purchaseFired = useRef(false);
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  // const [currentDistrict, setCurrentDistrict] = useState("");
  const [deliveryLocation, setDeliveryLocation] = useState<"inside" | "outside" | "">("");
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const displayTitle = landing.customTitle || product?.title || "";
  const displayDescription =
    landing.customDescription || product?.shortDescription || "";
  const bannerImage =
    landing.bannerImage || product?.images?.[0] || "/placeholder.png";
  const brandName = settings?.brandName || "Store";

  const catalogProducts = isCombo ? landing.comboProducts || [] : [];

  const [selectedProducts, setSelectedProducts] = useState<any[]>(() => {
    if (isCombo) {
      const comboItems = landing.comboProducts?.map((p: any, index: number) => ({
        ...p,
        qty: index === 0 ? 1 : 0,
        selectedVariants: {},
      })) || [];
      // If combo landing page has no combo products, fall back to the main product
      if (comboItems.length === 0 && product) {
        return [{ ...product, qty: 1, selectedVariants: {} }];
      }
      return comboItems;
    }
    if (product) {
      return [{ ...product, qty: 1, selectedVariants: {} }];
    }
    return [];
  });

  const baseShippingCharge =
    deliveryLocation === "inside"
      ? (settings?.shippingChargeInsideDhaka ?? 60)
      : deliveryLocation === "outside"
      ? (settings?.shippingChargeOutsideDhaka ?? 120)
      : 0;

  const activeItems = isCombo
    ? selectedProducts.filter((p) => p.qty > 0)
    : selectedProducts;

  const hasFreeShipping =
    !!landing.freeShipping || activeItems.some((p) => p.freeShipping);
  const shippingCharge = hasFreeShipping ? 0 : baseShippingCharge;

  const subtotal = activeItems.reduce(
    (sum, p) => sum + getProductPrice(p) * p.qty,
    0,
  );
  const total = subtotal + (subtotal > 0 ? shippingCharge : 0);
  const totalQty = activeItems.reduce((sum, p) => sum + p.qty, 0);

  let stickyOfferText = landing.headerTitle || displayTitle;
  const MAX_WORDS = 15;
  const words = stickyOfferText.split(/\s+/);
  if (words.length > MAX_WORDS) {
    stickyOfferText = words.slice(0, MAX_WORDS).join(" ") + "...";
  }

  const handleQtyChange = (productId: string, delta: number) => {
    setSelectedProducts((prev) =>
      prev.map((p) => {
        if (p._id !== productId) return p;
        const minQty = isCombo ? 0 : 1;
        return { ...p, qty: Math.max(minQty, p.qty + delta) };
      }),
    );
  };

  const handleVariantChange = (
    productId: string,
    type: string,
    value: string,
  ) => {
    setSelectedProducts((prev) =>
      prev.map((p) => {
        if (p._id !== productId) return p;
        return {
          ...p,
          selectedVariants: { ...p.selectedVariants, [type.toLowerCase()]: value },
        };
      }),
    );
  };

  useEffect(() => {
    if (!landing.offerEndTime) {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const end = new Date().setHours(new Date().getHours() + 1);
        const diff = end - now;
        setTimeLeft({
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }, 1000);
      return () => clearInterval(timer);
    }

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(landing.offerEndTime).getTime();
      const diff = end - now;
      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [landing.offerEndTime]);

  const hasTrackedViewContent = useRef(false);

  useEffect(() => {
    if (hasTrackedViewContent.current) return;
    const items = activeItems.length ? activeItems : selectedProducts;
    if (items.length === 0) return;
    
    hasTrackedViewContent.current = true;
    trackViewContent({
      content_name: displayTitle,
      content_category: "Landing Page",
      content_ids: items.map((p) => String(p._id)),
      contents: items.map((p) => ({
        id: String(p._id),
        quantity: p.qty || 1,
        item_price: getProductPrice(p),
      })),
      content_type: isCombo ? "product_group" : "product",
      value: total || getProductPrice(items[0] || {}),
      currency: "BDT",
    });
  }, [landing, selectedProducts, total, displayTitle, isCombo, activeItems]);

  const validateVariants = (): string | null => {
    for (const p of activeItems) {
      const required = getRequiredVariantTypes(p);
      const missing = required.find((t) => !p.selectedVariants[t]);
      if (missing) return `${p.title}: Please select ${missing}`;
      
      if ((p.compatibleModels?.length ?? 0) > 0 && !p.selectedVariants['model']) {
          return `${p.title}: Please select model`;
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent, formData: any) => {
    if (isCombo && totalQty === 0) {
      toast.error("অন্তত একটি পণ্য সিলেক্ট করুন");
      return;
    }

    if (!deliveryLocation) {
      toast.error("Please select a delivery area");
      return;
    }

    const variantError = validateVariants();
    if (variantError) {
      toast.error(variantError);
      return;
    }

    setIsSubmitting(true);
    try {
      if (isCombo) {
        // const fullAddress = `${formData.address}, ${formData.district}, ${formData.division}`;
        const fullAddress = formData.address;
        const res = await axios.post("/api/orders", {
          customerInfo: {
            name: formData.name,
            phone: formData.phone,
            address: fullAddress,
            // city: formData.district,
            deliveryLocation,
            paymentMethod: "COD",
          },
          items: activeItems.map((p) => ({
            productId: p._id,
            quantity: p.qty,
            variant: p.selectedVariants,
          })),
          paymentMethod: "COD",
          landingPageId: landing._id,
        });
        if (res.data.success) {
          const oid = res.data.order?.orderId;
          const totalAmt = res.data.order?.totalAmount || total;
          const nameParts = formData.name.trim().split(/\s+/);
          if (oid) {
            try {
              // Double-guard: purchaseFired ref (catches same-session retries
              // that produce a new orderId) + sessionStorage key (catches page
              // refresh within the same browser tab).
              if (!purchaseFired.current) {
                const storageKey = `meta_pixel_purchase_${oid}`;
                if (!sessionStorage.getItem(storageKey)) {
                  purchaseFired.current = true;
                  runWhenFbqReady(() => {
                    trackPurchase(
                      {
                        content_ids: activeItems.map((p) => String(p._id)),
                        contents: activeItems.map((p) => ({
                          id: String(p._id),
                          quantity: p.qty,
                          item_price: getProductPrice(p),
                          item_name: p.title,
                        })),
                        content_type: "product_group",
                        value: totalAmt,
                        currency: "BDT",
                        num_items: totalQty,
                        shipping: baseShippingCharge,
                        eventID: `purchase_${oid}`,
                      },
                      {
                        phone: formData.phone.trim(),
                        firstName: nameParts[0],
                        lastName:
                          nameParts.length > 1
                            ? nameParts.slice(1).join(" ")
                            : undefined,
                        country: "bd",
                      }
                    );
                    try {
                      sessionStorage.setItem(storageKey, "1");
                    } catch {
                      /* ignore */
                    }
                  });
                }
              }
            } catch {
              /* ignore */
            }
          }
          toast.success("Order placed successfully!");
          if (oid) {
            router.push(`/order-confirmation/${oid}`);
          }
        }
      } else {
        const p = selectedProducts[0];
        const res = await axios.post("/api/landing/order", {
          landingPageId: landing._id,
          productId: p._id,
          quantity: p.qty,
          variant: p.selectedVariants,
          customerInfo: {
            name: formData.name,
            phone: formData.phone,
            // address: `${formData.address}, ${formData.district}, ${formData.division}`,
            address: formData.address,
            deliveryLocation,
          },
        });
        if (res.data.success) {
          const oid = res.data.order.orderId as string;
          const totalAmt = res.data.order.totalAmount as number;
          const nameParts = formData.name.trim().split(/\s+/);
          try {
            // Double-guard: purchaseFired ref + sessionStorage key.
            if (!purchaseFired.current) {
              const storageKey = `meta_pixel_purchase_${oid}`;
              if (!sessionStorage.getItem(storageKey)) {
                purchaseFired.current = true;
                runWhenFbqReady(() => {
                  trackPurchase(
                    {
                      content_ids: [String(p._id)],
                      contents: [
                        {
                          id: String(p._id),
                          quantity: p.qty,
                          item_price: getProductPrice(p),
                          item_name: p.title,
                        },
                      ],
                      value: totalAmt,
                      currency: "BDT",
                      num_items: p.qty,
                      shipping: baseShippingCharge,
                      eventID: `purchase_${oid}`,
                    },
                    {
                      phone: formData.phone.trim(),
                      firstName: nameParts[0],
                      lastName:
                        nameParts.length > 1
                          ? nameParts.slice(1).join(" ")
                          : undefined,
                      country: "bd",
                    },
                  );
                  try {
                    sessionStorage.setItem(storageKey, "1");
                  } catch {
                    /* ignore */
                  }
                });
              }
            }
          } catch {
            /* ignore */
          }
          toast.success("Order placed successfully!");
          router.push(`/order-confirmation/${oid}`);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToCheckout = () => {
    if (!hasInitiatedCheckout && !isCombo && product) {
      trackInitiateCheckout({
        content_ids: [String(product._id)],
        contents: [
          {
            id: String(product._id),
            quantity: selectedProducts[0]?.qty || 1,
            item_price: getProductPrice(selectedProducts[0] || product),
            item_name: product.title,
          },
        ],
        value: subtotal,
        currency: "BDT",
        num_items: selectedProducts[0]?.qty || 1,
      });
      setHasInitiatedCheckout(true);
    }
    document.getElementById("checkout")?.scrollIntoView({ behavior: "smooth" });
  };

  const pad = (n: number) => String(n).padStart(2, "0");

  const defaultFeatures = [
    {
      icon: "💧",
      title: "প্রিমিয়াম মান",
      desc: "উচ্চমানের পণ্য — গ্রাহক সন্তুষ্টির জন্য বিশেষভাবে তৈরি",
    },
    {
      icon: "⏰",
      title: "দ্রুত ডেলিভারি",
      desc: "সারা বাংলাদেশে দ্রুত ও নির্ভরযোগ্য ডেলিভারি",
    },
    {
      icon: "📦",
      title: "সুরক্ষিত প্যাকেজিং",
      desc: "পণ্য সুন্দরভাবে প্যাক করে পাঠানো হয়",
    },
    {
      icon: "✅",
      title: "১০০% গ্যারান্টি",
      desc: "পণ্যে সমস্যা হলে সম্পূর্ণ টাকা ফেরত দেওয়া হবে",
    },
  ];

  const featureCards =
    landing.whyChooseUs?.length > 0
      ? landing.whyChooseUs.map((item: any) => ({
        icon: item.icon || <CheckCircle2 className="w-7 h-7 sm:w-9 sm:h-9 text-emerald-500" fill="currentColor" stroke="white" strokeWidth={1.5} />,
        title: item.title,
        desc: item.description || "",
      }))
      : defaultFeatures;

  const trustBarItems = [
    { icon: "🚚", title: "Fast Delivery", sub: "All Over Bangladesh" },
    { icon: "💵", title: "Cash on Delivery", sub: "Payment After Receive" },
    { icon: "🛡", title: "Premium Quality", sub: "100% Authentic Products" },
    { icon: "💬", title: "24/7 Support", sub: "" },
  ];

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center p-4 font-['Hind_Siliguri',_sans-serif]">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center border border-emerald-100">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-10 h-10 text-emerald-600"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m4.5 12.75 6 6 9-13.5"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            অর্ডার সফল হয়েছে! 🎉
          </h1>
          <p className="text-gray-500 mb-6">
            Your order has been placed successfully
          </p>
          <div className="bg-gray-50 rounded-2xl p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Order ID</span>
              <span className="font-bold text-gray-900">
                {orderSuccess.orderId}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total</span>
              <span className="font-bold text-emerald-600">
                {formatCurrency(orderSuccess.total)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Payment</span>
              <span className="font-bold text-gray-900">Cash on Delivery</span>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            আমরা শীঘ্রই আপনার সাথে যোগাযোগ করবো
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF5F7] font-['Hind_Siliguri',_sans-serif] text-[#111] overflow-x-clip pb-20 md:pb-0">
      {/* STICKY TOP BAR */}
      <div className="sticky top-0 z-[999] bg-[#1a1a2e] text-white px-3 sm:px-4 py-3 sm:py-5 lg:py-6 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <div className="sm:hidden mb-2.5 overflow-hidden">
            <div className="animate-infinite-scroll flex items-center whitespace-nowrap pt-0.5">
              <div className="flex items-center">
                <span className="text-[12px] font-medium leading-snug">{stickyOfferText}</span>
                <span className="mx-6 text-red-500/30 text-[10px]">✦</span>
                <span className="text-[12px] font-medium leading-snug">{stickyOfferText}</span>
                <span className="mx-6 text-red-500/30 text-[10px]">✦</span>
              </div>
              <div className="flex items-center">
                <span className="text-[12px] font-medium leading-snug">{stickyOfferText}</span>
                <span className="mx-6 text-red-500/30 text-[10px]">✦</span>
                <span className="text-[12px] font-medium leading-snug">{stickyOfferText}</span>
                <span className="mx-6 text-red-500/30 text-[10px]">✦</span>
              </div>
            </div>
          </div>
          {/* Mobile Header Layout */}
          <div className="flex items-center justify-between gap-2 flex-wrap sm:hidden">
              <div className="flex-shrink-0">
                <Image
                  src="/images/landing_logo.png"
                  alt={brandName}
                  width={150}
                  height={50}
                  className="w-auto h-auto max-h-[40px] object-contain"
                  priority
                />
              </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold shrink-0">
              <span className="whitespace-nowrap">অফার:</span>
              <div className="flex gap-1">
                <div className="bg-red-600 px-1.5 py-0.5 rounded text-[13px] font-black tabular-nums min-w-[28px] text-center text-white">
                  {pad(timeLeft.hours)}
                </div>
                <span className="font-black text-[#f59e0b]">:</span>
                <div className="bg-red-600 px-1.5 py-0.5 rounded text-[13px] font-black tabular-nums min-w-[28px] text-center text-white">
                  {pad(timeLeft.minutes)}
                </div>
                <span className="font-black text-[#f59e0b]">:</span>
                <div className="bg-red-600 px-1.5 py-0.5 rounded text-[13px] font-black tabular-nums min-w-[28px] text-center text-white">
                  {pad(timeLeft.seconds)}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Header Layout */}
          <div className="hidden sm:grid grid-cols-[1fr_auto_1fr] items-center gap-4 w-full">
            {/* Left Side: Offer Text */}
            <div className="text-[14px] lg:text-[15px] font-medium text-left">
              <span className="animate-pulse-zoom inline-block">{stickyOfferText}</span>
            </div>

            {/* Middle Side: Centered Logo */}
            <div className="flex justify-center px-4">
              <Image
                src="/images/landing_logo.png"
                alt={brandName}
                width={200}
                height={60}
                className="w-auto h-auto max-h-[40px] sm:max-h-[50px] lg:max-h-[60px] object-contain"
                priority
              />
            </div>

            {/* Right Side: Timer */}
            <div className="flex items-center justify-end gap-2 text-[14px] font-bold shrink-0">
              <span className="whitespace-nowrap">অফার:</span>
              <div className="flex gap-1">
                <div className="bg-red-600 px-2.5 py-1 rounded text-[16px] font-black tabular-nums min-w-[38px] text-center text-white">
                  {pad(timeLeft.hours)}
                </div>
                <span className="font-black text-[#f59e0b]">:</span>
                <div className="bg-red-600 px-2.5 py-1 rounded text-[16px] font-black tabular-nums min-w-[38px] text-center text-white">
                  {pad(timeLeft.minutes)}
                </div>
                <span className="font-black text-[#f59e0b]">:</span>
                <div className="bg-red-600 px-2.5 py-1 rounded text-[16px] font-black tabular-nums min-w-[38px] text-center text-white">
                  {pad(timeLeft.seconds)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HERO */}
      <section className="relative min-h-[calc(100vh-4.5rem)] md:min-h-[95vh] flex items-center justify-center bg-gradient-to-br from-[#0d0d0d] via-[#1a0a0a] to-[#2d0808] px-3 sm:px-4 lg:px-6 pt-2 pb-24 sm:pt-3 sm:pb-36 lg:pt-4 lg:pb-48 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_70%_50%,rgba(180,30,30,0.25)_0%,transparent_60%)]" />
        <div className="max-w-7xl mx-auto relative w-full flex flex-col items-center justify-center gap-6 sm:gap-8 lg:flex-row lg:items-center lg:justify-center lg:gap-12">
          <div className="flex-1 w-full max-w-2xl space-y-3 sm:space-y-4 text-center lg:text-left">
            <div className="inline-block bg-[#d4a843]/15 border border-[#d4a843]/40 text-[#d4a843] text-[9px] sm:text-[10px] lg:text-[11px] font-black px-3 sm:px-4 py-1.5 rounded-full">
              ✨ প্রিমিয়াম কালেকশন
            </div>
            <h1 className="text-white text-xl sm:text-2xl md:text-3xl lg:text-[38px] xl:text-[44px] font-black leading-tight px-1">
              {displayTitle}
            </h1>
            <p className="text-white/70 text-xs sm:text-sm md:text-base leading-relaxed max-w-xl mx-auto lg:mx-0 px-1">
              {displayDescription && (
                <span className="block mb-2 text-white/80 text-sm sm:text-base md:text-lg font-medium">
                  {displayDescription}
                </span>
              )}
              🏷{" "}
              <span className="text-[#d4a843] font-bold">
                ক্যাশ অন ডেলিভারি
              </span>{" "}
              — পণ্য পেয়ে টাকা দিন।{" "}
              {hasFreeShipping ? (
                <span className="text-[#d4a843] font-bold">ফ্রি শিপিং</span>
              ) : (
                <span>ডেলিভারি চার্জ জেলা অনুযায়ী প্রযোজ্য</span>
              )}{" "}
              সারা বাংলাদেশে।
            </p>
            <button
              onClick={scrollToCheckout}
              className="w-full sm:w-auto bg-red-600 text-white px-7 sm:px-9 py-3 sm:py-3.5 rounded-xl font-black text-sm sm:text-base shadow-xl shadow-red-900/50 hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2 mx-auto lg:mx-0"
            >
              অর্ডার করতে ক্লিক করুন →
            </button>
          </div>
          <div 
            onClick={() => setActiveImage(bannerImage)}
            className="relative w-[340px] h-[420px] sm:w-[380px] sm:h-[480px] lg:w-[460px] lg:h-[580px] xl:w-[520px] xl:h-[650px] 2xl:w-[620px] 2xl:h-[780px] shrink-0 animate-float cursor-zoom-in group"
          >
            <Image
              src={bannerImage}
              alt={displayTitle}
              fill
              className="object-contain drop-shadow-[0_24px_30px_rgba(255,0,0,0.2)]"
              priority
              sizes="(max-width: 640px) 280px, (max-width: 1024px) 300px, (max-width: 1280px) 460px, (max-width: 1536px) 520px, 620px"
            />
          </div>
        </div>
      </section>

      <style jsx global>{`
        @keyframes infiniteScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-infinite-scroll {
          animation: infiniteScroll 15s linear infinite;
          width: max-content;
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-18px);
          }
        }
        .animate-float {
          animation: float 3.5s ease-in-out infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out forwards;
        }
        @keyframes pulseZoom {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.04);
          }
        }
        .animate-pulse-zoom {
          animation: pulseZoom 2.5s ease-in-out infinite;
          display: inline-block;
          transform-origin: center;
        }
        .reviews-section .bg-red-500 {
          background-color: #d4a843 !important;
        }
      `}</style>

      {/* TRUST BAR */}
      {/* <div className="bg-[#0d0d0d] py-6 sm:py-10 lg:py-12">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 lg:gap-10 items-start">
          {trustBarItems.map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center sm:items-start gap-2 text-white min-w-0 text-center sm:text-left"
            >
              <div className="w-11 h-11 sm:w-12 sm:h-12 bg-white/5 rounded-xl sm:rounded-2xl flex items-center justify-center text-lg sm:text-2xl shrink-0">
                {item.icon}
              </div>
              <div className="min-w-0">
                <h5 className="text-[11px] sm:text-[14px] font-black leading-tight">
                  {item.title}
                </h5>
                {item.sub ? (
                  <p className="text-[8px] sm:text-[10px] text-white/40 mt-0.5 line-clamp-2">
                    {item.sub}
                  </p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div> */}

      {/* FEATURES */}
      <section className="py-10 sm:py-16 lg:py-20 px-3 sm:px-5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <div className="text-red-600 text-[10px] sm:text-[11px] font-black mb-2">
              PREMIUM COLLECTION
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-[42px] font-black mb-2 sm:mb-3 px-2">
              {displayTitle}
            </h2>
            {displayDescription && (
              <p className="text-gray-500 text-sm sm:text-base max-w-lg mx-auto px-2">
                {displayDescription}
              </p>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {featureCards.map(
              (
                feat: { icon: string; title: string; desc: string },
                i: number,
              ) => (
                <div
                  key={i}
                  className="bg-white border border-gray-100 rounded-2xl sm:rounded-[2rem] p-5 sm:p-8 flex flex-col items-center text-center gap-3 sm:gap-4 hover:shadow-2xl hover:shadow-gray-200 transition-all group"
                >
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-50 rounded-xl sm:rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shrink-0">
                    {feat.icon}
                  </div>
                  <div>
                    <h4 className="text-base sm:text-lg font-black mb-1 sm:mb-2">
                      {feat.title}
                    </h4>
                    {feat.desc && (
                      <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                        {feat.desc}
                      </p>
                    )}
                  </div>
                </div>
              ),
            )}
          </div>
          <div className="text-center mt-8 sm:mt-12">
            <button
              onClick={scrollToCheckout}
              className="w-full sm:w-auto bg-red-600 text-white px-8 sm:px-12 py-3.5 sm:py-5 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base hover:bg-red-700 transition-all shadow-xl shadow-red-100"
            >
              অর্ডার করুন
            </button>
          </div>
        </div>
      </section>

      {/* PRODUCT GRID — combo only */}
      {isCombo && catalogProducts.length > 0 && (
        <section className="bg-[#0d0d0d] py-10 sm:py-16 lg:py-20 px-3 sm:px-5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8 sm:mb-16">
              <div className="text-[#d4a843] text-[10px] sm:text-[11px] font-black mb-2">
                EXCLUSIVE
              </div>
              <h2 className="text-white text-xl sm:text-2xl lg:text-[42px] font-black mb-2 sm:mb-3">
                পণ্য কালেকশন
              </h2>
              <p className="text-white/50 text-sm sm:text-base max-w-lg mx-auto">
                আপনার পছন্দের পণ্য বেছে নিন
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-8">
              {catalogProducts.map((p: any) => (
                <div
                  key={p._id}
                  className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl sm:rounded-[2rem] overflow-hidden hover:border-[#d4a843]/50 transition-all group"
                >
                  <div className="relative aspect-[4/5] bg-[#111] overflow-hidden">
                    <Image
                      src={p.images?.[0] || "/placeholder.png"}
                      alt={p.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                      sizes="(max-width: 640px) 50vw, 20vw"
                    />
                    <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-[#d4a843] text-black text-[8px] sm:text-[10px] font-black px-2 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase">
                      PRO
                    </div>
                  </div>
                  <div className="p-3 sm:p-6">
                    <h4 className="text-white text-xs sm:text-base font-black mb-1 truncate">
                      {p.title}
                    </h4>
                    {p.shortDescription && (
                      <p className="text-white/40 text-[10px] sm:text-xs leading-relaxed line-clamp-1 mb-2 sm:mb-4">
                        {p.shortDescription}
                      </p>
                    )}
                    <div className="text-[#d4a843] text-sm sm:text-xl font-black">
                      {formatCurrency(p.price)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* DETAILS */}
      {(landing.customDetails || product?.fullDescription) && (
        <section className="py-10 sm:py-16 px-3 sm:px-5 bg-gradient-to-br from-[#0d0d0d] via-[#1a0a0a] to-[#2d0808]">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-6 sm:mb-8 text-center">
              বিস্তারিত বিবরণ
            </h2>
            <div
              className="prose prose-invert max-w-none text-white/80 prose-headings:text-white prose-strong:text-white prose-a:text-red-400 hover:prose-a:text-red-300 prose-code:text-red-300 prose-pre:bg-black/50 prose-pre:border prose-pre:border-red-900/50"
              dangerouslySetInnerHTML={{
                __html: landing.customDetails || product?.fullDescription,
              }}
            />
          </div>
        </section>
      )}

      {/* CUSTOMER REVIEWS SLIDER */}
      {landing.reviewImages && landing.reviewImages.length > 0 && (
        <section className="py-12 sm:py-18 px-3 sm:px-5 bg-gradient-to-br from-[#0d0d0d] via-[#1a150e] to-[#251e12] relative overflow-hidden reviews-section">
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_50%,rgba(212,168,67,0.15)_0%,transparent_60%)]" />
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-8 sm:mb-12">
              <span className="inline-block bg-[#d4a843]/10 border border-[#d4a843]/30 text-[#d4a843] text-[10px] sm:text-[11px] font-black px-3 sm:px-4 py-1.5 rounded-full mb-3">
                ⭐ গ্রাহকের সন্তুষ্টি আমাদের প্রেরণা
              </span>
              <h2 className="text-white text-xl sm:text-2xl lg:text-[40px] font-black leading-tight mb-3">
                আমাদের সম্মানিত ক্রেতাদের মতামত
              </h2>
              <p className="text-white/60 text-xs sm:text-sm max-w-lg mx-auto">
                পণ্য হাতে পেয়ে সম্মানিত গ্রাহকরা যে মূল্যবান ছবি ও রিভিউ শেয়ার করেছেন তা নিচে তুলে ধরা হলো।
              </p>
            </div>

            <GenericSlider
              autoplay={true}
              autoplayInterval={3000}
              showArrows={true}
              showDots={true}
              slidesPerView={{ mobile: 1.1, sm: 2, md: 3, lg: 3 }}
              gap={20}
              loop={true}
            >
              {landing.reviewImages.map((img: string, i: number) => (
                <div
                  key={i}
                  onClick={() => setActiveImage(img)}
                  className="relative aspect-[2/3] rounded-2xl overflow-hidden border border-[#d4a843]/30 bg-white/5 backdrop-blur-md shadow-lg shadow-black/40 hover:border-[#d4a843] group cursor-pointer transition-all duration-300"
                >
                  <Image
                    src={img}
                    alt={`Customer Review ${i + 1}`}
                    fill
                    className="object-cover transition-all duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="text-white text-xs font-bold flex items-center gap-1">
                      🔍 ক্লিক করে বড় করে দেখুন
                    </span>
                  </div>
                </div>
              ))}
            </GenericSlider>
          </div>
        </section>
      )}

      {/* Full Screen Image Modal */}
      {activeImage && (
        <div
          onClick={() => setActiveImage(null)}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 cursor-zoom-out animate-fade-in"
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setActiveImage(null)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-full p-2.5 z-50 transition-colors shadow-lg focus:outline-none"
              aria-label="Close review modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="relative w-full h-[80vh] flex items-center justify-center">
              <Image
                src={activeImage}
                alt="Enlarged Image"
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
          </div>
        </div>
      )}

      {/* PROMO BANNER */}
      {landing.offer && (
        <div className="w-full bg-gradient-to-r from-red-700 via-red-800 to-red-950 text-white py-4 px-4 sm:px-8 shadow-md border-y border-red-600/30 flex items-center justify-center">
          <div className="max-w-7xl w-full flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
            <div className="flex items-center gap-3.5 flex-col md:flex-row justify-center md:justify-start">
              <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-xl shrink-0 animate-bounce">
                🎁
              </div>
              <p className="text-sm sm:text-base font-black tracking-wide leading-relaxed text-white">
                {landing.offer}
              </p>
            </div>
            <button
              onClick={scrollToCheckout}
              className="bg-white text-red-700 hover:text-red-600 hover:bg-red-50 px-6 py-2.5 rounded-full font-black text-sm hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 shrink-0 shadow-lg shadow-black/20"
            >
              অর্ডার করুন <span className="text-base">→</span>
            </button>
          </div>
        </div>
      )}

      {/* CHECKOUT */}
      <section
        id="checkout"
        className="bg-[#FFF5F7] py-10 sm:py-16 lg:py-20 px-3 sm:px-5 scroll-mt-14"
      >
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#111] text-white text-center py-4 sm:py-5 px-4 sm:px-8 rounded-xl sm:rounded-2xl text-sm sm:text-lg lg:text-xl font-black mb-6 sm:mb-12 shadow-2xl leading-snug">
            অর্ডার করতে আপনার তথ্য দিয়ে নিচের ফর্মটি পূরণ করুন
          </div>

          {isCombo && catalogProducts.length > 1 && (
            <div className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-gray-200 p-4 sm:p-8 md:p-12 mb-6 sm:mb-10 shadow-sm">
              <div className="flex items-center gap-3 mb-5 sm:mb-8">
                <div className="w-9 h-9 sm:w-10 sm:h-10 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-200 shrink-0">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base sm:text-xl font-black text-gray-900 leading-none">
                    {isCombo ? "Select Your Items" : "আপনার পণ্য"}
                  </h3>
                  <p className="text-[13px] text-gray-500 font-bold mt-1">
                    {isCombo
                      ? "পছন্দের পণ্যগুলো সিলেক্ট করুন"
                      : "ভেরিয়েন্ট ও পরিমাণ নির্বাচন করুন"}
                  </p>
                </div>
              </div>
              <div className="border border-gray-100 rounded-3xl overflow-hidden divide-y divide-gray-100 shadow-inner bg-slate-50/30">
                {selectedProducts.map((p) => (
                  <ComboProductCard
                    key={p._id}
                    product={p}
                    quantity={p.qty}
                    selectedVariants={p.selectedVariants}
                    onQtyChange={(delta) => handleQtyChange(p._id, delta)}
                    onVariantChange={(type, value) =>
                      handleVariantChange(p._id, type, value)
                    }
                    singleMode={!isCombo}
                  />
                ))}
              </div>
            </div>
          )}

          <ComboBillingForm
            subtotal={subtotal}
            shippingCharge={subtotal > 0 ? shippingCharge : 0}
            total={total}
            totalQty={isCombo ? totalQty : selectedProducts[0]?.qty || 1}
            isSubmitting={isSubmitting}
            deliveryLocation={deliveryLocation}
            onDeliveryLocationChange={setDeliveryLocation}
            onSubmit={handleSubmit}
          />
        </div>
      </section>

      {/* FAQ */}
      {landing.faqs?.length > 0 && (
        <section className="py-10 sm:py-16 px-3 sm:px-5 bg-white">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 mb-6 sm:mb-8 text-center">
              সাধারণ জিজ্ঞাসা (FAQ)
            </h2>
            <div className="space-y-3 sm:space-y-4">
              {landing.faqs.map(
                (faq: { question: string; answer: string }, i: number) => (
                  <details
                    key={i}
                    className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm group"
                  >
                    <summary className="px-4 sm:px-6 py-4 sm:py-5 font-bold text-gray-900 text-sm sm:text-lg cursor-pointer list-none flex items-center justify-between gap-3">
                      {faq.question}
                      <span className="text-gray-400 group-open:rotate-180 transition-transform">
                        ▼
                      </span>
                    </summary>
                    <div className="px-4 sm:px-6 pb-4 sm:pb-5 text-sm sm:text-base text-gray-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  </details>
                ),
              )}
            </div>
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="bg-red-950 text-white">
        {/* Top CTA Section */}
        {settings?.whatsapp && (
          <div className="border-b border-red-900/50 px-3 sm:px-5 py-6 sm:py-8">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg sm:text-xl font-black mb-1">
                  কোন প্রশ্ন আছে?
                </h3>
                <p className="text-sm text-red-200/70">
                  আমাদের সাথে সরাসরি যোগাযোগ করুন
                </p>
              </div>
              <a
                href={`https://wa.me/${settings.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-black text-sm transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                💬 WhatsApp চ্যাট করুন
              </a>
            </div>
          </div>
        )}

        {/* Main Footer Content */}
        <div className="px-3 sm:px-5 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 mb-12">
              {/* Brand Section */}
              <div className="lg:col-span-1">
                <div className="mb-6">
                  <h2 className="text-2xl sm:text-3xl font-black mb-3">
                    {brandName}
                  </h2>

                </div>

                <div>
                  <p className="text-white/70 text-sm leading-relaxed">আমরা চেষ্টা করি যেন আমাদের কাস্টমারের হাতে সেরা পণ্যটি পৌঁছায়!</p>
                </div>

              </div>

              {/* Contact Info */}
              <div>
                <h4 className="text-base font-black mb-5 flex items-center gap-2">
                  <span className="text-red-400">📞</span> যোগাযোগ
                </h4>
                <div className="space-y-4 text-sm">
                  {settings?.contactPhone && (
                    <div>
                      <p className="text-red-300/50 text-xs font-bold mb-1">
                        ফোন
                      </p>
                      <a
                        href={`tel:${settings.contactPhone}`}
                        className="text-white hover:text-red-300 transition-colors font-bold"
                      >
                        {settings.contactPhone}
                      </a>
                    </div>
                  )}
                  {settings?.contactEmail && (
                    <div>
                      <p className="text-red-300/50 text-xs font-bold mb-1">
                        ইমেইল
                      </p>
                      <a
                        href={`mailto:${settings.contactEmail}`}
                        className="text-white hover:text-red-300 transition-colors font-bold break-all text-xs sm:text-sm"
                      >
                        {settings.contactEmail}
                      </a>
                    </div>
                  )}
                  {settings?.address && (
                    <div>
                      <p className="text-red-300/50 text-xs font-bold mb-1">
                        ঠিকানা
                      </p>
                      <p className="text-red-100/90">{settings.address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Support */}
              <div>
                <h4 className="text-base font-black mb-5 flex items-center gap-2">
                  <span className="text-red-400">🕐</span> সহায়তা
                </h4>
                <div className="space-y-4 text-sm text-red-100/80">
                  <div>
                    <p className="text-red-300/50 text-xs font-bold mb-2">
                      গ্রাহক সেবা
                    </p>
                    <p>আমরা সর্বদা আপনার সেবায় নিয়োজিত</p>
                  </div>
                  {settings?.whatsapp && (
                    <div className="pt-2 border-t border-red-900/50">
                      <p className="text-red-300/50 text-xs font-bold mb-2">
                        লাইভ চ্যাট
                      </p>
                      <a
                        href={`https://wa.me/${settings.whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-green-400 hover:text-green-300 font-bold text-sm"
                      >
                        💬 WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Social Links */}
              {(settings?.facebook ||
                settings?.instagram ||
                settings?.youtube ||
                settings?.tiktok) && (
                  <div>
                    <h4 className="text-base font-black mb-5 flex items-center gap-2">
                      <span className="text-red-400">🔗</span> অনুসরণ করুন
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {settings?.facebook && (
                        <a
                          href={settings.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-11 h-11 bg-red-900/40 border border-red-700/60 text-white rounded-lg flex items-center justify-center hover:bg-red-900 hover:text-white hover:border-red-700 transition-all transform hover:scale-110"
                          title="Facebook"
                        >
                          <Facebook size={20} />
                        </a>
                      )}
                      {settings?.instagram && (
                        <a
                          href={settings.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-11 h-11 bg-red-900/40 border border-red-700/60 text-white rounded-lg flex items-center justify-center hover:bg-red-900 hover:text-white hover:border-red-700 transition-all transform hover:scale-110"
                          title="Instagram"
                        >
                          <Instagram size={20} />
                        </a>
                      )}
                      {settings?.youtube && (
                        <a
                          href={settings.youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-11 h-11 bg-red-900/40 border border-red-700/60 text-white rounded-lg flex items-center justify-center hover:bg-red-900 hover:text-white hover:border-red-700 transition-all transform hover:scale-110"
                          title="YouTube"
                        >
                          <Youtube size={20} />
                        </a>
                      )}
                      {settings?.tiktok && (
                        <a
                          href={settings.tiktok}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-11 h-11 bg-red-900/40 border border-red-700/60 text-white rounded-lg flex items-center justify-center hover:bg-red-900 hover:text-white hover:border-red-700 transition-all transform hover:scale-110"
                          title="TikTok"
                        >
                          <TikTokIcon size={20} />
                        </a>
                      )}
                    </div>
                  </div>
                )}
            </div>

            {/* Divider */}
            <div className="border-t border-red-900/50 pt-8 sm:pt-10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-red-200/60">
                <div>
                  <p>
                    © {new Date().getFullYear()}{" "}
                    <span className="font-black text-red-300">{brandName}</span>
                    . সর্বস্বত্ব সংরক্ষিত।
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-red-300/70">
                  <span>Powered by</span>
                  <a
                    href={process.env.NEXT_PUBLIC_BASE_URL || "/"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-black text-red-300 hover:text-red-200 transition-colors"
                  >
                    {process.env.NEXT_PUBLIC_BASE_URL?.replace(/^https?:\/\//, '') || "Store"}
                  </a>
              
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* MOBILE CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white/95 backdrop-blur-xl border-t border-gray-100 z-[900]">
        <button
          onClick={scrollToCheckout}
          className="w-full bg-red-600 text-white py-3.5 rounded-xl font-black text-base shadow-xl shadow-red-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-5 h-5 shrink-0" />
          <span className="truncate">
            অর্ডার করুন — {formatCurrency(total || subtotal)}
          </span>
        </button>
      </div>
    </div>
  );
}
