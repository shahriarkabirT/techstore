/**
 * Snapshot per-unit product cost on an order line (from product / variant at order time).
 * Variant-specific cost wins; otherwise falls back to product-level productCost.
 */

function asOptionalNonNegativeNumber(value: unknown): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return undefined;
    return Math.round(n * 100) / 100;
}

export function snapshotUnitProductCost(
    product: { productCost?: number | null },
    matchedVariant: { productCost?: number | null } | null | undefined,
): number | undefined {
    if (matchedVariant != null) {
        const fromVariant = asOptionalNonNegativeNumber(matchedVariant.productCost);
        if (fromVariant !== undefined) return fromVariant;
    }
    return asOptionalNonNegativeNumber(product.productCost);
}
