import { Metadata } from 'next';
import { ClipboardViewerClient } from '@/components/clipboard/ClipboardViewerClient';

interface ClipboardSlugProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ClipboardSlugProps): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = slug?.trim() || '';

  return {
    title: `${cleanSlug} - Nextbyte Clipboard`,
    description: `Buka dan salin teks atau gambar dari clipboard ${cleanSlug} di Nextbyte Clipboard.`,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `https://www.nextbyte.biz.id/clipboard/${cleanSlug}`,
    },
    openGraph: {
      title: `${cleanSlug} - Nextbyte Clipboard`,
      description: 'Buka dan salin teks atau unduh gambar dari clipboard privat ini.',
      url: `https://www.nextbyte.biz.id/clipboard/${cleanSlug}`,
      siteName: 'NextByte Tools',
      locale: 'id_ID',
      type: 'website',
    },
  };
}

export default async function ClipboardSlugPage({ params }: ClipboardSlugProps) {
  const { slug } = await params;

  return <ClipboardViewerClient slug={slug} />;
}
