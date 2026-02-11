# CLAUDE.md - AI Visibility Tracker Pro Project Memory

> **CRITICAL**: Read this file completely before making ANY changes to the project.
> This is Claude's persistent memory for the AI Visibility Tracker Pro project.

---

## Project Overview

**AI Visibility Tracker Pro** is a production-ready web application for tracking brand visibility across AI platforms (ChatGPT, Perplexity, Google AI Overview). Built for **Bliss Drive** - Digital Marketing Agency.

### Current Status (Updated: February 11, 2026)

| Metric | Value |
|--------|-------|
| Project Status | Production Ready |
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Database | PostgreSQL + Prisma |
| Job Queue | Bull + Redis |

### Demo Credentials

- **Email**: `demo@blissdrive.com`
- **Password**: `demo1234`

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18, Vite, Recharts, html2canvas + jsPDF |
| Backend | Node.js, Express.js |
| Browser Automation | Puppeteer + Stealth Plugin |
| Database | PostgreSQL 16 + Prisma ORM |
| Job Queue | Bull + Redis 7 |
| Authentication | JWT (7-day expiry) |
| Encryption | AES-256-CBC (session tokens) |
| Containerization | Docker + Docker Compose |

---

## CRITICAL: DO NOT DELETE

### Protected Configuration Files

```
backend/.env                     # API keys, secrets, database URLs
backend/prisma/schema.prisma     # Database schema
docker-compose.yml               # Infrastructure configuration
.gitignore                       # Git ignore rules
```

### Protected Data Directories

```
backend/prisma/                  # Database schema & migrations
screenshots/                     # Scan screenshots (user data)
```

---

## Directory Structure

```
bliss-ai-visibility-tool/
├── ai-visibility-tracker/
│   ├── frontend/                     # React frontend
│   │   ├── src/
│   │   │   ├── components/           # Reusable components
│   │   │   │   ├── common/           # UI components
│   │   │   │   ├── Layout/           # Main layout
│   │   │   │   ├── clients/          # Client management
│   │   │   │   ├── scan/             # Scan interface
│   │   │   │   ├── charts/           # Data visualization
│   │   │   │   └── reports/          # Report components
│   │   │   ├── context/              # React contexts (Auth, Theme)
│   │   │   ├── pages/                # Page components
│   │   │   ├── services/             # API communication
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   ├── styles/               # Global styles
│   │   │   └── utils/                # Utilities
│   │   ├── Dockerfile                # Multi-stage build
│   │   └── nginx.conf                # Nginx config
│   │
│   ├── backend/                      # Node.js backend
│   │   ├── src/
│   │   │   ├── config/               # env, database, redis
│   │   │   ├── controllers/          # Request handlers
│   │   │   ├── routes/               # API routes
│   │   │   ├── middleware/           # auth, error, rate-limit
│   │   │   ├── services/
│   │   │   │   ├── engines/          # ChatGPT, Perplexity, Google
│   │   │   │   ├── analysis/         # Mention, sentiment, competitor
│   │   │   │   ├── scanOrchestrator.js
│   │   │   │   └── screenshot.service.js
│   │   │   ├── jobs/                 # Bull queue & workers
│   │   │   └── utils/                # Logger, browserPool
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Database models
│   │   │   └── seed.js               # Demo data seeder
│   │   └── Dockerfile
│   │
│   ├── screenshots/                  # Stored scan screenshots
│   ├── docker-compose.yml            # Full stack config
│   ├── .env.example                  # Environment template
│   └── README.md                     # Project documentation
│
├── .claude/                          # Claude settings
├── .gitignore
└── CLAUDE.md                         # THIS FILE
```

---

## Database Schema (Prisma Models)

### Core Models

| Model | Purpose |
|-------|---------|
| `User` | User accounts with role (ADMIN, ANALYST, VIEWER) |
| `UserSettings` | Theme, encrypted API keys, session tokens |
| `Client` | Brand/company being tracked |
| `Scan` | Individual scan job (QUEUED → RUNNING → COMPLETED/FAILED) |
| `Report` | Scan results with overall score |
| `PromptResult` | Results per search prompt |
| `EngineResult` | Results per AI engine |

### Key Enums

