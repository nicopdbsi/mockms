# BentoHub - Kitchen Management System

## Overview

BentoHub is a subscription-based Kitchen Management System designed to help small food entrepreneurs launch, manage, and grow their food businesses. The platform provides three core functions: automated recipe costing (CFO), operations management (COO), and growth analytics (CGO). It helps food entrepreneurs move from guesswork to data-driven decisions by tracking costs, managing inventory, and providing insights on profitability.

The application is built as a full-stack web application with a React frontend and Express backend, targeting small food business owners who need clarity and professional tools without complexity.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**UI Component System**: Shadcn UI with Radix UI primitives
- Uses a "new-york" style variant with neutral color scheme
- Component library configured via `components.json` with path aliases for clean imports
- Tailwind CSS for styling with custom design tokens and spacing system

**Design System**:
- Typography: Inter/DM Sans fonts with specific size scales for hero (3.5rem), sections (2.5rem), and features (1.5rem)
- Layout: Container max-width of 7xl with consistent spacing primitives (4, 6, 8, 12, 16, 20, 24, 32)
- Color system: HSL-based with CSS variables for theming, supporting both light and dark modes
- Custom utility classes for elevation effects (`hover-elevate`, `active-elevate-2`)

**State Management**:
- TanStack Query (React Query) for server state management
- Custom auth context provider for authentication state
- Form state managed by React Hook Form with Zod validation

**Routing**: Wouter for client-side routing (lightweight React Router alternative)

**Page Structure**:
- Marketing pages: Home page with 7 sections (Hero, Three Pillars, Problem/Solution, Features, Social Proof, CTA, Footer)
- Application pages: Dashboard, Recipes, Recipe Form, Ingredients, Materials, Suppliers, Analytics
- Auth pages: Login and Signup

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js

**Development vs Production**:
- Development mode uses Vite dev server with HMR middleware
- Production mode serves pre-built static files from `dist/public`
- Separate entry points (`index-dev.ts` and `index-prod.ts`) for different environments

**API Structure**: RESTful API design
- Authentication endpoints: `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/user`
- Resource endpoints follow pattern: `/api/{resource}` with standard CRUD operations
- Resources include: users, suppliers, ingredients, materials, recipes, recipe-ingredients, orders

**Authentication & Sessions**:
- Passport.js with Local Strategy for username/password authentication
- Session management using express-session with in-memory store (MemoryStore)
- Password hashing with scrypt (Node.js crypto module)
- Session cookies with 7-day expiration
- Global Express.User type augmentation for type-safe user objects

**Data Access Layer**:
- Storage interface pattern (`IStorage`) abstracts database operations
- All database operations go through storage layer for testability and flexibility
- User-scoped queries ensure data isolation between accounts

### Data Storage

**ORM**: Drizzle ORM for type-safe database access

**Database**: PostgreSQL (configured for Neon serverless)
- Connection via `@neondatabase/serverless` HTTP adapter
- Schema defined in `shared/schema.ts` with Drizzle table definitions
- Migration system using Drizzle Kit (output to `./migrations`)

**Schema Design**:
- Users table: Core authentication and business profile
- Suppliers table: Contact and vendor management
- Ingredients table: Food items with pricing per gram, quantity tracking, and supplier references
- Materials table: Non-food items (packaging, equipment) with per-unit pricing
- Recipes table: Dish definitions with servings, target margin, target food cost, and cost calculations
- RecipeIngredients table: Junction table linking recipes to ingredients with quantities
- Orders table: Production records linking recipes to actual revenue/cost

**Data Relationships**:
- All entities (except users) have `userId` foreign key for multi-tenancy
- Cascade deletes on user removal to clean up all associated data
- Supplier references use `SET NULL` on delete to preserve historical records
- Relations defined using Drizzle's `relations()` API

**Validation**: Zod schemas generated from Drizzle tables via `drizzle-zod`
- Insert schemas for form validation
- Type inference for compile-time safety
- Shared between client and server via `shared/schema.ts`

### External Dependencies

