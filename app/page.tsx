'use client';

import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';

export default function HomePage() {
  const { user, loading } = useAuth();
  return (
    <div className='bg-background-100 min-h-screen'>
      {/* Hero Section */}
      <section className='relative bg-gradient-to-br from-primary-500 to-primary-700 text-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24'>
          <div className='text-center'>
            <h1 className='text-4xl md:text-6xl font-heading font-bold mb-6'>
              Second Turn Games
            </h1>
            <p className='text-xl md:text-2xl mb-8 text-primary-100'>
              Baltic Board Game Marketplace
            </p>
            <p className='text-lg mb-12 text-primary-200 max-w-3xl mx-auto'>
              Buy and sell board games in Estonia, Latvia, and Lithuania.
              Connect with local gamers and discover your next favorite game.
            </p>
            <div className='flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4'>
              <Link href='/marketplace' className='btn-primary'>
                Browse Games
              </Link>
              {user ? (
                <Link
                  href='/sell'
                  className='btn-secondary border-white text-white hover:bg-white hover:text-primary-600'
                >
                  Sell a Game
                </Link>
              ) : (
                <Link
                  href='/auth/signup'
                  className='btn-secondary border-white text-white hover:bg-white hover:text-primary-600'
                >
                  Join Now
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className='py-16 bg-white'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center mb-12'>
            <h2 className='text-3xl font-heading font-bold text-gray-900 mb-4'>
              Why Choose Second Turn Games?
            </h2>
            <p className='text-lg text-gray-600'>
              Built specifically for the Baltic gaming community
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            <div className='text-center'>
              <div className='w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-2xl'>🌍</span>
              </div>
              <h3 className='text-xl font-heading font-semibold mb-2'>
                Local Focus
              </h3>
              <p className='text-gray-600'>
                Designed for the Baltic region with local shipping and payment
                methods.
              </p>
            </div>

            <div className='text-center'>
              <div className='w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-2xl'>🎲</span>
              </div>
              <h3 className='text-xl font-heading font-semibold mb-2'>
                Curated Selection
              </h3>
              <p className='text-gray-600'>
                High-quality board games from verified sellers in your area.
              </p>
            </div>

            <div className='text-center'>
              <div className='w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-2xl'>💬</span>
              </div>
              <h3 className='text-xl font-heading font-semibold mb-2'>
                Community
              </h3>
              <p className='text-gray-600'>
                Connect with fellow gamers and build lasting friendships.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className='py-16 bg-primary-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-8 text-center'>
            <div>
              <div className='text-3xl font-bold text-primary-600 mb-2'>0</div>
              <div className='text-gray-600'>Games Listed</div>
            </div>
            <div>
              <div className='text-3xl font-bold text-primary-600 mb-2'>0</div>
              <div className='text-gray-600'>Active Sellers</div>
            </div>
            <div>
              <div className='text-3xl font-bold text-primary-600 mb-2'>0</div>
              <div className='text-gray-600'>Happy Buyers</div>
            </div>
            <div>
              <div className='text-3xl font-bold text-primary-600 mb-2'>3</div>
              <div className='text-gray-600'>Countries</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// Disable static generation for this page
export const dynamic = 'force-dynamic';
