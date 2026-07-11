# KE HOACH TRIEN KHAI CHI TIET
# BOOKIFY GOOGLE DOCS EXTENSION + FREE TIER STRATEGY

**Ngay tao:** 2026-02-27
**Muc tieu:** $0/thang (0-500 users) -> $7-26/thang (2000 users)

---

## MUC LUC

- [PHAN 0: MAPPING FREE TIER STACK](#phan-0)
- [PHAN 1: INFRASTRUCTURE SETUP (Tuan 0)](#phan-1)
- [PHAN 2: PHASE 1 - Foundation & Export Engine (Tuan 1-4)](#phan-2)
- [PHAN 3: PHASE 2 - Formatting & Book Design (Tuan 5-8)](#phan-3)
- [PHAN 4: PHASE 3 - Writing Tools (Tuan 9-12)](#phan-4)
- [PHAN 5: PHASE 4 - Collaboration & Publishing (Tuan 13-16)](#phan-5)
- [PHAN 6: UPGRADE PATH](#phan-6)

---

## PHAN 0: MAPPING FREE TIER STACK VAO KIEN TRUC BOOKIFY {#phan-0}

### Bang Thay The Dich Vu

| Dich vu goc (Google Cloud) | Thay the (Free Tier) | Tiet kiem | Gioi han Free |
|---|---|---|---|
| Cloud Run (Backend API) | **Render.com** | ~$15/thang | 750h/thang, 512MB RAM, spin down sau 15 phut |
| Firebase Hosting (Frontend) | **Cloudflare Pages** | ~$5/thang | Unlimited bandwidth, 500 builds/thang |
| Cloud Storage (Export files) | **Cloudflare R2** | ~$5/thang | 10GB storage, 0 egress fee |
| Firestore (User data) | **Supabase** | ~$25/thang | 500MB DB, 50k MAU, 1GB file storage |
| Cloud Memorystore (Cache) | **Upstash Redis** | ~$15/thang | 10k commands/ngay, 256MB |
| Google Fonts CDN | **Google Fonts CDN** | $0 | Mien phi (giu nguyen) |
| Cloud Logging | **Render.com built-in logs** | ~$5/thang | Co san trong free tier |
| Cloud Build (CI/CD) | **GitHub Actions** | ~$10/thang | 2000 phut/thang free |
| **TONG** | | **~$80/thang** | **$0/thang** |

### Kien Truc Moi (Free Tier Stack)

```
Google Docs Add-on (Apps Script)
    |
    |--- google.script.run ---> Frontend (Cloudflare Pages)
    |                            https://bookify-ixxa.onrender.com
    |
    |--- UrlFetchApp ---------> Backend API (Render.com)
    |                            https://bookify-ixxa.onrender.com
    |                                |
    |                                |--- Supabase (User data, metadata)
    |                                |--- Cloudflare R2 (Export files)
    |                                |--- Upstash Redis (Cache, rate limit)
    |                                |--- Google Fonts API
    |
    |--- Drive API ------------> Google Drive (User's own storage)
```

### Thay Doi Ky Thuat Quan Trong

1. **WeasyPrint thay Puppeteer/Chrome** cho PDF generation
   - Ly do: Puppeteer can ~1.5GB RAM, khong fit 512MB free tier
   - WeasyPrint: ~100MB RAM, Python-based, CSS print support tot
   - Trade-off: Kem linh hoat hon Puppeteer nhung du cho book PDF

2. **GitHub Actions ping trick** cho Render.com
   - Render free tier spin down sau 15 phut khong co request
   - Cron job ping moi 14 phut de giu server song
   - File: `.github/workflows/keep-alive.yml`

3. **Signed URLs tu R2** thay vi serve truc tiep
   - Export files upload len R2, tra ve signed URL (het han 24h)
   - User download truc tiep tu R2, khong qua backend

---

## PHAN 1: INFRASTRUCTURE SETUP - TUAN 0 {#phan-1}

### 1.1 Khoi Tao Monorepo

```
bookify-gdocs-extension/
├── addon/                      # Google Apps Script (clasp)
│   ├── appsscript.json
│   ├── Code.gs
│   ├── Sidebar.html
│   ├── ExportService.gs
│   ├── StyleService.gs
│   ├── VersionService.gs
│   └── WritingTools.gs
│
├── frontend/                   # React sidebar app
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── App.jsx
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                    # Node.js + Python (WeasyPrint) API
│   ├── src/
│   │   ├── routes/
│   │   │   ├── export.js
│   │   │   ├── fonts.js
│   │   │   └── validate.js
│   │   ├── services/
│   │   │   ├── epubGenerator.js
│   │   │   ├── pdfGenerator.js   # Goi WeasyPrint subprocess
│   │   │   ├── fontManager.js
│   │   │   ├── r2Client.js       # Cloudflare R2
│   │   │   └── supabaseClient.js # Supabase
│   │   └── server.js
│   ├── python/
│   │   └── pdf_render.py          # WeasyPrint PDF renderer
│   ├── Dockerfile                 # Multi-stage: Node + Python
│   └── render.yaml                # Render.com config
│
├── .github/workflows/
│   ├── deploy-backend.yml         # Deploy to Render.com
│   ├── deploy-frontend.yml        # Deploy to Cloudflare Pages
│   ├── publish-addon.yml          # Push to Apps Script
│   └── keep-alive.yml             # Ping Render moi 14 phut
│
├── supabase/
│   └── migrations/                # Database schema
│       └── 001_initial.sql
│
└── docs/
    └── KE_HOACH_TRIEN_KHAI.md
```

### 1.2 Dang Ky Tai Khoan & Cau Hinh (Ngay 1-2)

#### Buoc 1: Dang ky cac dich vu free

| STT | Dich vu | URL | Ghi chu |
|-----|---------|-----|---------|
| 1 | Render.com | render.com | Dung GitHub login, link repo |
| 2 | Cloudflare | cloudflare.com | Tao account, vao Pages + R2 |
| 3 | Supabase | supabase.com | Tao project, chon region Singapore |
| 4 | Upstash | upstash.com | Tao Redis database, chon region ap-southeast-1 |
| 5 | GitHub | github.com | Tao repo bookify-gdocs-extension |
| 6 | Google Cloud | console.cloud.google.com | Tao project bookify-gdocs-addon |
| 7 | Chrome Web Store | chromewebstore.google.com | Tra phi $5, tao developer account |

#### Buoc 2: Cau hinh Google Cloud Project

```bash
# Tao project
gcloud projects create bookify-gdocs-addon

# Bat APIs can thiet
gcloud services enable \
  docs.googleapis.com \
  drive.googleapis.com \
  script.googleapis.com

# Tao OAuth 2.0 credentials
# Console > APIs & Services > Credentials > Create OAuth Client ID
# Type: Web application
# Redirect URI: https://script.google.com/macros/d/{SCRIPT_ID}/usercallback
```

#### Buoc 3: Cau hinh Supabase Database

```sql
-- supabase/migrations/001_initial.sql

-- Bang luu user preferences
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  daily_word_goal INTEGER DEFAULT 1000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bang luu custom themes
CREATE TABLE custom_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  theme_config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bang luu writing stats
CREATE TABLE writing_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  word_count INTEGER DEFAULT 0,
  sprint_minutes INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Bang luu export history
CREATE TABLE export_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  doc_id TEXT NOT NULL,
  format TEXT NOT NULL, -- 'epub', 'pdf', 'docx'
  file_url TEXT, -- R2 signed URL
  file_size BIGINT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bang luu version names (bo sung cho Drive revisions)
CREATE TABLE named_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  doc_id TEXT NOT NULL,
  revision_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE writing_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE export_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE named_versions ENABLE ROW LEVEL SECURITY;

-- Users chi thay data cua minh
CREATE POLICY "Users see own profile" ON user_profiles
  FOR ALL USING (google_email = current_setting('app.current_user_email'));

CREATE POLICY "Users see own themes" ON custom_themes
  FOR ALL USING (user_id IN (
    SELECT id FROM user_profiles WHERE google_email = current_setting('app.current_user_email')
  ));

CREATE POLICY "Users see own stats" ON writing_stats
  FOR ALL USING (user_id IN (
    SELECT id FROM user_profiles WHERE google_email = current_setting('app.current_user_email')
  ));
```

#### Buoc 4: Cau hinh Cloudflare R2

```bash
# Trong Cloudflare Dashboard:
# 1. R2 > Create Bucket > ten: "bookify-exports"
# 2. R2 > Manage R2 API Tokens > Create API Token
#    - Permissions: Object Read & Write
#    - Specify bucket: bookify-exports
# 3. Luu lai:
#    - Account ID
#    - Access Key ID
#    - Secret Access Key
#    - Bucket endpoint: https://<account-id>.r2.cloudflarestorage.com
```

#### Buoc 5: Cau hinh Upstash Redis

```bash
# Trong Upstash Console:
# 1. Create Database > ten: "bookify-cache"
# 2. Region: ap-southeast-1 (Singapore)
# 3. Luu lai:
#    - UPSTASH_REDIS_REST_URL
#    - UPSTASH_REDIS_REST_TOKEN
```

#### Buoc 6: Tao file .env cho backend

```env
# backend/.env.example

# Server
PORT=3000
NODE_ENV=production

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
JWT_SECRET=generate-random-64-char-string

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx

# Cloudflare R2
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=bookify-exports
R2_ENDPOINT=https://xxx.r2.cloudflarestorage.com

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Export settings
MAX_EXPORT_SIZE_MB=50
SIGNED_URL_EXPIRY_HOURS=24
```

### 1.3 Dockerfile Toi Uu Cho Render.com (Duoi 512MB RAM)

```dockerfile
# backend/Dockerfile

# Stage 1: Build Node.js app
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY src/ ./src/

# Stage 2: Runtime voi Python (WeasyPrint)
FROM python:3.11-slim

# Cai WeasyPrint dependencies (nhe hon Puppeteer 10x)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf2.0-0 \
    libffi-dev \
    libcairo2 \
    fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir weasyprint==62.3

# Cai Node.js trong Python image
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Node app tu builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/src ./src
COPY package.json ./

# Copy Python PDF renderer
COPY python/ ./python/

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000

# Gioi han memory cho Node.js (de lai cho WeasyPrint)
CMD ["node", "--max-old-space-size=256", "src/server.js"]
```

### 1.4 Render.com Configuration

```yaml
# backend/render.yaml

services:
  - type: web
    name: bookify-api
    runtime: docker
    dockerfilePath: ./Dockerfile
    plan: free           # Free tier: 512MB RAM, 0.1 CPU
    region: singapore
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: "3000"
      # Cac env khac set trong Render Dashboard
    healthCheckPath: /health
    autoDeploy: true     # Auto deploy khi push to main
```

### 1.5 GitHub Actions Keep-Alive (Chong Cold Start)

```yaml
# .github/workflows/keep-alive.yml

name: Keep Render.com Alive
on:
  schedule:
    - cron: '*/14 * * * *'   # Moi 14 phut

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping backend
        run: |
          curl -sf https://bookify-ixxa.onrender.com/health || true
          echo "Pinged at $(date)"
```

### 1.6 Cloudflare Pages Configuration

```bash
# Frontend deploy len Cloudflare Pages

# Buoc 1: Connect GitHub repo trong Cloudflare Dashboard
# Pages > Create a Project > Connect to Git

# Buoc 2: Build settings
# Framework preset: Vite
# Build command: cd frontend && npm run build
# Build output directory: frontend/dist
# Root directory: / (root of repo)

# Buoc 3: Environment variables
# VITE_API_URL=https://bookify-ixxa.onrender.com
# VITE_SUPABASE_URL=https://xxx.supabase.co
# VITE_SUPABASE_ANON_KEY=xxx
```

---

## PHAN 2: PHASE 1 - FOUNDATION & EXPORT ENGINE (TUAN 1-4) {#phan-2}

### Tuan 1: Backend API Scaffold + EPUB Export MVP

#### Ngay 1-2: Khoi tao du an

**Viec can lam:**

1. Khoi tao monorepo:
```bash
mkdir bookify-gdocs-extension && cd bookify-gdocs-extension
git init

# Backend
mkdir -p backend/src/{routes,services,middleware}
mkdir -p backend/python
cd backend && npm init -y
npm install express cors helmet morgan jsonwebtoken
npm install @supabase/supabase-js @aws-sdk/client-s3 @upstash/redis
npm install epub-gen-memory
npm install -D typescript @types/express @types/node jest ts-jest
cd ..

# Frontend
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install zustand @tanstack/react-query
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
cd ..

# Add-on
mkdir -p addon
# Cai clasp global
npm install -g @google/clasp
```

2. Tao `backend/src/server.js`:
```javascript
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { rateLimit } = require('express-rate-limit');

const exportRoutes = require('./routes/export');
const fontRoutes = require('./routes/fonts');
const validateRoutes = require('./routes/validate');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Security
app.use(helmet());
app.use(cors({
  origin: [
    'https://bookify-ixxa.onrender.com',
    /\.google\.com$/,
    /script\.google\.com$/
  ]
}));
app.use(express.json({ limit: '50mb' }));
app.use(morgan('combined'));

// Rate limiting
const exportLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many exports. Please wait 1 minute.' }
});

// Health check (cho keep-alive ping)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Routes
app.use('/export', authMiddleware, exportLimiter, exportRoutes);
app.use('/fonts', fontRoutes);
app.use('/validate', authMiddleware, validateRoutes);

app.listen(PORT, () => {
  console.log(`Bookify API running on port ${PORT}`);
});
```

3. Tao `backend/src/services/r2Client.js` (Cloudflare R2):
```javascript
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function uploadExportFile(buffer, filename, contentType) {
  const key = `exports/${Date.now()}-${filename}`;

  await r2.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  }));

  // Tao signed URL het han sau 24h
  const signedUrl = await getSignedUrl(
    r2,
    new GetObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
    }),
    { expiresIn: 86400 } // 24 hours
  );

  return { key, signedUrl };
}

module.exports = { uploadExportFile };
```

4. Tao `backend/src/services/supabaseClient.js`:
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function getOrCreateUser(email, displayName) {
  const { data: existing } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('google_email', email)
    .single();

  if (existing) return existing;

  const { data: created } = await supabase
    .from('user_profiles')
    .insert({ google_email: email, display_name: displayName })
    .select()
    .single();

  return created;
}

async function saveExportHistory(userId, docId, format, fileUrl, fileSize, metadata) {
  return supabase
    .from('export_history')
    .insert({ user_id: userId, doc_id: docId, format, file_url: fileUrl, file_size: fileSize, metadata });
}

async function getWritingStats(userId, startDate, endDate) {
  return supabase
    .from('writing_stats')
    .select('*')
    .eq('user_id', userId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });
}

async function upsertDailyStats(userId, date, wordCount) {
  return supabase
    .from('writing_stats')
    .upsert(
      { user_id: userId, date, word_count: wordCount },
      { onConflict: 'user_id,date' }
    );
}

module.exports = { supabase, getOrCreateUser, saveExportHistory, getWritingStats, upsertDailyStats };
```

#### Ngay 3-4: EPUB Generator

**Viec can lam:**

1. Tao `backend/src/services/epubGenerator.js`:
```javascript
const EPub = require('epub-gen-memory').default;

async function generateEpub(docContent, metadata, theme, settings) {
  // Parse HTML thanh chapters
  const chapters = parseChapters(docContent, settings.includeChapters);

  // Tao CSS tu theme
  const themeCSS = generateThemeCSS(theme, settings);

  const epubOptions = {
    title: metadata.title,
    author: metadata.author,
    language: metadata.language || 'en',
    css: themeCSS,
    content: chapters.map(ch => ({
      title: ch.title,
      data: ch.html,
    })),
    // Font embedding
    fonts: theme.fontFamily ? [
      await fetchGoogleFont(theme.fontFamily)
    ] : [],
  };

  const epub = await new EPub(epubOptions).genEpub();
  return {
    buffer: epub,
    filename: `${metadata.title.replace(/[^a-z0-9]/gi, '_')}.epub`,
  };
}

function parseChapters(html, includeChapters) {
  // Split HTML by H1 tags thanh chapters
  const parts = html.split(/<h1[^>]*>/i);
  const chapters = [];

  for (let i = 1; i < parts.length; i++) {
    const closingIndex = parts[i].indexOf('</h1>');
    const title = parts[i].substring(0, closingIndex).replace(/<[^>]*>/g, '');
    const content = parts[i].substring(closingIndex + 5);

    if (!includeChapters || includeChapters.includes(title)) {
      chapters.push({ title, html: content });
    }
  }

  return chapters;
}

function generateThemeCSS(theme, settings) {
  let css = `
    body {
      font-family: '${theme.fontFamily || 'Georgia'}', serif;
      font-size: ${theme.fontSize || '11pt'};
      line-height: ${theme.lineHeight || 1.6};
      margin: ${theme.margins?.top || '1in'} ${theme.margins?.outer || '0.8in'}
              ${theme.margins?.bottom || '1in'} ${theme.margins?.inner || '1in'};
    }
    h1 { font-family: '${theme.headingFont || theme.fontFamily || 'Georgia'}'; }
  `;

  // Drop caps
  if (settings.dropCaps) {
    css += `
      p:first-of-type::first-letter {
        float: left;
        font-size: 3.5em;
        line-height: 0.8;
        padding: 0.1em 0.1em 0 0;
        font-weight: bold;
      }
    `;
  }

  // Scene breaks
  if (settings.sceneBreakSymbol) {
    css += `
      .scene-break {
        text-align: center;
        margin: 2em 0;
        font-size: 1.5em;
      }
    `;
  }

  return css;
}

module.exports = { generateEpub };
```

2. Tao `backend/src/routes/export.js`:
```javascript
const express = require('express');
const router = express.Router();
const { generateEpub } = require('../services/epubGenerator');
const { generatePdf } = require('../services/pdfGenerator');
const { uploadExportFile } = require('../services/r2Client');
const { saveExportHistory } = require('../services/supabaseClient');

router.post('/epub', async (req, res) => {
  try {
    const { docContent, metadata, theme, settings } = req.body;

    const result = await generateEpub(docContent, metadata, theme, settings);
    const { signedUrl } = await uploadExportFile(
      result.buffer, result.filename, 'application/epub+zip'
    );

    // Luu vao Supabase
    await saveExportHistory(
      req.user.id, req.body.docId, 'epub',
      signedUrl, result.buffer.length, metadata
    );

    res.json({
      downloadUrl: signedUrl,
      filename: result.filename,
      size: result.buffer.length,
    });
  } catch (error) {
    console.error('EPUB export failed:', error);
    res.status(500).json({ error: 'EPUB export failed', details: error.message });
  }
});

router.post('/pdf', async (req, res) => {
  try {
    const { docContent, trimSize, theme, settings } = req.body;

    const result = await generatePdf(docContent, trimSize, theme, settings);
    const { signedUrl } = await uploadExportFile(
      result.buffer, result.filename, 'application/pdf'
    );

    await saveExportHistory(
      req.user.id, req.body.docId, 'pdf',
      signedUrl, result.buffer.length, { trimSize }
    );

    res.json({
      downloadUrl: signedUrl,
      filename: result.filename,
      pageCount: result.pageCount,
      size: result.buffer.length,
    });
  } catch (error) {
    console.error('PDF export failed:', error);
    res.status(500).json({ error: 'PDF export failed', details: error.message });
  }
});

router.post('/docx', async (req, res) => {
  try {
    const { docContent, theme } = req.body;
    // Dung html-to-docx package
    const HTMLtoDOCX = require('html-to-docx');
    const buffer = await HTMLtoDOCX(docContent, null, {
      font: theme.fontFamily || 'Georgia',
      fontSize: theme.fontSize || 22,
    });

    const filename = `export_${Date.now()}.docx`;
    const { signedUrl } = await uploadExportFile(
      buffer, filename,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );

    res.json({ downloadUrl: signedUrl, filename });
  } catch (error) {
    res.status(500).json({ error: 'DOCX export failed', details: error.message });
  }
});

module.exports = router;
```

#### Ngay 5: PDF Generator voi WeasyPrint

**Viec can lam:**

1. Tao `backend/python/pdf_render.py`:
```python
#!/usr/bin/env python3
"""PDF renderer using WeasyPrint - 10x lighter than Puppeteer"""
import sys
import json
import base64
from weasyprint import HTML, CSS

# Trim size map (inches to mm)
TRIM_SIZES = {
    "5x8":     {"width": "127mm", "height": "203mm"},
    "5.06x7.81": {"width": "128.5mm", "height": "198.4mm"},
    "5.25x8":  {"width": "133.4mm", "height": "203mm"},
    "5.5x8.5": {"width": "139.7mm", "height": "215.9mm"},
    "6x9":     {"width": "152.4mm", "height": "228.6mm"},
    "6.14x9.21": {"width": "156mm", "height": "234mm"},
    "6.69x9.61": {"width": "170mm", "height": "244mm"},
    "7x10":    {"width": "177.8mm", "height": "254mm"},
    "7.44x9.69": {"width": "189mm", "height": "246mm"},
    "7.5x9.25": {"width": "190.5mm", "height": "235mm"},
    "8x10":    {"width": "203.2mm", "height": "254mm"},
    "8.25x6":  {"width": "209.6mm", "height": "152.4mm"},
    "8.25x8.25": {"width": "209.6mm", "height": "209.6mm"},
    "8.5x8.5": {"width": "215.9mm", "height": "215.9mm"},
    "8.5x11":  {"width": "215.9mm", "height": "279.4mm"},
    "8.27x11.69": {"width": "210mm", "height": "297mm"},  # A4
    "11x8.5":  {"width": "279.4mm", "height": "215.9mm"},  # Landscape letter
}

def render_pdf(html_content, trim_size, theme, settings):
    size = TRIM_SIZES.get(trim_size, TRIM_SIZES["6x9"])
    mirror = settings.get("mirrorMargins", False)

    margins = theme.get("margins", {})
    margin_top = margins.get("top", "1in")
    margin_bottom = margins.get("bottom", "1in")
    margin_inner = margins.get("inner", "1in")
    margin_outer = margins.get("outer", "0.75in")

    # CSS for print
    page_css = f"""
    @page {{
        size: {size['width']} {size['height']};
        margin-top: {margin_top};
        margin-bottom: {margin_bottom};
    }}
    @page :left {{
        margin-left: {margin_inner if mirror else margin_outer};
        margin-right: {margin_outer if mirror else margin_inner};
    }}
    @page :right {{
        margin-left: {margin_outer if mirror else margin_inner};
        margin-right: {margin_inner if mirror else margin_outer};
    }}
    body {{
        font-family: '{theme.get("fontFamily", "Georgia")}', serif;
        font-size: {theme.get("fontSize", "11pt")};
        line-height: {theme.get("lineHeight", 1.6)};
        orphans: 2;
        widows: 2;
    }}
    h1 {{
        page-break-before: always;
        font-family: '{theme.get("headingFont", theme.get("fontFamily", "Georgia"))}';
    }}
    h1:first-of-type {{ page-break-before: avoid; }}
    """

    if settings.get("orphanControl", True):
        page_css += """
        p { orphans: 2; widows: 2; }
        """

    html = HTML(string=html_content)
    css = CSS(string=page_css)
    pdf_bytes = html.write_pdf(stylesheets=[css])

    return pdf_bytes

if __name__ == "__main__":
    # Doc input tu stdin
    input_data = json.loads(sys.stdin.read())
    pdf = render_pdf(
        input_data["html"],
        input_data["trimSize"],
        input_data["theme"],
        input_data["settings"]
    )
    # Output base64 encoded PDF
    result = {
        "pdf": base64.b64encode(pdf).decode("utf-8"),
        "size": len(pdf)
    }
    print(json.dumps(result))
```

2. Tao `backend/src/services/pdfGenerator.js` (goi Python subprocess):
```javascript
const { spawn } = require('child_process');
const path = require('path');

async function generatePdf(docContent, trimSize, theme, settings) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python3', [
      path.join(__dirname, '../../python/pdf_render.py')
    ]);

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => { stdout += data; });
    pythonProcess.stderr.on('data', (data) => { stderr += data; });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`PDF render failed: ${stderr}`));
        return;
      }
      try {
        const result = JSON.parse(stdout);
        const buffer = Buffer.from(result.pdf, 'base64');
        resolve({
          buffer,
          filename: `book_${trimSize}_${Date.now()}.pdf`,
          pageCount: Math.ceil(result.size / 50000), // estimate
        });
      } catch (e) {
        reject(new Error(`PDF parse failed: ${e.message}`));
      }
    });

    // Gui data qua stdin
    pythonProcess.stdin.write(JSON.stringify({
      html: docContent,
      trimSize,
      theme,
      settings,
    }));
    pythonProcess.stdin.end();
  });
}

