import assert from 'node:assert/strict';
import { rotationInPeriod } from '../src/lib/rotationPeriod';

const now = new Date('2026-09-14T10:00:00Z');
assert.equal(rotationInPeriod('2026-09-13T21:00:00Z', 'DAY', now), true);
assert.equal(rotationInPeriod('2026-09-13T20:59:59Z', 'DAY', now), false);
assert.equal(rotationInPeriod('2026-09-14T21:00:00Z', 'DAY', now), false);
assert.equal(rotationInPeriod('2026-09-20T20:59:59Z', 'WEEK', now), true);
assert.equal(rotationInPeriod('2026-09-20T21:00:00Z', 'WEEK', now), false);
assert.equal(rotationInPeriod('2026-08-31T21:00:00Z', 'MONTH', now), true);
assert.equal(rotationInPeriod('2026-09-30T21:00:00Z', 'MONTH', now), false);
assert.equal(rotationInPeriod('2025-12-31T21:00:00Z', 'YEAR', now), true);
assert.equal(rotationInPeriod('2026-09-16T20:59:59Z', 'CUSTOM', now, '2026-09-14', '2026-09-16'), true);
assert.equal(rotationInPeriod('2026-09-16T21:00:00Z', 'CUSTOM', now, '2026-09-14', '2026-09-16'), false);
assert.equal(rotationInPeriod('2026-09-15T00:00:00Z', 'CUSTOM', now, '2026-09-16', '2026-09-14'), false);
assert.equal(rotationInPeriod('invalid', 'DAY', now), false);
console.log('Rotation period boundary checks passed.');
