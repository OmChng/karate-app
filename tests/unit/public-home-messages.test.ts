import { describe, expect, it } from 'vitest';
import esMessages from '../../messages/es.json';
import enMessages from '../../messages/en.json';
import { PUBLIC_ACADEMIES } from '../../src/app/[locale]/(public)/components/academy-data';

const REQUIRED_PUBLIC_HOME_KEYS = [
  'metadata.title',
  'metadata.description',
  'brand.name',
  'brand.tagline',
  'brand.homeLabel',
  'nav.primaryLabel',
  'nav.about',
  'nav.academies',
  'nav.programs',
  'nav.news',
  'nav.contact',
  'actions.academies',
  'actions.login',
  'language.label',
  'language.es',
  'language.en',
  'hero.eyebrow',
  'hero.title',
  'hero.subtitle',
  'hero.visualAlt',
  'hero.visualKicker',
  'hero.visualTitle',
  'hero.visualText',
  'story.eyebrow',
  'story.title',
  'story.body',
  'story.beats.discipline.title',
  'story.beats.discipline.body',
  'story.beats.community.title',
  'story.beats.community.body',
  'story.beats.excellence.title',
  'story.beats.excellence.body',
  'about.title',
  'academies.title',
  'programs.title',
  'instructors.title',
  'news.title',
  'contact.title',
  'footer.navLabel',
  'footer.copyright',
] as const;

function readKey(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((value, segment) => {
    if (value && typeof value === 'object' && segment in value) {
      return (value as Record<string, unknown>)[segment];
    }
    return undefined;
  }, source);
}

describe('public homepage messages', () => {
  it('has required Spanish copy for the public homepage', () => {
    for (const key of REQUIRED_PUBLIC_HOME_KEYS) {
      expect(readKey(esMessages.publicHome, key), key).toEqual(expect.any(String));
    }
  });

  it('mirrors required public homepage keys for maintainer QA', () => {
    for (const key of REQUIRED_PUBLIC_HOME_KEYS) {
      expect(readKey(enMessages.publicHome, key), key).toEqual(expect.any(String));
    }
  });

  it('has translated public academy data for every mapped branch', () => {
    for (const academy of PUBLIC_ACADEMIES) {
      expect(readKey(esMessages.publicHome.academies.items, `${academy.key}.name`)).toEqual(
        expect.any(String),
      );
      expect(readKey(esMessages.publicHome.academies.items, `${academy.key}.address`)).toEqual(
        expect.any(String),
      );
      expect(readKey(enMessages.publicHome.academies.items, `${academy.key}.name`)).toEqual(
        expect.any(String),
      );
      expect(readKey(enMessages.publicHome.academies.items, `${academy.key}.address`)).toEqual(
        expect.any(String),
      );
    }
  });
});