module.exports = { generatePdf };
```

### Tuan 2: Google Apps Script Add-on Scaffold

#### Ngay 1-2: Manifest va Entry Points

**Viec can lam:**

1. Tao `addon/appsscript.json` (nhu da dinh nghia trong tai lieu)

2. Tao `addon/Code.gs`:
```javascript
/**
 * Bookify - Main Entry Points
 * @OnlyCurrentDoc
 */

const API_BASE_URL = 'https://bookify-ixxa.onrender.com';
const FRONTEND_URL = 'https://bookify-ixxa.onrender.com';

function onOpen(e) {
  DocumentApp.getUi()
    .createMenu('Bookify')
    .addItem('Open Formatter', 'openSidebar')
    .addItem('Quick Export EPUB', 'quickExportEpub')
    .addItem('Quick Export PDF', 'quickExportPdf')
    .addSeparator()
    .addItem('Insert Chapter Break', 'insertChapterBreak')
    .addItem('Insert Scene Break', 'insertSceneBreak')
    .addToUi();
}

function onHomepage(e) {
  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Bookify'))
    .addSection(
      CardService.newCardSection()
        .addWidget(CardService.newTextParagraph()
          .setText('Format and export your book directly from Google Docs.'))
        .addWidget(CardService.newTextButton()
          .setText('Open Formatter')
          .setOnClickAction(CardService.newAction().setFunctionName('openSidebar')))
    )
    .build();
}

