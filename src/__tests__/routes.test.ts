import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? (f === '__tests__' ? [] : files(p)) : /\.tsx?$/.test(f) ? [p] : [];
  });

describe('liens vers les lectures (audit N03)', () => {
  it('aucun écran ne renvoie vers l’ancien onglet caché /lectures', () => {
    const bad = files('src').filter((p) => /['"`]\/lectures['"`]/.test(readFileSync(p, 'utf8')));
    expect(bad).toEqual([]);
  });

  it('le menu mène à Mes lectures', () => {
    expect(readFileSync('src/app/menu.tsx', 'utf8')).toContain("router.push('/mes-lectures')");
  });
});