```prisma
enum Role { ADMIN, ANALYST, VIEWER }
enum ScanStatus { QUEUED, RUNNING, COMPLETED, FAILED }
enum Engine { CHATGPT, PERPLEXITY, GOOGLE_AIO }
enum MentionType { FEATURED, MENTIONED, COMPETITOR_ONLY, NOT_FOUND }
```

---

## API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/register` | Create account |
| POST | `/login` | Login, returns JWT |
| GET | `/me` | Get current user |

### Clients (`/api/clients`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | List all clients |
| POST | `/` | Create client |
| GET | `/:id` | Get client details |
| PUT | `/:id` | Update client |
| DELETE | `/:id` | Delete client |
| POST | `/:id/prompts` | Add search prompts |
| DELETE | `/:id/prompts/:index` | Remove prompt |
| POST | `/:id/competitors` | Add competitors |
| DELETE | `/:id/competitors/:index` | Remove competitor |

### Scans (`/api/scans`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/` | Start new scan |
| GET | `/:id` | Get scan details |
| GET | `/:id/status` | Real-time status polling |

### Reports (`/api/reports`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | List reports (paginated) |
| GET | `/:id` | Get detailed report |
| DELETE | `/:id` | Delete report |

### Settings (`/api/settings`)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/` | Get user settings |
| PUT | `/` | Update settings |

---

## Main Features

### 1. Multi-Engine Scanning
- **ChatGPT**: Puppeteer automation with session token auth
- **Perplexity**: Puppeteer automation with session token auth
- **Google AI Overview**: SerpAPI integration (or simulated without key)

### 2. Analysis Capabilities
- **Mention Detection**: FEATURED, MENTIONED, COMPETITOR_ONLY, NOT_FOUND
- **Sentiment Analysis**: Keyword-based NLP (-1.0 to +1.0 score)
- **Competitor Tracking**: Known competitor matching + new discovery
- **Gap Analysis**: Client vs competitor visibility comparison

### 3. Job Queue System
- Bull queue backed by Redis
- Progress tracking (0-100% with step descriptions)
- Auto-retry with exponential backoff (3 attempts)

### 4. PDF Report Generation
- Client-side using html2canvas + jsPDF
- Overall visibility score, engine breakdown, gap analysis

### 5. Browser Pool
- Puppeteer-based with stealth plugin
- Configurable pool size (default 2)
- Max 50 uses per browser before recycling

---

## Environment Variables

### Required Variables

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_visibility_tracker
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=<your-secret-key>
JWT_EXPIRES_IN=7d

# Encryption (for storing session tokens)
ENCRYPTION_KEY=<32-byte-hex-key>
ENCRYPTION_IV=<16-byte-hex-iv>

# Server
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Optional Variables

```bash
# APIs (optional - features work without)
SERP_API_KEY=<serpapi-key>           # Google AI Overview
FIRECRAWL_API_KEY=<firecrawl-key>    # Alternative web scraping

# Puppeteer Settings
PUPPETEER_HEADLESS=true
BROWSER_POOL_SIZE=2
SCAN_DELAY_MIN_MS=3000
SCAN_DELAY_MAX_MS=8000
PROMPT_TIMEOUT_MS=60000

# Storage
SCREENSHOT_DIR=./screenshots
MAX_SCREENSHOT_SIZE_MB=5
```

### Generate Encryption Keys

```bash
# Generate ENCRYPTION_KEY (32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate ENCRYPTION_IV (16 bytes)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

## Development Commands

### Setup

```bash
# Install dependencies
cd ai-visibility-tracker/backend && npm install
cd ai-visibility-tracker/frontend && npm install

# Copy environment file
cp ai-visibility-tracker/.env.example ai-visibility-tracker/backend/.env

# Start databases
docker-compose -f ai-visibility-tracker/docker-compose.yml up -d db redis

# Initialize database
cd ai-visibility-tracker/backend
npx prisma migrate dev
npx prisma db seed
```

### Development Servers

```bash
# Terminal 1 - Backend (port 3001)
cd ai-visibility-tracker/backend && npm run dev

