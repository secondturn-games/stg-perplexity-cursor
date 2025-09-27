import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    marketplace: [
      { href: '/marketplace', label: 'Browse Games' },
      { href: '/sell', label: 'Sell a Game' },
      { href: '/categories', label: 'Categories' },
      { href: '/search', label: 'Search' },
    ],
    support: [
      { href: '/help', label: 'Help Center' },
      { href: '/contact', label: 'Contact Us' },
      { href: '/shipping', label: 'Shipping Info' },
      { href: '/returns', label: 'Returns' },
    ],
    legal: [
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Service' },
      { href: '/gdpr', label: 'GDPR Rights' },
      { href: '/cookies', label: 'Cookie Policy' },
    ],
    company: [
      { href: '/about', label: 'About Us' },
      { href: '/blog', label: 'Blog' },
      { href: '/careers', label: 'Careers' },
      { href: '/press', label: 'Press' },
    ],
  };

  return (
    <footer className='bg-gray-900 text-white' role='contentinfo'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
          {/* Brand Section */}
          <div className='lg:col-span-1'>
            <Link
              href='/'
              className='flex items-center space-x-2 mb-4 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded-lg p-1'
              aria-label='Second Turn Games - Go to homepage'
            >
              <div className='w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center'>
                <span className='text-white font-bold text-sm'>ST</span>
              </div>
              <span className='font-heading text-xl font-bold text-white'>
                Second Turn Games
              </span>
            </Link>
            <p className='text-gray-300 text-sm leading-relaxed mb-4'>
              The premier marketplace for buying and selling board games in the
              Baltic region. Connect with local gamers and discover your next
              favorite game.
            </p>
            <div className='flex space-x-4'>
              <a
                href='#'
                className='text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded'
                aria-label='Follow us on Facebook'
              >
                <span className='sr-only'>Facebook</span>
                <svg
                  className='w-5 h-5'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path d='M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z' />
                </svg>
              </a>
              <a
                href='#'
                className='text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded'
                aria-label='Follow us on Twitter'
              >
                <span className='sr-only'>Twitter</span>
                <svg
                  className='w-5 h-5'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path d='M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z' />
                </svg>
              </a>
              <a
                href='#'
                className='text-gray-400 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded'
                aria-label='Follow us on Instagram'
              >
                <span className='sr-only'>Instagram</span>
                <svg
                  className='w-5 h-5'
                  fill='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path d='M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.781H6.721v10.562h9.558V7.207zm1.418-1.418c-.49 0-.928-.49-.928-1.037s.438-1.037.928-1.037.928.49.928 1.037-.438 1.037-.928 1.037z' />
                </svg>
              </a>
            </div>
          </div>

          {/* Marketplace Links */}
          <div>
            <h3 className='text-sm font-semibold text-white uppercase tracking-wider mb-4'>
              Marketplace
            </h3>
            <ul className='space-y-3' role='list'>
              {footerLinks.marketplace.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className='text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded'
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className='text-sm font-semibold text-white uppercase tracking-wider mb-4'>
              Support
            </h3>
            <ul className='space-y-3' role='list'>
              {footerLinks.support.map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className='text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded'
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal & Company Links */}
          <div>
            <h3 className='text-sm font-semibold text-white uppercase tracking-wider mb-4'>
              Legal & Company
            </h3>
            <ul className='space-y-3' role='list'>
              {[...footerLinks.legal, ...footerLinks.company].map(link => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className='text-gray-300 hover:text-white transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900 rounded'
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className='mt-12 pt-8 border-t border-gray-800'>
          <div className='flex flex-col md:flex-row justify-between items-center'>
            <div className='flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6'>
              <p className='text-gray-400 text-sm'>
                © {currentYear} Second Turn Games. All rights reserved.
              </p>
              <div className='flex items-center space-x-4'>
                <span className='text-gray-400 text-sm'>🇪🇪 🇱🇻 🇱🇹</span>
                <span className='text-gray-400 text-sm'>
                  Serving the Baltic region
                </span>
              </div>
            </div>
            <div className='mt-4 md:mt-0'>
              <p className='text-gray-400 text-sm'>
                Built with ❤️ for the Baltic gaming community
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
