import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { pgDetailFromResponse, readPgIdParam } from './pg-detail';

describe('readPgIdParam', () => {
  it('accepts a UUID from the route or useParams', () => {
    assert.equal(readPgIdParam('e23e7b16-b20f-42ff-a823-16c12829829c'), 'e23e7b16-b20f-42ff-a823-16c12829829c');
    assert.equal(readPgIdParam(['e23e7b16-b20f-42ff-a823-16c12829829c']), 'e23e7b16-b20f-42ff-a823-16c12829829c');
  });

  it('rejects the broken ids that made renter detail show PG not found', () => {
    assert.equal(readPgIdParam(undefined), null);
    assert.equal(readPgIdParam('undefined'), null);
    assert.equal(readPgIdParam('demo-1'), null);
  });
});

describe('pgDetailFromResponse', () => {
  it('keeps the PG when the API returns it', () => {
    const parsed = pgDetailFromResponse(true, {
      pg: { id: 'e23e7b16-b20f-42ff-a823-16c12829829c', name: 'Sunrise Nest' },
      rooms: [{ id: 'room-1' }],
      owner: { name: 'Asha' },
    });
    assert.equal(parsed.ok, true);
    if (parsed.ok) {
      assert.equal((parsed.pg as { name: string }).name, 'Sunrise Nest');
      assert.equal(parsed.rooms.length, 1);
    }
  });

  it('does not treat a rooms or server error as a missing PG payload', () => {
    const parsed = pgDetailFromResponse(false, { error: 'column rooms.has_ac does not exist' });
    assert.deepEqual(parsed, { ok: false, error: 'column rooms.has_ac does not exist' });
  });

  it('falls back to PG not found only when the payload has no PG', () => {
    assert.deepEqual(pgDetailFromResponse(true, {}), { ok: false, error: 'PG not found.' });
  });
});
