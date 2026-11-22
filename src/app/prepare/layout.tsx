import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tax Readiness — Get Ready for Your Preparer',
  description:
    'Answer a few questions, see what you have and what is missing, and send your preparer a clean summary. Free, and nothing is stored.',
};

export default function PrepareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
