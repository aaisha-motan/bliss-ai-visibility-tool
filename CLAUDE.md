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

## STRICT DEVELOPMENT RULES

> **CRITICAL**: These rules MUST be followed for ALL future development.

### Rule #1: NO DELETIONS

- **NEVER delete existing files**
- **NEVER remove existing code**
- **NEVER modify existing functionality in breaking ways**
- **ONLY add new features**
- **ONLY extend existing functionality**

### Rule #2: Additive Development Only

When implementing new features:
1. Create NEW files for new services
2. Add NEW endpoints to existing routes (don't remove old ones)
3. Add NEW components (don't replace existing ones)
4. Extend existing functions (don't rewrite them)

---

## Rich's Feedback - DB Meeting (February 10, 2026)

### Meeting Source
- **Meeting**: DB Meeting
- **Date**: February 10, 2026
- **Recording**: https://fathom.video/calls/561010260
- **Timestamp**: 16:37 - 34:07 (AI Visibility Tool discussion)

### What Aaisha Demonstrated

Aaisha showed the current tool to Rich with these features:
- Browser-based scanning (not API) for live results
- Multi-engine: ChatGPT, Perplexity, Google AI Overview
- Screenshot capture of each result
- Gap analysis with competitors
- Client dashboard with login/logout
- Manual prompt and competitor entry
- Tested with Think Branded Media client

### Rich's Concerns

1. **"It's very limited"** - Only shows manually-entered prompts
2. **"Where are the keyword possibilities?"** - Can't discover what we're ranking for
3. **"We have to put in manually where we think we are placed"** - Too manual
4. **"How do we find keywords that we're ranking well?"** - No discovery feature

### Rich's Specific Requests

| Request | Priority | Quote from Rich |
|---------|----------|-----------------|
| Auto-generate prompts from keywords | HIGH | "Give it our keywords and ask it to generate prompts on its own" |
| Keyword discovery | HIGH | "Find keywords we're already ranking well for" |
| Bulk prompt upload | MEDIUM | "Upload 100 prompts" |
| Show ranking gaps | MEDIUM | "Where are they actually ranking and not ranking" |
| Non-biased search | MEDIUM | "Show them their downfalls" |
| Orchestrator/automation | MEDIUM | "Runs every month automatically" |
| Regular updates | HIGH | "Keep me updated regularly, don't wait till next week" |

### Rich's Vision

> *"My goal right now is just to build out things that are actually scalable, usable, automatic. Rather than just little tools... we need to have a fully functioning automated module for it that would eliminate people actually doing the work, more people overseeing the work."*

---

## Current Implementation Status

### Implemented Features ✅

| Feature | Status | File Location |
|---------|--------|---------------|
| Multi-engine scanning | ✅ Done | `services/engines/*.js` |
| Screenshot capture | ✅ Done | `services/screenshot.service.js` |
| Manual prompts | ✅ Done | `controllers/client.controller.js` |
| Manual competitors | ✅ Done | `controllers/client.controller.js` |
| Mention detection | ✅ Done | `services/analysis/mentionDetector.js` |
| Gap analysis | ✅ Done | `services/analysis/gapAnalyzer.js` |
| Sentiment analysis | ✅ Done | `services/analysis/sentimentAnalyzer.js` |
| Client dashboard | ✅ Done | `frontend/src/pages/` |
| PDF reports | ✅ Done | Client-side generation |
| Job queue | ✅ Done | `jobs/queue.js`, `jobs/scanWorker.js` |

### Missing Features ❌ (To Be Implemented)

| Feature | Priority | Status | Notes |
|---------|----------|--------|-------|
| Auto-generate prompts from keywords | HIGH | ✅ Completed | Implemented Feb 12, 2026 |
| Keyword discovery | HIGH | ❌ Not started | Find what client ranks for - **NEXT TO IMPLEMENT** |
| Bulk prompt upload | MEDIUM | ❌ Not started | CSV/spreadsheet import |
| Monthly automation/scheduler | MEDIUM | ❌ Not started | Cron-based scans |
| Deployment for AMs | MEDIUM | ❌ Not started | Production deployment |

---

## Development Roadmap

### Phase 1: Auto-Generate Prompts (COMPLETED - February 12, 2026)

**Goal**: Let AI generate search prompts from keywords

**Files Created**:
```
backend/src/services/promptGenerator.js       # AI prompt generation service
frontend/src/components/clients/PromptGenerator.jsx  # UI component with modal
```

**Endpoint Added**:
```
POST /api/clients/:id/generate-prompts
Body: { keywords: ["solar", "residential"], location: "Los Angeles", count: 10 }
Returns: { prompts: ["Best solar...", ...], source: "openai" | "templates" }
```

**Implementation Completed**:
1. User clicks "Generate from Keywords" button in Client Detail page
2. User enters focus keywords + location + count
3. AI (OpenAI gpt-4o-mini) generates prompts, or falls back to templates
4. User reviews and selects which prompts to add
5. Selected prompts added to client via existing `addPrompts` endpoint

**Files Modified**:
- `backend/src/config/env.js` - Added openaiApiKey config
- `backend/src/controllers/client.controller.js` - Added generatePrompts function
- `backend/src/routes/client.routes.js` - Added POST /:id/generate-prompts route
- `frontend/src/services/clientService.js` - Added generatePrompts API function
- `frontend/src/pages/ClientDetail.jsx` - Integrated PromptGenerator component
- `.env.example` - Added OPENAI_API_KEY

### Phase 2: Keyword Discovery (TO BE IMPLEMENTED)

**Goal**: Find what keywords/prompts a client is already ranking well for in AI platforms

**Rich's Request**: *"How do we find keywords that we're ranking well?"* / *"Where are the keyword possibilities?"*

**Concept**:
Instead of manually guessing prompts, this feature will:
1. Take client's brand name, website, and industry
2. Use AI to generate discovery prompts (e.g., "Best [industry] companies in [location]")
3. Run scans on these discovery prompts
4. Identify which prompts return the client as FEATURED or MENTIONED
5. Save successful prompts for regular tracking

**Proposed Implementation**:

1. **New Backend Service**: `backend/src/services/keywordDiscovery.js`
   - Generate industry-specific discovery prompts using OpenAI
   - Categories: "best", "top", "recommended", "alternatives to", "compare", etc.
   - Include location variants if applicable

2. **New API Endpoint**: `POST /api/clients/:id/discover-keywords`
   ```
   Request: { industry: "solar", location: "Los Angeles", depth: "quick" | "thorough" }
   Response: {
     discoveredPrompts: [
       { prompt: "Best solar companies in LA", mentionType: "FEATURED", engine: "chatgpt" },
       { prompt: "Top residential solar installers", mentionType: "MENTIONED", engine: "perplexity" }
     ],
     totalScanned: 25,
     successRate: "32%"
   }
   ```

3. **New Frontend Component**: `frontend/src/components/clients/KeywordDiscovery.jsx`
   - Button: "Discover Keywords" on Client Detail page
   - Input: Industry, location, discovery depth (quick=10 prompts, thorough=50)
   - Progress indicator during discovery scan
   - Results table showing successful prompts with mention types
   - Checkbox to select which discovered prompts to add to client

4. **Discovery Prompt Templates** (built-in):
   ```
   - "Best {industry} companies in {location}"
   - "Top {industry} services near me"
   - "Recommended {industry} providers"
   - "Who are the leading {industry} companies"
   - "{industry} companies with best reviews"
   - "Alternatives to [competitor]"
   - "Compare {industry} providers in {location}"
   ```

5. **Database Changes** (optional):
   - Add `discoveredAt` timestamp to track when prompts were discovered
   - Add `discoverySource` field to distinguish manual vs discovered prompts

**Files to Create**:
```
backend/src/services/keywordDiscovery.js      # Discovery logic
frontend/src/components/clients/KeywordDiscovery.jsx  # UI component
```

**Files to Modify**:
```
backend/src/controllers/client.controller.js  # Add discoverKeywords function
backend/src/routes/client.routes.js           # Add POST /:id/discover-keywords
frontend/src/services/clientService.js        # Add discoverKeywords API call
frontend/src/pages/ClientDetail.jsx           # Integrate KeywordDiscovery component
```

**Estimated Effort**: Medium (similar scope to Phase 1)

---

### Phase 3: Bulk Prompt Upload (Future)

**Goal**: Allow users to upload 100+ prompts via CSV/spreadsheet

**Rich's Request**: *"Upload 100 prompts"*

**Proposed Implementation**:

1. **New API Endpoint**: `POST /api/clients/:id/prompts/bulk`
   - Accept CSV file upload
   - Parse and validate prompts
   - Return import summary (added, duplicates, errors)

2. **Frontend Component**: `BulkPromptUpload.jsx`
   - Drag-and-drop CSV upload
   - Preview table before import
   - Download CSV template

3. **CSV Format**:
   ```csv
   prompt,category
   "Best solar companies in LA",discovery
   "Top residential solar installers",comparison
   ```

**Files to Create**:
```
backend/src/services/csvParser.js
frontend/src/components/clients/BulkPromptUpload.jsx
```

---

### Phase 4: Monthly Automation/Scheduler (Future)

**Goal**: Run scans automatically on a schedule (monthly, weekly)

**Rich's Request**: *"Runs every month automatically"* / *"Orchestrator/automation"*

**Proposed Implementation**:

1. **Scheduler Service**: `backend/src/services/scheduler.js`
   - Use node-cron or Bull's repeatable jobs
   - Store schedules per client in database

2. **New Database Fields**:
   ```prisma
   model Client {
     scanSchedule    String?   // "monthly" | "weekly" | "disabled"
     nextScheduledScan DateTime?
     lastScheduledScan DateTime?
   }
   ```

3. **New API Endpoints**:
   - `PUT /api/clients/:id/schedule` - Set scan schedule
   - `GET /api/clients/:id/schedule` - Get schedule status

4. **Frontend**: Schedule toggle in Client settings

5. **Email Notifications** (optional):
   - Send report summary when automated scan completes

**Files to Create**:
```
backend/src/services/scheduler.js
backend/src/jobs/scheduledScanWorker.js
```

---

### Phase 5: Production Deployment (Future)

**Goal**: Deploy tool for Account Managers to use

**Rich's Request**: *"Deployment for AMs"*

**Tasks**:
1. Set up production server (AWS/DigitalOcean/etc.)
2. Configure production environment variables
3. Set up SSL/HTTPS
4. Configure production PostgreSQL + Redis
5. Set up monitoring and logging
6. Create user accounts for AMs
7. Documentation/training for AMs

---

## Development Session Log

### Session: February 15, 2026

**Bug Fixes**: Scan Progress Bar & Rate Limiting

**Issues Identified**:
1. Progress bar stuck at 0% during scans
2. User getting logged out due to rate limiting
3. Scans completing but UI not reflecting progress

**Root Causes**:
1. Progress calculation used counter-based approach with parallel engines - all 3 engines reported 0% at start
2. Rate limits too low (100 API requests/15min, 10 auth attempts/15min)
3. Frontend polling every 2s but progress wasn't being updated in DB properly

**Fixes Applied**:

1. **scanOrchestrator.js** - Complete rewrite of progress calculation:
   - Changed from `completedSteps / totalSteps` to prompt-based progress
   - Each prompt contributes ~90%/totalPrompts to progress
   - Added initial 5% progress update at scan start
   - Progress updates at START and END of each engine scan
   - Formula: `baseProgress(5%) + (promptIndex * perPromptProgress) + (engineProgress * perPromptProgress / 100)`

2. **rateLimiter.js** - Increased limits for development:
   - API: 100 → 1000 requests per 15 minutes
   - Auth: 10 → 50 attempts per 15 minutes
   - Scan: kept at 20 per hour

**Files Modified**:
- `backend/src/services/scanOrchestrator.js` - Progress calculation fix
- `backend/src/middleware/rateLimiter.js` - Increased rate limits

**Status**: Fixed - scans complete successfully and reports are created

---

### Session: February 12, 2026 (Continued)

**Feature Completed**: Auto-Generate Prompts from Keywords

**Implementation Summary**:
- Created backend service with OpenAI integration + template fallback
- Added REST endpoint POST /api/clients/:id/generate-prompts
- Built React component with two-step modal (input → review)
- Integrated into Client Detail page
- All files compile and build successfully

**Technical Details**:
- Uses gpt-4o-mini model for cost-effective generation
- Template fallback includes 20+ prompt patterns
- Prompts are validated to exclude brand name mentions (discovery searches)
- User can select/deselect individual prompts before adding

**Status**: Ready for testing

---

### Session: February 12, 2026 (Earlier)

**Summary**: Analyzed Rich's feedback from DB meeting, identified missing features, created implementation plan for auto-prompt generation.

**Discovery**:
- Reviewed DB Meeting transcript (Feb 10, 2026)
- Extracted Rich's specific requests and concerns
- Compared current implementation vs requirements
- Identified 5 missing features

**Decisions**:
- Start with "Auto-generate prompts from keywords" feature
- Strict rule: NO DELETIONS, only additions
- Document everything in CLAUDE.md

**Completed**:
1. ✅ Create `promptGenerator.js` service
2. ✅ Add new endpoint to client routes
3. ✅ Create `PromptGenerator.jsx` component
4. ⏳ Test with Think Branded Media client

---

## Contact

- **Company**: Bliss Drive - Digital Marketing Agency
- **Website**: https://blissdrive.com

---

*Last Updated: February 15, 2026*
*Maintained by: Claude (Anthropic)*
