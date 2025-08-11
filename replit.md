# Overview

Cheetos Gaming is a clean and simple gaming e-commerce store built as a full-stack web application. The platform specializes in selling digital gaming products including game currencies, gift cards, and digital vouchers with fast delivery and secure payments. The application features a modern gaming-themed UI with dark mode design and a responsive layout optimized for both desktop and mobile devices.

**Note: Simplified version - All complex features (recommendations, social sharing, interactive animations, loading games) have been removed for a clean, error-free experience suitable for deployment.**

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Query (TanStack Query) for server state and React Context for local state (cart management)
- **UI Framework**: Radix UI primitives with shadcn/ui components for consistent, accessible design
- **Styling**: Tailwind CSS with custom gaming theme colors and CSS variables
- **Animations**: CSS animations with custom keyframes for starfield background and carousel effects

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **Request Logging**: Custom middleware for API request/response logging with timing
- **Error Handling**: Centralized error handling middleware
- **Development**: Vite integration for hot module replacement in development

## Data Storage
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: PostgreSQL (configured via DATABASE_URL environment variable)
- **Schema**: Shared schema definition between client and server
- **Migration**: Drizzle Kit for database migrations with automatic schema pushing
- **Storage Architecture**: Simple DatabaseStorage implementation with basic CRUD operations for games and categories only
- **Session Management**: No session management in simplified version
- **Seeding**: Automated database seeding with games and categories

## Database Schema
### Core Tables
- **Games Table**: Products with id, name, slug, description, price, currency, image, category, popularity flag, stock, and package information
- **Categories Table**: Product categories with id, name, slug, description, image, gradient colors, and icons
- **Sessions Table**: Express session storage for user tracking

### Simplified Schema
- **Only two core tables**: Games and Categories for basic e-commerce functionality
- **No user tracking, achievements, or social features** to maintain simplicity

### Validation
- **Zod Schemas**: Type-safe data validation with insert/select schema separation
- **Relations**: Drizzle ORM explicit relations between users, games, achievements, and activity tracking

## Authentication & Sessions
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **Security**: No authentication system implemented in current version (likely for future enhancement)

## Key Features
- **Shopping Cart**: Persistent cart using localStorage with add, remove, update quantity, and clear functionality
- **Product Catalog**: Games organized by categories with popular games section
- **Checkout Flow**: WhatsApp-based ordering system for direct communication with sellers
- **Payment Integration**: Multiple payment method display (PayPal, cards, mobile payments, bank transfers)
- **Responsive Design**: Mobile-first design with adaptive layouts
- **Simple Game Cards**: Clean hover effects and basic animations
- **Standard Loading States**: Simple loading indicators without interactive elements

## UI Components
- **Design System**: Custom gaming theme with gold/yellow primary colors and neon pink secondary
- **Interactive Elements**: Advanced hover effects, loading states, particle animations, and animated feedback
- **Accessibility**: Radix UI ensures keyboard navigation and screen reader support
- **Visual Effects**: Starfield background animation, carousel components, and interactive particle systems
- **Advanced Game Cards**: Varied grid layouts with different aspect ratios, smooth hover transformations, and animated borders
- **Social Integration**: Share buttons with platform-specific styling and feedback animations
- **Achievement Components**: Trophy-based UI with progress bars, completion badges, and category-based styling
- **Loading Experience**: Interactive mini-game during loading screens with score tracking
- **Recommendation Engine UI**: Personalized game suggestions with reasoning displays and confidence scores

# Production Deployment

## Vercel Deployment Setup
- **Platform**: Vercel for hosting and serverless functions
- **Database**: Neon PostgreSQL for production database
- **Static Assets**: Public folder for images and static files
- **Environment Variables**: DATABASE_URL configured in Vercel dashboard
- **Build Configuration**: Custom build process with client/server separation

## Deployment Files Created
- `vercel.json`: Vercel configuration for routing and builds
- `deploy-guide.md`: Step-by-step deployment instructions
- `README.md`: Comprehensive project documentation
- `.gitignore`: Git ignore rules for clean repository
- `.vercelignore`: Vercel deployment ignore rules

## Database Production Setup
- **Provider**: Neon (neon.tech) for serverless PostgreSQL
- **Schema Management**: Drizzle Kit for migrations and schema sync
- **Data Seeding**: Automated seeding script for initial data
- **Connection**: Pooled connections via @neondatabase/serverless

## Asset Management
- **Development**: attached_assets folder for local development
- **Production**: public/assets folder for Vercel static serving
- **Images**: Professional game card images and category graphics
- **Optimization**: All images copied to public folder for production deployment

# External Dependencies

## Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL client for database connectivity
- **drizzle-orm & drizzle-kit**: Modern TypeSQL ORM for database operations and migrations
- **@tanstack/react-query**: Server state management and caching
- **wouter**: Lightweight React router

## UI & Styling
- **@radix-ui/***: Comprehensive set of UI primitives for accessibility and interaction
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **clsx & tailwind-merge**: Conditional class name utilities

## Form & Validation
- **react-hook-form & @hookform/resolvers**: Form handling with validation
- **zod**: Runtime type validation and schema definitions
- **drizzle-zod**: Integration between Drizzle ORM and Zod validation

## Development Tools
- **vite & @vitejs/plugin-react**: Build tool and React plugin
- **@replit/vite-plugin-***: Replit-specific development enhancements
- **tsx**: TypeScript execution for development server
- **esbuild**: Fast JavaScript/TypeScript bundler for production builds

## Utilities
- **date-fns**: Date manipulation library
- **nanoid**: Unique ID generation
- **cmdk**: Command palette component
- **embla-carousel-react**: Carousel/slider component
- **react-icons**: Icon library with various icon sets

## Session & Storage
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **express-session**: Session middleware (imported by connect-pg-simple)

## Production Deployment
The application is configured for production deployment with:
- Static file serving for built React application
- Environment-based configuration
- Production-optimized builds with esbuild
- PostgreSQL database connection via DATABASE_URL environment variable