export function safeDate(value: unknown): Date | null {
  if (!value && value !== 0) return null;
  const d = new Date(value as any);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(
  value: unknown,
  locale: string = 'en-GB',
  options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' }
): string {
  const d = safeDate(value);
  if (!d) return '—';
  return d.toLocaleDateString(locale, options);
}

export function formatDateTime(
  value: unknown,
  locale: string = 'en-GB'
): string {
  const d = safeDate(value);
  if (!d) return '—';
  return (
    d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-') +
    ' ' +
    d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  );
}

export function timeAgo(value: unknown, locale: 'ar' | 'en' = 'en'): string {
  const d = safeDate(value);
  if (!d) return '—';
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (locale === 'ar') {
    if (mins < 1) return 'الآن';
    if (mins < 60) return `منذ ${mins} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 30) return `منذ ${days} يوم`;
    return formatDate(d, 'ar-EG');
  }

  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return formatDate(d, 'en-GB');
}
