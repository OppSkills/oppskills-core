# OppSkills Core - Platform for Hackathons & Events

OppSkills is a high-performance, scalable platform designed for organizing, discovering, and managing hackathons, festivals, and tech events. Built with a modern monorepo architecture, it provides a seamless experience for both organizers and participants.

---

## 🚀 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | [Next.js 16](https://nextjs.org/), React 19, Tailwind CSS 4, TanStack Query |
| **Backend** | [NestJS 11](https://nestjs.com/), Node.js, Express |
| **Database** | [Prisma 6](https://www.prisma.io/), PostgreSQL (via Docker) |
| **Caching/Bus** | [Redis](https://redis.io/) (via Docker) |
| **Auth** | [Clerk](https://clerk.com/) |
| **Webhooks** | [Svix](https://www.svix.com/) |
| **Monorepo** | [Turborepo](https://turbo.build/repo) |

---

## ⚙️ Prerequisites

Ensure you have the following installed before starting:
- **Node.js**: >= 18.x (LTS recommended)
- **pnpm**: >= 10.5.2 (`npm install -g pnpm`)
- **Docker Desktop**: Required for PostgreSQL and Redis
- **Git**: For version control

---

## 🛠️ Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/OppSkills/oppskills-core
cd oppskills-core
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Spin Up Infrastructure
OppSkills uses Docker to manage local database and caching services.
```bash
docker compose up -d
```
*This starts **PostgreSQL** (port 5434) and **Redis** (port 6380).*

---

## 🔑 Environment Configuration

You need to set up `.env.local` files for the backend and frontend. Use the templates below:

### Backend (`apps/backend/.env.local`)
```env
DATABASE_URL="postgresql://oppskills:oppskills@localhost:5434/oppskills?schema=oppskills"
CLERK_SECRET_KEY="sk_test_..."
CLERK_WEBHOOK_SECRET="whsec_..."
REDISHOST="localhost"
REDISPORT="6380"
```

### Frontend (`apps/ui-webapp/.env.local`)
```env
NEXT_PUBLIC_API_URL="http://localhost:3001"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

---

## 📦 Database Setup (Prisma)

Once your infrastructure is running, initialize the database:

1. **Generate Client**: `pnpm db:generate`
2. **Push Schema**: `pnpm db:push` (Development only)
3. **Run Studio**: `pnpm db:studio` (Opens GUI on port 3008)

---

## 📡 Webhooks & Svix

To test Clerk user synchronization webhooks locally:
1. Install Svix CLI: `npm install -g svix-cli`
2. Start the listener:
   ```bash
   svix listen http://localhost:3001/user-accounts/clerk-webhook
   ```
3. Configure the output URL in your Clerk dashboard webhooks section.

---

## 💻 Development Workflow

### Start All Services
```bash
pnpm dev
```
- **UI Webapp**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3001](http://localhost:3001)
- **API Reference**: [http://localhost:3001/api-reference](http://localhost:3001/api-reference)

### Essential Commands
| Command | Description |
| :--- | :--- |
| `pnpm build` | Build all projects in order |
| `pnpm lint` | Run ESLint across the monorepo |
| `pnpm format` | Format code using Prettier |
| `pnpm check-types` | Run TypeScript compiler checks |

---

## 📂 Monorepo Structure

### Applications (`apps/`)

- **`backend`**: NestJS 11 API providing robust business logic, authentication guards, and database services.
- **`ui-webapp`**: Next.js 16 frontend featuring App Router, Server Components, and a premium React developer experience.

### Shared Packages (`packages/`)

OppSkills utilizes a shared-nothing-architecture where possible, but leverages standard packages for core cross-cutting concerns:

| Package | Purpose | Core Technologies |
| :--- | :--- | :--- |
| **`@oppskills/db`** | Single source of truth for the database schema and Prisma Client. | Prisma 6, PostgreSQL |
| **`@oppskills/types`** | Shared DTOs, Enums, and TypeScript interfaces for full-stack type safety. | TypeScript, class-validator |
| **`@oppskills/emails`** | Modular email templates used for automated platform notifications. | React Email, Resend |

---

## 📖 Documentation

For detailed guides, please refer to the `docs/` directory:
- [Architecture Overview](docs/architecture.md)
- [Comprehensive Development Guide](docs/development.md)
- [API Reference](docs/api.md)
- [Authentication Details](docs/authentication.md)

---

© 2026 OppSkills Platform. All rights reserved.