function openSidebar() {
  const html = HtmlService.createHtmlOutputFromFile('Sidebar')
    .setTitle('Bookify')
    .setWidth(350);
  DocumentApp.getUi().showSidebar(html);
}

function insertChapterBreak() {
  const doc = DocumentApp.getActiveDocument();
  const cursor = doc.getCursor();
  if (!cursor) {
    DocumentApp.getUi().alert('Please place your cursor where you want the chapter break.');
    return;
  }
  const element = cursor.insertText('\n');
  const parent = element.getParent();
  parent.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  parent.setText('Chapter Title');
  doc.setCursor(doc.newPosition(parent, 0));
}
```

3. Tao `addon/Sidebar.html`:
```html
<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <style>
    body { margin: 0; padding: 0; overflow: hidden; }
    #app-frame {
      width: 100%; height: 100vh;
      border: none;
    }
    .loading {
      display: flex; align-items: center; justify-content: center;
      height: 100vh; font-family: sans-serif; color: #666;
    }
    .spinner {
      width: 40px; height: 40px;
      border: 3px solid #f3f3f3; border-top: 3px solid #4285f4;
      border-radius: 50%; animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="loading" id="loader">
    <div>
      <div class="spinner"></div>
      <p>Loading Bookify...</p>
    </div>
  </div>
  <iframe id="app-frame" style="display:none"></iframe>

  <script>
    const frame = document.getElementById('app-frame');
    const loader = document.getElementById('loader');

    frame.src = '<?= FRONTEND_URL ?>/sidebar';
    frame.onload = function() {
      loader.style.display = 'none';
      frame.style.display = 'block';
    };
    frame.onerror = function() {
      loader.innerHTML = '<p>Failed to load. Please try again.</p>';
    };

    // Bridge: cho phep frontend goi google.script.run
    window.addEventListener('message', function(event) {
      if (event.data.type === 'GAS_CALL') {
        const { method, args, callbackId } = event.data;
        google.script.run
          .withSuccessHandler(function(result) {
            frame.contentWindow.postMessage({
              type: 'GAS_RESULT', callbackId, result
            }, '*');
          })
          .withFailureHandler(function(error) {
            frame.contentWindow.postMessage({
              type: 'GAS_ERROR', callbackId, error: error.message
            }, '*');
          })
          [method](...(args || []));
      }
    });
  </script>
</body>
</html>
```

4. Tao `addon/ExportService.gs`:
```javascript
/**
 * Export Service - Extracts doc content and calls backend API
 */

function getDocumentContent() {
  const doc = DocumentApp.getActiveDocument();
  const body = doc.getBody();

  return {
    html: convertDocToHtml_(body),
    metadata: {
      title: doc.getName(),
      id: doc.getId(),
      lastUpdated: doc.getLastUpdated().toISOString(),
    },
    headings: extractHeadings_(body),
  };
}

function callExportAPI(endpoint, payload) {
  const token = getAuthToken_();
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: { 'Authorization': `Bearer ${token}` },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(`${API_BASE_URL}${endpoint}`, options);
  const status = response.getResponseCode();

  if (status !== 200) {
    throw new Error(`Export failed (${status}): ${response.getContentText()}`);
  }

  return JSON.parse(response.getContentText());
}

function exportEpub(settings) {
  const content = getDocumentContent();
  const result = callExportAPI('/export/epub', {
    docContent: content.html,
    docId: content.metadata.id,
    metadata: content.metadata,
    theme: settings.theme || {},
    settings: settings,
  });
  return result;
}

function exportPdf(settings) {
  const content = getDocumentContent();
  const result = callExportAPI('/export/pdf', {
    docContent: content.html,
    docId: content.metadata.id,
    trimSize: settings.trimSize || '6x9',
    theme: settings.theme || {},
    settings: settings,
  });
  return result;
}

// === Private helpers ===

function convertDocToHtml_(body) {
  // Convert Google Doc body to HTML
  let html = '';
  const numChildren = body.getNumChildren();

  for (let i = 0; i < numChildren; i++) {
    const child = body.getChild(i);
    const type = child.getType();

    if (type === DocumentApp.ElementType.PARAGRAPH) {
      html += convertParagraph_(child);
    } else if (type === DocumentApp.ElementType.TABLE) {
      html += convertTable_(child);
    } else if (type === DocumentApp.ElementType.LIST_ITEM) {
      html += convertListItem_(child);
    }
  }

  return html;
}

function convertParagraph_(para) {
  const heading = para.getHeading();
  const text = getFormattedText_(para);

  if (heading === DocumentApp.ParagraphHeading.HEADING1) return `<h1>${text}</h1>`;
  if (heading === DocumentApp.ParagraphHeading.HEADING2) return `<h2>${text}</h2>`;
  if (heading === DocumentApp.ParagraphHeading.HEADING3) return `<h3>${text}</h3>`;
  return `<p>${text}</p>`;
}

function getFormattedText_(element) {
  let result = '';
  const text = element.editAsText();
  const content = text.getText();

  if (!content) return '';

  let i = 0;
  while (i < content.length) {
    let char = content[i];
    const bold = text.isBold(i);
    const italic = text.isItalic(i);

    if (bold) char = `<strong>${char}`;
    if (italic) char = `<em>${char}`;
    if (italic) char += '</em>';
    if (bold) char += '</strong>';

    result += char;
    i++;
  }

  // Consolidate adjacent tags
  result = result.replace(/<\/strong><strong>/g, '');
  result = result.replace(/<\/em><em>/g, '');

  return result;
}

function extractHeadings_(body) {
  const headings = [];
  const numChildren = body.getNumChildren();

  for (let i = 0; i < numChildren; i++) {
    const child = body.getChild(i);
    if (child.getType() === DocumentApp.ElementType.PARAGRAPH) {
      const heading = child.getHeading();
      if (heading !== DocumentApp.ParagraphHeading.NORMAL) {
        headings.push({
          text: child.getText(),
          level: heading.toString(),
          index: i,
        });
      }
    }
  }

  return headings;
}

function getAuthToken_() {
  // Dung ScriptApp.getOAuthToken() de lay Google token
  // Backend se verify token nay voi Google
  return ScriptApp.getOAuthToken();
}
```

### Tuan 3: Frontend Sidebar React App

#### Ngay 1-3: React Skeleton + Export Panel

**Viec can lam:**

1. Setup Vite + React + TypeScript + Tailwind (da co tu tuan 1)

2. Tao communication bridge `frontend/src/hooks/useGasbridge.ts`:
```typescript
// Hook de goi Google Apps Script functions tu React sidebar

let callbackCounter = 0;
const pendingCallbacks = new Map<string, { resolve: Function; reject: Function }>();

// Lang nghe responses tu GAS
if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    if (event.data.type === 'GAS_RESULT') {
      const cb = pendingCallbacks.get(event.data.callbackId);
      if (cb) { cb.resolve(event.data.result); pendingCallbacks.delete(event.data.callbackId); }
    }
    if (event.data.type === 'GAS_ERROR') {
      const cb = pendingCallbacks.get(event.data.callbackId);
      if (cb) { cb.reject(new Error(event.data.error)); pendingCallbacks.delete(event.data.callbackId); }
    }
  });
}

