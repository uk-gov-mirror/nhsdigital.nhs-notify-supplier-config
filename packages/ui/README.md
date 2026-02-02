# NHS Notify Supplier Configuration UI

This is a [Next.js](https://nextjs.org) application for managing NHS Notify supplier configurations.

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Features

- **Pack Specifications Management**: Create and manage pack specifications including postage, paper types, and assembly options
- **Envelope & Insert Configuration**: Configure envelope sizes, features, and insert specifications
- **Type-safe**: Built with TypeScript for enhanced type safety
- **Modern UI**: Uses Next.js 16 with App Router and Tailwind CSS v4

## Development

### Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the application for production
- `npm start` - Start the production server
- `npm run lint` - Run ESLint to check for code issues
- `npm run lint:fix` - Fix ESLint issues automatically
- `npm run typecheck` - Run TypeScript type checking

### Project Structure

```
packages/ui/
├── app/                # Next.js App Router pages and layouts
│   ├── layout.tsx     # Root layout
│   ├── page.tsx       # Home page
│   └── globals.css    # Global styles
├── public/            # Static assets
├── next.config.ts     # Next.js configuration
├── tsconfig.json      # TypeScript configuration
└── package.json       # Package dependencies and scripts
```

## Integration with Events Package

This UI package can be integrated with the `@nhsdigital/nhs-notify-event-schemas-supplier-config` package to work with pack specifications and other configuration schemas.

To add the events package as a dependency:

```bash
npm install @nhsdigital/nhs-notify-event-schemas-supplier-config
```

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)

## Deployment

The application can be deployed to Vercel, AWS, or any platform that supports Next.js applications.

For Vercel deployment:

```bash
npm run build
```

Then follow the Vercel deployment instructions.
