import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tax Diagnostic — Pre-File Organizer',
  description:
    'Answer a few questions, organize your documents, and walk into your CPA appointment with a structured summary. A free TaxClarity tool.',
};

export default function PrepareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
