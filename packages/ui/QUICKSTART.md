# NHS Notify Supplier Configuration UI - Quick Start

## Installation

The UI package has been scaffolded and is ready for development. All dependencies are installed.

## Development

### Start the development server

From the root of the workspace:

```bash
npm run dev:ui
```

Or from within the packages/ui directory:

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build the production application |
| `npm start` | Start production server (requires build first) |
| `npm run lint` | Run ESLint to check code quality |
| `npm run lint:fix` | Automatically fix ESLint issues |
| `npm run typecheck` | Run TypeScript type checking |

## Project Structure

```
packages/ui/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout with metadata
│   ├── page.tsx                 # Home page
│   ├── globals.css              # Global styles
│   └── pack-specifications/     # Example feature page
│       └── page.tsx
├── components/                   # Reusable React components
│   ├── Header.tsx               # NHS-styled header
│   └── Footer.tsx               # Footer component
├── types/                        # TypeScript type definitions
│   └── index.ts
├── public/                       # Static assets
├── .env.example                  # Environment variable template
├── eslint.config.mjs            # ESLint configuration
├── next.config.ts               # Next.js configuration
├── tsconfig.json                # TypeScript configuration
├── tailwind.config.ts           # Tailwind CSS configuration
├── postcss.config.mjs           # PostCSS configuration
└── package.json                 # Package dependencies

```

## Features Implemented

### 1. NHS-Themed Styling
- NHS blue (#005EB8) color scheme
- Accessible design patterns
- Responsive layouts with Tailwind CSS v4

### 2. Reusable Components
- **Header**: NHS-branded header component with title and subtitle
- **Footer**: Standard footer with copyright information

### 3. Example Pages
- **Home**: Landing page with feature cards
- **Pack Specifications**: Example page showing integration possibilities

### 4. TypeScript Support
- Full TypeScript setup
- Type definitions in `/types` directory
- Ready for integration with `@nhsdigital/nhs-notify-event-schemas-supplier-config`

### 5. Development Tools
- ESLint for code quality
- TypeScript for type safety
- Tailwind CSS for styling
- Next.js 16 with App Router and Turbopack

## Integration with Events Package

To integrate with the events schema package:

```bash
cd packages/ui
npm install @nhsdigital/nhs-notify-event-schemas-supplier-config
```

Then import types in your components:

```typescript
import {
  PackSpecification,
  Envelope,
  Paper
} from "@nhsdigital/nhs-notify-event-schemas-supplier-config/src/domain/pack-specification";
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration values.

## Next Steps

1. **Add API Integration**: Create API routes in `app/api/` for backend communication
2. **Add Forms**: Build forms for creating/editing pack specifications
3. **Add Authentication**: Implement auth with NextAuth.js or similar
4. **Add Database**: Connect to a database for persistence
5. **Add Tests**: Set up Jest and React Testing Library
6. **Add Storybook**: Create component documentation with Storybook

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [NHS Design System](https://service-manual.nhs.uk/design-system)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, you can specify a different port:

```bash
npm run dev -- -p 3001
```

### Build Errors

Run type checking to identify TypeScript issues:

```bash
npm run typecheck
```

Run linting to identify code quality issues:

```bash
npm run lint
```
