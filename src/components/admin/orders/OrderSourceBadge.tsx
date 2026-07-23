const SOURCE_STYLES: Record<string, { label: string; className: string }> = {
    landing: {
        label: 'Landing Page',
        className: 'bg-violet-100 text-violet-700 border-violet-200',
    },
    pos: {
        label: 'POS',
        className: 'bg-slate-100 text-slate-700 border-slate-200',
    },
    online: {
        label: 'Online Store',
        className: 'bg-sky-100 text-sky-700 border-sky-200',
    },
};

export default function OrderSourceBadge({ source }: { source?: string }) {
    const key = source && SOURCE_STYLES[source] ? source : 'online';
    const { label, className } = SOURCE_STYLES[key];

    return (
        <span
            className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter border ${className}`}
        >
            {label}
        </span>
    );
}
