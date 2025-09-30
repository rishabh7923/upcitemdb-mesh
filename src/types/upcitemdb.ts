export interface RateLimit {
    remaining: number;
    resetsAt: Date;
}

export interface ProxyUsage {
    requestCount: number;
    lastResetTime: number;
}

export interface Proxy {
    host: string;
    port: number;
    protocol: string;
    auth: {
        username: string;
        password: string;
    };
}

export interface LookupResponse {
    code: string
    total: number
    offset: number
    items: Item[]
}


export interface Item {
    ean: string
    title: string
    upc: string
    gtin: string
    asin: string
    description: string
    brand: string
    model: string
    dimension: string
    weight: string
    category: string
    currency: string
    lowest_recorded_price: number
    highest_recorded_price: number
    images: string[]
    offers: Offer[]
}

export interface Offer {
    merchant: string
    domain: string
    title: string
    currency: string
    list_price: number
    price: number
    shipping: string
    condition: string
    availability: string
    link: string
    updated_t: number
}