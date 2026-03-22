# GameCart Architecture Overview

## System Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                          INTERNET                                  │
└─────────────────┬──────────────────────────────┬──────────────────┘
                  │                              │
         ┌────────▼────────┐            ┌────────▼────────┐
         │    VERCEL       │            │    KATABUMP     │
         │  (Frontend)     │            │   (Backend)     │
         │                 │            │                 │
         │  React App      │            │   Node.js App   │
         │  TypeScript     │            │   Express       │
         │  ────────────   │            │                 │
         │  ✨ UI/UX       │            │  ✨ REST API    │
         │  ✨ Shopping    │            │  ✨ Data Mgmt   │
         │  ✨ Browsing    │            │  ✨ File Upload │
         │                 │            │                 │
         │ gamecart.       │◄──────────►│ gamecart.       │
         │ vercel.app      │   HTTPS    │ katabump.com    │
         └────────┬────────┘            └────────┬────────┘
                  │                              │
                  │                              │
                  │                      ┌───────▼────────┐
                  │                      │  Data Storage  │
                  │                      │                │
                  │                      │ data/          │
                  │                      │  ├─ games.json │
                  │                      │  └─ cats.json  │
                  │                      │                │
                  │                      │ uploads/       │
                  │                      │  └─ images/    │
                  │                      └────────────────┘
                  │
                  └──────────── CDN (Images via /uploads)
```

## Data Flow

### Creating a Game

```
┌──────────────────────────┐
│  Admin fills form in     │
│  React Dashboard         │
└────────────┬─────────────┘
             │
             │ FormData with image
             │ (multipart/form-data)
             ▼
┌──────────────────────────────────┐
│  POST /api/admin/games           │
│  Content-Type: multipart/form-data
│  - name: "Valorant"              │
│  - slug: "valorant"              │
│  - price: "0"                    │
│  - image: <File Object>          │
└────────────┬─────────────────────┘
             │
             │ Express routes to handler
             │
             ▼
┌──────────────────────────────────┐
│  Backend Processes:              │
│  1. Validate input               │
│  2. Check slug uniqueness        │
│  3. Save image with multer       │
│  4. Generate unique ID           │
│  5. Create game object           │
│  6. Save to games.json           │
└────────────┬─────────────────────┘
             │
             │ Response with new game
             │
             ▼
┌──────────────────────────┐
│  Frontend receives:      │
│  - Game object           │
│  - Image URL             │
│  - Success message       │
│                          │
│  Updates UI & cache      │
│  Shows new game          │
└──────────────────────────┘
```

### Fetching Games

```
┌─────────────────────────┐
│  User visits homepage   │
│  or game details page   │
└────────────┬────────────┘
             │
             │ useEffect hook
             │
             ▼
┌────────────────────────┐
│  GET /api/games        │
│  or                    │
│  GET /api/games/slug/:s│
└────────────┬───────────┘
             │
             │ HTTPS request
             │
             ▼
┌─────────────────────────────────┐
│  Backend:                       │
│  1. Read from games.json        │
│  2. Filter if needed            │
│  3. Return JSON array           │
└────────────┬────────────────────┘
             │
             │ Response JSON
             │
             ▼
┌─────────────────────────────────┐
│  Frontend:                      │
│  1. Parse JSON                  │
│  2. Update state/store          │
│  3. Render game cards           │
│  4. Load images from /uploads   │
└─────────────────────────────────┘
```

## Component Interaction

### Admin Dashboard Components

```
┌─────────────────────────────────────────────────┐
│          AdminDashboard Component               │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │        Dashboard Stats                  │  │
│  │  ┌──────────┐ ┌──────────┐              │  │
│  │  │  Games   │ │Categories│              │  │
│  │  │    10    │ │    5     │              │  │
│  │  └──────────┘ └──────────┘              │  │
│  │  ┌──────────┐ ┌──────────┐              │  │
│  │  │  Stock   │ │  Value   │              │  │
│  │  │   500    │ │ 50000 EGP│              │  │
│  │  └──────────┘ └──────────┘              │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │      Create Game Form                   │  │
│  │  Name: _______________                  │  │
│  │  Slug: _______________                  │  │
│  │  Price: _____ Currency: [EGP]           │  │
│  │  Stock: _____ Popular: [✓]              │  │
│  │  Image: [Choose File]                   │  │
│  │  [CREATE GAME]                          │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
│  ┌─────────────────────────────────────────┐  │
│  │      Games Management Table             │  │
│  │  Name | Category | Price | Stock | ...  │  │
│  │  ──────────────────────────────────      │  │
│  │  Val. | Shooter  | 0     | 100   | Edit │  │
│  │  CS:G | Shooter  | 0     | 50    | Edit │  │
│  │  ────────────────────────────────────   │  │
│  └─────────────────────────────────────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

