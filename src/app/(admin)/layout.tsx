import { Metadata } from 'next';

export const metadata: Metadata = {
    manifest: '/api/admin/manifest',
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
