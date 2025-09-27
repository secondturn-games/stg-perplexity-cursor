# Second Turn Games - Baltic Board Game Marketplace

A Next.js 15 marketplace application for buying and selling board games in the Baltic region.

## 🚀 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Database**: Supabase
- **Forms**: React Hook Form + Yup validation
- **Testing**: Jest + React Testing Library
- **Linting**: ESLint + Prettier

## 🎨 Brand Colors

- **Primary**: #29432B (Forest Green)
- **Accent**: #D95323 (Warm Orange)
- **Warning**: #F2C94C (Golden Yellow)
- **Background**: #E6EAD7 (Light Sage)

## 🎭 Typography

- **Body**: Roboto (Google Fonts)
- **Headings**: Righteous (Google Fonts)

## 📁 Project Structure

```
second-turn-games/
├── app/                    # Next.js App Router pages
├── components/             # Reusable UI components
├── lib/                    # Utility functions and configurations
├── types/                  # TypeScript type definitions
├── tests/                  # Test files
├── public/                 # Static assets
└── ...config files
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- npm 8+
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd second-turn-games
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp env.example .env.local
   ```

   Edit `.env.local` with your configuration:
   - Supabase URL and keys
   - API keys for external services
   - Other required environment variables

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📋 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm run type-check` - Run TypeScript type checking
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage

## 🔧 Configuration

### Environment Variables

Required environment variables are validated at startup. See `env.example` for all available options.

### TypeScript

Strict TypeScript configuration with:

- Strict null checks
- No implicit any
- Exact optional property types
- Path mapping for clean imports

### ESLint & Prettier

Configured with strict rules for:

- TypeScript best practices
- React hooks
- Accessibility
- Code formatting

## 🧪 Testing

The project includes:

- Jest configuration for unit tests
- React Testing Library for component tests
- Coverage reporting
- Test utilities and mocks

## 🌍 Internationalization

Ready for Baltic market with support for:

- Estonian (et)
- Latvian (lv)
- Lithuanian (lt)
- English (en) fallback

## 🔒 Security

- Environment variable validation
- TypeScript strict mode
- ESLint security rules
- Secure defaults for Next.js

## 📦 Dependencies

### Core

- Next.js 15
- React 18
- TypeScript 5

### UI & Styling

- Tailwind CSS
- Lucide React (icons)
- Tailwind Forms & Typography plugins

### Forms & Validation

- React Hook Form
- Yup validation
- Zod for runtime validation

### Database & Auth

- Supabase client

### Utilities

- clsx & tailwind-merge for conditional classes
- date-fns for date manipulation

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests and linting
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
