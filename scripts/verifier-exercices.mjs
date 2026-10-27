// Vérifie que chaque exercice de formule publié est corrigeable par le moteur.
// À lancer après toute écriture de leçon : node scripts/verifier-exercices.mjs
import { grade } from '../lib/excel/grade.js';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://hixfkahqkdjlsibesdhs.supabase.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'sb_publishable_3-t2Pw8lnEWH-R4_Hl7Imw_k3-PXwVy';

const sb = createClient(url, key);
const { data, error } = await sb
  .from('lesson_steps')
  .select('title, exercise, lessons(slug)')
  .not('exercise', 'is', null);

if (error) { console.error(error); process.exit(1); }

let ok = 0, ko = 0, sansFormule = 0;
for (const r of data) {
  const ex = r.exercise;
  if (!ex?.expectedFormula) { sansFormule++; continue; }   // raccourcis clavier, ruban
  const res = grade(ex.expectedFormula, ex);
  if (res.correct) ok++;
  else {
    ko++;
    console.log(`✗ ${r.lessons?.slug} | ${r.title}`);
    console.log(`   ${ex.expectedFormula} → ${res.code} : ${(res.message || '').slice(0, 120)}`);
  }
}
console.log(`\n${ok} exercices de formule valides, ${ko} en échec` +
            ` (${sansFormule} exercices de raccourci ou de ruban, non concernés)`);
process.exit(ko ? 1 : 0);
