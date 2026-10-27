import { createClient } from '@/lib/supabase/server';

export const revalidate = 3600;

export default async function sitemap() {
  const base = 'https://modelefinancier.com';
  const statiques = ['', '/cours', '/modeles', '/parcours', '/entrainement',
    '/certification', '/verification', '/mentions-legales', '/inscription', '/connexion'];

  const supabase = createClient();
  const { data: lessons } = await supabase
    .from('lessons')
    .select('slug, updated_at')
    .eq('published', true);

  return [
    ...statiques.map((p) => ({
      url: `${base}${p}`,
      changeFrequency: p === '' ? 'weekly' : 'monthly',
      priority: p === '' ? 1 : 0.7,
    })),
    ...(lessons ?? []).map((l) => ({
      url: `${base}/modeles/${l.slug}`,
      lastModified: l.updated_at ? new Date(l.updated_at) : undefined,
      changeFrequency: 'monthly',
      priority: 0.6,
    })),
  ];
}
