# SmartGrocer - Smart Retail Grocery Application

## Overview

SmartGrocer is a full-stack digital assistant application for physical grocery retail stores. It provides a hierarchical store management system with branches, floors, racks, and items (1000+ grocery products). The application supports three user roles: HQ administrators who manage multiple branches, branch managers who oversee individual store operations, and customers who browse and shop products with AI-powered assistance.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript, built using Vite
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: Zustand with persistence for auth and cart state, TanStack React Query for server state
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens (emerald green primary palette, CSS variables for theming)
- **Animations**: Framer Motion for page transitions and UI effects
- **Charts**: Recharts for analytics visualizations in manager dashboard

### Backend Architecture
- **Runtime**: Node.js with Express and TypeScript
- **API Design**: RESTful endpoints defined in `shared/routes.ts` with Zod validation schemas
- **Database**: PostgreSQL with Drizzle ORM for type-safe queries
- **Real-time Features**: Server-Sent Events (SSE) for AI chatbot streaming responses
- **Build System**: Custom esbuild script that bundles server dependencies for optimized cold starts

### Data Model
The store hierarchy follows: Branch → Floor → Rack → Items
- **Branches**: Store locations with QR codes for customer access
- **Floors**: Physical floors within each branch (Ground, 1st, 2nd, etc.)
- **Racks**: Categorized shelving units (minimum 10 items per rack)
- **Items**: Grocery products with pricing, stock, discounts, and category info
- **Users**: Role-based (hq_admin, branch_manager, customer) with branch assignments
- **Sales**: Transaction records with line items for analytics

### Authentication
- Role-based access control with three tiers: HQ Admin, Branch Manager, Customer
- Customers can enter via QR code scan (branch selection) without credentials
- Managers and HQ admins require username/password authentication
- Session state persisted in Zustand store with localStorage

### AI Integration
- OpenAI-compatible API through Replit AI Integrations
- Chat assistant for product location, pricing, and recipe help
- SSE streaming for real-time response delivery
- Voice chat capabilities with audio recording and playback utilities
- Image generation support for product imagery

### Shared Code
- `shared/schema.ts`: Drizzle table definitions and Zod insert schemas
- `shared/routes.ts`: API endpoint definitions with method, path, and validation
- Path aliases: `@/` for client source, `@shared/` for shared modules

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Schema migrations with `drizzle-kit push` command

### AI Services
- **OpenAI API** (via Replit AI Integrations): Text chat, image generation, speech-to-text, text-to-speech
- Environment variables: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Third-Party Libraries
- **QRCode**: Generate QR codes for branch identification
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **date-fns**: Date formatting utilities
- **p-limit/p-retry**: Batch processing with rate limiting for AI calls

### Development Tools
- **Vite**: Dev server with HMR, includes Replit-specific plugins for error overlay and dev banner
- **esbuild**: Production server bundling
- **TypeScript**: Strict mode enabled across client, server, and shared code