import { Metadata } from 'next';
import { ClipboardViewerClient } from '@/components/clipboard/ClipboardViewerClient';

interface ClipSlugProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: ClipSlugProps): Promise<Metadata> {
  const { slug } = await params;
  const cleanSlug = slug?.trim() || '';

  return {
    title: `${cleanSlug} - Nextbyte Clip`,
    description: `Buka dan salin teks atau gambar dari clip ${cleanSlug} di Nextbyte Clip.`,
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `https://www.nextbyte.biz.id/clip/${cleanSlug}`,
    },
    openGraph: {
      title: `${cleanSlug} - Nextbyte Clip`,
      description: 'Buka dan salin teks atau unduh gambar dari clip privat ini.',
      url: `https://www.nextbyte.biz.id/clip/${cleanSlug}`,
      siteName: 'NextByte Tools',
      locale: 'id_ID',
      type: 'website',
    },
  };
}

export default async function ClipSlugPage({ params }: ClipSlugProps) {
  const { slug } = await params;

  return <ClipboardViewerClient slug={slug} />;
}
