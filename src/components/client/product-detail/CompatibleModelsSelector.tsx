import React from 'react';

interface CompatibleModelsSelectorProps {
    models: (string | { name?: string })[]; 
    selectedModel: string;
    onSelect: (model: string) => void;
    hasError?: boolean;
}

export default function CompatibleModelsSelector({
    models,
    selectedModel,
    onSelect,
    hasError
}: CompatibleModelsSelectorProps) {
    if (!models || models.length === 0) return null;

    const modelNames = models
        .map((m) => (typeof m === 'string' ? m : m?.name || ''))
        .filter(Boolean);

    if (modelNames.length === 0) return null;

    return (
        <div>
            <div className="flex items-center gap-2 mb-1 lg:mb-2 border-b border-gray-100 pb-2">
                <span className="text-[10px] lg:text-xs font-black text-gray-700 uppercase tracking-wide">Select Compatible Model</span>
                {selectedModel && (
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">{selectedModel}</span>
                )}
            </div>
            <div className="mt-2">
                <select
                    value={selectedModel || ''}
                    onChange={(e) => onSelect(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-white transition-all focus:outline-none focus:ring-1 appearance-none bg-no-repeat bg-right ${
                        hasError
                            ? 'border-rose-300 ring-1 ring-rose-300 text-rose-600 bg-rose-50'
                            : 'border-gray-300 text-gray-700 focus:border-gray-900 focus:ring-gray-900 hover:border-gray-400'
                    }`}
                    style={{
                        backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")',
                        backgroundSize: '1rem',
                        backgroundPosition: 'right 0.75rem center',
                    }}
                >
                    <option value="">Choose a model</option>
                    {modelNames.map((name) => (
                        <option key={name} value={name}>{name}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
