'use client';

import { useState } from 'react';
import {
    useGetAttributesQuery,
    useCreateAttributeMutation,
    useUpdateAttributeMutation,
    useDeleteAttributeMutation,
    useCreateAttributeValueMutation,
    useUpdateAttributeValueMutation,
    useDeleteAttributeValueMutation,
} from '@/redux/features/attribute/attributeApi';
import type { IAttribute, IAttributeValue } from '@/types';
import { showError, showSuccess } from '@/lib/toast';

export default function AttributeManagementPage() {
    const { data, isLoading } = useGetAttributesQuery();
    const [createAttribute, { isLoading: isCreatingAttr }] = useCreateAttributeMutation();
    const [updateAttribute, { isLoading: isUpdatingAttr }] = useUpdateAttributeMutation();
    const [deleteAttribute] = useDeleteAttributeMutation();

    const [createValue, { isLoading: isCreatingVal }] = useCreateAttributeValueMutation();
    const [updateValue, { isLoading: isUpdatingVal }] = useUpdateAttributeValueMutation();
    const [deleteValue] = useDeleteAttributeValueMutation();

    const [selectedAttributeId, setSelectedAttributeId] = useState<string | null>(null);

    // Attribute State
    const [newAttrName, setNewAttrName] = useState('');
    const [newAttrType, setNewAttrType] = useState<'text' | 'color'>('text');
    const [newAttrOrder, setNewAttrOrder] = useState('0');
    const [editingAttr, setEditingAttr] = useState<{ id: string; name: string; type: 'text' | 'color'; order: number } | null>(null);
    const [isMovingAttr, setIsMovingAttr] = useState(false);

    // Value State
    const [newValLabel, setNewValLabel] = useState('');
    const [newValColor, setNewValColor] = useState('#000000');
    const [newValOrder, setNewValOrder] = useState('0');
    const [editingVal, setEditingVal] = useState<{ id: string; label: string; colorCode?: string; order: number } | null>(null);
    const [isMovingVal, setIsMovingVal] = useState(false);

    const attributes = data?.attributes || [];
    const selectedAttribute = attributes.find((a) => a._id === selectedAttributeId);
    const activeValues = selectedAttribute?.values || [];

    // --- Attribute Handlers ---

    const handleCreateAttr = async () => {
        if (!newAttrName.trim()) {
            showError('Attribute name is required');
            return;
        }
        try {
            const res = await createAttribute({
                name: newAttrName.trim(),
                type: newAttrType,
                order: Number(newAttrOrder),
            }).unwrap();
            showSuccess('Created', `Attribute "${newAttrName.trim()}" added`);
            setNewAttrName('');
            setNewAttrType('text');
            setNewAttrOrder('0');
            setSelectedAttributeId(res.attribute._id);
        } catch (err: any) {
            showError(err.data?.message || 'Failed to create attribute');
        }
    };

    const handleUpdateAttr = async () => {
        if (!editingAttr) return;
        if (!editingAttr.name.trim()) {
            showError('Attribute name is required');
            return;
        }
        try {
            await updateAttribute({
                id: editingAttr.id,
                body: {
                    name: editingAttr.name.trim(),
                    type: editingAttr.type,
                    order: editingAttr.order,
                },
            }).unwrap();
            showSuccess('Updated', 'Attribute saved');
            setEditingAttr(null);
        } catch (err: any) {
            showError(err.data?.message || 'Failed to update attribute');
        }
    };

    const handleDeleteAttr = async (id: string, name: string) => {
        if (!confirm(`Delete attribute "${name}"? This will also remove all its values.`)) return;
        try {
            await deleteAttribute(id).unwrap();
            showSuccess('Deleted', `Attribute "${name}" removed`);
            if (selectedAttributeId === id) setSelectedAttributeId(null);
        } catch (err: any) {
            showError(err.data?.message || 'Failed to delete attribute');
        }
    };

    const handleMoveAttr = async (attr: IAttribute, direction: 'up' | 'down') => {
        const index = attributes.findIndex((a) => a._id === attr._id);
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === attributes.length - 1) return;

        setIsMovingAttr(true);
        try {
            const newArray = [...attributes];
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            [newArray[index], newArray[targetIndex]] = [newArray[targetIndex], newArray[index]];

            const updates = newArray.map((a, i) => {
                if (a.order !== i) {
                    return updateAttribute({
                        id: a._id,
                        body: { name: a.name, type: a.type, order: i },
                    }).unwrap();
                }
                return null;
            }).filter(Boolean);

            if (updates.length > 0) {
                await Promise.all(updates);
                showSuccess('Reordered', 'Attribute order updated');
            }
        } catch (err: any) {
            showError('Failed to reorder attributes');
        } finally {
            setIsMovingAttr(false);
        }
    };

    // --- Value Handlers ---

    const handleCreateVal = async () => {
        if (!selectedAttribute) return;
        if (!newValLabel.trim()) {
            showError('Value label is required');
            return;
        }
        try {
            await createValue({
                attributeId: selectedAttribute._id,
                label: newValLabel.trim(),
                order: Number(newValOrder),
                ...(selectedAttribute.type === 'color' ? { colorCode: newValColor } : {}),
            }).unwrap();
            showSuccess('Created', `Value "${newValLabel.trim()}" added`);
            setNewValLabel('');
            setNewValColor('#000000');
            setNewValOrder('0');
        } catch (err: any) {
            showError(err.data?.message || 'Failed to create value');
        }
    };

    const handleUpdateVal = async () => {
        if (!selectedAttribute || !editingVal) return;
        if (!editingVal.label.trim()) {
            showError('Value label is required');
            return;
        }
        try {
            await updateValue({
                id: editingVal.id,
                body: {
                    label: editingVal.label.trim(),
                    order: editingVal.order,
                    ...(selectedAttribute.type === 'color' ? { colorCode: editingVal.colorCode } : {}),
                },
            }).unwrap();
            showSuccess('Updated', 'Value saved');
            setEditingVal(null);
        } catch (err: any) {
            showError(err.data?.message || 'Failed to update value');
        }
    };

    const handleDeleteVal = async (id: string, label: string) => {
        if (!confirm(`Delete value "${label}"?`)) return;
        try {
            await deleteValue(id).unwrap();
            showSuccess('Deleted', `Value "${label}" removed`);
        } catch (err: any) {
            showError(err.data?.message || 'Failed to delete value');
        }
    };

    const handleMoveVal = async (val: IAttributeValue, direction: 'up' | 'down') => {
        const index = activeValues.findIndex((v) => v._id === val._id);
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === activeValues.length - 1) return;

        setIsMovingVal(true);
        try {
            const newArray = [...activeValues];
            const targetIndex = direction === 'up' ? index - 1 : index + 1;
            [newArray[index], newArray[targetIndex]] = [newArray[targetIndex], newArray[index]];

            const updates = newArray.map((v, i) => {
                if (v.order !== i) {
                    return updateValue({
                        id: v._id,
                        body: { label: v.label, order: i, colorCode: v.colorCode },
                    }).unwrap();
                }
                return null;
            }).filter(Boolean);

            if (updates.length > 0) {
                await Promise.all(updates);
                showSuccess('Reordered', 'Value order updated');
            }
        } catch (err: any) {
            showError('Failed to reorder values');
        } finally {
            setIsMovingVal(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
            </div>
        );
    }

    // Automatically select the first attribute if none is selected
    if (!selectedAttributeId && attributes.length > 0) {
        setSelectedAttributeId(attributes[0]._id);
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Attribute Management</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Manage global product attributes (e.g., Size, Color, Processor) and their possible values.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Attributes */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <h3 className="text-sm font-bold text-gray-900 mb-4">Add New Attribute</h3>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-700 mb-1">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={newAttrName}
                                    onChange={(e) => setNewAttrName(e.target.value)}
                                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-gray-900 outline-none"
                                    placeholder="e.g. Size, Color, Screen Size"
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateAttr()}
                                />
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-1">
                                    <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-700 mb-1">
                                        Type
                                    </label>
                                    <select
                                        value={newAttrType}
                                        onChange={(e) => setNewAttrType(e.target.value as 'text' | 'color')}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-gray-900 outline-none"
                                    >
                                        <option value="text">Text / Default</option>
                                        <option value="color">Color (with swatch)</option>
                                    </select>
                                </div>
                                <div className="w-20">
                                    <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-700 mb-1">
                                        Order
                                    </label>
                                    <input
                                        type="number"
                                        value={newAttrOrder}
                                        onChange={(e) => setNewAttrOrder(e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-gray-900 outline-none"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleCreateAttr}
                                disabled={isCreatingAttr || !newAttrName.trim()}
                                className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-bold hover:bg-black transition-all disabled:opacity-50"
                            >
                                {isCreatingAttr ? 'Adding...' : 'Add Attribute'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">
                                Attributes ({attributes.length})
                            </h3>
                        </div>
                        <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
                            {attributes.length === 0 ? (
                                <div className="p-4 text-center text-sm text-gray-400">No attributes found.</div>
                            ) : (
                                attributes.map((attr) => (
                                    <div
                                        key={attr._id}
                                        className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                                            selectedAttributeId === attr._id ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'hover:bg-gray-50 border-l-4 border-transparent'
                                        }`}
                                        onClick={() => setSelectedAttributeId(attr._id)}
                                    >
                                        {editingAttr?.id === attr._id ? (
                                            <div className="flex-1 space-y-2 pr-2">
                                                <input
                                                    type="text"
                                                    value={editingAttr.name}
                                                    onChange={(e) => setEditingAttr({ ...editingAttr, name: e.target.value })}
                                                    className="w-full bg-white border border-gray-300 rounded text-xs px-2 py-1"
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <div className="flex gap-2">
                                                    <select
                                                        value={editingAttr.type}
                                                        onChange={(e) => setEditingAttr({ ...editingAttr, type: e.target.value as 'text' | 'color' })}
                                                        className="w-full bg-white border border-gray-300 rounded text-xs px-2 py-1"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <option value="text">Text</option>
                                                        <option value="color">Color</option>
                                                    </select>
                                                    <input
                                                        type="number"
                                                        value={editingAttr.order}
                                                        onChange={(e) => setEditingAttr({ ...editingAttr, order: Number(e.target.value) })}
                                                        className="w-16 bg-white border border-gray-300 rounded text-xs px-2 py-1"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </div>
                                                <div className="flex gap-2 pt-1">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleUpdateAttr(); }}
                                                        disabled={isUpdatingAttr}
                                                        className="px-2 py-1 bg-gray-900 text-white rounded text-xs font-bold"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setEditingAttr(null); }}
                                                        className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs font-bold"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-semibold truncate ${selectedAttributeId === attr._id ? 'text-indigo-900' : 'text-gray-900'}`}>
                                                        {attr.name}
                                                    </p>
                                                    <p className="text-[10px] text-gray-500 uppercase">
                                                        {attr.type} • Order: {attr.order} • {attr.values?.length || 0} values
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0 ml-2">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleMoveAttr(attr, 'up'); }}
                                                        disabled={isMovingAttr || attributes.indexOf(attr) === 0}
                                                        className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-30"
                                                    >
                                                        ↑
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleMoveAttr(attr, 'down'); }}
                                                        disabled={isMovingAttr || attributes.indexOf(attr) === attributes.length - 1}
                                                        className="p-1 text-gray-400 hover:text-gray-900 disabled:opacity-30"
                                                    >
                                                        ↓
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setEditingAttr({ id: attr._id, name: attr.name, type: attr.type, order: attr.order }); }}
                                                        className="p-1 text-gray-400 hover:text-blue-600"
                                                    >
                                                        ✎
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteAttr(attr._id, attr.name); }}
                                                        className="p-1 text-gray-400 hover:text-rose-600"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Values */}
                <div className="lg:col-span-2">
                    {selectedAttribute ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-1">
                                Values for &quot;{selectedAttribute.name}&quot;
                            </h2>
                            <p className="text-sm text-gray-500 mb-6">
                                Manage the available options for this attribute.
                            </p>

                            {/* Add New Value */}
                            <div className="flex flex-wrap items-end gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100 mb-6">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-700 mb-1">
                                        Value Label
                                    </label>
                                    <input
                                        type="text"
                                        value={newValLabel}
                                        onChange={(e) => setNewValLabel(e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-gray-900 outline-none"
                                        placeholder={`e.g. ${selectedAttribute.name === 'Size' ? 'XL' : selectedAttribute.name === 'Color' ? 'Red' : 'Option'}`}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateVal()}
                                    />
                                </div>

                                {selectedAttribute.type === 'color' && (
                                    <div className="min-w-[120px]">
                                        <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-700 mb-1">
                                            Color Code
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="color"
                                                value={newValColor}
                                                onChange={(e) => setNewValColor(e.target.value)}
                                                className="w-9 h-9 rounded cursor-pointer border border-gray-300 p-0.5"
                                            />
                                            <input
                                                type="text"
                                                value={newValColor}
                                                onChange={(e) => setNewValColor(e.target.value)}
                                                className="w-20 bg-white border border-gray-300 rounded-lg px-2 text-xs font-mono focus:border-gray-900 outline-none"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="w-20">
                                    <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-700 mb-1">
                                        Order
                                    </label>
                                    <input
                                        type="number"
                                        value={newValOrder}
                                        onChange={(e) => setNewValOrder(e.target.value)}
                                        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-gray-900 outline-none"
                                    />
                                </div>

                                <button
                                    onClick={handleCreateVal}
                                    disabled={isCreatingVal || !newValLabel.trim()}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
                                >
                                    {isCreatingVal ? 'Adding...' : 'Add Value'}
                                </button>
                            </div>

                            {/* Values List */}
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 border-b border-gray-100 pb-2">
                                    Existing Values ({activeValues.length})
                                </h3>
                                
                                {activeValues.length === 0 ? (
                                    <div className="text-center py-8 text-sm text-gray-400">
                                        No values added yet for {selectedAttribute.name}.
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {activeValues.map((val) => (
                                            <div key={val._id} className="py-3 flex items-center gap-4 hover:bg-gray-50 rounded px-2">
                                                {editingVal?.id === val._id ? (
                                                    // Editing Value
                                                    <>
                                                        <div className="flex-1 flex items-center gap-3">
                                                            {selectedAttribute.type === 'color' && (
                                                                <input
                                                                    type="color"
                                                                    value={editingVal.colorCode || '#000000'}
                                                                    onChange={(e) => setEditingVal({ ...editingVal, colorCode: e.target.value })}
                                                                    className="w-8 h-8 rounded cursor-pointer border border-gray-300 p-0.5 shrink-0"
                                                                />
                                                            )}
                                                            <input
                                                                type="text"
                                                                value={editingVal.label}
                                                                onChange={(e) => setEditingVal({ ...editingVal, label: e.target.value })}
                                                                className="flex-1 bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none"
                                                                autoFocus
                                                            />
                                                            <input
                                                                type="number"
                                                                value={editingVal.order}
                                                                onChange={(e) => setEditingVal({ ...editingVal, order: Number(e.target.value) })}
                                                                className="w-16 bg-white border border-gray-300 rounded px-3 py-1.5 text-sm outline-none"
                                                            />
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={handleUpdateVal}
                                                                disabled={isUpdatingVal}
                                                                className="px-3 py-1.5 bg-gray-900 text-white rounded text-xs font-bold"
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingVal(null)}
                                                                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs font-bold"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    // Display Value
                                                    <>
                                                        <div className="flex-1 flex items-center gap-3">
                                                            {selectedAttribute.type === 'color' && val.colorCode && (
                                                                <div
                                                                    className="w-6 h-6 rounded border border-gray-200 shrink-0"
                                                                    style={{ backgroundColor: val.colorCode }}
                                                                />
                                                            )}
                                                            <span className="text-sm font-semibold text-gray-900">{val.label}</span>
                                                            {selectedAttribute.type === 'color' && val.colorCode && (
                                                                <span className="text-xs font-mono text-gray-400 ml-2">{val.colorCode}</span>
                                                            )}
                                                            <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded ml-auto">
                                                                Order: {val.order}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <button
                                                                onClick={() => handleMoveVal(val, 'up')}
                                                                disabled={isMovingVal || activeValues.indexOf(val) === 0}
                                                                className="p-1.5 text-gray-400 hover:text-gray-900 disabled:opacity-30"
                                                            >
                                                                ↑
                                                            </button>
                                                            <button
                                                                onClick={() => handleMoveVal(val, 'down')}
                                                                disabled={isMovingVal || activeValues.indexOf(val) === activeValues.length - 1}
                                                                className="p-1.5 text-gray-400 hover:text-gray-900 disabled:opacity-30"
                                                            >
                                                                ↓
                                                            </button>
                                                            <button
                                                                onClick={() => setEditingVal({ id: val._id, label: val.label, colorCode: val.colorCode, order: val.order })}
                                                                className="p-1.5 text-gray-400 hover:text-blue-600"
                                                            >
                                                                ✎
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteVal(val._id, val.label)}
                                                                className="p-1.5 text-gray-400 hover:text-rose-600"
                                                            >
                                                                ×
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full min-h-[300px] flex items-center justify-center bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                            <p className="text-gray-400 text-sm">Select an attribute from the left to manage its values.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
