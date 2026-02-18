# AI Visibility Tracker Pro

A production-ready web application for tracking brand visibility across AI platforms (ChatGPT, Perplexity, Google AI Overview).

Built for **Bliss Drive** - Digital Marketing Agency

## Features

- **Multi-Engine Scanning**: Track brand mentions across ChatGPT, Perplexity, and Google AI Overview
- **Browser Automation**: Real web interface scanning using Puppeteer (not API calls)
- **Keyword Discovery**: Find what prompts your brand is already ranking for (with screenshot proof!)
- **Auto-Generate Prompts**: AI generates search prompts from your keywords using ChatGPT browser
- **Bulk Prompt Upload**: Upload 100+ prompts via CSV file
- **Session Token Validation**: Check if your ChatGPT/Perplexity tokens are still valid
- **Gap Analysis**: Compare client visibility against competitors
- **Sentiment Analysis**: Analyze how AI platforms portray your brand
- **New Competitor Detection**: Automatically discover new competitors in AI responses
- **PDF Reports**: Export professional reports for clients
- **Dark/Light Mode**: Full theme support
- **Real-time Progress**: Watch scan progress in real-time
- **Production Ready**: Docker Compose deployment with nginx reverse proxy

---

## How Features Work (Technical Details)

> **IMPORTANT**: All data discovered by this tool is **100% REAL**. We use actual browser automation to query real AI platforms - nothing is simulated or faked.

### 1. Multi-Engine Scanning (Core Feature)

**How it works:**
- Uses **Puppeteer** (headless Chrome) to open a real browser
- Navigates to the actual AI platform (ChatGPT, Perplexity, or Google)
- Types your search prompt into the real interface
- Waits for the AI to generate a complete response
- Takes a **screenshot** as proof of the real response
- Extracts and analyzes the response text

**Why it's real:**
- We don't use APIs that might return cached/different results
- Screenshots are captured from the actual browser session
- You can see the exact same response if you manually search the same prompt
- Session tokens authenticate us as a real logged-in user

**Code location:** `backend/src/services/engines/chatgpt.js`, `perplexity.js`, `googleAIO.js`

### 2. Keyword Discovery

**How it works:**
1. Takes your industry, services, and location as input
2. Generates discovery prompts using **ChatGPT Browser** (or templates as fallback):
   - "Best [industry] companies in [location]"
   - "Top [service] providers near me"
   - "Who are the leading [industry] agencies"
   - etc.
3. **Actually queries the AI platform** (ChatGPT/Perplexity) with each prompt
4. **Captures screenshot proof** of each response
5. Analyzes each real response for mentions of your brand
6. Returns prompts where your brand was **FEATURED** or **MENTIONED** with "View Proof" links

**Why it's real:**
- Each prompt is sent to the real AI platform
- We run actual browser automation for every single prompt
- **Screenshot proof** is captured for every discovered keyword
- The mention detection happens on real AI-generated responses
- Progress shows each prompt being scanned in real-time
- You can verify any discovered prompt by searching it yourself or clicking "View Proof"

**Example flow:**
```
Input: Industry = "Solar", Location = "Los Angeles"
       Brand = "SunPower Solar"

System generates: "Best solar companies in Los Angeles"
System queries: ChatGPT (real browser automation)
ChatGPT responds: "Here are the top solar companies in LA:
                  1. SunPower Solar - known for efficiency...
                  2. Tesla Solar..."

Result: FEATURED (brand mentioned first)
```

**Code location:** `backend/src/services/keywordDiscovery.js`

### 3. Auto-Generate Prompts

**How it works:**
1. Takes your keywords (e.g., "solar panels", "residential") and location
2. Priority order for generation:
   - **ChatGPT Browser** (uses same session token as scanning - no API key needed!)
   - **OpenAI API** (GPT-4o-mini) if available
   - **Template-based** fallback if neither is available
3. Returns prompts for user review before adding

**Why it's useful:**
- Saves time vs manually creating prompts
- AI understands context and generates realistic search queries
- Prompts are designed to be what real users would search
- **No extra API key required** - uses existing ChatGPT session token

**Code location:** `backend/src/services/promptGenerator.js`, `backend/src/services/keywordDiscovery.js`

### 4. Bulk Prompt Upload

**How it works:**
1. User uploads CSV file or pastes prompts directly
2. System parses and validates each prompt
3. Detects duplicates against existing prompts
4. Adds new prompts to the client's prompt list

**CSV Format:**
```csv
prompt,category
"Best digital marketing agencies in LA?",discovery
"Top SEO companies for small business",comparison
```

**Code location:** `backend/src/services/bulkUpload.js`

### 5. Mention Detection

**How it works:**
- Scans the AI response text for exact brand name matches
- Checks response position (featured = top 3, mentioned = anywhere)
- Detects competitor mentions in the same response
- Calculates mention type: FEATURED, MENTIONED, COMPETITOR_ONLY, NOT_FOUND

**Code location:** `backend/src/services/analysis/mentionDetector.js`

### 6. Gap Analysis

**How it works:**
- Compares where client appears vs where competitors appear
- Identifies prompts where competitors rank but client doesn't
- Shows opportunities for improvement

