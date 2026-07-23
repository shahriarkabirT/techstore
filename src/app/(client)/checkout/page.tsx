"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import Image from "next/image";
import { isHexColor, getColorName, formatCurrency } from "@/lib/utils";
import { toast } from "react-hot-toast";
import Skeleton from "@/components/shared/Skeleton";
import { OrderSummarySkeleton } from "@/components/shared/Skeletons";
import CouponInput from "@/components/client/CouponInput";
import { useGetPublicGeneralSettingsQuery } from "@/redux/features/settings/settingsApi";
import { trackInitiateCheckout } from "@/lib/gtm-datalayer";
import { bdLocations } from "@/lib/locations";


function CheckoutContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const isDirectBuy = searchParams.get("directBuy") === "true";

    const {
        items: cartItems,
        isLoading: isCartLoading,
        getTotal: getCartTotal,
        clearCart: clearCartContext,
    } = useCart();
    const [directBuyItems, setDirectBuyItems] = useState<any[]>([]);
    const [isDirectBuyLoading, setIsDirectBuyLoading] = useState(true);

    useEffect(() => {
        if (isDirectBuy) {
            const stored = sessionStorage.getItem("directBuyItem");
            if (stored) {
                try {
                    setDirectBuyItems(JSON.parse(stored));
                } catch (e) {
                    console.error("Failed to parse directBuyItem", e);
                }
            }
            setIsDirectBuyLoading(false);
        }
    }, [isDirectBuy]);

    const items = isDirectBuy ? directBuyItems : cartItems;
    const isLoading = isDirectBuy ? isDirectBuyLoading : isCartLoading;

    const { data: generalSettingsData } = useGetPublicGeneralSettingsQuery();
    const generalSettings = generalSettingsData?.settings;

    const getTotal = () => {
        if (isDirectBuy) {
            return directBuyItems.reduce(
                (total, item) => total + item.price * item.quantity,
                0,
            );
        }
        return getCartTotal();
    };

    const clearCart = () => {
        if (isDirectBuy) {
            sessionStorage.removeItem("directBuyItem");
        } else {
            clearCartContext();
        }
    };
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        email: "",
        address: "",
        // division: "",
        // district: "",
        city: "",
        notes: "",
    });
    const [deliveryLocation, setDeliveryLocation] = useState<"inside" | "outside" | "">("");
    const [paymentMethod, setPaymentMethod] = useState("COD");
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [discountAmount, setDiscountAmount] = useState(0);

    // ── Abandoned checkout capture ──
    const hasInteracted = useRef(false);
    const hasSubmitted = useRef(false);

    const handleFormFocus = useCallback(() => {
        hasInteracted.current = true;
    }, []);

    useEffect(() => {
        const sendAbandonedCheckout = () => {
            // Skip if user never touched the form, or already placed an order
            if (!hasInteracted.current || hasSubmitted.current) return;
            // Skip if no useful data entered
            const fd = formData;
            if (!fd.name?.trim() && !fd.phone?.trim()) return;
            // Skip if cart is empty
            if (!items || items.length === 0) return;

            const payload = JSON.stringify({
                customerInfo: {
                    name: fd.name,
                    phone: fd.phone,
                    email: fd.email,
                    address: fd.address,
                    city: fd.city,
                    notes: fd.notes,
                },
                cartItems: items.map((item: any) => ({
                    productId: item.productId,
                    title: item.title,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image,
                    variant: item.variant,
                })),
                cartTotal: items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0),
            });

            // sendBeacon is fire-and-forget — works during page unload
            navigator.sendBeacon('/api/abandoned-checkout', new Blob([payload], { type: 'application/json' }));
        };

        const handleBeforeUnload = () => sendAbandonedCheckout();
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') sendAbandonedCheckout();
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [formData, items]);

    const hasTrackedCheckout = useRef(false);

    // Meta Pixel: Track InitiateCheckout
    useEffect(() => {
        if (items && items.length > 0 && !isLoading && !hasTrackedCheckout.current) {
            hasTrackedCheckout.current = true;
            const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
            trackInitiateCheckout({
                content_ids: items.map(i => String(i.productId)),
                contents: items.map(i => ({ id: String(i.productId), quantity: i.quantity, item_price: i.price, item_name: i.title })),
                value: total,
                currency: 'BDT',
                num_items: items.reduce((sum, i) => sum + i.quantity, 0)
            });
        }
    }, [items, isLoading]);

    // Auto-fill user data if available and form is empty
    useEffect(() => {
        if (user && !formData.name && !formData.email) {
            setFormData((prev) => ({
                ...prev,
                name: user.name || "",
                email: user.email || "",
                phone: user.phone || "",
            }));
        }
    }, [formData.email, formData.name, user]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat("en-BD", {
            style: "currency",
            currency: "BDT",
            minimumFractionDigits: 0,
        }).format(price);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto">
                    <Skeleton width="200px" height="32px" className="mb-8" />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="card p-6 space-y-6 rounded-2xl">
                                <Skeleton width="150px" height="20px" />
                                <div className="space-y-4">
                                    <Skeleton width="100%" height="48px" borderRadius="0.75rem" />
                                    <Skeleton width="100%" height="48px" borderRadius="0.75rem" />
                                    <Skeleton width="100%" height="48px" borderRadius="0.75rem" />
                                    <Skeleton
                                        width="100%"
                                        height="100px"
                                        borderRadius="0.75rem"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <OrderSummarySkeleton />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto">
                    <div className="card p-12 text-center max-w-lg mx-auto">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1}
                            stroke="currentColor"
                            className="w-16 h-16 mx-auto text-gray-300 mb-4"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
                            />
                        </svg>
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">
                            Your cart is empty
                        </h2>
                        <p className="text-gray-500 mb-6">
                            Add products to cart before checkout.
                        </p>
                        <Link href="/products" className="btn btn-primary">
                            Continue Shopping
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const subtotal = getTotal();
    const totalTax = items.reduce((acc, item) => {
        const itemTax =
            (item.variant as any)?.tax !== undefined
                ? (item.variant as any).tax
                : item.tax || 0;
        const itemTaxType = item.taxType || "percentage";

        if (itemTaxType === "flat") {
            return acc + itemTax * item.quantity;
        }

        return acc + (item.price * item.quantity * itemTax) / 100;
    }, 0);
    const hasFreeShippingItem = items.some(item => item.freeShipping);
    const baseShippingCost = deliveryLocation === 'inside'
        ? (generalSettings?.shippingChargeInsideDhaka ?? 60)
        : deliveryLocation === 'outside'
            ? (generalSettings?.shippingChargeOutsideDhaka ?? 120)
            : 0; // Default to 0 if no location selected
    const shippingCost = hasFreeShippingItem ? 0 : baseShippingCost;
    const total = subtotal + shippingCost + totalTax - discountAmount;

    const handleApplyCoupon = (coupon: any, discount: number) => {
        setAppliedCoupon(coupon);
        setDiscountAmount(discount);
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setDiscountAmount(0);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => {
            const updated = { ...prev, [name]: value };
            // if (name === "division") {
            //     updated.district = "";
            //     updated.city = "";
            // } else if (name === "district") {
            //     updated.city = value;
            // }
            return updated;
        });
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const insideCharge = generalSettings?.shippingChargeInsideDhaka ?? 60;
    const outsideCharge = generalSettings?.shippingChargeOutsideDhaka ?? 120;

    const handleSelectAddress = (address) => {
        let matchedDivision = "";
        let matchedDistrict = "";

        if (address.city) {
            for (const [div, districts] of Object.entries(bdLocations)) {
                const found = districts.find(
                    (dist) => dist.toLowerCase() === address.city.toLowerCase()
                );
                if (found) {
                    matchedDivision = div;
                    matchedDistrict = found;
                    break;
                }
            }
        }

        if (!matchedDistrict && address.address) {
            for (const [div, districts] of Object.entries(bdLocations)) {
                const found = districts.find(
                    (dist) => address.address.toLowerCase().includes(dist.toLowerCase())
                );
                if (found) {
                    matchedDivision = div;
                    matchedDistrict = found;
                    break;
                }
            }
        }

        setFormData((prev) => ({
            ...prev,
            name: address.name || user?.name || prev.name,
            phone: address.phone || user?.phone || prev.phone,
            address: address.address,
            // division: matchedDivision,
            // district: matchedDistrict,
            // city: matchedDistrict || address.city,
            city: address.city,
        }));
        setShowAddressModal(false);
        toast.success("Address applied!");
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) {
            newErrors.name = "Name is required";
        }

        const phoneRegex = /^(\+?880|0)?1[3-9]\d{8}$/;
        if (!formData.phone.trim()) {
            newErrors.phone = "Phone number is required";
        } else if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
            newErrors.phone = "Invalid phone number";
        }

        if (!formData.address.trim()) {
            newErrors.address = "Address is required";
        }

        // if (!formData.division) {
        //     newErrors.division = "Division is required";
        // }

        // if (!formData.district) {
        //     newErrors.district = "District is required";
        // }

        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Invalid email format";
        }

        if (!deliveryLocation) {
            newErrors.deliveryLocation = "Please select a delivery location";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsSubmitting(true);

        try {
            // Create order
            const orderResponse = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerInfo: {
                        ...formData,
                        // address: `${formData.address}, ${formData.district}, ${formData.division}`,
                        // city: formData.district,
                        address: formData.address,
                        city: formData.city || undefined,
                        deliveryLocation,
                    },
                    items: items.map((item) => ({
                        productId: item.productId,
                        title: item.title,
                        quantity: item.quantity,
                        variant: item.variant,
                        isPreorder: item.isPreorder,
                    })),
                    paymentMethod,
                    shippingCost,
                    taxAmount: totalTax,
                    discountAmount,
                    couponCode: appliedCoupon?.code,
                }),
            });

            const orderData = await orderResponse.json();

            if (!orderData.success) {
                throw new Error(orderData.message || "Failed to create order");
            }

            if (paymentMethod === "AamarPay") {
                // Initialize payment
                const paymentResponse = await fetch("/api/payment/init", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId: orderData.order.orderId }),
                });

                const paymentData = await paymentResponse.json();

                if (paymentData.success && paymentData.paymentUrl) {
                    hasSubmitted.current = true;
                    clearCart();
                    window.location.href = paymentData.paymentUrl;
                    return;
                }

                throw new Error(paymentData.message || "Payment initialization failed");
            }

            // COD - redirect to confirmation
            hasSubmitted.current = true;
            clearCart();
            router.push(`/order-confirmation/${orderData.order.orderId}`);
        } catch (error) {
            console.error("Checkout error:", error);
            setErrors({
                submit: error.message || "Something went wrong. Please try again.",
            });
            toast.error(error.message || "Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background py-8 relative">
            {/* Address Selection Modal */}
            {showAddressModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                            <h3 className="font-bold text-gray-900">
                                Select Delivery Address
                            </h3>
                            <button
                                onClick={() => setShowAddressModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                    className="w-5 h-5"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
                            {user?.addressBook && user.addressBook.length > 0 ? (
                                user.addressBook.map((addr, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelectAddress(addr)}
                                        className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-blue-500 hover:bg-blue-50/30 transition-all group"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-gray-900 text-sm">
                                                {addr.name}
                                            </span>
                                            {addr.isDefault && (
                                                <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                                                    Default
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 mb-1 flex items-center gap-1.5">
                                            <svg
                                                className="w-3.5 h-3.5"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                                />
                                            </svg>
                                            {addr.phone}
                                        </p>
                                        <p className="text-sm text-gray-600 leading-relaxed font-medium">
                                            {addr.address}, {addr.city}
                                        </p>
                                    </button>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <p>No saved addresses found.</p>
                                    <Link
                                        href="/profile"
                                        className="text-blue-600 text-sm font-bold hover:underline mt-2 inline-block"
                                    >
                                        Manage Addresses in Profile
                                    </Link>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
                            <button
                                onClick={() => setShowAddressModal(false)}
                                className="w-full py-2.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="container mx-auto">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Shipping Information */}
                        <div className="space-y-4">
                            <div className="card p-5 rounded-2xl border-none shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-base font-bold text-gray-900 uppercase tracking-wider">
                                        Shipping Information
                                    </h2>
                                    {user && user.addressBook?.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setShowAddressModal(true)}
                                            className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                                />
                                            </svg>
                                            Select Saved Address
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Full Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            onFocus={handleFormFocus}
                                            className={`input ${errors.name ? "border-danger" : ""}`}
                                            placeholder="Enter your full name"
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-danger mt-1">{errors.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Phone Number *
                                        </label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            onFocus={handleFormFocus}
                                            className={`input ${errors.phone ? "border-danger" : ""}`}
                                            placeholder="01XXXXXXXXX"
                                        />
                                        {errors.phone && (
                                            <p className="text-sm text-danger mt-1">{errors.phone}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Email (Optional)
                                        </label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            onFocus={handleFormFocus}
                                            className={`input ${errors.email ? "border-danger" : ""}`}
                                            placeholder="your@email.com"
                                        />
                                        {errors.email && (
                                            <p className="text-sm text-danger mt-1">{errors.email}</p>
                                        )}
                                    </div>
                                      {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Division *
                                            </label>
                                            <select
                                                name="division"
                                                required
                                                value={formData.division}
                                                onChange={handleInputChange}
                                                className={`input ${errors.division ? "border-danger" : ""}`}
                                            >
                                                <option value="">Select Division</option>
                                                {Object.keys(bdLocations).map((div) => (
                                                    <option key={div} value={div}>{div}</option>
                                                ))}
                                            </select>
                                            {errors.division && (
                                                <p className="text-sm text-danger mt-1">{errors.division}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                District *
                                            </label>
                                            <select
                                                name="district"
                                                required
                                                disabled={!formData.division}
                                                value={formData.district}
                                                onChange={handleInputChange}
                                                className={`input ${errors.district ? "border-danger" : ""}`}
                                            >
                                                <option value="">Select District</option>
                                                {formData.division && bdLocations[formData.division as keyof typeof bdLocations].map((dist) => (
                                                    <option key={dist} value={dist}>{dist}</option>
                                                ))}
                                            </select>
                                            {errors.district && (
                                                <p className="text-sm text-danger mt-1">{errors.district}</p>
                                            )}
                                        </div>
                                    </div> */}

                                    {/* Delivery Area Selector */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Delivery Area *
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDeliveryLocation("inside");
                                                    setErrors(prev => ({ ...prev, deliveryLocation: '' }));
                                                }}
                                                className={`relative flex flex-col items-start gap-1 p-3 rounded-xl border-2 cursor-pointer transition-all text-left ${
                                                    deliveryLocation === "inside"
                                                        ? "border-primary bg-primary/5 shadow-sm"
                                                        : "border-gray-200 hover:border-gray-300 bg-white"
                                                }`}
                                            >
                                                {deliveryLocation === "inside" && (
                                                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1.5">
                                                    <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    </svg>
                                                    <span className="font-semibold text-sm text-gray-800">Inside Dhaka</span>
                                                </span>
                                                <span className="text-xs text-primary font-bold ml-5.5">
                                                    {hasFreeShippingItem ? (
                                                        <span className="text-green-600">Free</span>
                                                    ) : (
                                                        `৳${insideCharge}`
                                                    )}
                                                </span>
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDeliveryLocation("outside");
                                                    setErrors(prev => ({ ...prev, deliveryLocation: '' }));
                                                }}
                                                className={`relative flex flex-col items-start gap-1 p-3 rounded-xl border-2 cursor-pointer transition-all text-left ${
                                                    deliveryLocation === "outside"
                                                        ? "border-primary bg-primary/5 shadow-sm"
                                                        : "border-gray-200 hover:border-gray-300 bg-white"
                                                }`}
                                            >
                                                {deliveryLocation === "outside" && (
                                                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1.5">
                                                    <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span className="font-semibold text-sm text-gray-800">Outside Dhaka</span>
                                                </span>
                                                <span className="text-xs text-gray-500 font-bold ml-5.5">
                                                    {hasFreeShippingItem ? (
                                                        <span className="text-green-600">Free</span>
                                                    ) : (
                                                        `৳${outsideCharge}`
                                                    )}
                                                </span>
                                            </button>
                                        </div>
                                        {errors.deliveryLocation && (
                                            <p className="mt-2 text-xs text-red-500 font-medium">
                                                {errors.deliveryLocation}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Full Delivery Address *
                                        </label>
                                        <textarea
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            onFocus={handleFormFocus}
                                            className={`input min-h-[100px] ${errors.address ? "border-danger" : ""}`}
                                            placeholder="Enter your full address"
                                            rows={3}
                                        />
                                        {errors.address && (
                                            <p className="text-sm text-danger mt-1">
                                                {errors.address}
                                            </p>
                                        )}
                                    </div>

                                  

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Order Notes (Optional)
                                        </label>
                                        <textarea
                                            name="notes"
                                            value={formData.notes}
                                            onChange={handleInputChange}
                                            className="input"
                                            placeholder="Any special instructions..."
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Payment Method */}
                            <div className="card p-5 rounded-2xl border-none shadow-sm">
                                <h2 className="text-base font-bold text-gray-900 mb-4 uppercase tracking-wider">
                                    Payment Method
                                </h2>

                                <div className="space-y-3">
                                    <label
                                        className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${paymentMethod === "COD"
                                            ? "border-primary bg-primary/5"
                                            : "border-gray-100 hover:border-gray-200"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="COD"
                                            checked={paymentMethod === "COD"}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-4 h-4 text-primary"
                                        />
                                        <div className="flex-grow">
                                            <span className="font-medium text-gray-800">
                                                Cash on Delivery
                                            </span>
                                            <p className="text-sm text-gray-500">
                                                Pay when you receive your order
                                            </p>
                                        </div>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="w-6 h-6 text-gray-400"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z"
                                            />
                                        </svg>
                                    </label>

                                    {/* <label
                                        className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${paymentMethod === "AamarPay"
                                            ? "border-primary bg-primary/5"
                                            : "border-gray-100 hover:border-gray-200"
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="AamarPay"
                                            checked={paymentMethod === "AamarPay"}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-4 h-4 text-primary"
                                        />
                                        <div className="flex-grow">
                                            <span className="font-medium text-gray-800">
                                                Online Payment
                                            </span>
                                            <p className="text-sm text-gray-500">
                                                Pay securely with bKash, Nagad, Cards & more
                                            </p>
                                        </div>
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={1.5}
                                            stroke="currentColor"
                                            className="w-6 h-6 text-gray-400"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
                                            />
                                        </svg>
                                    </label> */}
                                </div>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div>
                            <div className="card p-5 sticky top-24 rounded-2xl border-none shadow-sm dark:bg-gray-900/50">
                                <h2 className="text-base font-bold text-gray-900 mb-4 uppercase tracking-wider">
                                    Order Summary
                                </h2>

                                {/* Items */}
                                <div className="space-y-3 max-h-[300px] overflow-y-auto mb-4">
                                    {items.map((item) => (
                                        <div
                                            key={`${item.productId}-${JSON.stringify(item.variant)}`}
                                            className="flex gap-3"
                                        >
                                            <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 rounded overflow-hidden">
                                                {item.image ? (
                                                    <Image
                                                        src={item.image}
                                                        alt={item.title}
                                                        fill
                                                        className="object-cover"
                                                        sizes="64px"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={1}
                                                            stroke="currentColor"
                                                            className="w-6 h-6"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                                                            />
                                                        </svg>
                                                    </div>
                                                )}
                                                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                                    {item.quantity}
                                                </span>
                                            </div>
                                            <div className="flex-grow min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">
                                                    {item.title}
                                                </p>
                                                {item.variant &&
                                                    Object.keys(item.variant).length > 0 && (
                                                        <div className="flex flex-wrap gap-1 mt-0.5">
                                                            {Object.entries(item.variant).map(
                                                                ([key, value]) => {
                                                                    if (
                                                                        key === "colorCode" ||
                                                                        key === "tax" ||
                                                                        key === "taxType"
                                                                    )
                                                                        return null;

                                                                    const isColor = key.toLowerCase() === "color";
                                                                    const swatchColor = isColor
                                                                        ? item.variant?.colorCode
                                                                        : null;

                                                                    return (
                                                                        <span
                                                                            key={key}
                                                                            className="flex items-center gap-1.5 text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-700 font-bold uppercase tracking-tight border border-gray-200"
                                                                        >
                                                                            {swatchColor && (
                                                                                <span
                                                                                    className="w-2 h-2 rounded-full border border-gray-300 shadow-sm"
                                                                                    style={{
                                                                                        backgroundColor: swatchColor,
                                                                                    }}
                                                                                />
                                                                            )}
                                                                            {String(value)}
                                                                        </span>
                                                                    );
                                                                },
                                                            )}
                                                        </div>
                                                    )}
                                                {item.isPreorder && (
                                                    <div className="mt-1">
                                                        <span className="bg-orange-100 text-orange-600 text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter border border-orange-200">
                                                            Pre-order
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className="text-primary font-bold text-sm">
                                                            {formatPrice(item.price)}
                                                        </span>
                                                    </div>
                                                    {item.originalPrice > item.price && (
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="text-[10px] text-gray-400 line-through">
                                                                {formatPrice(item.originalPrice)}
                                                            </span>
                                                            {item.discount > 0 && (
                                                                <span className="text-[8px] font-bold bg-rose-50 text-rose-500 px-1 py-0.5 rounded tracking-widest whitespace-nowrap">
                                                                    {item.discountType === "flat"
                                                                        ? `-${formatPrice(item.discount)}`
                                                                        : `-${item.discount}%`}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {(() => {
                                                        const itemTax = item.tax || 0;
                                                        if (itemTax === 0) return null;
                                                        const itemTaxType = item.taxType || "percentage";
                                                        const calculatedTax =
                                                            itemTaxType === "flat"
                                                                ? itemTax
                                                                : (item.price * itemTax) / 100;

                                                        return (
                                                            <div className="mt-0.5">
                                                                <span className="text-[10px] text-gray-500 font-medium">
                                                                    + Tax{" "}
                                                                    {itemTaxType === "percentage" &&
                                                                        `(${itemTax}%)`}
                                                                    : ৳{calculatedTax.toLocaleString("en-BD")}
                                                                </span>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-800">
                                                {formatPrice(item.price * item.quantity)}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Coupon Input */}
                                <div className="mb-6 pt-2 border-t border-gray-100">
                                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">
                                        Promo Code
                                    </h3>
                                    <CouponInput
                                        cartTotal={subtotal}
                                        onApply={handleApplyCoupon}
                                        onRemove={handleRemoveCoupon}
                                        appliedCoupon={appliedCoupon}
                                    />
                                </div>

                                {/* Totals */}
                                <div className="border-t border-gray-200 pt-4 space-y-3 text-sm">
                                    <div className="flex justify-between text-gray-600 font-medium">
                                        <span>Subtotal</span>
                                        <span>{formatPrice(subtotal)}</span>
                                    </div>
                                    {totalTax > 0 && (
                                        <div className="flex justify-between text-gray-600 font-medium">
                                            <span>Estimated Tax</span>
                                            <span>{formatPrice(totalTax)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-gray-600 font-medium">
                                        <span>Shipping</span>
                                        {shippingCost === 0 ? (
                                            <span className="text-green-600 font-bold uppercase tracking-wider text-xs bg-green-50 px-2 py-0.5 rounded border border-green-100">Free</span>
                                        ) : (
                                            <span>{formatPrice(shippingCost)}</span>
                                        )}
                                    </div>
                                    {discountAmount > 0 && (
                                        <div className="flex justify-between text-green-600 font-bold bg-green-50/50 p-2 rounded-lg border border-green-100/50">
                                            <div className="flex items-center gap-1">
                                                <span>Discount</span>
                                                <span className="text-[10px] bg-green-100 px-1.5 py-0.5 rounded uppercase">
                                                    {appliedCoupon?.code}
                                                </span>
                                            </div>
                                            <span>-{formatPrice(discountAmount)}</span>
                                        </div>
                                    )}
                                    <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-gray-900">
                                        <span className="text-base uppercase tracking-wider">
                                            Total
                                        </span>
                                        <span className="text-primary text-2xl tracking-tight">
                                            {formatPrice(total)}
                                        </span>
                                    </div>
                                </div>

                                {errors.submit && (
                                    <div className="mt-4 p-3 bg-danger/10 text-danger text-sm rounded-lg">
                                        {errors.submit}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="btn btn-primary w-full mt-6 py-3 disabled:opacity-60"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="spinner"></span>
                                            Processing...
                                        </>
                                    ) : paymentMethod === "COD" ? (
                                        "Confirm Order"
                                    ) : (
                                        "Proceed to Payment"
                                    )}
                                </button>

                                <Link href="/cart" className="btn btn-outline w-full mt-3">
                                    Back to Cart
                                </Link>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-gray-50 py-8">
                    <div className="container mx-auto flex justify-center mt-20">
                        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                </div>
            }
        >
            <CheckoutContent />
        </Suspense>
    );
}
