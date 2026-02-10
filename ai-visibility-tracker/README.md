# AI Visibility Tracker Pro

A production-ready web application for tracking brand visibility across AI platforms (ChatGPT, Perplexity, Google AI Overview).

Built for **Bliss Drive** - Digital Marketing Agency

## Features

- **Multi-Engine Scanning**: Track brand mentions across ChatGPT, Perplexity, and Google AI Overview
- **Browser Automation**: Real web interface scanning using Puppeteer (not API calls)
- **Gap Analysis**: Compare client visibility against competitors
- **Sentiment Analysis**: Analyze how AI platforms portray your brand
- **New Competitor Detection**: Automatically discover new competitors in AI responses
- **PDF Reports**: Export professional reports for clients
- **Dark/Light Mode**: Full theme support
- **Real-time Progress**: Watch scan progress in real-time

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