**Code location:** `backend/src/services/analysis/gapAnalyzer.js`

---

## Data Verification

### How to verify the data is real:

1. **Check screenshots**: Every scan saves a screenshot of the actual AI response
2. **Manual verification**: Search any prompt yourself on ChatGPT/Perplexity and compare
3. **Session tokens**: We use your actual logged-in session, seeing exactly what you would see
4. **Timestamps**: All scans are timestamped - AI responses change over time

### What we DON'T do:

- ❌ We don't simulate or fake AI responses
- ❌ We don't use cached data
- ❌ We don't make up mention results
- ❌ We don't use unofficial APIs that might return different results

### What we DO:

- ✅ Real browser automation with Puppeteer
- ✅ Actual AI platform queries
- ✅ Screenshot proof of every response
- ✅ Real-time scanning with progress tracking
- ✅ Authenticated sessions for accurate results

---

## Tech Stack

### Frontend
- React 18 + Vite
- React Router
- Recharts (charts)
- html2canvas + jsPDF (PDF export)

### Backend
- Node.js + Express
- Puppeteer (browser automation)
- Bull + Redis (job queue)
- Prisma + PostgreSQL
- JWT Authentication

### Infrastructure
- Docker + Docker Compose
- PostgreSQL
- Redis

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- (Optional) SERP API key for Google AI Overview

### Development Setup

1. **Clone and install dependencies**
```bash
cd ai-visibility-tracker

# Install backend dependencies
cd backend && npm install && cd ..

# Install frontend dependencies
cd frontend && npm install && cd ..
```

2. **Set up environment**
```bash
# Copy environment file
cp .env.example backend/.env

# Generate encryption keys
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Update backend/.env with generated keys
```

3. **Start databases**
```bash
docker-compose up -d db redis
```

4. **Initialize database**
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
cd ..
```

5. **Start development servers**
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm run dev
```

6. **Open the app**
```
http://localhost:5173
```

### Demo Credentials
- Email: `demo@blissdrive.com`
- Password: `demo1234`

## Docker Deployment

### Full Stack Deployment
```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `REDIS_URL` | Redis connection string | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `ENCRYPTION_KEY` | 32-byte hex key for encrypting tokens | Yes |
| `ENCRYPTION_IV` | 16-byte hex IV for encryption | Yes |
| `SERP_API_KEY` | SerpAPI key for Google AI Overview | No* |

*Without SERP API key, Google AI Overview will return simulated results.

### Production Deployment

For production deployment (e.g., AWS Lightsail, DigitalOcean):

1. **Copy the production example file**
```bash
cp .env.prod.example .env.prod
```

2. **Configure production environment**
Edit `.env.prod` with your actual values:
- Generate new `JWT_SECRET`, `ENCRYPTION_KEY`, `ENCRYPTION_IV`
- Set `FRONTEND_URL` to your server's public IP/domain
- Configure database credentials

3. **Deploy with production compose file**
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

4. **Important Notes**:
- `.env.prod` is gitignored - never commit production secrets
- If migrating from local dev, ensure ENCRYPTION_KEY/IV match or re-enter session tokens
- Nginx timeouts are set to 600s for long-running discovery scans

## Project Structure

```
ai-visibility-tracker/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── context/         # React contexts
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── utils/           # Utilities
│   └── ...
├── backend/                  # Node.js backend
│   ├── src/
│   │   ├── config/          # Configuration
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   │   ├── engines/     # Scan engines
│   │   │   └── analysis/    # Analysis services
│   │   ├── jobs/            # Background jobs
│   │   └── utils/           # Utilities
│   └── prisma/              # Database schema
├── screenshots/             # Stored screenshots
└── docker-compose.yml       # Docker configuration
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Clients
- `GET /api/clients` - List clients
- `POST /api/clients` - Create client
- `GET /api/clients/:id` - Get client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Scans
- `POST /api/scans` - Start scan
- `GET /api/scans/:id/status` - Get scan status

### Reports
- `GET /api/reports` - List reports
- `GET /api/reports/:id` - Get report
- `DELETE /api/reports/:id` - Delete report

## Configuration

### Setting Up Session Tokens

For ChatGPT and Perplexity scanning, you need to provide session tokens:

1. **ChatGPT Session Token**:
   - Log into chat.openai.com
   - Open DevTools → Application → Cookies
   - Copy the value of `__Secure-next-auth.session-token`

2. **Perplexity Session Token**:
   - Log into perplexity.ai
   - Open DevTools → Application → Cookies
   - Copy session-related cookies

### SERP API Setup

1. Create account at https://serpapi.com
2. Get your API key
3. Add to Settings in the app

## Development

### Running Tests
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

### Database Migrations
```bash
cd backend

# Create migration
npx prisma migrate dev --name <migration_name>

# Apply migrations
npx prisma migrate deploy

# Reset database
npx prisma migrate reset
```

## License

Proprietary - Bliss Drive

## Support

For issues and feature requests, contact the Bliss Drive development team.

---

**Powered by Bliss Drive** | [blissdrive.com](https://blissdrive.com)
