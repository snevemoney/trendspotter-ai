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
  // Tech
  { name: "Samsung", companies: [{ company: "Samsung Electronics", ticker: "005930.KS", exchange: "KRX" }] },
  { name: "Sony", companies: [{ company: "Sony Group", ticker: "SONY", exchange: "NYSE" }] },
  { name: "Google", companies: [{ company: "Alphabet Inc.", ticker: "GOOGL", exchange: "NASDAQ" }] },
  { name: "Meta", companies: [{ company: "Meta Platforms", ticker: "META", exchange: "NASDAQ" }] },
  { name: "Amazon", companies: [{ company: "Amazon.com", ticker: "AMZN", exchange: "NASDAQ" }] },
  { name: "Microsoft", companies: [{ company: "Microsoft Corp.", ticker: "MSFT", exchange: "NASDAQ" }] },
  { name: "Tesla", companies: [{ company: "Tesla, Inc.", ticker: "TSLA", exchange: "NASDAQ" }] },
  { name: "Nvidia", companies: [{ company: "NVIDIA Corp.", ticker: "NVDA", exchange: "NASDAQ" }] },
  { name: "AMD", companies: [{ company: "Advanced Micro Devices", ticker: "AMD", exchange: "NASDAQ" }] },
  { name: "Intel", companies: [{ company: "Intel Corp.", ticker: "INTC", exchange: "NASDAQ" }] },
  { name: "Spotify", companies: [{ company: "Spotify Technology", ticker: "SPOT", exchange: "NYSE" }] },
  { name: "Netflix", companies: [{ company: "Netflix, Inc.", ticker: "NFLX", exchange: "NASDAQ" }] },
  { name: "Disney", companies: [{ company: "Walt Disney Co.", ticker: "DIS", exchange: "NYSE" }] },
  { name: "Roku", companies: [{ company: "Roku, Inc.", ticker: "ROKU", exchange: "NASDAQ" }] },
  // Fashion / Apparel
  { name: "Adidas", companies: [{ company: "Adidas AG", ticker: "ADS.DE", exchange: "XETRA" }] },
  { name: "Under Armour", companies: [{ company: "Under Armour", ticker: "UAA", exchange: "NYSE" }] },
  { name: "Gap", companies: [{ company: "Gap, Inc.", ticker: "GAP", exchange: "NYSE" }] },
  { name: "Ralph Lauren", companies: [{ company: "Ralph Lauren Corp.", ticker: "RL", exchange: "NYSE" }] },
  { name: "Tapestry", companies: [{ company: "Tapestry, Inc.", ticker: "TPR", exchange: "NYSE" }] },
  { name: "Capri Holdings", companies: [{ company: "Capri Holdings", ticker: "CPRI", exchange: "NYSE" }] },
  { name: "VF Corporation", companies: [{ company: "VF Corporation", ticker: "VFC", exchange: "NYSE" }] },
  { name: "Hanesbrands", companies: [{ company: "Hanesbrands", ticker: "HBI", exchange: "NYSE" }] },
  { name: "Abercrombie", companies: [{ company: "Abercrombie & Fitch", ticker: "ANF", exchange: "NYSE" }] },
  { name: "New Balance", companies: [] },
  { name: "On Running", companies: [{ company: "On Holding AG", ticker: "ONON", exchange: "NYSE" }] },
  { name: "Hoka", companies: [{ company: "Deckers Outdoor", ticker: "DECK", exchange: "NYSE" }] },
  { name: "Birkenstock", companies: [{ company: "Birkenstock Holding", ticker: "BIRK", exchange: "NYSE" }] },
  // Food / Beverage
  { name: "Coca-Cola", companies: [{ company: "Coca-Cola Co.", ticker: "KO", exchange: "NYSE" }] },
  { name: "PepsiCo", companies: [{ company: "PepsiCo, Inc.", ticker: "PEP", exchange: "NASDAQ" }] },
  { name: "Chipotle", companies: [{ company: "Chipotle Mexican Grill", ticker: "CMG", exchange: "NYSE" }] },
  { name: "McDonald's", companies: [{ company: "McDonald's Corp.", ticker: "MCD", exchange: "NYSE" }] },
  { name: "Celsius", companies: [{ company: "Celsius Holdings", ticker: "CELH", exchange: "NASDAQ" }] },
  { name: "Monster Beverage", companies: [{ company: "Monster Beverage", ticker: "MNST", exchange: "NASDAQ" }] },
  { name: "Hershey", companies: [{ company: "Hershey Co.", ticker: "HSY", exchange: "NYSE" }] },
  { name: "Mondelez", companies: [{ company: "Mondelez International", ticker: "MDLZ", exchange: "NASDAQ" }] },
  { name: "General Mills", companies: [{ company: "General Mills", ticker: "GIS", exchange: "NYSE" }] },
  { name: "Keurig Dr Pepper", companies: [{ company: "Keurig Dr Pepper", ticker: "KDP", exchange: "NASDAQ" }] },
  { name: "Sweetgreen", companies: [{ company: "Sweetgreen, Inc.", ticker: "SG", exchange: "NYSE" }] },
  { name: "Dutch Bros", companies: [{ company: "Dutch Bros Inc.", ticker: "BROS", exchange: "NYSE" }] },
  // Fitness
  { name: "Peloton", companies: [{ company: "Peloton Interactive", ticker: "PTON", exchange: "NASDAQ" }] },
  { name: "Planet Fitness", companies: [{ company: "Planet Fitness", ticker: "PLNT", exchange: "NYSE" }] },
  { name: "Garmin", companies: [{ company: "Garmin Ltd.", ticker: "GRMN", exchange: "NYSE" }] },
  { name: "Fitbit", companies: [{ company: "Alphabet Inc.", ticker: "GOOGL", exchange: "NASDAQ" }] },
  { name: "Whoop", companies: [] },
  { name: "Gymshark", companies: [] },
  // Home / Decor
  { name: "Wayfair", companies: [{ company: "Wayfair Inc.", ticker: "W", exchange: "NYSE" }] },
  { name: "Restoration Hardware", companies: [{ company: "RH", ticker: "RH", exchange: "NYSE" }] },
  { name: "Williams-Sonoma", companies: [{ company: "Williams-Sonoma", ticker: "WSM", exchange: "NYSE" }] },
  { name: "Ethan Allen", companies: [{ company: "Ethan Allen Interiors", ticker: "ETD", exchange: "NYSE" }] },
  { name: "Bed Bath & Beyond", companies: [] },
  { name: "IKEA", companies: [] },
  { name: "Target", companies: [{ company: "Target Corp.", ticker: "TGT", exchange: "NYSE" }] },
  { name: "Walmart", companies: [{ company: "Walmart Inc.", ticker: "WMT", exchange: "NYSE" }] },
  { name: "Costco", companies: [{ company: "Costco Wholesale", ticker: "COST", exchange: "NASDAQ" }] },
  // Finance / Fintech
  { name: "Robinhood", companies: [{ company: "Robinhood Markets", ticker: "HOOD", exchange: "NASDAQ" }] },
  { name: "Coinbase", companies: [{ company: "Coinbase Global", ticker: "COIN", exchange: "NASDAQ" }] },
  { name: "SoFi", companies: [{ company: "SoFi Technologies", ticker: "SOFI", exchange: "NASDAQ" }] },
  { name: "PayPal", companies: [{ company: "PayPal Holdings", ticker: "PYPL", exchange: "NASDAQ" }] },
  { name: "Block", companies: [{ company: "Block, Inc.", ticker: "XYZ", exchange: "NYSE" }] },
  { name: "Affirm", companies: [{ company: "Affirm Holdings", ticker: "AFRM", exchange: "NASDAQ" }] },
  // Health / Supplements
  { name: "Hims & Hers", companies: [{ company: "Hims & Hers Health", ticker: "HIMS", exchange: "NYSE" }] },
  { name: "GNC", companies: [] },
  { name: "Vital Proteins", companies: [{ company: "Nestlé", ticker: "NSRGY", exchange: "OTC" }] },
  // Travel
  { name: "Airbnb", companies: [{ company: "Airbnb, Inc.", ticker: "ABNB", exchange: "NASDAQ" }] },
  { name: "Booking.com", companies: [{ company: "Booking Holdings", ticker: "BKNG", exchange: "NASDAQ" }] },
  { name: "Expedia", companies: [{ company: "Expedia Group", ticker: "EXPE", exchange: "NASDAQ" }] },
  { name: "Marriott", companies: [{ company: "Marriott International", ticker: "MAR", exchange: "NASDAQ" }] },
  { name: "Hilton", companies: [{ company: "Hilton Worldwide", ticker: "HLT", exchange: "NYSE" }] },
  // Pet
  { name: "Chewy", companies: [{ company: "Chewy, Inc.", ticker: "CHWY", exchange: "NYSE" }] },
  { name: "Petco", companies: [{ company: "Petco Health", ticker: "WOOF", exchange: "NASDAQ" }] },
  { name: "Freshpet", companies: [{ company: "Freshpet, Inc.", ticker: "FRPT", exchange: "NASDAQ" }] },
  // Entertainment
  { name: "Roblox", companies: [{ company: "Roblox Corp.", ticker: "RBLX", exchange: "NYSE" }] },
  { name: "Electronic Arts", companies: [{ company: "Electronic Arts", ticker: "EA", exchange: "NASDAQ" }] },
  { name: "Take-Two", companies: [{ company: "Take-Two Interactive", ticker: "TTWO", exchange: "NASDAQ" }] },
  { name: "Warner Bros", companies: [{ company: "Warner Bros. Discovery", ticker: "WBD", exchange: "NASDAQ" }] },
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
  "Samsung": ["Galaxy S24", "Galaxy Watch", "QLED TV"],
  "Sony": ["WH-1000XM5", "PlayStation 5", "Alpha camera"],
  "Google": ["Pixel 9", "Nest Hub", "Chromecast"],
  "Meta": ["Quest 3", "Ray-Ban smart glasses", "Portal"],
  "Amazon": ["Echo Dot", "Fire TV Stick", "Kindle Paperwhite"],
  "Microsoft": ["Surface Pro", "Xbox Series X", "Copilot"],
  "Tesla": ["Model 3", "Cybertruck", "Powerwall"],
  "Nvidia": ["RTX 4090", "GeForce GPU", "Shield TV"],
  "Netflix": ["subscription plan", "ad tier", "mobile games"],
  "Disney": ["Disney+ bundle", "theme park pass", "merchandise"],
  "Adidas": ["Samba sneakers", "Ultraboost", "Gazelle"],
  "Under Armour": ["HOVR shoes", "tech polo", "gym bag"],
  "Abercrombie": ["dad jeans", "bodysuit", "puffer jacket"],
  "On Running": ["Cloudmonster", "Cloud 5", "Cloudstratus"],
  "Birkenstock": ["Boston clogs", "Arizona sandals", "EVA slides"],
  "Coca-Cola": ["Coke Zero", "Spiced flavor", "mini cans"],
  "Chipotle": ["burrito bowl", "chicken al pastor", "lifestyle bowls"],
  "McDonald's": ["McFlurry", "McNuggets", "Happy Meal toy"],
  "Celsius": ["energy drink", "Vibe line", "on-the-go powder"],
  "Peloton": ["Bike+", "Tread", "Row"],
  "Garmin": ["Forerunner 265", "Venu 3", "Instinct Solar"],
  "Wayfair": ["sectional sofa", "area rug", "patio set"],
  "Target": ["Threshold collection", "Hearth & Hand", "dollar spot finds"],
  "Walmart": ["Better Homes set", "Great Value finds", "rollback deals"],
  "Costco": ["Kirkland items", "food court pizza", "seasonal finds"],
  "Robinhood": ["stock trading app", "Gold membership", "IRA account"],
  "Coinbase": ["crypto wallet", "staking rewards", "trading app"],
  "SoFi": ["checking account", "student loan refi", "invest account"],
  "Airbnb": ["unique stays", "experiences", "hosting tips"],
  "Chewy": ["Autoship deals", "pet pharmacy", "toy bundles"],
  "Freshpet": ["fresh dog food", "cat food rolls", "treats"],
  "Roblox": ["Robux", "avatar items", "game passes"],
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
