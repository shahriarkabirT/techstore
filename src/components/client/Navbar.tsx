"use client";

import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useGetPublicSettingsQuery } from "@/redux/features/settings/settingsApi";
import { useHasMounted } from "@/hooks/useHasMounted";
import { ISettings } from "@/types";
import {
  Heart,
  LogIn,
  PackageSearch,
  ShoppingBag,
  User,
  UserPlus,
  MoreHorizontal,
  Info,
  HelpCircle,
  Phone,
  MessageCircle,
  Menu,
  Search,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useState, useRef, useEffect } from "react";

const WhatsAppIcon = ({ className, style, fill }: { className?: string; style?: React.CSSProperties; fill?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill={fill || "currentColor"}
    className={className}
    style={style}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 0 5.415 0 12.05c0 2.12.553 4.189 1.603 6.02L0 24l6.112-1.604a11.82 11.82 0 005.935 1.597h.005c6.634 0 12.05-5.415 12.05-12.05a11.78 11.78 0 00-3.535-8.513" />
  </svg>
);
import CartDrawer from "./CartDrawer";
import CategoryMegaMenu from "./CategoryMegaMenu";
import SearchBar from "./SearchBar";
import MobileSearchModal from "./MobileSearchModal";

interface NavbarProps {
  initialSettings?: Partial<ISettings> | null;
}

export default function Navbar({ initialSettings }: NavbarProps) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const { getItemCount } = useCart();
  const { wishlistCount } = useWishlist();
  const itemCount = getItemCount();
  const mounted = useHasMounted();

  // Close "More" menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
    };
    if (isMoreOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMoreOpen]);

  const { data: settingsData } = useGetPublicSettingsQuery(undefined);

  const settings = { ...initialSettings, ...settingsData?.settings };
  const brandName = settings?.brandName || "Store";

  const logoSettings = {
    url: settings?.logoUrl || "",
    width: settings?.logoWidth || 120,
    height: settings?.logoHeight || 40,
  };

  return (
    <>
      <header className={`shadow-sm z-50 transition-all duration-300 ${(isMoreOpen || isUserMenuOpen)
          ? 'bg-white'
          : 'bg-white/80 backdrop-blur-md hover:bg-white hover:backdrop-blur-none'
        }`}>
        <nav className="container mx-auto">
          <div className="flex items-center justify-between h-[72px] 2xl:h-20 gap-4">
            {/* Section 1: Logo - Desktop Left / Mobile Left */}
            <div className="flex-shrink-0 flex-none flex justify-start">
              {logoSettings.url ? (
                <Link
                  href="/"
                  className="flex items-center justify-center group"
                >
                  <Image
                    src={logoSettings.url}
                    alt={brandName}
                    width={logoSettings.width}
                    height={logoSettings.height}
                    style={{
                      width: `${logoSettings.width}px`,
                      height: `${logoSettings.height}px`,
                    }}
                    className="object-contain"
                    priority
                  />
                </Link>
              ) : (
                <Link
                  href="/"
                  className="flex items-center justify-center group"
                >
                  <span className="text-xl font-bold text-primary">
                    {brandName}
                  </span>
                </Link>
              )}
            </div>

            {/* Section 2: Navigation - Middle Left */}
            <div className="hidden md:flex items-center gap-2 xl:gap-4">
              {[
                { label: "Home", href: "/" },
                { label: "Categories", href: "/products", hasMegaMenu: true },
                { label: "Shop", href: "/products" },
                { label: "Contact", href: "/contact" },
                { label: "Stores", href: "/store-locations" },
              ].map((link) => {
                const isActive =
                  !link.hasMegaMenu &&
                  (pathname === link.href ||
                    (link.href !== "/" && pathname.startsWith(link.href)));
                return (
                  <div
                    key={link.label}
                    className={
                      link.hasMegaMenu
                        ? "relative group/cat h-16 flex items-center"
                        : "relative h-16 flex items-center"
                    }
                  >
                    {link.hasMegaMenu ? (
                      <>
                        <button
                          className={`relative px-4 py-2 transition-colors duration-200 text-sm md:text-[14px] lg:text-[15px] 2xl:text-base tracking-wide flex items-center gap-1.5 cursor-pointer ${isActive ? "text-primary font-semibold" : "text-gray-500 font-medium hover:text-primary"}`}
                        >
                          {link.label}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                            className="w-3 h-3 group-hover/cat:rotate-180 transition-transform duration-300 ease-out"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m19.5 8.25-7.5 7.5-7.5-7.5"
                            />
                          </svg>
                          {isActive && (
                            <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-primary" />
                          )}
                        </button>
                        <div className="absolute left-0 top-full pt-2 opacity-0 invisible translate-y-2 group-hover/cat:opacity-100 group-hover/cat:visible group-hover/cat:translate-y-0 transition-all duration-200 z-50">
                          <div className="w-[900px] max-w-[90vw] rounded-2xl border border-gray-100 shadow-2xl shadow-black/10 overflow-hidden bg-white">
                            <CategoryMegaMenu />
                          </div>
                        </div>
                      </>
                    ) : (
                      <Link
                        href={link.href}
                        className={`relative px-4 py-2 transition-colors duration-200 text-sm md:text-[14px] lg:text-[15px] 2xl:text-base tracking-wide flex items-center cursor-pointer group/link ${isActive ? "text-primary font-semibold" : "text-gray-500 font-medium hover:text-primary"}`}
                      >
                        {link.label}
                        {isActive ? (
                          <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-primary" />
                        ) : (
                          <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-primary scale-x-0 group-hover/link:scale-x-100 transition-transform duration-300 origin-center" />
                        )}
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobile Search - Removed as per new design */}

            {/* Section 3: Search Bar - Middle Right (Desktop) */}
            <div className="hidden md:flex items-center gap-4">
              <Suspense
                fallback={
                  <div className="w-48 xl:w-56 h-10 bg-gray-50 rounded-md animate-pulse" />
                }
              >
                <SearchBar
                  className="w-full"
                  inputClassName="w-56 xl:w-72 2xl:w-96 focus:w-64 xl:focus:w-80 2xl:focus:w-[420px]"
                />
              </Suspense>
            </div>

            {/* Section 4: Action Buttons - Far Right */}
            <div className="flex-shrink-0 flex items-center gap-2 md:gap-3 xl:gap-4">
              <Link
                href="/track/order"
                aria-label="Track Order"
                className="hidden md:flex flex-col items-center gap-1 p-1.5 text-gray-600 hover:text-gray-900 transition-colors group"
              >
                <div className="relative">
                  <PackageSearch
                    className="w-6 h-6 group-hover:text-gray-900 transition-colors"
                    strokeWidth={1.5}
                  />
                </div>
                <span className="text-[10px] 2xl:text-[11px] font-medium">Track</span>
              </Link>
              <Link
                href="/wishlist"
                aria-label="View Wishlist"
                className="hidden md:flex flex-col items-center gap-1 p-1.5 text-gray-600 hover:text-gray-900 transition-colors group"
              >
                <div className="relative">
                  <Heart
                    className="w-6 h-6 group-hover:fill-rose-500 group-hover:stroke-rose-500 transition-colors"
                    strokeWidth={1.5}
                  />
                  {mounted && wishlistCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-white">
                      {wishlistCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] 2xl:text-[11px] font-medium">Wishlist</span>
              </Link>
              <button
                onClick={() => setIsMobileSearchOpen(true)}
                aria-label="Search"
                className="md:hidden flex flex-col items-center gap-1 p-1.5 text-gray-800 hover:text-primary transition-colors group cursor-pointer"
              >
                <div className="relative">
                  <Search
                    className="w-6 h-6 md:group-hover:text-primary transition-colors"
                    strokeWidth={1.5}
                  />
                </div>
              </button>
              <button
                onClick={() => setIsCartOpen(true)}
                aria-label="Open Cart"
                className="flex flex-col items-center gap-1 p-1.5 text-gray-800 hover:text-primary transition-colors group cursor-pointer"
              >
                <div className="relative">
                  <ShoppingBag
                    className="w-6 h-6 md:group-hover:text-primary transition-colors"
                    strokeWidth={1.5}
                  />
                  {mounted && itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-primary text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-white">
                      {itemCount}
                    </span>
                  )}
                </div>
                <span className="hidden md:block text-[10px] 2xl:text-[11px] font-medium">Cart</span>
              </button>
              {isLoading ? (
                <div
                  aria-label="Loading profile"
                  className="hidden md:flex flex-col items-center gap-1 p-1.5"
                >
                  <div className="w-6 h-6 rounded-full border border-gray-200 bg-gray-100 animate-pulse" />
                  <div className="hidden sm:block w-10 h-2 rounded-full bg-gray-100 animate-pulse" />
                </div>
              ) : (
                <div className="relative group/auth hidden md:block">
                  {user ? (
                    <>
                      <button
                        aria-label="User Menu"
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex flex-col items-center gap-1 p-1.5 text-gray-600 hover:text-gray-900 transition-colors group cursor-pointer md:gap-1"
                      >
                        <div className="relative">
                          <div className="w-6 h-6 rounded-full ring-1 ring-gray-200 overflow-hidden bg-gray-100 flex items-center justify-center">
                            {user.image ? (
                              <Image
                                src={user.image}
                                alt={user.name || "Profile"}
                                width={24}
                                height={24}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[10px] font-bold text-gray-700 uppercase">
                                {(user.name?.[0] || user.email?.[0] || "U").toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                        </div>
                        <span className="hidden sm:block text-[10px] 2xl:text-[11px] font-medium">
                          Profile
                        </span>
                      </button>

                      {/* User Dropdown (Logged In) */}
                      {isUserMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-40 animate-in fade-in zoom-in-95 duration-200">
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-bold text-gray-900 truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {user.email}
                            </p>
                          </div>
                          <Link
                            href="/profile"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          >
                            Profile
                          </Link>
                          {(user.role === "admin" ||
                            user.role === "moderator") && (
                              <Link
                                href={
                                  user.role === "moderator"
                                    ? "/admin/moderator-dashboard"
                                    : "/admin/dashboard"
                                }
                                onClick={() => setIsUserMenuOpen(false)}
                                className="block px-4 py-1.5 text-sm font-bold text-primary hover:bg-primary/5 transition-colors"
                              >
                                {user.role === "moderator"
                                  ? "Moderator Dashboard"
                                  : "Admin Dashboard"}
                              </Link>
                            )}

                          <button
                            onClick={() => {
                              logout();
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-rose-500 hover:bg-rose-50 font-medium"
                          >
                            Sign Out
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        aria-label="Sign In Menu"
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex flex-col items-center gap-1 p-1.5 text-gray-600 hover:text-gray-900 transition-colors group cursor-pointer"
                      >
                        <div className="relative">
                          <User
                            className="w-6 h-6 group-hover:text-primary transition-colors"
                            strokeWidth={1.5}
                          />
                        </div>
                        <span className="text-[10px] 2xl:text-[11px] font-medium md:block hidden">
                          Profile
                        </span>
                      </button>

                      {/* Auth Dropdown (Hover & Click) - Enhanced Premium UI */}
                      <div
                        className={`absolute top-full right-0 mt-3 w-64 bg-white/95 backdrop-blur-xl rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100/50 p-4 z-40 transition-all transform duration-300 ${isUserMenuOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible translate-y-4 md:group-hover/auth:opacity-100 md:group-hover/auth:visible md:group-hover/auth:translate-y-0"}`}
                      >
                        {/* Decorative triangle arrow */}
                        <div className="absolute -top-1.5 right-4 w-3 h-3 bg-white border-t border-l border-gray-100/50 rotate-45 z-[-1]" />

                        <div className="mb-4">
                          <h3 className="text-sm font-bold text-gray-900">
                            Welcome to {brandName}
                          </h3>
                          <p className="text-[11px] text-gray-400 mt-0.5 leading-relaxed">
                            Discover the best shopping experience and manage
                            your orders
                          </p>
                        </div>

                        <div className="grid gap-2">
                          <Link
                            href="/login"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center justify-center gap-2.5 px-4 py-2.5 bg-primary text-white text-sm font-bold rounded-md hover:bg-primary/90 transition-all active:scale-[0.98] shadow-lg shadow-primary/20 hover:shadow-primary/30 group/btn"
                          >
                            <LogIn className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
                            Sign In
                          </Link>

                          <Link
                            href="/register"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center justify-center gap-2.5 px-4 py-2.5 bg-gray-50 text-gray-700 text-sm font-bold rounded-md hover:bg-gray-100 transition-all active:scale-[0.98] border border-gray-100 group/btn2"
                          >
                            <UserPlus className="w-4 h-4 text-gray-400 group-hover/btn2:scale-110 transition-transform" />
                            Create Account
                          </Link>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100/50">
                          <p className="text-[10px] text-center text-gray-400">
                            By continuing, you agree to our Terms and Conditions
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* More Menu */}
              <div ref={moreRef} className="relative group/more block">
                <button
                  aria-label="More options"
                  onClick={() => setIsMoreOpen(!isMoreOpen)}
                  className="flex flex-col items-center gap-1 p-1.5 text-gray-600 hover:text-gray-900 transition-colors group cursor-pointer"
                >
                  <div className="relative">
                    <MoreHorizontal
                      className="w-6 h-6 group-hover:text-gray-900 transition-colors"
                      strokeWidth={1.5}
                    />
                  </div>
                  <span className="hidden sm:block text-[10px] 2xl:text-[11px] font-medium">
                    More
                  </span>
                </button>

                {/* Dropdown */}
                <div
                  className={`absolute top-full right-0 mt-2 w-52 bg-white backdrop-blur-xl rounded-lg shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100/50 py-2 z-40 transition-all transform duration-300 ${isMoreOpen
                    ? "opacity-100 visible translate-y-0"
                    : "opacity-0 invisible translate-y-4 md:group-hover/more:opacity-100 md:group-hover/more:visible md:group-hover/more:translate-y-0"
                    }`}
                >
                  {/* Decorative triangle arrow */}
                  <div className="absolute -top-1.5 right-4 w-3 h-3 bg-white border-t border-l border-gray-100/50 rotate-45 z-[-1]" />

                  {[
                    { label: "Track Order", href: "/track/order", icon: PackageSearch },
                    { label: "About Us", href: "/about", icon: Info },
                    { label: "Wishlist", href: "/wishlist", icon: Heart },
                    { label: "FAQ", href: "/faq", icon: HelpCircle },
                    {
                      label: "Call Us",
                      href: `tel:${(settings?.contactPhone || "").replace(/\s/g, '')}`,
                      icon: Phone,
                      external: true,
                    },
                    {
                      label: "WhatsApp",
                      href: `https://wa.me/${(settings?.whatsapp || "").replace(/\D/g, '')}`,
                      icon: WhatsAppIcon,
                      external: true,
                      color: "#25D366",
                    },
                  ].map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      onClick={() => setIsMoreOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-200 hover:text-gray-900 transition-colors group/item"
                    >
                      <item.icon
                        className={`w-4 h-4 transition-colors ${item.color ? "" : "text-gray-400 group-hover/item:text-gray-700"}`}
                        style={item.color ? { color: `${item.color} !important`, fill: `${item.color} !important` } : {}}
                        strokeWidth={1.5}
                      />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </nav>
      </header>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <MobileSearchModal isOpen={isMobileSearchOpen} onClose={() => setIsMobileSearchOpen(false)} />
    </>
  );
}