export function callGas<T>(method: string, ...args: any[]): Promise<T> {
  return new Promise((resolve, reject) => {
    const callbackId = `cb_${++callbackCounter}`;
    pendingCallbacks.set(callbackId, { resolve, reject });

    window.parent.postMessage({
      type: 'GAS_CALL',
      method,
      args,
      callbackId,
    }, '*');

    // Timeout sau 120s
    setTimeout(() => {
      if (pendingCallbacks.has(callbackId)) {
        pendingCallbacks.delete(callbackId);
        reject(new Error('Request timed out'));
      }
    }, 120000);
  });
}
```

3. Tao `frontend/src/components/ExportPanel.tsx`:
```typescript
import { useState } from 'react';
import { callGas } from '../hooks/useGasBridge';

const TRIM_SIZES = [
  { value: '5x8', label: '5" x 8"' },
  { value: '5.5x8.5', label: '5.5" x 8.5"' },
  { value: '6x9', label: '6" x 9"' },
  // ... them 14 sizes khac
];

export function ExportPanel() {
  const [format, setFormat] = useState<'epub' | 'pdf' | 'docx'>('epub');
  const [loading, setLoading] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [trimSize, setTrimSize] = useState('6x9');

  async function handleExport() {
    setLoading(true);
    try {
      const method = format === 'epub' ? 'exportEpub'
        : format === 'pdf' ? 'exportPdf' : 'exportDocx';

      const result = await callGas<{ downloadUrl: string }>(method, {
        theme: {}, // TODO: lay tu ThemeBuilder
        trimSize,
        dropCaps: false,
        sceneBreakSymbol: '***',
      });

      setDownloadUrl(result.downloadUrl);
    } catch (error) {
      alert(`Export failed: ${error}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">Export</h2>

      {/* Format tabs */}
      <div className="flex gap-2 mb-4">
        {(['epub', 'pdf', 'docx'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`px-4 py-2 rounded text-sm font-medium
              ${format === f ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            {f.toUpperCase()}
          </button>
        ))}
      </div>

      {/* PDF-specific: Trim Size */}
      {format === 'pdf' && (
        <select
          value={trimSize}
          onChange={e => setTrimSize(e.target.value)}
          className="w-full p-2 border rounded mb-4"
        >
          {TRIM_SIZES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      )}

      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={loading}
        className="w-full py-3 bg-blue-600 text-white rounded font-medium
          disabled:opacity-50"
      >
        {loading ? 'Exporting...' : `Export ${format.toUpperCase()}`}
      </button>

      {/* Download link */}
      {downloadUrl && (
        <a
          href={downloadUrl}
          target="_blank"
          className="block mt-4 text-center text-blue-600 underline"
        >
          Download {format.toUpperCase()}
        </a>
      )}
    </div>
  );
}
```

### Tuan 4: Integration Testing + First Deploy

#### Ngay 1-2: Deploy Backend len Render.com

**Buoc deploy:**

```bash
# 1. Push code len GitHub
git add -A && git commit -m "Initial backend with EPUB/PDF export"
git push origin main

# 2. Trong Render Dashboard:
#    - New > Web Service
#    - Connect GitHub repo
#    - Name: bookify-api
#    - Region: Singapore
#    - Branch: main
#    - Root Directory: backend
#    - Runtime: Docker
#    - Plan: Free
#    - Add environment variables tu .env

# 3. Verify
curl https://bookify-ixxa.onrender.com/health
```

#### Ngay 3: Deploy Frontend len Cloudflare Pages

```bash
# 1. Trong Cloudflare Dashboard:
#    Pages > Create > Connect to Git > Select repo
#    Build settings:
#      Build command: cd frontend && npm ci && npm run build
#      Output directory: frontend/dist

# 2. Add env vars:
#    VITE_API_URL=https://bookify-ixxa.onrender.com

# 3. Deploy & verify: https://bookify-ixxa.onrender.com
```

#### Ngay 4-5: Deploy Add-on + End-to-End Testing

```bash
# 1. Clasp setup
cd addon
clasp login
clasp create --type standalone --title "Bookify"
clasp push

# 2. Test trong Google Docs
# Mo Google Doc > Extensions > Bookify
# Test export EPUB voi 1 chapter don gian
# Test export PDF voi trim size 6x9

# 3. Checklist Tuan 4:
# [ ] Backend /health tra ve 200
# [ ] Keep-alive cron chay dung (check GitHub Actions logs)
# [ ] EPUB export thanh cong, download tu R2 signed URL
# [ ] PDF export thanh cong voi WeasyPrint
# [ ] Frontend load trong sidebar < 3s
# [ ] Auth flow: GAS token -> Backend JWT verify
```

---

## PHAN 3: PHASE 2 - FORMATTING & BOOK DESIGN (TUAN 5-8) {#phan-3}

### Tuan 5: Theme System + Scene Breaks

**Viec can lam:**

| STT | Task | File | Thoi gian |
|-----|------|------|-----------|
| 1 | Dinh nghia 17 preset themes (TypeScript constants) | `frontend/src/data/themes.ts` | 1 ngay |
| 2 | ThemeBuilder component (font picker, size slider, color) | `frontend/src/components/ThemeBuilder.tsx` | 2 ngay |
| 3 | Scene Break inserter (36 ornamental symbols) | `frontend/src/components/SceneBreaks.tsx` | 1 ngay |
| 4 | StyleService.gs - apply theme to doc + insert scene breaks | `addon/StyleService.gs` | 1 ngay |

**Scene Break Symbols (36 cai):**
```
*** | ~~~ | --- | * * * | ~ ~ ~ | - - - |
*** | *** | *** | *** | *** | ***
*** | *** | *** | *** | *** | ***
*** | *** | *** | *** | *** | ***
*** | *** | *** | *** | *** | ***
*** | *** | *** | *** | *** | ***
```
(Cac ky tu Unicode decorative: fleurons, dingbats, ornaments)

**Luu theme vao Supabase:**
```sql
-- Da co bang custom_themes trong migration 001
-- Frontend goi backend endpoint POST /themes/save
-- Backend luu vao Supabase, tra ve theme_id
```

### Tuan 6: Drop Caps + Text Message Formatter + Call-Out Boxes

| STT | Task | File |
|-----|------|------|
| 1 | Drop Caps configurator (letter, font, size, color) | `frontend/src/components/DropCaps.tsx` |
| 2 | Text Message Formatter (iOS/Android bubble styles) | `frontend/src/components/TextMessageFormatter.tsx` |
| 3 | Call-Out Box builder (color, border, corner radius) | `frontend/src/components/CalloutBox.tsx` |
| 4 | StyleService.gs - insertDropCap, insertTextMessage, insertCalloutBox | `addon/StyleService.gs` |
| 5 | CSS cho cac styles nay trong EPUB/PDF export | `backend/src/services/styleCSS.js` |

### Tuan 7: Chapter Structure Panel + Front/Back Matter

| STT | Task | File |
|-----|------|------|
| 1 | Chapter hierarchy panel (H1-H6 mapping, drag reorder) | `frontend/src/components/ChapterPanel.tsx` |
| 2 | Front Matter wizard (Title, Copyright, Dedication, TOC) | `frontend/src/components/FrontMatter.tsx` |
| 3 | Back Matter wizard (About Author, Also By, Acknowledgments) | `frontend/src/components/BackMatter.tsx` |
| 4 | Include In toggle (Ebook/Print/Both/None per section) | `frontend/src/components/IncludeIn.tsx` |
| 5 | Begin On setting (Right/Left page per chapter) | via Chapter Panel |

### Tuan 8: Theme Integration Testing + Bug Fixes

| STT | Task |
|-----|------|
| 1 | Test tat ca 17 themes voi EPUB export |
| 2 | Test tat ca 17 themes voi PDF export (tat ca trim sizes) |
| 3 | Test Drop Caps render dung trong Kindle/Kobo |
| 4 | Test Scene Breaks hien thi dung |
| 5 | Test Text Messages render dung trong EPUB |
| 6 | Fix bugs, optimize performance |

---

## PHAN 4: PHASE 3 - WRITING TOOLS & PRODUCTIVITY (TUAN 9-12) {#phan-4}

### Tuan 9: Sprint Timer + Word Count Goals

| STT | Task | File | Luu tru |
|-----|------|------|---------|
| 1 | Sprint Timer (pomodoro, custom intervals) | `frontend/src/components/SprintTimer.tsx` | Local state |
| 2 | Word Count (total/chapter/selection + daily goal) | `frontend/src/components/WordCount.tsx` | Supabase `writing_stats` |
| 3 | WritingToolsService.gs - getWordCount, getDailyWordCount | `addon/WritingTools.gs` | PropertiesService + Supabase |
| 4 | Daily goal progress bar + notifications | Frontend component | Supabase |

**Upstash Redis cho Word Count Cache:**
```javascript
// Cache word count de khong phai scan toan bo doc moi lan
const { Redis } = require('@upstash/redis');
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Cache word count 5 phut
async function getCachedWordCount(docId) {
  const cached = await redis.get(`wc:${docId}`);
  if (cached) return JSON.parse(cached);
  return null;
}

async function setCachedWordCount(docId, data) {
  await redis.set(`wc:${docId}`, JSON.stringify(data), { ex: 300 });
}
```

### Tuan 10: Writing Streak + Smart Quotes

| STT | Task | File |
|-----|------|------|
| 1 | Writing Streak calendar heatmap | `frontend/src/components/WritingStreak.tsx` |
| 2 | Streak counter + longest streak badge | Supabase query |
| 3 | Smart Quotes scanner (tim va fix curly quotes) | `addon/WritingTools.gs` |
| 4 | Find & Replace advanced (regex support) | `addon/WritingTools.gs` |

### Tuan 11: Multi-Device Previewer

| STT | Task | File |
|-----|------|------|
| 1 | DevicePreviewer component (5 devices) | `frontend/src/components/DevicePreviewer.tsx` |
| 2 | Device CSS profiles (Kindle/Kobo/iPad/iPhone/Galaxy) | `frontend/src/data/deviceProfiles.ts` |
| 3 | Font size slider + dark mode toggle | Trong DevicePreviewer |
| 4 | Chapter navigation trong previewer | Trong DevicePreviewer |

### Tuan 12: QA Writing Tools + Performance

| STT | Task |
|-----|------|
| 1 | Test Sprint Timer voi nhieu intervals |
| 2 | Test Word Count accuracy voi doc 100k words |
| 3 | Test Writing Streak across multiple days |
| 4 | Test Previewer tren tat ca 5 device profiles |
| 5 | Performance: sidebar load < 3s, word count < 2s |
| 6 | Fix bugs |

---

## PHAN 5: PHASE 4 - COLLABORATION & PUBLISHING (TUAN 13-16) {#phan-5}

### Tuan 13: Version Manager + Collaboration

| STT | Task | File | Storage |
|-----|------|------|---------|
| 1 | Version Manager (list, create, restore, compare) | `frontend/src/components/VersionManager.tsx` | Drive API + Supabase `named_versions` |
| 2 | VersionService.gs (Drive revisions API) | `addon/VersionService.gs` | Drive API |
| 3 | Collaboration share (invite by email, set roles) | `addon/CollaborationService.gs` | Drive Permissions API |
| 4 | Full Account Backup (ZIP export) | Backend endpoint | R2 storage |

### Tuan 14: EPUB Validation + Polish

| STT | Task |
|-----|------|
| 1 | EPUB validation (epubcheck integration) |
| 2 | Orphan/Widow control cho PDF |
| 3 | Alt text batch editor |
| 4 | Large Print configurator |
| 5 | UI polish, animations, error states |
| 6 | Performance optimization (bundle size < 200KB gzipped) |

### Tuan 15: Chrome Web Store Submission

**Checklist truoc khi submit:**

| # | Item | Status |
|---|------|--------|
| 1 | Privacy Policy URL hoat dong va GDPR-compliant | |
| 2 | Screenshots 1280x800px (it nhat 1, toi da 5) | |
| 3 | Promo tile 440x280px | |
| 4 | Description khong keyword stuffing | |
| 5 | Single purpose: chi book formatting | |
| 6 | Minimum permissions (chi scopes can thiet) | |
| 7 | No remote code execution (khong eval()) | |
| 8 | Unit test coverage > 80% backend, > 70% frontend | |
| 9 | ESLint + Prettier pass | |
| 10 | Security audit (npm audit, Snyk) | |

**Quy trinh submit:**

```bash
# 1. Tao ZIP cho Chrome Web Store
cd addon && zip -r ../bookify-addon.zip .

# 2. Vao chromewebstore.google.com/devconsole
# 3. New Item > Upload ZIP
# 4. Dien thong tin listing
# 5. Submit for review (1-3 ngay)

# 6. OAuth Verification (can cho restricted scopes)
#    - Chuan bi Privacy Policy URL
#    - Chuan bi demo video YouTube (< 2 phut, tieng Anh)
#    - Submit verification request
#    - Timeline: 2-6 tuan
```

### Tuan 16: Launch + Monitoring

| STT | Task |
|-----|------|
| 1 | OAuth verification follow-up |
| 2 | Setup error monitoring (Sentry free tier: 5k events/thang) |
| 3 | Setup uptime monitoring (UptimeRobot free: 50 monitors) |
| 4 | Landing page (Cloudflare Pages, 1 trang don gian) |
| 5 | Launch announcement |

---

## PHAN 6: UPGRADE PATH {#phan-6}

### Khi Nao Can Upgrade?

| Metric | Free Tier Limit | Dau Hieu Can Upgrade |
|--------|-----------------|---------------------|
| Users | 0-500 | Render cold start > 30s thuong xuyen |
| Render.com | 512MB RAM, spin down | > 750h/thang uptime |
| Cloudflare R2 | 10GB storage | Export files > 8GB |
| Supabase | 500MB DB, 50k MAU | DB > 400MB |
| Upstash Redis | 10k commands/ngay | > 8k commands/ngay |

### Lo Trinh Upgrade

#### Muc 1: $7/thang (500-1000 users)
```
Render.com Starter: $7/thang
- 512MB RAM (giong free nhung KHONG spin down)
- Khong can GitHub Actions keep-alive nua
- Response time on dinh < 500ms

Tat ca dich vu khac: van free
TONG: $7/thang
```

#### Muc 2: $14/thang (1000-1500 users)
```
Render.com Starter: $7/thang
Supabase Pro: $0 (van free neu < 50k MAU)
Upstash Pro: $7/thang (10M commands/thang)
  - Rate limit khong con la van de
  - Caching aggressively

TONG: $14/thang
```

#### Muc 3: $26/thang (1500-2000 users)
```
Render.com Standard: $15/thang
  - 1GB RAM (thoai mai cho WeasyPrint)
  - 0.5 CPU
Upstash Pay-as-you-go: $7/thang
Cloudflare R2: $4/thang (neu > 10GB)

TONG: ~$26/thang
```

#### Muc 4: $50-100/thang (2000-5000 users)
```
Render.com Pro: $25/thang (2GB RAM)
Supabase Pro: $25/thang
  - 8GB DB, 100k MAU
  - Daily backups
Upstash: $10/thang
R2: $5/thang

TONG: ~$65/thang
(Luc nay da co revenue tu users)
```

### Revenue Model De Cover Chi Phi

```
Freemium model:
- Free: 3 exports/thang, basic themes, no previewer
- Pro $9.99/thang: unlimited exports, all themes, previewer, priority support
- Lifetime $149: tat ca tinh nang

Break-even:
- $26/thang chi phi o 2000 users
- Chi can 3 Pro subscribers ($30) = da cover
- Hoac 1 Lifetime moi 5 thang
```

---

## PHAN 7: TONG KET TIMELINE

```
TUAN 0:  Infrastructure Setup (dang ky accounts, cau hinh services)
TUAN 1:  Backend scaffold + EPUB export MVP
TUAN 2:  Apps Script add-on scaffold + PDF export (WeasyPrint)
TUAN 3:  React frontend sidebar + Export Panel
TUAN 4:  Integration testing + First deploy (Render + CF Pages)
         >>> MILESTONE: Export EPUB/PDF working end-to-end <<<

TUAN 5:  Theme system (17 presets) + Scene Breaks
TUAN 6:  Drop Caps + Text Messages + Call-Out Boxes
TUAN 7:  Chapter Structure + Front/Back Matter
TUAN 8:  Theme testing across all export formats
         >>> MILESTONE: Full formatting suite complete <<<

TUAN 9:  Sprint Timer + Word Count Goals
TUAN 10: Writing Streak + Smart Quotes
TUAN 11: Multi-Device Previewer
TUAN 12: QA + Performance optimization
         >>> MILESTONE: All writing tools live <<<

TUAN 13: Version Manager + Collaboration
TUAN 14: EPUB validation + UI polish
TUAN 15: Chrome Web Store submission
TUAN 16: OAuth verification + Launch
         >>> MILESTONE: Public launch <<<
```

### Chi Phi Tong Ket

| Giai doan | Users | Chi phi/thang | Infrastructure |
|-----------|-------|---------------|----------------|
| Launch | 0-500 | **$0** | Full free tier stack |
| Growth | 500-1000 | **$7** | Render Starter |
| Scale | 1000-2000 | **$14-26** | + Upstash Pro |
| Mature | 2000-5000 | **$50-100** | Full paid stack, co revenue |

---

## PHAN 8: OPTION SERVERLESS 100% (THAM KHAO)

Neu muon tiet kiem toi da va chap nhan trade-offs:

```
Vercel Functions (thay Render.com):
- 100GB bandwidth free
- 10s execution limit (du cho EPUB, khong du cho PDF lon)
- Khong can keep-alive

GitHub Actions lam PDF Queue:
- Workflow dispatch: frontend trigger workflow qua GitHub API
- Workflow chay WeasyPrint, upload PDF len R2
- Tra ve download URL qua webhook/polling
- Trade-off: cham hon (30-60s queue time), 2000 phut/thang limit

Kien truc:
User click Export PDF
  -> Frontend goi Vercel Function
  -> Vercel trigger GitHub Actions workflow
  -> Workflow chay WeasyPrint container
  -> Upload PDF len R2
  -> Tra ve signed URL
  -> Frontend poll cho ket qua

Chi phi: $0 tuyet doi
Nhuoc diem: PDF export cham (1-2 phut thay vi 30s)
```

---

*Tai lieu nay se duoc cap nhat theo tien do thuc te cua du an.*
