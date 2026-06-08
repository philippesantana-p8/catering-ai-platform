---
name: cdl-package-banners
description: Transform WhatsApp/Instagram catering package promo images into three SaaS catalog assets (mobile 4:3, banner 16:9, detail). Use when the user attaches package promo images, asks for package banners, catalog image versions, or Catering AI Platform package visuals.
---

# CDL Package Banner Transform

## When to use

User attaches one or more promotional package images (WhatsApp, Instagram, flyers) and wants professional app catalog assets for Catering AI Platform.

## Output (per source image)

Generate **three files** and save under `assets/packages/`:

| Version | Folder | Aspect | Filename pattern |
|---------|--------|--------|------------------|
| Mobile card | `mobile-4x3/` | 4:3 | `{package_key}-mobile-4x3.png` |
| Web banner | `banner-16x9/` | 16:9 | `{package_key}-banner-16x9.png` |
| Detail | `detail/` | preserve content, min 1200px wide | `{package_key}-detail.png` |

Infer `package_key` from visible text (e.g. BBQTRAD, BBQTRAD+) or ask if unclear.

## Mandatory rules

1. No information cropped or cut off.
2. Entire composition fits inside the frame.
3. No black letterboxing, empty bands, or wasted space — use light neutral background `#f5f5f5` or white if needed.
4. Reorganize layout when needed; never delete copy.
5. Keep original brand identity (colors, food photography, package name).
6. Improve text legibility (contrast, hierarchy, alignment).
7. Result must look like a modern SaaS catalog (Uber Eats, iFood, Shopify), not a WhatsApp flyer.

## Visual priority (top to bottom)

1. Food photo
2. Package name
3. Price
4. Main benefits
5. Other text (smaller, reorganized — never removed)

## Generation workflow

For **each** attached source image:

1. Read the source with the Read tool (images are supported).
2. Call `GenerateImage` **three times** with `reference_image_paths: [source path]`.
3. Use prompts below; adjust package name/price from what is visible in the source.

### Prompt — Mobile 4:3

```
Professional mobile app food catalog card, 4:3 aspect ratio. Reference the attached promo image.
Recreate as a premium SaaS product card: large appetizing food photo filling most of the frame (object-fit contain logic — show ALL food and ALL text, nothing cropped).
Package code small at top, package name bold, price prominent at bottom. Secondary benefits in smaller type.
Clean layout, white or #f5f5f5 margins only if needed to fit everything. No black bars. Modern iFood/Uber Eats style. High quality.
```

### Prompt — Banner 16:9

```
Professional horizontal web banner, 16:9 aspect ratio. Reference the attached promo image.
Premium catering app hero banner: all original information visible, nothing cut off. Food photography left or center, typography right or balanced grid.
Package name and price highlighted. Benefits readable but secondary. Light background #f5f5f5 or white fills gaps — no letterboxing black. Modern SaaS marketplace aesthetic.
```

### Prompt — Detail

```
High-resolution package detail image for catering app. Reference the attached promo image.
Keep nearly all original content; only reorganize for readability and alignment. Every line of text and every food item fully visible, nothing cropped.
Improve hierarchy: food hero, name, price, benefits. Clean professional catalog page, not social flyer. Minimum composition width equivalent to 1200px detail view quality.
```

4. After generation, move/rename outputs into `assets/packages/{folder}/` with the naming pattern above.
5. Report a table: source → 3 output paths → suggested `image_url` for Supabase (mobile 4:3 for wizard cards).

## App integration (after user approves assets)

- Wizard catalog (`PackageCatalogCard`) uses `object-contain` — **mobile 4:3** assets work best for `packages.image_url`.
- Do not change admin `/packages` CRUD unless user asks to upload to Supabase storage.
- Optional upload via existing `Lib/packageImageStorage.ts` + `/api/packages/[id]/image`.

## If source images are missing

Ask the user to attach PNG/JPG files or place them in `assets/packages/source/` and retry.
