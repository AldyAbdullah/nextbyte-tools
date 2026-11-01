import { redirect } from 'next/navigation';

interface LegacySlugProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function LegacyClipboardSlugPage({ params }: LegacySlugProps) {
  const { slug } = await params;
  redirect(`/clip/${slug}`);
}
