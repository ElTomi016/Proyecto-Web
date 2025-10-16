import { InjectionToken, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

const getServerEnv = (key: string): string | undefined => {
  return (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.[key];
};

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const ensureApiPath = (value: string): string => {
  const normalized = trimTrailingSlash(value);
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
};

const getBrowserConfiguredUrl = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;

  const browserWindow = window as typeof window & {
    API_BASE_URL?: string;
    __env?: Record<string, string | undefined>;
  };

  const fromWindow =
    browserWindow.API_BASE_URL ?? browserWindow.__env?.['API_BASE_URL'];
  if (fromWindow) return fromWindow;

  if (typeof document !== 'undefined') {
    const meta = document.querySelector?.('meta[name="api-base-url"]');
    const content = meta?.getAttribute('content')?.trim();
    if (content) return content;
  }

  return undefined;
};

const getBrowserDefaultBase = (): string => {
  if (typeof window === 'undefined') return '';

  return window.location.origin;
};

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => {
    const platformId = inject(PLATFORM_ID);

    if (isPlatformBrowser(platformId)) {
      const configured = getBrowserConfiguredUrl();
      if (configured) return ensureApiPath(configured);

      return ensureApiPath(getBrowserDefaultBase());
    }

    const configured = getServerEnv('API_BASE_URL') ?? 'http://localhost:8080/api';
    return ensureApiPath(configured);
  }
});
