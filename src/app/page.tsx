import Link from 'next/link';
import { getSeasonMode, SEASON_COPY } from '@/lib/season';

// Re-render daily so the seasonal mode follows the calendar.
export const revalidate = 86400;

const GITHUB_URL = 'https://github.com/brownefield/open1040';
const OT_URL = 'https://overtime.taxclarity.io';
const CONTACT = 'mailto:hello@taxclarity.io';

type Tool = {
  name: string;
  question: string;
  body: string;
  href: string;
  external?: boolean;
  status: 'Live' | 'Coming January' | 'Early access';
  bar: string;
  tags: string[];
};

const TOOLS: Tool[] = [
  {
    name: 'Tax Readiness',
    question: 'Are you ready to file?',
    body: 'Answer a few questions, see what you have and what’s missing, and leave with a structured summary instead of a shoebox.',
    href: '/prepare',
    status: 'Live',
    bar: 'bg-tc-honey',
    tags: ['Document checklist', 'Missing-item gaps', 'CPA-ready summary'],
  },
  {
    name: 'What changed for 2026',
    question: 'Does any of it affect you?',
    body: 'Short, interactive explainers on this year’s changes — overtime, tips, senior and car-loan provisions — in plain English.',
    href: '#tools',
    status: 'Coming January',
    bar: 'bg-tc-slate',
    tags: ['Plain-English', 'Interactive'],
  },
  {
    name: 'Overtime Clarity',
    question: 'What does overtime really net you?',
    body: 'Enter your rate and hours and see what you actually take home after taxes.',
    href: OT_URL,
    external: true,
    status: 'Live',
    bar: 'bg-tc-sage',
    tags: ['Overtime pay', 'Instant results'],
  },
  {
    name: 'Open1040',
    question: 'Is your return truly simple?',
    body: 'A free, open-source worksheet for simple federal returns — W-2 income and the standard deduction. It tells you plainly when your situation is out of scope.',
    href: '/open1040',
    status: 'Live',
    bar: 'bg-tc-sage',
    tags: ['Single filers', 'W-2 income', 'No account'],
  },
];

const PRINCIPLES = [
  ['Free core tools', 'Readiness, calculators and Open1040 stay free.'],
  ['No surprise paywalls', 'We charge only for optional services that organize, review, or move your situation forward.'],
  ['Browser-first', 'Free tools are built to work in your browser, and we don’t save what you enter.'],
  ['Open source', 'MIT-licensed. Read every line on GitHub.'],
];

const JOURNEY = ['Understand', 'Gather', 'Check', 'Prepare', 'Hand off', 'Track'];

function HexBadge() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
      <polygon
        points="18,2 32,10 32,26 18,34 4,26 4,10"
        fill="#B07F35"
        stroke="#2A241D"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <text
        x="18"
        y="22.5"
        textAnchor="middle"
        fontFamily="Source Serif 4, Georgia, serif"
        fontWeight="700"
        fontSize="12"
        fill="#FBF8F1"
      >
        TC
      </text>
    </svg>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  const live = tool.status === 'Live';
  const inner = (
    <>
      <span className={`tc-bar ${tool.bar}`} aria-hidden="true" />
      <div className="flex items-start justify-between gap-3">
        <p className="tc-label">{tool.question}</p>
        <span className={`tc-status ${live ? 'bg-tc-honeysoft text-tc-ink' : 'text-tc-muted'}`}>
          {tool.status}
        </span>
      </div>
      <h3 className="mt-3 font-display text-2xl font-semibold text-tc-ink">{tool.name}</h3>
      <p className="mt-2 text-[15px] leading-relaxed text-tc-muted">{tool.body}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {tool.tags.map((t) => (
          <span key={t} className="rounded-full border border-tc-line px-3 py-1 text-xs text-tc-muted">
            {t}
          </span>
        ))}
      </div>
    </>
  );
  const cls = `tc-card block p-6 pl-8 sm:p-7 sm:pl-9 ${live ? 'transition-transform hover:-translate-y-0.5' : 'opacity-80'}`;

  if (!live) return <div className={cls}>{inner}</div>;
  if (tool.external) {
    return (
      <a href={tool.href} className={cls}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={tool.href} className={cls}>
      {inner}
    </Link>
  );
}

