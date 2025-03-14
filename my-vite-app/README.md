# Vite + React Developer Template

A modern, feature-rich template for React applications using Vite.

## Features

- ⚡️ **Vite** - Lightning fast build tool
- ⚛️ **React** - UI library
- 📝 **TypeScript** - Type safety
- 🎨 **CSS** - Modular CSS support
- 🧪 **ESLint** - Code linting
- 📁 **Absolute Imports** - Clean import paths
- 🎯 **Pre-configured Components** - Ready-to-use components
- 🪝 **Custom Hooks** - Reusable logic
- 🛠️ **Utility Functions** - Common helpers

## Project Structure

```
src/
├── assets/        # Static assets
├── components/    # Reusable UI components
├── hooks/         # Custom React hooks
├── pages/         # Application pages/routes
├── styles/        # Global styles
└── utils/         # Utility functions
```

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
```

2. Install dependencies:
```bash
npm install
# or
yarn
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code

## Component Examples

### Button Component

```tsx
import { Button } from '@components/Button';

function MyComponent() {
  return (
    <Button 
      variant="primary" 
      size="medium" 
      onClick={() => console.log('clicked')}
    >
      Click Me
    </Button>
  );
}
```

### Custom Hooks

```tsx
import { useLocalStorage } from '@hooks/useLocalStorage';

function MyComponent() {
  const [value, setValue] = useLocalStorage('key', 'initial value');
  // Use like useState, but persists in localStorage
}
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
