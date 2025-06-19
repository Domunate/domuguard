# DomuGuard Frontend

The frontend application for DomuGuard, a document management and comparison system.

## Features

- Document upload with drag and drop support
- Document comparison with visual diff
- Project management
- Dark/light theme support
- Responsive design
- Modern UI components

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Radix UI
- Lucide Icons

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## Project Structure

```
frontend/
├── src/
│   ├── app/              # Next.js app directory
│   ├── components/       # React components
│   │   ├── ui/          # UI components
│   │   └── ...          # Feature components
│   ├── lib/             # Utility functions
│   └── styles/          # Global styles
├── public/              # Static assets
└── ...                  # Configuration files
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Style

- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error handling
- Write meaningful comments
- Follow the component structure

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

Proprietary - All rights reserved
