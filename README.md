# StockAI — AI-Powered Stock Inventory Management

A modern inventory management system built with **Next.js (App Router) + TypeScript + Tailwind + shadcn-style UI**, **MongoDB**, **BunnyCDN Storage**, and a **local Ollama vision model** for AI-assisted item naming.

> AI only **suggests** item names and search keywords from a product image. It never sets category, quantity, location, or any stock value — all inventory data stays user-controlled.

## Features

- **Inventory CRUD** with images, search terms, stock levels, and warehouse/rack/shelf/bin location.
- **Category → Sub Category → Item** hierarchy with create / edit / archive.
- **Smart search** combining MongoDB full-text, regex, and in-memory **fuzzy matching** (typo-tolerant: `cabel → cable`, `etharnet → ethernet`). Matches names, keywords, aliases, and common names.
- **AI-assisted creation**: upload an image → Ollama vision model returns suggested names + search keywords. Falls back to a built-in mock when Ollama is unreachable.
- **Image storage** on BunnyCDN (with a local `/public/uploads` fallback when not configured).
- **Stock movements** (purchase / return / transfer-in, consumption / sale / transfer-out / damaged) with full history and live balance.
- **Duplicate detection** before saving, with Continue / Edit existing / Cancel.
- **Dashboard**: total items, categories, low-stock, out-of-stock, recently added.

## Stack

| Layer    | Tech                                            |
| -------- | ----------------------------------------------- |
| Frontend | Next.js 14 App Router, TypeScript, Tailwind     |
| UI       | shadcn-style Radix primitives, lucide, sonner   |
| Backend  | Next.js Route Handlers (API)                    |
| Database | MongoDB (native driver, text index + fuzzy)     |
| Storage  | BunnyCDN Storage (local fallback)               |
| AI       | Ollama vision (`qwen2.5vl`), mock fallback      |

## Getting started

```bash
# 1. Install
npm install

# 2. Configure environment
cp .env.example .env.local   # then fill in values (MongoDB is required)

# 3. Create indexes (and optionally seed demo data)
npm run init-db
npm run seed          # loads the Electrical → Wires/Switches example data

# 4. Run
npm run dev           # http://localhost:3000
```

### Environment variables

See [.env.example](.env.example). Minimum to run: `MONGODB_URI`.

- **MongoDB** — local (`mongodb://127.0.0.1:27017`) or Atlas.
- **BunnyCDN** — set `BUNNY_STORAGE_ZONE`, `BUNNY_STORAGE_API_KEY`,
  `BUNNY_STORAGE_HOST`, and `BUNNY_PULL_ZONE_URL`. If left blank, images are
  saved to `public/uploads` so the app still works locally.
- **Ollama** — `OLLAMA_BASE_URL` + `OLLAMA_VISION_MODEL`. Pull a vision model
  first: `ollama pull qwen2.5vl:7b`. Set `AI_MOCK=true` to always use the mock.

## API overview

| Method                | Route                          | Purpose                          |
| --------------------- | ------------------------------ | -------------------------------- |
| `GET/POST`            | `/api/categories`              | List / create categories         |
| `PATCH/DELETE`        | `/api/categories/:id`          | Edit / archive category          |
| `GET/POST`            | `/api/subcategories`           | List (by `categoryId`) / create  |
| `PATCH/DELETE`        | `/api/subcategories/:id`       | Edit / archive subcategory       |
| `GET/POST`            | `/api/items`                   | Search/list / create item        |
| `GET/PATCH/DELETE`    | `/api/items/:id`               | Read / update / delete item      |
| `GET/POST`            | `/api/items/:id/stock`         | Movement history / record one    |
| `POST`                | `/api/items/duplicates`        | Duplicate detection              |
| `POST`                | `/api/upload`                  | Upload image (multipart)         |
| `POST`                | `/api/ai/suggest`              | AI suggestions from image URL    |
| `GET`                 | `/api/dashboard`               | Dashboard stats                  |

`/api/items` search params: `q`, `categoryId`, `subcategoryId`, `stock=low|out|all`, `page`, `limit`.

## How AI suggestions work

1. Image is uploaded to BunnyCDN (or local fallback) → URL returned.
2. Client calls `POST /api/ai/suggest` with the URL.
3. Backend fetches the image bytes, base64-encodes them, and calls Ollama
   `/api/generate` with the vision model and a JSON-only prompt.
4. Response is parsed into suggested names + keywords / common / layman /
   spelling variations. On any failure it returns a labelled **mock**.

## Notes & limitations (MVP)

- No auth layer yet — `Created By` / `Modified By` use `DEFAULT_USER`.
- Removing an image from a saved item drops the reference; orphaned BunnyCDN
  files are cleaned up on item delete but not on individual image removal.
- Fuzzy search scans up to 5,000 candidate docs per query; for very large
  catalogs, move to MongoDB Atlas Search for server-side fuzzy ranking.
