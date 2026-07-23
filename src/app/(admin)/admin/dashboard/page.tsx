import { DashboardContainer } from '@/components/admin/dashboard/DashboardContainer';

export const metadata = {
    title: 'Admin Dashboard',
};

export default function AdminDashboardPage() {
    return (
        <div className="min-h-screen bg-gray-50/30">
            <DashboardContainer />
        </div>
    );
}
