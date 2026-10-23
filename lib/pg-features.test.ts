import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  PG_FEATURES,
  SEARCH_FEATURES,
  asStringList,
  parseFeatureSearchParams,
  pgMatchesFeatureFilters,
  sanitizeFeatureList,
} from './pg-features';

describe('asStringList', () => {
  it('returns trimmed strings from an array', () => {
    assert.deepEqual(asStringList([' Wi-Fi ', '', 'AC', 12, null]), ['Wi-Fi', 'AC']);
  });

  it('returns an empty list for non-arrays', () => {
    assert.deepEqual(asStringList({ AC: true }), []);
    assert.deepEqual(asStringList(null), []);
  });
});

describe('sanitizeFeatureList', () => {
  it('dedupes, trims, and drops empty values', () => {
    assert.deepEqual(sanitizeFeatureList([' Wi-Fi ', 'Wi-Fi', '', 'Laundry']), ['Wi-Fi', 'Laundry']);
  });
});

describe('pgMatchesFeatureFilters', () => {
  const pg = {
    amenities: ['Wi-Fi', 'AC', 'Laundry', 'Parking'],
    rooms: [
      { hasAc: true, features: ['Hot Water'] },
      { hasAc: false, features: ['Study Rooms'] },
    ],
  };

  it('matches everything when no AC or feature filters are set', () => {
    assert.equal(pgMatchesFeatureFilters(pg, {}), true);
    assert.equal(pgMatchesFeatureFilters(pg, { ac: false, features: [] }), true);
  });

  it('matches AC from PG amenities', () => {
    assert.equal(pgMatchesFeatureFilters({ amenities: ['AC'], rooms: [] }, { ac: true }), true);
    assert.equal(pgMatchesFeatureFilters({ amenities: ['Gym'], rooms: [] }, { ac: true }), false);
  });

  it('matches AC aliases used on listings', () => {
    assert.equal(pgMatchesFeatureFilters({ amenities: ['AC Rooms'], rooms: [] }, { ac: true }), true);
  });

  it('matches AC from a room even when the PG amenity list omits it', () => {
    assert.equal(
      pgMatchesFeatureFilters({ amenities: ['Wi-Fi'], rooms: [{ hasAc: true, features: [] }] }, { ac: true }),
      true,
    );
  });

  it('matches a feature from PG amenities or from any room', () => {
    assert.equal(pgMatchesFeatureFilters(pg, { features: ['Laundry'] }), true);
    assert.equal(pgMatchesFeatureFilters(pg, { features: ['Hot Water'] }), true);
    assert.equal(pgMatchesFeatureFilters(pg, { features: ['Gym'] }), false);
  });

  it('matches a PG that has any of the selected features (OR)', () => {
    assert.equal(pgMatchesFeatureFilters(pg, { features: ['Wi-Fi', 'Hot Water'] }), true);
    assert.equal(pgMatchesFeatureFilters(pg, { features: ['Wi-Fi', 'Gym'] }), true);
    assert.equal(pgMatchesFeatureFilters(pg, { features: ['Gym', 'Housekeeping'] }), false);
  });

  it('treats WiFi and Meals as aliases of the stored feature names', () => {
    assert.equal(pgMatchesFeatureFilters({ amenities: ['WiFi', 'Meals'], rooms: [] }, { features: ['Wi-Fi'] }), true);
    assert.equal(
      pgMatchesFeatureFilters({ amenities: ['WiFi', 'Meals'], rooms: [] }, { features: ['Mess / Food'] }),
      true,
    );
  });

  it('keeps AC plus another feature from emptying results when the listing has only one of them', () => {
    assert.equal(pgMatchesFeatureFilters(pg, { ac: true, features: ['Study Rooms'] }), true);
    assert.equal(pgMatchesFeatureFilters(pg, { ac: true, features: ['Gym'] }), true);
    assert.equal(
      pgMatchesFeatureFilters({ amenities: ['Laundry'], rooms: [] }, { ac: true, features: ['Laundry'] }),
      true,
    );
    assert.equal(
      pgMatchesFeatureFilters({ amenities: ['Gym'], rooms: [] }, { ac: true, features: ['Parking'] }),
      false,
    );
  });
});

describe('parseFeatureSearchParams', () => {
  it('reads ac=true and comma-separated features', () => {
    const params = new URLSearchParams('ac=true&features=Wi-Fi,Laundry');
    assert.deepEqual(parseFeatureSearchParams(params), { ac: true, features: ['Wi-Fi', 'Laundry'] });
  });

  it('reads repeated feature params and ignores unknown blanks', () => {
    const params = new URLSearchParams('feature=Parking&feature=&features=Gym');
    assert.deepEqual(parseFeatureSearchParams(params), { ac: false, features: ['Parking', 'Gym'] });
  });

  it('treats missing AC as off', () => {
    assert.deepEqual(parseFeatureSearchParams(new URLSearchParams('q=nest')), { ac: false, features: [] });
  });
});

describe('catalog', () => {
  it('includes AC in the same search checkbox list as other features', () => {
    assert.equal(PG_FEATURES.includes('AC'), true);
    assert.equal(SEARCH_FEATURES.includes('AC'), true);
    assert.equal(SEARCH_FEATURES.includes('Wi-Fi'), true);
  });
});
