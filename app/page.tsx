export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-heading font-bold text-primary-500 mb-4">
          Second Turn Games
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Baltic Board Game Marketplace
        </p>
        <div className="space-y-4">
          <p className="text-gray-500">
            Welcome to your new Next.js 15 project with TypeScript and Tailwind CSS!
          </p>
          <div className="flex justify-center space-x-4">
            <button className="btn-primary">
              Get Started
            </button>
            <button className="btn-secondary">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
