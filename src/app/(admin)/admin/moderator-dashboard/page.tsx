import Link from 'next/link';

export const metadata = {
    title: 'Moderator Dashboard',
};

export default function ModeratorDashboardPage() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-indigo-50 border-8 border-indigo-100/50 rounded-full flex items-center justify-center text-indigo-600 mb-6 transition-transform hover:scale-105 duration-300">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">Welcome to the Portal</h1>
            <p className="max-w-md text-gray-500 mb-8 leading-relaxed">
                You currently have restricted privileges. Use the sidebar menu to navigate through the specific modules your administrator has authorized for you.
            </p>

            <div className="grid grid-cols-2 gap-4 max-w-sm w-full">
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100/80 text-left">
                    <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5 tracking-wider">Status</span>
                    <span className="text-sm font-semibold text-emerald-600 flex items-center gap-2">
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </div>
                        Active
                    </span>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100/80 text-left">
                    <span className="block text-[10px] uppercase font-bold text-gray-400 mb-1.5 tracking-wider">Access Level</span>
                    <span className="text-sm font-semibold text-indigo-600">Moderator</span>
                </div>
            </div>
        </div>
    );
}
