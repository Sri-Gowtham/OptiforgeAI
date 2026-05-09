'use client';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { ThemeProvider } from 'next-themes';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const ChatBot = dynamic(() => import('@/components/ChatBot'), { ssr: false });
const inter = Inter({ subsets: ['latin'] });

function InnerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChat = pathname === '/login' || pathname === '/register';
  return (
    <>
      {children}
      {!hideChat && <ChatBot />}
    </>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="optiforge-theme">
          <AuthProvider>
            <InnerLayout>{children}</InnerLayout>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
