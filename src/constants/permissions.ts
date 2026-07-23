/**
 * Centralized permission definitions for the moderator system.
 *
 * Each entry represents a main sidebar section and maps to:
 * - `key`          — stored in the user's `permissions[]` array
 * - `label`        — human-readable name shown in the admin UI
 * - `adminPaths`   — frontend path prefixes (for sidebar filtering)
 * - `apiPrefixes`  — backend API path prefixes (for route-level enforcement)
 */

export interface Permission {
    key: string;
    label: string;
    adminPaths: string[];   // e.g. ['/admin/products', '/admin/brands']
    apiPrefixes: string[];  // e.g. ['/api/products', '/api/brands']
}

export const PERMISSIONS: Permission[] = [
    {
        key: 'dashboard',
        label: 'Dashboard',
        adminPaths: ['/admin/dashboard'],
        apiPrefixes: ['/api/admin/stats'],
    },
    {
        key: 'pos',
        label: 'POS Terminal',
        adminPaths: ['/admin/pos'],
        apiPrefixes: ['/api/pos'],
    },
    {
        key: 'products',
        label: 'Products',
        adminPaths: ['/admin/products', '/admin/variant-management', '/admin/brands'],
        apiPrefixes: ['/api/products', '/api/brands', '/api/variant-options'],
    },
    {
        key: 'categories',
        label: 'Categories',
        adminPaths: ['/admin/categories'],
        apiPrefixes: ['/api/categories', '/api/subcategories', '/api/childcategories', '/api/subchildcategories'],
    },
    {
        key: 'orders',
        label: 'Orders',
        adminPaths: ['/admin/orders', '/admin/abandoned-checkouts'],
        apiPrefixes: ['/api/orders', '/api/abandoned-checkout'],
    },
    {
        key: 'settings',
        label: 'Settings',
        adminPaths: ['/admin/settings', '/admin/couriers'],
        apiPrefixes: ['/api/settings', '/api/admin/settings', '/api/couriers'],
    },
    {
        key: 'marketing',
        label: 'Marketing',
        adminPaths: ['/admin/marketing'],
        apiPrefixes: ['/api/coupons', '/api/admin/marketing', '/api/admin/subscribers', '/api/newsletter'],
    },
    {
        key: 'banners',
        label: 'Banners',
        adminPaths: ['/admin/banners'],
        apiPrefixes: ['/api/banners'],
    },
    {
        key: 'reports',
        label: 'Reports',
        adminPaths: ['/admin/reports'],
        apiPrefixes: ['/api/admin/reports', '/api/admin/meta-ads'],
    },
    {
        key: 'users',
        label: 'User Management',
        adminPaths: ['/admin/users'],
        apiPrefixes: ['/api/admin/users'],
    },
    {
        key: 'frauds',
        label: 'Fraud Protection',
        adminPaths: ['/admin/frauds'],
        apiPrefixes: ['/api/frauds'],
    },
    {
        key: 'refunds',
        label: 'Returns & Refunds',
        adminPaths: ['/admin/refunds'],
        apiPrefixes: ['/api/admin/refunds'],
    },
    {
        key: 'messages',
        label: 'Messages',
        adminPaths: ['/admin/messages'],
        apiPrefixes: ['/api/admin/messages', '/api/contact'],
    },
    {
        key: 'chat',
        label: 'Live Chat',
        adminPaths: ['/admin/chat'],
        apiPrefixes: ['/api/chat'],
    },
    {
        key: 'reviews',
        label: 'Reviews',
        adminPaths: ['/admin/reviews'],
        apiPrefixes: ['/api/reviews', '/api/admin/reviews'],
    },
    {
        key: 'landing-pages',
        label: 'Landing Pages',
        adminPaths: ['/admin/landing-pages'],
        apiPrefixes: ['/api/admin/landing-pages', '/api/landing'],
    },
    {
        key: 'blogs',
        label: 'Blogs',
        adminPaths: ['/admin/blogs'],
        apiPrefixes: ['/api/blogs', '/api/admin/blogs'],
    },
    {
        key: 'testimonials',
        label: 'Testimonials',
        adminPaths: ['/admin/testimonials'],
        apiPrefixes: ['/api/testimonials', '/api/admin/testimonials'],
    },
    {
        key: 'policies',
        label: 'Policies',
        adminPaths: ['/admin/policies'],
        apiPrefixes: ['/api/policies', '/api/admin/policies'],
    },
];

/**
 * Look up a permission entry by its key.
 */
export function getPermission(key: string): Permission | undefined {
    return PERMISSIONS.find(p => p.key === key);
}

/**
 * Check if a moderator's permission list includes a given key.
 */
export function hasPermission(userPermissions: string[], key: string): boolean {
    return userPermissions.includes(key);
}
