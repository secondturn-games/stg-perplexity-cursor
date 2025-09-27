'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ShoppingCart, User, Globe } from 'lucide-react';

interface HeaderProps {
  isAuthenticated?: boolean;
  cartCount?: number;
  currentLanguage?: 'EN' | 'EST' | 'LVA' | 'LTU';
}

export default function Header({
  isAuthenticated = false,
  cartCount = 0,
  currentLanguage = 'EN',
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleLanguageMenu = () => {
    setIsLanguageMenuOpen(!isLanguageMenuOpen);
  };

  const navigationItems = [
    { href: '/', label: 'Home' },
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/messages', label: 'Messages' },
    { href: '/profile', label: 'Profile' },
  ];

  const languageOptions = [
    { code: 'EN', label: 'English' },
    { code: 'EST', label: 'Eesti' },
    { code: 'LVA', label: 'Latviešu' },
    { code: 'LTU', label: 'Lietuvių' },
  ];

  return (
    <header className='bg-white shadow-sm border-b border-gray-200'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo */}
          <div className='flex-shrink-0'>
            <Link
              href='/'
              className='flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg p-1'
              aria-label='Second Turn Games - Go to homepage'
            >
              <div className='w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>ST</span>
              </div>
              <span className='font-heading text-xl font-bold text-primary-500'>
                Second Turn Games
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav
            className='hidden md:flex items-center space-x-8'
            role='navigation'
            aria-label='Main navigation'
          >
            {navigationItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className='text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                aria-current={item.href === '/' ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className='flex items-center space-x-4'>
            {/* Language Selector */}
            <div className='relative'>
              <button
                onClick={toggleLanguageMenu}
                className='flex items-center space-x-1 text-gray-700 hover:text-primary-600 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                aria-label={`Current language: ${currentLanguage}. Click to change language`}
                aria-expanded={isLanguageMenuOpen}
                aria-haspopup='true'
              >
                <Globe className='w-4 h-4' />
                <span className='text-sm font-medium'>{currentLanguage}</span>
              </button>

              {isLanguageMenuOpen && (
                <div
                  className='absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50'
                  role='menu'
                  aria-orientation='vertical'
                >
                  {languageOptions.map(lang => (
                    <button
                      key={lang.code}
                      className='w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100'
                      role='menuitem'
                      onClick={() => {
                        setIsLanguageMenuOpen(false);
                        // TODO: Implement language switching
                      }}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Shopping Cart */}
            <Link
              href='/cart'
              className='relative p-2 text-gray-700 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md'
              aria-label={`Shopping cart with ${cartCount} items`}
            >
              <ShoppingCart className='w-5 h-5' />
              {cartCount > 0 && (
                <span className='absolute -top-1 -right-1 bg-accent-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center'>
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Link>

            {/* User Authentication */}
            {isAuthenticated ? (
              <div className='flex items-center space-x-2'>
                <Link
                  href='/profile'
                  className='flex items-center space-x-2 text-gray-700 hover:text-primary-600 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                  aria-label='Go to profile'
                >
                  <User className='w-5 h-5' />
                  <span className='hidden sm:inline text-sm font-medium'>
                    Profile
                  </span>
                </Link>
                <button
                  className='text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                  aria-label='Sign out'
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className='flex items-center space-x-2'>
                <Link
                  href='/login'
                  className='text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                >
                  Login
                </Link>
                <Link href='/register' className='btn-primary text-sm'>
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className='md:hidden p-2 rounded-md text-gray-700 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
              aria-label={
                isMobileMenuOpen
                  ? 'Close navigation menu'
                  : 'Open navigation menu'
              }
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className='w-6 h-6' />
              ) : (
                <Menu className='w-6 h-6' />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className='md:hidden border-t border-gray-200'>
            <div className='px-2 pt-2 pb-3 space-y-1'>
              {navigationItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2'
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-current={item.href === '/' ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              ))}

              {/* Mobile authentication section */}
              <div className='pt-4 pb-3 border-t border-gray-200'>
                {isAuthenticated ? (
                  <div className='flex items-center px-3'>
                    <User className='w-5 h-5 text-gray-400' />
                    <div className='ml-3'>
                      <div className='text-base font-medium text-gray-800'>
                        User Profile
                      </div>
                      <div className='text-sm text-gray-500'>
                        user@example.com
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className='space-y-2'>
                    <Link
                      href='/login'
                      className='block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50'
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      href='/register'
                      className='block px-3 py-2 rounded-md text-base font-medium text-primary-600 hover:text-primary-500 hover:bg-gray-50'
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Backdrop for mobile menu */}
      {isMobileMenuOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden'
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden='true'
        />
      )}
    </header>
  );
}
