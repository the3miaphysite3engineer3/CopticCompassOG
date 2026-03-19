import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import DictionaryEntryCard from '@/components/DictionaryEntry';
import StructuredData from '@/components/StructuredData';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getDictionary } from '@/lib/dictionary';
import { buildPageTitle, siteConfig } from '@/lib/site';
import {
  buildEntryDescription,
  createDefinedTermStructuredData,
  toPlainText,
} from '@/lib/structuredData';

// Generate static params so the pages are pre-rendered at build time
export async function generateStaticParams() {
  const dictionary = getDictionary();
  return dictionary.map(entry => ({
    id: entry.id,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const dictionary = getDictionary();
  const entry = dictionary.find((item) => item.id === resolvedParams.id);

  if (!entry) {
    return {
      title: "Entry Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const headword = toPlainText(entry.headword);
  const description = buildEntryDescription(entry);

  return {
    title: headword,
    description,
    alternates: {
      canonical: `/entry/${entry.id}`,
    },
    openGraph: {
      title: buildPageTitle(headword),
      description,
      url: `${siteConfig.liveUrl}/entry/${entry.id}`,
    },
    twitter: {
      title: buildPageTitle(headword),
      description,
    },
  };
}

export default async function EntryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const dictionary = getDictionary();
  const entry = dictionary.find(e => e.id === resolvedParams.id);

  if (!entry) {
    notFound();
  }

  return (
    <main className="min-h-screen relative overflow-hidden pb-20 pt-16 px-6">
      <StructuredData data={createDefinedTermStructuredData(entry)} />
      
      <div className="absolute top-0 left-0 w-full h-[520px] bg-sky-500/10 dark:bg-sky-900/10 rounded-b-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute top-28 right-[-10%] w-[440px] h-[440px] bg-emerald-500/10 dark:bg-emerald-900/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <Link href="/dictionary" className="btn-secondary gap-2 px-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Dictionary Search
          </Link>

          <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-400">
            Dictionary Entry
          </span>
        </div>
        
        <DictionaryEntryCard entry={entry} headingLevel="h1" linkHeadword={false} />
      </div>
    </main>
  );
}
