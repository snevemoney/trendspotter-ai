

# Bulk Keyword Seeding System

Currently, keywords are added one at a time through the Settings page. To maximize data coverage, we'll add a massive pre-built keyword library and a bulk-import mechanism.

---

## What You'll Get

- A curated library of **1,000+ keywords** organized by category (beauty, fashion, tech, food, fitness, finance, home, travel, entertainment, health, etc.)
- A **"Seed Keywords"** button on the Settings page that bulk-inserts hundreds of keywords in one click
- A **bulk paste/import** feature where you can paste a large list of keywords (one per line) and add them all at once
- Categories displayed as toggleable groups so you can enable/disable entire categories

---

## Keyword Categories (1,000+ total)

Each category will contain 50-150 keywords covering:

1. **Beauty / Skincare** -- brand names, product types, viral terms ("glass skin", "slugging", "skin barrier")
2. **Fashion / Apparel** -- brand names, trend terms ("quiet luxury", "mob wife aesthetic", "capsule wardrobe")
3. **Tech / Gadgets** -- product names, brand names ("AirPods", "iPad", "Samsung", "mechanical keyboard")
4. **Food / Beverage** -- viral food brands, trends ("protein coffee", "cottage cheese", "baked oats")
5. **Fitness / Wellness** -- supplements, equipment, trends ("creatine", "walking pad", "cold plunge")
6. **Home / Decor** -- viral home products ("LED lights", "cloud couch", "Stanley cup organizer")
7. **Finance / Investing** -- stock terms, fintech ("dividend stocks", "Robinhood", "FIRE movement")
8. **Travel** -- travel gear, destinations, hacks ("packing cubes", "airport hack", "hotel hack")
9. **Entertainment** -- streaming, gaming, pop culture ("Netflix", "BookTok", "vinyl records")
10. **Health / Supplements** -- wellness brands, ingredients ("magnesium", "ashwagandha", "gut health")
11. **Baby / Parenting** -- viral parenting products ("Snoo", "baby monitor", "toddler hack")
12. **Pet** -- pet brands and viral products ("Farmer's Dog", "pet camera", "dog enrichment")
13. **Signal Phrases** -- cross-category viral phrases ("restock alert", "run don't walk", "sold out", "back in stock", "tiktok made me buy", "dupe alert", "holy grail", "game changer")

---

## Technical Details

### Files to Create

- **`src/lib/keyword-library.ts`** -- Contains the full keyword library as a structured constant: `Record<string, string[]>` mapping category names to keyword arrays. This keeps the data in-code with zero database overhead until the user seeds them.

### Files to Modify

- **`src/hooks/useKeywords.ts`** -- Add a new `useBulkAddKeywords()` mutation that accepts an array of strings and batch-inserts them (in chunks of 100 to stay within query limits), skipping duplicates.

- **`src/pages/Settings.tsx`** -- Add three new UI elements to the Keywords card:
  1. **"Seed Library" button** -- Opens a dialog showing keyword categories with checkboxes. User selects categories, clicks "Add Selected", and all keywords from those categories are bulk-inserted.
  2. **"Bulk Paste" button** -- Opens a dialog with a textarea where users can paste keywords (one per line) and import them all at once.
  3. **Keyword count badge** -- Shows total count (e.g., "1,247 keywords") so users can see how many they have.

- **`src/lib/mock-data.ts`** -- Expand the BRANDS array to include more brands that correspond to the new keyword categories (adding ~80 more brand-to-company mappings with tickers), so scans against these new keywords produce richer company match data.

### Bulk Insert Logic

```text
useBulkAddKeywords():
  1. Accept string[] of keywords
  2. Fetch existing keywords for user (to deduplicate)
  3. Filter out duplicates
  4. Chunk remaining into batches of 100
  5. Insert each batch with incrementing sort_order
  6. Show toast: "Added X new keywords (Y duplicates skipped)"
  7. Invalidate keywords query
```

### Seed Dialog Flow

```text
User clicks "Seed Library"
  -> Dialog opens with category list + checkboxes
  -> Each category shows count (e.g., "Beauty / Skincare (127)")
  -> "Select All" / "Deselect All" toggle
  -> "Add Selected" button
  -> Bulk insert runs
  -> Dialog closes, keyword list refreshes
```

### Expanded Brand Mappings

The BRANDS array in mock-data.ts will grow from 20 to ~100 entries, adding companies like:
- Tech: Samsung (005930.KS), Sony (SONY), Google/Alphabet (GOOGL), Meta (META), Amazon (AMZN)
- Fashion: Adidas (ADS.DE), Under Armour (UAA), Gap (GAP), H&M (HM-B.ST), Zara/Inditex (ITX.MC)
- Food: Coca-Cola (KO), PepsiCo (PEP), Chipotle (CMG), McDonald's (MCD)
- Fitness: Peloton (PTON), Planet Fitness (PLNT), Garmin (GRMN)
- Home: Wayfair (W), Restoration Hardware (RH), Williams-Sonoma (WSM)
- Finance: Robinhood (HOOD), Coinbase (COIN), SoFi (SOFI)
- And many more...

This ensures that when scans run against the new keywords, the system generates more company matches with real tickers, which in turn produces more Kalshi prediction overlap signals.