## File Organization

### Frontend (React/Vercel)
```
client/
├── src/
│   ├── components/
│   │   ├── admin-dashboard.tsx
│   │   ├── game-form.tsx
│   │   ├── games-table.tsx
│   │   └── ... (other components)
│   ├── lib/
│   │   └── backendApi.ts (← API integration)
│   ├── hooks/
│   └── pages/
└── .env (← Backend URL)
```

### Backend (Node.js/Katabump)
```
backend/
├── index.js (← ALL API endpoints)
├── package.json
├── .env (← Configuration)
├── data/
│   ├── games.json (← Games database)
│   └── categories.json (← Categories database)
└── uploads/
    └── images/ (← User uploaded files)
```

## Database Schema

### games.json
```json
[
  {
    "id": "game_1",
    "name": "Valorant",
    "slug": "valorant",
    "description": "...",
    "price": "0",
    "currency": "EGP",
    "image": "/uploads/image-123.jpg",
    "category": "shooters",
    "isPopular": true,
    "stock": 100,
    "packages": ["Standard", "Deluxe"],
    "packagePrices": ["0", "99.99"]
  }
]
```

### categories.json
```json
[
  {
    "id": "cat_1",
    "name": "Shooters",
    "slug": "shooters",
    "description": "...",
    "image": "/uploads/shooters-123.jpg",
    "gradient": "from-red-600 to-orange-600",
    "icon": "Crosshair"
  }
]
```

## API Communication

### Request/Response Flow

```
CLIENT REQUEST
│
├─ Method: GET / POST / PUT / DELETE
├─ URL: https://gamecart.katabump.com/api/...
├─ Headers:
│  ├─ Content-Type: application/json
│  │           or multipart/form-data
│  └─ (CORS auto-handled)
└─ Body: (JSON or FormData)
      │
      ▼
SERVER PROCESSING
│
├─ Parse request
├─ Validate input
├─ Process data
├─ Save to files
├─ Handle files (multer)
└─ Generate response
      │
      ▼
SERVER RESPONSE
│
├─ Status Code: 200/201/400/404/500
├─ Headers: Content-Type: application/json
└─ Body: JSON response
      │
      ▼
CLIENT HANDLING
│
├─ Parse response
├─ Update UI
├─ Cache data
└─ Show results
```

## CORS Setup

```
Frontend (Vercel)
  │
  ├─ Origin: https://gamecart.vercel.app
  │
  └──► Backend (Katabump)
       Checks CORS whitelist
       │
       ├─ Allow if in whitelist
       └─ Add headers:
          Access-Control-Allow-Origin: https://...
          Access-Control-Allow-Methods: GET, POST, PUT, DELETE
          Access-Control-Allow-Headers: Content-Type
```

## Image Upload Flow

```
User selects image
        │
        ▼
FormData with image
        │
        ▼
Frontend sends to /api/admin/games
        │
        ▼
Multer middleware
├─ Validates file
├─ Generates filename
└─ Saves to ./uploads/
        │
        ▼
Express saves metadata
├─ Image path: /uploads/filename
└─ Saves to games.json
        │
        ▼
Response to frontend
├─ Game object
├─ Image URL
└─ Success message
        │
        ▼
Frontend displays image
└─ <img src="/uploads/filename" />
```

## Search & Filter Flow

```
User enters: "q=valorant&category=shooters"
                    │
                    ▼
GET /api/search?q=valorant&category=shooters
                    │
                    ▼
Backend processes:
├─ Load all games from games.json
├─ Filter by name/description match: "valorant"
├─ Filter by category: "shooters"
├─ Filter by price (if provided)
├─ Filter by stock status (if provided)
└─ Return filtered array
                    │
                    ▼
Response: [filtered games]
                    │
                    ▼
Frontend displays results
└─ User sees matching games
```

## Error Handling

```
Request comes in
       │
       ▼
Try to process
       │
    ┌──┴──┐
    │     │
   OK    ERROR
    │     │
    ▼     ▼
  Response Handler
    │     │
    ▼     ▼
 200/    400/
 201      404/
         500
    │     │
    ▼     ▼
 Success  Error Message
 JSON    + Details
```

## Performance Considerations

```
Frontend (Vercel)
  ├─ Cached API responses
  ├─ Image lazy loading
  └─ State management

Backend (Katabump)
  ├─ JSON file caching in memory
  ├─ Fast file operations
  ├─ CORS pre-flight optimization
  └─ Multer streaming
```

---

This architecture provides:
- ✅ Clear separation of concerns
- ✅ Scalable API design
- ✅ Easy maintenance
- ✅ Production-ready deployment
- ✅ Simple but powerful data management