# Terminal 2 - Frontend (port 5173)
cd ai-visibility-tracker/frontend && npm run dev
```

### Docker Full Stack

```bash
cd ai-visibility-tracker
docker-compose up -d --build     # Start all services
docker-compose logs -f           # View logs
docker-compose down              # Stop all
```

### Database Commands

```bash
cd ai-visibility-tracker/backend
npx prisma migrate dev --name <name>   # Create migration
npx prisma migrate deploy              # Apply migrations
npx prisma migrate reset               # Reset database
npx prisma db seed                     # Seed demo data
npx prisma studio                      # Open DB browser
```

---

## Security Configuration

### Rate Limiting

| Limiter | Limit | Window |
|---------|-------|--------|
| API | 100 requests | 15 minutes |
| Auth | 10 attempts | 15 minutes |
| Scan | 20 scans | 1 hour |

### Password Security
- Bcrypt hashing with 12 salt rounds
- Minimum 8 characters

### Token Storage
- Session tokens encrypted with AES-256-CBC
- API keys encrypted at rest

---

## Session Token Setup

### ChatGPT Session Token

1. Log into chat.openai.com
2. Open DevTools → Application → Cookies
3. Copy value of `__Secure-next-auth.session-token`
4. Add in Settings page

### Perplexity Session Token

1. Log into perplexity.ai
2. Open DevTools → Application → Cookies
3. Copy session-related cookies
4. Add in Settings page

### SERP API Key

1. Create account at https://serpapi.com
2. Get API key from dashboard
3. Add in Settings page

---

## Frontend Pages

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Dashboard | Overview, recent scans |
| `/login` | Login | Authentication |
| `/clients` | Clients | Client CRUD |
| `/clients/:id` | ClientDetail | Single client view |
| `/scan` | Scan | Start/monitor scans |
| `/reports` | Reports | Report list |
| `/reports/:id` | ReportDetail | Full report view |
| `/settings` | Settings | User preferences, API keys |

---

## Troubleshooting

### Scan Fails Immediately

1. Check Redis is running: `docker ps | grep redis`
2. Check backend logs: `docker-compose logs backend`
3. Verify session tokens are set in Settings

### ChatGPT Returns Login Page

1. Session token expired - get a new one
2. Update token in Settings page
3. Retry scan

### Google AI Overview Not Working

1. Check if SERP_API_KEY is set
2. Without key, returns simulated results
3. Get key from https://serpapi.com

### Database Connection Issues

1. Check PostgreSQL is running: `docker ps | grep postgres`
2. Verify DATABASE_URL in .env
3. Run `npx prisma migrate dev` if schema changed

### Browser Pool Exhausted

1. Reduce concurrent scans
2. Increase BROWSER_POOL_SIZE in .env
3. Check for orphaned Chromium processes

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `backend/src/index.js` | Express app initialization |
| `backend/src/jobs/queue.js` | Bull queue setup |
| `backend/src/jobs/scanWorker.js` | Scan job processor |
| `backend/src/services/scanOrchestrator.js` | Scan orchestration |
| `backend/src/services/engines/*.js` | AI engine implementations |
| `backend/src/utils/browserPool.js` | Browser management |
| `backend/prisma/schema.prisma` | Database schema |
| `frontend/src/App.jsx` | React routing |
| `frontend/src/context/AuthContext.jsx` | Auth state |

---

## Cleanup Guidelines

### SAFE to Delete

```
*.log                    # Log files
screenshots/*.png        # Old screenshots (if not needed)
node_modules/            # Reinstall with npm install
dist/, build/            # Rebuild with npm run build
```

### NEVER Delete

```
backend/.env             # Contains secrets
backend/prisma/          # Database schema & migrations
screenshots/             # User scan data
docker-compose.yml       # Infrastructure config
package.json             # Dependencies
```

---

## Deployment Checklist

- [ ] Set strong JWT_SECRET
- [ ] Generate production ENCRYPTION_KEY and ENCRYPTION_IV
- [ ] Configure PostgreSQL with strong password
- [ ] Set NODE_ENV=production
- [ ] Configure FRONTEND_URL for CORS
- [ ] Set up HTTPS/SSL
- [ ] Configure Redis persistence
- [ ] Set up database backups
- [ ] Set up monitoring/alerting

---

## Contact

- **Company**: Bliss Drive - Digital Marketing Agency
- **Website**: https://blissdrive.com

---

*Last Updated: February 11, 2026*
*Maintained by: Claude (Anthropic)*
