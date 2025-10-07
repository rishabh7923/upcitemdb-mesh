import axios, { AxiosResponse } from 'axios';
import { readFileSync } from 'fs';
import { Proxy, RateLimit, ProxyUsage, LookupResponse } from '../types/upcitemdb';
import { config } from 'dotenv';

config()

const proxies = readFileSync('proxies.txt', 'utf-8').split('\n').map((proxy) => {
    const [ip, port, username, password] = proxy.split(':')
    return {
        host: ip,
        port: parseInt(port),
        protocol: 'http',
        auth: {
            username: username,
            password: password
        }
    }
})

const MAX_REQUESTS_PER_MINUTE = parseInt(process.env.MAX_REQUESTS_PER_MINUTE!)
const RESET_INTERVAL_MS = parseInt(process.env.RESET_INTERVAL_MS!)
const BASE_URL = process.env.BASE_URL!

const rateLimits: Map<string, RateLimit> = new Map();
const proxyUsage: Map<string, ProxyUsage> = new Map(proxies.map(proxy => [proxy.auth.username, { requestCount: 0, lastResetTime: Date.now() }]));

export async function lookup(upc: string): Promise<LookupResponse> {
    const url = `${BASE_URL}/lookup?upc=${encodeURIComponent(upc)}`;
    const proxy = getAvailableProxy();

    if (!proxy) {
        throw new Error("All proxies are currently rate-limited. Try again later.");
    }

    trackProxyUsage(proxy.auth.username);

    try {
        const response = await axios.get(url, { proxy });
        updateRateLimit(proxy, response.headers);

        console.log([
            `${new Date()}`,
            `LOOKUP UPC (${upc})`,
            `PROXY (${proxy.auth.username}): ${proxyUsage.get(proxy.auth.username)?.requestCount}`,
            `RATELIMITS: ${rateLimits.get(proxy.auth.username)?.remaining}`,
        ].join(" | "))

        return response.data;
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 429) markProxyAsRateLimited(proxy.auth.username);
        throw error;
    }
}

/**
 * HELPER METHODS
 */

function getAvailableProxy(): Proxy | null {
    const ratelimitedProxies = Array.from(rateLimits.entries()).filter(([_, rateLimit]) => {
        const now = new Date();
        return rateLimit.remaining <= 1 && rateLimit.resetsAt > now;
    });

    const ratelimitedUsernames = new Set(ratelimitedProxies.map(([username, _]) => username));

    const now = Date.now();
    const overusedProxies = Array.from(proxyUsage.entries())
        .filter(([username, usage]) => { // Use username (key) for filtering
            // Reset counter if a minute has passed
            if (now - usage.lastResetTime >= RESET_INTERVAL_MS) {
                proxyUsage.set(username, {
                    requestCount: 0,  // This request
                    lastResetTime: now
                })

                return false; // Not overused if just reset
            }

            // Check if usage for this username exceeds the limit
            return usage.requestCount >= MAX_REQUESTS_PER_MINUTE;
        })
        .map(([username, _]) => username);


    const overusedHosts = new Set(overusedProxies);

    // Filter available proxies that are not rate limited by API or our tracking
    const availableProxies = proxies.filter(p =>
        !ratelimitedUsernames.has(p.auth.username) &&
        !overusedHosts.has(p.auth.username)
    );

    if (availableProxies.length === 0) {
        return null;
    }

    return availableProxies[Math.floor(Math.random() * availableProxies.length)];
}


function trackProxyUsage(host: string): void {
    const now = Date.now();
    const usage = proxyUsage.get(host);

    if (usage) {
        // Reset counter if a minute has passed
        if (now - usage.lastResetTime >= RESET_INTERVAL_MS) {
            usage.requestCount = 1;  // This request
            usage.lastResetTime = now;
        } else {
            usage.requestCount++;
        }
    } else {
        proxyUsage.set(host, {
            requestCount: 1,
            lastResetTime: now
        });
    }
}

function markProxyAsRateLimited(host: string): void {
    proxyUsage.set(host, {
        requestCount: MAX_REQUESTS_PER_MINUTE,
        lastResetTime: Date.now()
    });
}


function updateRateLimit(proxy: Proxy, headers: AxiosResponse['headers']): void {
    const remaining = parseInt(headers['x-ratelimit-remaining'] || '0');
    const resetsAt = new Date(parseInt(headers['x-ratelimit-reset'] || '0') * 1000);

    rateLimits.set(proxy.auth.username, {
        remaining,
        resetsAt
    });
}