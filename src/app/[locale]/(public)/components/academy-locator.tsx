'use client';

import {
  AlertCircle,
  ExternalLink,
  LocateFixed,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Search,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { Reveal, StaggerContainer, StaggerItem } from '@/components/motion/reveal';
import { PUBLIC_ACADEMIES, type PublicAcademy } from './academy-data';

interface Coordinates {
  lat: number;
  lng: number;
}

interface LocatedAcademy {
  academy: PublicAcademy;
  distanceKm?: number;
}

type LocatorStatus = 'idle' | 'loading' | 'success' | 'error';

const MAIN_ACADEMY_KEY = 'lasAguilas';
const MEXICO_ZIP_PATTERN = /^\d{5}$/;
const ACADEMY_NAME_COLLATOR = new Intl.Collator('es-MX', { sensitivity: 'base' });

export function AcademyLocator() {
  const t = useTranslations('publicHome.academies');
  const [query, setQuery] = useState('');
  const [origin, setOrigin] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<LocatorStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const locatedAcademies = useMemo<LocatedAcademy[]>(() => {
    const rows = PUBLIC_ACADEMIES.map((academy) => ({
      academy,
      distanceKm: origin ? distanceInKm(origin, academy) : undefined,
    }));

    if (!origin) {
      return rows.sort((a, b) => {
        if (a.academy.key === MAIN_ACADEMY_KEY) return -1;
        if (b.academy.key === MAIN_ACADEMY_KEY) return 1;
        return ACADEMY_NAME_COLLATOR.compare(
          t(`items.${a.academy.key}.name`),
          t(`items.${b.academy.key}.name`),
        );
      });
    }
    return rows.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }, [origin, t]);

  const nearest = origin ? locatedAcademies[0] : null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setStatus('error');
      setError(t('locator.emptyError'));
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const nextOrigin = await geocodeInput(trimmed);
      setOrigin(nextOrigin);
      setStatus('success');
    } catch {
      setOrigin(null);
      setStatus('error');
      setError(t('locator.notFoundError'));
    }
  }

  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setStatus('error');
      setError(t('locator.geolocationUnavailable'));
      return;
    }

    setStatus('loading');
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setOrigin({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setStatus('success');
      },
      () => {
        setStatus('error');
        setError(t('locator.geolocationError'));
      },
      { enableHighAccuracy: true, timeout: 12_000, maximumAge: 60_000 },
    );
  }

  return (
    <div className="mt-10">
      <Reveal className="public-light-panel border border-[#e5e7eb] bg-white p-4 shadow-[var(--shadow-card)] dark:border-white/[0.12] dark:bg-[#171b24] md:p-5">
        <form onSubmit={handleSubmit} className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
          <div className="min-w-0">
            <label
              htmlFor="academy-location-search"
              className="public-light-heading mb-2 block text-sm font-semibold text-[#10131a] dark:text-white"
            >
              {t('locator.label')}
            </label>
            <div className="relative">
              <Search
                className="public-light-subtle pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6b7280] dark:text-white/55"
                aria-hidden
              />
              <input
                id="academy-location-search"
                name="academy-location-search"
                type="search"
                inputMode="search"
                autoComplete="street-address"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t('locator.placeholder')}
                className="public-light-input min-h-12 w-full rounded-md border border-[#d1d5db] bg-white py-2 pl-10 pr-3 text-base text-[#10131a] shadow-sm placeholder:text-[#6b7280] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/[0.14] dark:bg-[#10131a] dark:text-white dark:placeholder:text-white/45"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="inline-flex min-h-12 items-center justify-center gap-2 self-end rounded-md bg-primary px-5 text-base font-semibold text-primary-foreground transition-colors duration-fast ease-standard hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Navigation className="h-4 w-4" aria-hidden />
            {status === 'loading' ? t('locator.searching') : t('locator.submit')}
          </button>
          <button
            type="button"
            disabled={status === 'loading'}
            onClick={handleUseCurrentLocation}
            className="public-light-button inline-flex min-h-12 items-center justify-center gap-2 self-end rounded-md border border-[#d1d5db] px-5 text-base font-semibold text-[#10131a] transition-colors duration-fast ease-standard hover:bg-[#f3f4f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/[0.16] dark:text-white dark:hover:bg-white/10"
          >
            <LocateFixed className="h-4 w-4" aria-hidden />
            {t('locator.useCurrentLocation')}
          </button>
        </form>

        {nearest && (
          <div className="public-light-accent-panel mt-5 border-l-4 border-primary bg-[#fff1ee] p-4 text-[#a92d24] dark:bg-[#2a1716] dark:text-[#fecaca]">
            <p className="font-semibold">
              {t('locator.resultTitle', {
                academy: t(`items.${nearest.academy.key}.name`),
              })}
            </p>
          </div>
        )}

        {status === 'error' && error && (
          <div
            role="alert"
            className="public-light-error-panel mt-5 flex gap-3 border border-[#fee2e2] bg-[#fee2e2] p-4 text-sm text-[#b91c1c] dark:border-red-400/25 dark:bg-red-950/40 dark:text-red-200"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
            <p>{error}</p>
          </div>
        )}
      </Reveal>

      <StaggerContainer
        className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
        staggerDelay={0.045}
        amount={0.12}
      >
        {locatedAcademies.map(({ academy }, index) => {
          const isNearest = Boolean(origin) && index === 0;
          const isMainAcademy = !origin && academy.key === MAIN_ACADEMY_KEY;
          const name = t(`items.${academy.key}.name`);
          return (
            <StaggerItem
              key={academy.key}
              className="h-full"
              hover="lift"
              y={42}
              scale={0.97}
              blur={7}
              duration={0.56}
            >
              <article
                className={cn(
                  'public-light-panel group h-full overflow-hidden border bg-white shadow-[var(--shadow-card)] dark:bg-[#171b24]',
                  isNearest ? 'border-primary' : 'border-[#e5e7eb] dark:border-white/[0.12]',
                  origin &&
                    !isNearest &&
                    'opacity-[0.35] grayscale transition-opacity duration-normal',
                )}
              >
                <div className="relative h-40 overflow-hidden bg-[#10131a]" aria-hidden>
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(228,61,48,0.82),rgba(16,19,26,0.45)_42%,rgba(24,59,91,0.82))]" />
                  <div className="absolute -right-10 top-10 h-28 w-56 -skew-x-12 bg-white/[0.12]" />
                  <div className="absolute bottom-0 left-0 h-14 w-2/3 bg-primary" />
                  <div className="absolute bottom-4 left-5 text-5xl font-black text-white/25">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-sm font-semibold text-primary">
                        <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                        <span>{t(`items.${academy.key}.area`)}</span>
                      </p>
                      <h3 className="public-light-heading mt-3 text-xl font-black text-[#10131a] dark:text-white">
                        {name}
                      </h3>
                    </div>
                    {(isNearest || isMainAcademy) && (
                      <span className="shrink-0 rounded-md bg-primary px-2 py-1 text-xs font-bold uppercase tracking-[0.12em] text-primary-foreground">
                        {isNearest ? t('locator.nearestBadge') : t('locator.mainBadge')}
                      </span>
                    )}
                  </div>

                  <p className="public-light-muted mt-4 text-sm leading-6 text-[#4b5563] dark:text-white/[0.68]">
                    {t(`items.${academy.key}.address`)}
                  </p>

                  <div className="public-light-divider mt-5 flex flex-col gap-2 border-t border-[#e5e7eb] pt-4 text-sm dark:border-white/[0.12]">
                    {academy.phone && (
                      <a
                        href={`tel:${digitsOnly(academy.phone)}`}
                        className="public-light-button inline-flex min-h-11 items-center gap-2 rounded-md px-2 font-medium text-[#10131a] transition-colors duration-fast ease-standard hover:bg-[#f3f4f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-white dark:hover:bg-white/10"
                      >
                        <Phone className="h-4 w-4 text-primary" aria-hidden />
                        <span>{t('phoneLabel', { phone: academy.phone })}</span>
                      </a>
                    )}
                    {academy.whatsapp && (
                      <a
                        href={`https://wa.me/52${digitsOnly(academy.whatsapp)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="public-light-button inline-flex min-h-11 items-center gap-2 rounded-md px-2 font-medium text-[#10131a] transition-colors duration-fast ease-standard hover:bg-[#f3f4f6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-white dark:hover:bg-white/10"
                      >
                        <MessageCircle className="h-4 w-4 text-primary" aria-hidden />
                        <span>{t('whatsappLabel', { phone: academy.whatsapp })}</span>
                      </a>
                    )}
                    <a
                      href={directionsUrl(academy, origin)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center gap-2 rounded-md bg-[#10131a] px-3 font-semibold text-white transition-colors duration-fast ease-standard hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-label={t('directionsAria', { academy: name })}
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden />
                      <span>{origin ? t('directionsFromOrigin') : t('directions')}</span>
                    </a>
                  </div>
                </div>
              </article>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </div>
  );
}

async function geocodeInput(input: string): Promise<Coordinates> {
  if (MEXICO_ZIP_PATTERN.test(input)) {
    const zipResult = await geocodeZipCode(input);
    if (zipResult) return zipResult;
  }

  const query = MEXICO_ZIP_PATTERN.test(input) ? `${input}, Jalisco, México` : `${input}, México`;
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'mx');
  url.searchParams.set('q', query);

  const response = await fetch(url);
  if (!response.ok) throw new Error('geocoding failed');

  const results = (await response.json()) as Array<{ lat?: string; lon?: string }>;
  const first = results[0];
  const lat = Number(first?.lat);
  const lng = Number(first?.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw new Error('geocoding failed');

  return { lat, lng };
}

async function geocodeZipCode(zipCode: string): Promise<Coordinates | null> {
  const response = await fetch(`https://api.zippopotam.us/mx/${zipCode}`);
  if (!response.ok) return null;

  const result = (await response.json()) as {
    places?: Array<{ latitude?: string; longitude?: string }>;
  };
  const first = result.places?.[0];
  const lat = Number(first?.latitude);
  const lng = Number(first?.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return { lat, lng };
}

function distanceInKm(origin: Coordinates, destination: Coordinates) {
  const earthRadiusKm = 6371;
  const latDelta = toRadians(destination.lat - origin.lat);
  const lngDelta = toRadians(destination.lng - origin.lng);
  const originLat = toRadians(origin.lat);
  const destinationLat = toRadians(destination.lat);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(originLat) * Math.cos(destinationLat) * Math.sin(lngDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function directionsUrl(academy: PublicAcademy, origin: Coordinates | null) {
  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  url.searchParams.set('destination', `${academy.lat},${academy.lng}`);
  url.searchParams.set('travelmode', 'driving');
  if (origin) {
    url.searchParams.set('origin', `${origin.lat},${origin.lng}`);
  }
  return url.toString();
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, '');
}
