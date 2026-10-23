import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isPgId } from './pg-id';

describe('isPgId', () => {
  it('accepts a UUID', () => {
    assert.equal(isPgId('e23e7b16-b20f-42ff-a823-16c12829829c'), true);
  });

  it('rejects missing or invalid ids that would 404 the detail API', () => {
    assert.equal(isPgId(undefined), false);
    assert.equal(isPgId('undefined'), false);
    assert.equal(isPgId('demo-1'), false);
    assert.equal(isPgId(''), false);
  });
});