**UI Component Libraries**:
- Radix UI (20+ primitive components): Accordion, Dialog, Dropdown, Select, Toast, Tooltip, etc.
- Provides accessible, unstyled components as foundation
- Class Variance Authority for variant-based styling
- Tailwind Merge and CLSX for className composition

**Form & Validation**:
- React Hook Form for form state management
- @hookform/resolvers for Zod schema integration
- Zod for runtime validation and TypeScript type inference

**Data Visualization**:
- Recharts library configured for charts (imported but not heavily used yet)
- Chart configuration system via custom `ChartContext`

**Date Handling**:
- date-fns for date manipulation and formatting

**Development Tools**:
- Replit-specific plugins: runtime error overlay, cartographer, dev banner
- ESBuild for production server bundling
- TSX for TypeScript execution in development

**Database & ORM**:
- @neondatabase/serverless: HTTP-based PostgreSQL client for serverless environments
- Drizzle ORM: Type-safe query builder and migration tool
- connect-pg-simple: PostgreSQL session store (available but currently using memory store)

**Session Management**:
- express-session with memorystore for development
- Session secret configurable via environment variable (defaults to development key)
- PostgreSQL session store available via connect-pg-simple for production scaling

**Asset Management**:
- Static image assets stored in `attached_assets/generated_images/`
- Images for hero, features, testimonials, and analytics dashboards
- Vite alias `@assets` for clean import paths

**Receipt OCR / Import**:
- Uses Replit AI Integrations (OpenAI-compatible) for receipt parsing
- Supports multiple file formats:
  - Images (PNG, JPG): Sent to OpenAI Vision API for OCR
  - PDF files: Text extracted using pdf-parse library, then sent to OpenAI
  - CSV files: Parsed using OpenAI text model
- Auto-detects items as "ingredient" or "material" type
- Extracts supplier info, item names, quantities, prices, and categories
- Normalizes numeric values for database storage
- **Duplicate Detection**: Case-insensitive matching against existing items
  - Shows warning alert with count of duplicates
  - Auto-deselects duplicate items
  - Duplicates are disabled and cannot be re-selected
  - "Exists" badge shown on duplicate items
  - Duplicates are always excluded from import
- Located in: `server/receipt-parser.ts`, `client/src/components/ReceiptUpload.tsx`

**Recipe Form Features**:
- **Tab-based interface** with 4 sections:
  1. **Overview tab**: Recipe name, description, servings, batch yield
  2. **Ingredients tab**: Food ingredients with component grouping + packaging materials + procedures with grouping
  3. **Costing tab**: Complete cost breakdown (ingredients, materials, labor) with per-unit analysis
  4. **Pricing tab**: Interactive margin slider with live profit calculations and batch projections

- **Validation with Tab Navigation**: When required fields are missing, form navigates to the correct tab and shows a message

- **New database fields**:
  - `laborCost`: Direct labor cost per batch
  - `batchYield`: Number of sellable units from one batch
  - `procedures`: Step-by-step cooking instructions
  - `componentName` on recipe ingredients: Group ingredients by component (e.g., "Cake", "Frosting")
  - `recipeMaterials` table: Links packaging/materials to recipes with quantities

- **Cost Calculation Features**:
  - Ingredients cost (based on pricePerGram × quantity)
  - Materials/packaging cost (based on pricePerUnit × quantity)
  - Labor cost (editable per batch)
  - Total batch cost and cost per unit (based on batch yield)
  - Target margin and food cost percentage calculations
  - Suggested pricing based on margin OR food cost targets

- **Interactive Pricing Slider**:
  - Adjustable margin (0-90%)
  - Live-updating price, profit, and food cost percentage
  - Batch projections (total revenue and profit)

- **Inline Add Dialogs**:
  - Add new ingredients directly from recipe form
  - Add new materials directly from recipe form
  - Duplicate detection with case-insensitive matching

- Located in: `client/src/pages/RecipeForm.tsx`

**Pantry Masterlist Features** (Ingredients, Materials, Suppliers):
- Sortable column headers with visual indicators (ascending/descending)
- Default alphabetical sorting (A-Z) by name
- Duplicate detection with case-insensitive matching
- Warning messages and disabled save buttons when duplicates detected
- Inline "Add New Supplier" option within Ingredient and Material forms