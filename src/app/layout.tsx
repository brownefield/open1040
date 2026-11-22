import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'TaxClarity — Know Before You File',
    template: '%s | TaxClarity',
  },
  description:
    'Check what you have, what you’re missing, and what to do next — then file with software or a professional when you’re ready. Free readiness tools from Brownefield Holdings.',
  robots: 'index, follow',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {/* Skip to main content — keyboard accessibility */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div id="main-content">
          {children}
        </div>
      </body>
    </html>
  );
}
