# OppSkills Documentation

Welcome to the OppSkills platform documentation. This folder contains comprehensive documentation for the entire monorepo.

## Documentation Structure

This documentation is organized into the following sections:

### Core Documentation
- [Architecture Overview](./architecture.md) - System architecture, tech stack, and high-level design
- [Development Guide](./development.md) - Local setup, commands, and development workflow
- [Database Schema](./database.md) - Complete database schema, entities, relationships, and enums

### Application Layer
- [Backend Documentation](./backend.md) - NestJS modules, services, controllers, and business logic
- [Frontend Documentation](./frontend.md) - Next.js app structure, components, pages, and hooks
- [API Reference](./api.md) - Complete API endpoints documentation

### Operations
- [Authentication & Authorization](./authentication.md) - Clerk integration, auth guards, and role-based access
- [Deployment Guide](./deployment.md) - Infrastructure, CI/CD, and production deployment
- [Features & Business Logic](./features.md) - Key features, workflows, and implementation patterns

## Quick Start

New to the project? Start here:

1. Read the [Architecture Overview](./architecture.md) to understand the system
2. Follow the [Development Guide](./development.md) to set up your local environment
3. Review [Authentication](./authentication.md) to understand security and access control
4. Explore [Features & Business Logic](./features.md) to learn about key workflows

## Project Overview

OppSkills is a Turborepo monorepo for managing hackathons, festivals, and teams:

- **Backend**: NestJS API (`apps/backend`) running on port 3001
- **Frontend**: Next.js 16 app (`apps/ui-webapp`) running on port 3000
- **Packages**:
  - `@oppskills/db` - Prisma client and schema
  - `@oppskills/types` - Shared TypeScript DTOs

## Tech Stack Summary

- **Frontend**: Next.js 16, React 19, Tailwind CSS 4, TanStack Query, Clerk Auth
- **Backend**: NestJS 11, Prisma 6, PostgreSQL, Redis
- **Shared**: TypeScript, class-validator, Turborepo
- **Infrastructure**: Docker, AWS (S3, CloudFront, Secrets Manager), Vercel

## Contributing

When making changes:
1. Always run `pnpm db:generate` after schema changes
2. Follow the build order: types/db → backend/frontend
3. Use `pnpm lint` and `pnpm format` before committing
4. Update relevant documentation in this folder

## Need Help?

- For specific API endpoints, see [API Reference](./api.md)
- For database questions, see [Database Schema](./database.md)
- For deployment issues, see [Deployment Guide](./deployment.md)
- For feature implementation, see [Backend](./backend.md) or [Frontend](./frontend.md)
