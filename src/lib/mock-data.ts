import { subDays, subHours } from "date-fns";

const BRANDS = [
  { name: "Stanley", companies: [{ company: "Stanley Black & Decker", ticker: "SWK", exchange: "NYSE" }] },
  { name: "CeraVe", companies: [{ company: "L'Oréal", ticker: "OR.PA", exchange: "Euronext" }] },
  { name: "Dyson", companies: [] },
  { name: "Starbucks", companies: [{ company: "Starbucks Corporation", ticker: "SBUX", exchange: "NASDAQ" }] },
  { name: "Crocs", companies: [{ company: "Crocs, Inc.", ticker: "CROX", exchange: "NASDAQ" }] },
  { name: "Lululemon", companies: [{ company: "Lululemon Athletica", ticker: "LULU", exchange: "NASDAQ" }] },
  { name: "Drunk Elephant", companies: [{ company: "Shiseido", ticker: "4911.T", exchange: "TSE" }] },
  { name: "Sol de Janeiro", companies: [] },
  { name: "Rare Beauty", companies: [] },
  { name: "Olaplex", companies: [{ company: "Olaplex Holdings", ticker: "OLPX", exchange: "NASDAQ" }] },
  { name: "e.l.f. Cosmetics", companies: [{ company: "e.l.f. Beauty", ticker: "ELF", exchange: "NYSE" }] },
  { name: "Nike", companies: [{ company: "Nike, Inc.", ticker: "NKE", exchange: "NYSE" }] },
  { name: "Apple", companies: [{ company: "Apple Inc.", ticker: "AAPL", exchange: "NASDAQ" }] },
  { name: "Glossier", companies: [] },
  { name: "Rhode Skin", companies: [] },
  { name: "Skims", companies: [] },
  { name: "Ugg", companies: [{ company: "Deckers Outdoor", ticker: "DECK", exchange: "NYSE" }] },
  { name: "Trader Joe's", companies: [] },
  { name: "Alo Yoga", companies: [] },
  { name: "Beis Travel", companies: [] },
];

const AUTHORS = [
  "@skincarejunkie", "@beautyfinds101", "@trendspotter_",
  "@dealsqueen", "@tiktokmademe", "@viralbuys",
  "@stockpicks_", "@consumertrends", "@restockalert",
  "@theproductguru", "@fashionfinder", "@budgetbeauty",
];

const KEYWORDS = [
  "restock alert", "tiktok made me buy", "back in stock",
  "run don't walk", "sold out everywhere", "limited drop",
];

const CAPTION_TEMPLATES = [
  "OMG the {brand} {product} is BACK IN STOCK! Run don't walk 🏃‍♀️",
  "This {brand} {product} is literally sold out everywhere and I found it!",
  "TikTok made me buy this {brand} {product} and I'm obsessed 😍",
  "Limited drop alert! {brand} just released a new {product} 🚨",
  "The viral {brand} {product} - is it worth the hype? Full review",
  "This {brand} {product} went viral and now it's impossible to find",
  "Restock alert! The {brand} {product} everyone's been waiting for",
  "{brand} {product} review - why everyone on TikTok is buying this",
  "Found the sold out {brand} {product} at my local store! 🎉",
  "This {brand} {product} is the best thing I've ever bought. Trust me.",
];

const PRODUCTS: Record<string, string[]> = {
  "Stanley": ["Quencher tumbler", "IceFlow bottle", "Adventure flask"],
  "CeraVe": ["moisturizing cream", "SA cleanser", "retinol serum"],
  "Dyson": ["Airwrap", "Supersonic dryer", "V15 vacuum"],
  "Starbucks": ["Stanley collab tumbler", "cold cup", "holiday cups"],
  "Crocs": ["Classic Clog", "Echo Surge", "collaboration clogs"],
  "Lululemon": ["Align leggings", "Belt Bag", "Scuba hoodie"],
  "Drunk Elephant": ["Protini moisturizer", "Bronzi drops", "baby facial"],
  "Sol de Janeiro": ["Bum Bum Cream", "Brazilian Mist", "body oil"],
  "Rare Beauty": ["Soft Pinch blush", "lip soufflé", "concealer"],
  "Olaplex": ["No. 3 treatment", "bond smoother", "shampoo"],
  "e.l.f. Cosmetics": ["Power Grip primer", "Halo Glow", "lip oil"],
  "Nike": ["Air Force 1", "Dunk Low", "Air Max 90"],
  "Apple": ["AirPods Pro", "iPhone case", "Apple Watch band"],
  "Glossier": ["Boy Brow", "Cloud Paint", "Balm Dotcom"],
  "Rhode Skin": ["Peptide lip tint", "Glazing Milk", "barrier cream"],
  "Skims": ["Soft Lounge set", "Fits Everybody bra", "cozy knit"],
  "Ugg": ["Ultra Mini boots", "Tazz slippers", "Classic Short"],
  "Trader Joe's": ["Everything Bagel seasoning", "chili crunch", "frozen meals"],
  "Alo Yoga": ["Airlift leggings", "Accolade hoodie", "sports bra"],
  "Beis Travel": ["Weekender bag", "cosmetic case", "carry-on roller"],
};

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export interface MockVideo {
  videoId: string;
  url: string;
  caption: string;
  author: string;
  postedAt: Date;
  likes: number;
  comments: number;
  shares: number;
  keyword: string;
  brand: string;
  product: string;
}

export function generateMockVideos(keyword: string, count: number = 5): MockVideo[] {
  const videos: MockVideo[] = [];

  for (let i = 0; i < count; i++) {
    const brand = randomItem(BRANDS);
    const products = PRODUCTS[brand.name] || ["product"];
    const product = randomItem(products);
    const template = randomItem(CAPTION_TEMPLATES);
    const caption = template.replace("{brand}", brand.name).replace("{product}", product);

    const hoursAgo = randomInt(1, 168); // up to 7 days
    const postedAt = subHours(new Date(), hoursAgo);

    const isViral = Math.random() > 0.7;
    const baseLikes = isViral ? randomInt(50000, 2000000) : randomInt(500, 50000);

    videos.push({
      videoId: `tt_${Date.now()}_${randomInt(100000, 999999)}`,
      url: `https://www.tiktok.com/@${randomItem(AUTHORS).slice(1)}/video/${randomInt(7000000000000000000, 7999999999999999999)}`,
      caption,
      author: randomItem(AUTHORS),
      postedAt,
      likes: baseLikes,
      comments: Math.round(baseLikes * (randomInt(1, 8) / 100)),
      shares: Math.round(baseLikes * (randomInt(1, 5) / 100)),
      keyword,
      brand: brand.name,
      product,
    });
  }

  return videos;
}

export function getBrandCompanyMatch(brandName: string) {
  const brand = BRANDS.find(
    (b) => b.name.toLowerCase() === brandName.toLowerCase()
  );
  return brand?.companies?.[0] || null;
}

export { BRANDS, KEYWORDS };
