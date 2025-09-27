import { Header, Footer } from '@/components/navigation';

interface MainLayoutProps {
  children: React.ReactNode;
  isAuthenticated?: boolean;
  cartCount?: number;
  currentLanguage?: 'EN' | 'EST' | 'LVA' | 'LTU';
}

export default function MainLayout({
  children,
  isAuthenticated = false,
  cartCount = 0,
  currentLanguage = 'EN',
}: MainLayoutProps) {
  return (
    <div className='min-h-screen flex flex-col'>
      <Header
        isAuthenticated={isAuthenticated}
        cartCount={cartCount}
        currentLanguage={currentLanguage}
      />
      <main className='flex-1'>{children}</main>
      <Footer />
    </div>
  );
}
