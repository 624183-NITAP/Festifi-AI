import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FestiFi AI — GenAI-Powered Celebration & Event Planner',
  description:
    'Plan weddings, milestone birthdays, community festivals, and galas with AI-powered personalized concepts, integer-exact budget optimization, deterministic timeline derivation, and contingency what-if simulation.',
  keywords: [
    'event planner',
    'wedding planner',
    'budget optimizer',
    'timeline derivation',
    'what-if event simulation',
    'contingency reserve',
    'vendor inquiries',
  ],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0a0e17',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
