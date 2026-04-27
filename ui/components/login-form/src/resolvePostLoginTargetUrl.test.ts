import { describe, it, expect } from 'vitest';
import { resolvePostLoginTargetUrl } from './resolvePostLoginTargetUrl';

const origin = 'https://app.example.com';

describe('resolvePostLoginTargetUrl', () => {
  it('should return same-app relative path for a safe relative returnUrl', () => {
    const { href } = resolvePostLoginTargetUrl({
      returnUrl: '/dashboard',
      fallbackPath: '/',
      origin,
    });
    expect(href).toBe('/dashboard');
  });

  it('should accept an absolute URL that matches the app origin', () => {
    const { href } = resolvePostLoginTargetUrl({
      returnUrl: 'https://app.example.com/dashboard',
      fallbackPath: '/',
      origin,
    });
    expect(href).toBe('https://app.example.com/dashboard');
  });

  it('should return fallbackPath href when returnUrl is null', () => {
    const { href } = resolvePostLoginTargetUrl({
      returnUrl: null,
      fallbackPath: '/',
      origin,
    });
    expect(href).toBe('/');
  });

  it('should return fallbackPath href when returnUrl is undefined', () => {
    const { href } = resolvePostLoginTargetUrl({
      returnUrl: undefined,
      fallbackPath: '/home',
      origin,
    });
    expect(href).toBe('/home');
  });

  it('should return fallbackPath href when returnUrl is an empty string', () => {
    const { href } = resolvePostLoginTargetUrl({
      returnUrl: '',
      fallbackPath: '/',
      origin,
    });
    expect(href).toBe('/');
  });

  it('should use fallback and not redirect to a foreign https origin', () => {
    const { href } = resolvePostLoginTargetUrl({
      returnUrl: 'https://evil.com/phishing',
      fallbackPath: '/',
      origin,
    });
    expect(href).toBe('/');
  });

  it('should use fallback for a protocol-relative URL pointing to a foreign host', () => {
    const { href } = resolvePostLoginTargetUrl({
      returnUrl: '//evil.com',
      fallbackPath: '/',
      origin,
    });
    expect(href).toBe('/');
  });

  it('should use fallback for a javascript: URL', () => {
    const { href } = resolvePostLoginTargetUrl({
      returnUrl: 'javascript:alert(1)',
      fallbackPath: '/',
      origin,
    });
    expect(href).toBe('/');
  });

  it('should use fallback for a data: URL', () => {
    const { href } = resolvePostLoginTargetUrl({
      returnUrl: 'data:text/html,<p>x</p>',
      fallbackPath: '/',
      origin,
    });
    expect(href).toBe('/');
  });

  it('should use fallback when host is a different subdomain of the same registrable domain', () => {
    const { href } = resolvePostLoginTargetUrl({
      returnUrl: 'https://evil.example.com/page',
      fallbackPath: '/',
      origin: 'https://app.example.com',
    });
    expect(href).toBe('/');
  });

  it('should preserve query string on a safe relative returnUrl', () => {
    const { href } = resolvePostLoginTargetUrl({
      returnUrl: '/dashboard?tab=stats&filter=active',
      fallbackPath: '/',
      origin,
    });
    expect(href).toBe('/dashboard?tab=stats&filter=active');
  });

  it('should preserve the URL fragment on a safe relative returnUrl', () => {
    const { href } = resolvePostLoginTargetUrl({
      returnUrl: '/dashboard#section-1',
      fallbackPath: '/',
      origin,
    });
    expect(href).toBe('/dashboard#section-1');
  });

  it('should use fallback for a foreign host with a non-default port', () => {
    const { href } = resolvePostLoginTargetUrl({
      returnUrl: 'https://evil.com:8080/page',
      fallbackPath: '/',
      origin,
    });
    expect(href).toBe('/');
  });

  it('should allow same host and same non-standard port as origin', () => {
    const { href } = resolvePostLoginTargetUrl({
      returnUrl: 'https://app.example.com:3000/page',
      fallbackPath: '/',
      origin: 'https://app.example.com:3000',
    });
    expect(href).toBe('https://app.example.com:3000/page');
  });

  it('should return safe fallback when returnUrl is not a usable URL', () => {
    const { href } = resolvePostLoginTargetUrl({
      returnUrl: ':::',
      fallbackPath: '/',
      origin,
    });
    expect(href).toBe('/');
  });
});
