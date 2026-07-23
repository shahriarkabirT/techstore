import { LRUCache } from 'lru-cache';
import { NextRequest } from 'next/server';

type Options = {
    uniqueTokenPerInterval?: number;
    interval?: number;
};

declare global {
    var tokenCache: LRUCache<string, number[]> | undefined;
}

export default function rateLimit(options?: Options) {
    if (!globalThis.tokenCache) {
        globalThis.tokenCache = new LRUCache<string, number[]>({
            max: options?.uniqueTokenPerInterval || 500,
            ttl: options?.interval || 60000,
        });
    }
    const tokenCache = globalThis.tokenCache;

    return {
        check: (limit: number, token: string) =>
            new Promise<void>((resolve, reject) => {
                const tokenCount = (tokenCache.get(token) as number[]) || [0];
                if (tokenCount[0] === 0) {
                    tokenCache.set(token, tokenCount);
                }
                tokenCount[0] += 1;

                const currentUsage = tokenCount[0];
                const isRateLimited = currentUsage >= limit;

                if (isRateLimited) {
                    return reject()
                }

                return resolve()
            }),
    };
}