export default function Home() {
  const season = SEASON_COPY[getSeasonMode()];

  return (
    <div className="min-h-screen bg-tc-cream font-body text-tc-ink">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b-2 border-tc-ink bg-tc-cream/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-2.5" aria-label="TaxClarity home">
            <HexBadge />
            <span className="font-display text-lg font-semibold">TaxClarity</span>
          </Link>
          <nav className="flex items-center gap-5">
            <a href="#preparers" className="hidden text-sm font-medium text-tc-muted hover:text-tc-ink sm:inline">
              For preparers
            </a>
            <Link href="/prepare" className="tc-pill-primary px-4 py-2 text-sm">
              Check readiness
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="mx-auto max-w-5xl px-5 pb-16 pt-14 sm:pt-20">
          <p className="tc-label">Free tools · Optional paid organization · Browser-first</p>
          <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
            Know before
            <br />
            you file.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-tc-muted">
            Check what you have, what you’re missing, and what to do next — then file with software or a
            professional when you’re ready.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/prepare" className="tc-pill-primary">
              Check My Tax Readiness
            </Link>
            <Link href="/open1040" className="tc-pill-secondary">
              Prepare a Simple Return
            </Link>
            <a href="#tools" className="px-2 text-sm font-medium text-tc-muted underline-offset-4 hover:underline">
              See free tools
            </a>
          </div>
          <p className="mt-5 max-w-xl text-sm text-tc-muted">
            We charge only for optional services that organize, review, or help move your tax situation forward.
          </p>

          {/* Seasonal note */}
          <div className="tc-card mt-12 p-5 pl-7 sm:p-6 sm:pl-8">
            <span className="tc-bar bg-tc-clay" aria-hidden="true" />
            <p className="tc-label">Right now · {season.label}</p>
            <p className="mt-2 font-display text-xl font-semibold">{season.headline}</p>
            <p className="mt-1 text-[15px] text-tc-muted">{season.body}</p>
          </div>
        </section>

        {/* JOURNEY */}
        <section className="border-y-2 border-tc-ink bg-tc-paper">
          <div className="mx-auto max-w-5xl px-5 py-6">
            <ol className="flex flex-wrap items-center gap-x-3 gap-y-2" aria-label="How TaxClarity works">
              {JOURNEY.map((step, i) => (
                <li key={step} className="flex items-center gap-3">
                  <span className="tc-label text-tc-ink">{step}</span>
                  {i < JOURNEY.length - 1 && <span className="text-tc-line" aria-hidden="true">—</span>}
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* TOOLS */}
        <section id="tools" className="mx-auto max-w-5xl scroll-mt-20 px-5 py-20">
          <p className="tc-label">Free tools</p>
          <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight">Start with a question.</h2>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-tc-muted">
            Each tool answers one thing well. All free, all in your browser.
          </p>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
            {TOOLS.map((tool) => (
              <ToolCard key={tool.name} tool={tool} />
            ))}
          </div>
        </section>

        {/* WHY */}
        <section className="bg-tc-paper">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-5 py-20 md:grid-cols-2 md:gap-16">
            <div>
              <p className="tc-label">Why we exist</p>
              <p className="mt-4 font-display text-3xl font-semibold leading-snug">
                Most tax stress isn’t the math. It’s not knowing what comes next.
              </p>
            </div>
            <div className="space-y-4 text-[15px] leading-relaxed text-tc-muted">
              <p>
                What do I need? What am I missing? Is my situation simple, or not? TaxClarity answers those
                questions first — so whoever files your return, software or a professional, starts with a clear
                picture.
              </p>
              <p className="tc-label pt-2">A Brownefield Holdings public service project</p>
            </div>
          </div>
        </section>

        {/* PRINCIPLES */}
        <section className="mx-auto max-w-5xl px-5 py-20">
          <p className="tc-label">Our promise</p>
          <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
            {PRINCIPLES.map(([title, body]) => (
              <div key={title} className="border-l-2 border-tc-honey pl-5">
                <p className="font-display text-lg font-semibold">{title}</p>
                <p className="mt-1 text-[15px] leading-relaxed text-tc-muted">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* PREPARERS */}
        <section id="preparers" className="mx-auto max-w-5xl scroll-mt-20 px-5 pb-20">
          <div className="tc-card flex flex-col gap-6 p-7 pl-9 sm:p-10 sm:pl-12 md:flex-row md:items-center md:justify-between">
            <span className="tc-bar bg-tc-honey" aria-hidden="true" />
            <div className="max-w-lg">
              <p className="tc-label">For CPAs &amp; enrolled agents</p>
              <h2 className="mt-3 font-display text-3xl font-semibold">Clients who arrive organized.</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-tc-muted">
                Send clients here before the appointment — they arrive organized, not with a shoebox. You spend
                your time on judgment, not chasing documents. Pilot spots are open for the 2027 season.
              </p>
            </div>
            <a href={CONTACT} className="tc-pill-primary shrink-0">
              Request early access
            </a>
          </div>
        </section>

        {/* COMPLIANCE */}
        <section className="mx-auto max-w-5xl px-5 pb-16">
          <div className="rounded-2xl border border-tc-line px-5 py-4 text-sm leading-relaxed text-tc-muted">
            <strong className="text-tc-ink">TaxClarity prepares the taxpayer.</strong> Qualified software or
            professionals prepare and file the return. TaxClarity is an organization and readiness tool — it does
            not file returns or provide legal, accounting, or tax advice.
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t-2 border-tc-ink">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-5 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-tc-muted">
            <span className="font-display font-semibold text-tc-ink">TaxClarity</span> · A Brownefield Holdings
            project · MIT License
          </p>
          <nav className="flex flex-wrap gap-5 text-sm text-tc-muted">
            <Link href="/prepare" className="hover:text-tc-ink">Tax Readiness</Link>
            <Link href="/open1040" className="hover:text-tc-ink">Open1040</Link>
            <a href={OT_URL} className="hover:text-tc-ink">Overtime</a>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:text-tc-ink">GitHub</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
