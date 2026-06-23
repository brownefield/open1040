import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Open1040 — Free Simple Federal Tax Prep',
  description:
    'Free, open-source federal tax preparation for simple returns. Single filers, W-2 income, standard deduction. Plain-English explanations of every calculation.',
};

export default function Open1040Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
