import { shouldUpdateCurrency } from '../client/src/lib/localization';

function assert(name: string, cond: boolean) {
  if (!cond) {
    console.error('FAIL', name);
    process.exitCode = 1;
  } else {
    console.log('PASS', name);
  }
}

assert('keeps manual EGP', shouldUpdateCurrency('EGP' as any, 'USD' as any) === null);
assert('keeps manual USD', shouldUpdateCurrency('USD' as any, 'EGP' as any) === null);
assert('sets detected when none saved', shouldUpdateCurrency(null as any, 'EGP' as any) === 'EGP');
assert('ignores invalid detected', shouldUpdateCurrency(null as any, 'XXX' as any) === null);
assert('ignores invalid saved', shouldUpdateCurrency('XXX' as any, 'USD' as any) === 'USD');

if (!process.exitCode) {
  console.log('All currency tests passed');
}
