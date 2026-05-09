# Malar Market Digital Ledger

A hybrid Desktop/Tablet Progressive Web Application (PWA) for managing flower commission business operations with 50+ farmers. Built for offline-first operation during critical morning rush hours (4-9 AM).

## 🌟 Overview

Malar Market Digital Ledger is a comprehensive business management system designed for flower market operations, featuring:

- **Offline-First PWA**: Full functionality during morning rush hours without internet connectivity
- **Time-Based Pricing Engine**: Dynamic pricing based on market hours and demand
- **Complex Financial Settlements**: Automated commission calculations, fee management, and advance tracking
- **WhatsApp Bot Integration**: Real-time transparency for farmers via automated notifications
- **Bilingual Support**: Complete English and Tamil language support
- **Role-Based Access Control**: Admin, Staff, and Farmer roles with appropriate permissions

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite PWA)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Daily Entry │  │  Settlements │  │  Reports     │      │
│  │  Management  │  │  Processing  │  │  Dashboard   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            │                                │
│  ┌─────────────────────────┴─────────────────────────┐     │
│  │         Offline Sync Layer (IndexedDB)            │     │
│  └─────────────────────────┬─────────────────────────┘     │
└────────────────────────────┼──────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │   HTTPS/REST    │
                    └────────┬────────┘
                             │
┌────────────────────────────┼──────────────────────────────┐
│                     Backend (FastAPI)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Auth &     │  │   Business   │  │  WhatsApp    │      │
│  │   RBAC       │  │   Logic      │  │  Integration  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            │                                │
│  ┌─────────────────────────┴─────────────────────────┐     │
│  │         Data Access Layer (SQLAlchemy)             │     │
│  └─────────────────────────┬─────────────────────────┘     │
└────────────────────────────┼──────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │   PostgreSQL    │
                    │   (Supabase)    │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │     Redis       │
                    │   (Caching)     │
                    └─────────────────┘
```

### Technology Stack

**Frontend:**
- React.js with Vite
- PWA with Workbox for offline support
- IndexedDB for local data storage
- Tailwind CSS for styling
- i18next for bilingual support

**Backend:**
- Python FastAPI
- SQLAlchemy ORM
- PostgreSQL via Supabase
- Redis for caching
- Twilio/Interakt for WhatsApp integration

**Infrastructure:**
- Vercel (Frontend hosting)
- Render/DigitalOcean (Backend hosting)
- Supabase (Database & Auth)
- GitHub Actions (CI/CD)

## 📁 Project Structure

```
malar-market-ledger/
├── backend/                 # FastAPI application
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Core configuration
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utilities
│   ├── tests/              # Backend tests
│   └── requirements.txt
├── frontend/               # React + Vite PWA
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # State management
│   │   ├── utils/          # Utilities
│   │   └── locales/        # i18n translations
│   ├── public/             # Static assets
│   └── tests/              # Frontend tests
├── docs/                   # Documentation
│   ├── architecture.md      # System architecture
│   ├── database-schema.md  # Database design
│   ├── api-design.md       # API documentation
│   └── deployment.md       # Deployment guides
├── scripts/                # Utility scripts
│   ├── migrations/         # Database migrations
│   └── seed/               # Seed data
├── .env.example            # Environment variables template
├── .gitignore
├── docker-compose.yml      # Local development
└── README.md
```

## 📊 Architecture Graph

Generate a full dependency graph of the codebase using the `/graphify` slash command in opencode:

```
/graphify .              # Graph the entire project
```

This produces a DOT/Graphviz diagram covering:
- **Infrastructure**: Nginx, PostgreSQL, Redis
- **Backend**: API routes (17 endpoints), SQLAlchemy models (15), services (9), auth/config/database
- **Frontend**: Pages (11), React contexts (4), API services (8), custom hooks (7), offline store, i18n
- **Cross-stack**: Frontend-to-backend REST connections through Nginx

### Rendering the Graph

Save the DOT output to a file and render with Graphviz:

```bash
# Install Graphviz if needed
# macOS: brew install graphviz
# Ubuntu: sudo apt install graphviz

dot -Tpng graph.dot -o architecture.png
dot -Tsvg graph.dot -o architecture.svg
```

Or paste the DOT output at [GraphvizOnline](https://dreampuf.github.io/GraphvizOnline) for an interactive view.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker (optional, for local development)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/malar-market-ledger.git
   cd malar-market-ledger
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start local services with Docker**
   ```bash
   docker-compose up -d
   ```

4. **Install backend dependencies**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

5. **Run database migrations**
   ```bash
   alembic upgrade head
   ```

6. **Load seed data (optional, for testing)**
   ```bash
   python scripts/seed/run_seed.py
   ```
   This will populate the database with sample users, farmers, flower types, time slots, market rates, daily entries, cash advances, and settlements.

7. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

8. **Start development servers**
   ```bash
   # Terminal 1: Backend
   cd backend
   uvicorn app.main:app --reload --port 8000

   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

9. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Seed Data Scripts

The project includes comprehensive seed data scripts for testing and development:

- **[`scripts/seed/run_seed.py`](scripts/seed/run_seed.py)** - Main seed script that runs all seed scripts
- **[`scripts/seed/seed_users.py`](scripts/seed/seed_users.py)** - Creates admin and staff user accounts
- **[`scripts/seed/seed_farmers.py`](scripts/seed/seed_farmers.py)** - Creates sample farmer records
- **[`scripts/seed/seed_flower_types.py`](scripts/seed/seed_flower_types.py)** - Creates flower types with bilingual names
- **[`scripts/seed/seed_time_slots.py`](scripts/seed/seed_time_slots.py)** - Creates time slots for market hours
- **[`scripts/seed/seed_market_rates.py`](scripts/seed/seed_market_rates.py)** - Creates market rates for each flower type and time slot
- **[`scripts/seed/seed_system_settings.py`](scripts/seed/seed_system_settings.py)** - Creates system configuration settings
- **[`scripts/seed/seed_daily_entries.py`](scripts/seed/seed_daily_entries.py)** - Creates sample daily entries for testing
- **[`scripts/seed/seed_cash_advances.py`](scripts/seed/seed_cash_advances.py)** - Creates sample cash advance records
- **[`scripts/seed/seed_settlements.py`](scripts/seed/seed_settlements.py)** - Creates sample settlement records

To run all seed scripts:
```bash
python scripts/seed/run_seed.py
```

To run individual seed scripts:
```bash
python scripts/seed/seed_users.py
python scripts/seed/seed_farmers.py
# ... etc
```

## 📚 Documentation

### Core Documentation
- [Project Summary](docs/project-summary.md) - Complete project overview and objectives
- [Architecture Overview](docs/architecture.md) - System design and data flow
- [Database Schema](docs/database-schema.md) - Complete ERD and table definitions
- [API Design](docs/api-design.md) - RESTful API documentation
- [Environment Configuration](docs/environment-configuration.md) - Environment variables setup

### Testing & Deployment
- [Testing Guide](docs/testing-guide.md) - Comprehensive testing procedures and strategies
- [Deployment Guide](docs/deployment-guide.md) - Complete production deployment instructions
- [Database Migration Guide](docs/database-migration-guide.md) - Database setup and migration procedures

### Monitoring & Security
- [Monitoring Guide](docs/monitoring-guide.md) - Application monitoring and logging setup
- [Security Checklist](docs/security-checklist.md) - Comprehensive security measures and audit procedures

### User Documentation
- [User Training Guide](docs/user-training-guide.md) - Admin and staff training materials
- [Production Readiness Checklist](docs/production-readiness-checklist.md) - Pre-launch and post-launch checklists

### WhatsApp Integration
- [WhatsApp Implementation Summary](docs/whatsapp-implementation-summary.md) - WhatsApp bot integration overview
- [WhatsApp Setup Guide](docs/whatsapp-setup.md) - WhatsApp configuration and testing

### Backend Documentation
- [Report Generation Guide](backend/docs/report-generation-guide.md) - PDF report generation with Tamil support
- [Font Setup Guide](backend/docs/font-setup.md) - Tamil font configuration

## 🔐 Security Features

- JWT-based authentication with refresh tokens
- Role-based access control (Admin, Staff, Farmer)
- HTTPS/TLS encryption for all communications
- Input validation and sanitization
- SQL injection prevention via ORM
- CORS configuration
- Rate limiting
- Audit logging for sensitive operations

## 🌐 Offline-First Strategy

The application is designed to work seamlessly during morning rush hours (4-9 AM) when internet connectivity may be unreliable:

1. **Service Worker Registration**: Caches critical assets and API responses
2. **IndexedDB Storage**: Local database for offline data persistence
3. **Background Sync**: Queues operations and syncs when connectivity returns
4. **Conflict Resolution**: Last-write-wins with timestamp-based resolution
5. **Optimistic UI Updates**: Immediate feedback with rollback on sync failure

## 🌍 Bilingual Support

Complete English and Tamil language support with:
- Dynamic language switching
- RTL (Right-to-Left) support for Tamil
- Culturally appropriate date/time formatting
- Localized currency display
- Translated error messages and notifications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Support

For support and questions, please contact the development team.

---

**Built with ❤️ for Malar Market**
