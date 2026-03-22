import { test, expect } from '@playwright/test';
import { normalizeNumericString, extractQuantityInt } from '../client/src/lib/quantity';

test('normalizeNumericString converts Arabic-Indic digits and removes commas', () => {
  expect(normalizeNumericString('١٠٢')).toBe('102');
  expect(normalizeNumericString('2,500')).toBe('2500');
  expect(normalizeNumericString('  ٣٠٠  ')).toBe('300');
});

test('extractQuantityInt parses positive integer from amount strings', () => {
  expect(extractQuantityInt('5,000 ZP')).toBe(5000);
  expect(extractQuantityInt('ZP 300')).toBe(300);
  expect(extractQuantityInt('١٠٠٠ ZP')).toBe(1000);
  expect(extractQuantityInt('no digits')).toBe(0);
});
