import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { cityFromGeocode, reverseGeocodeUrl } from './current-location';

describe('cityFromGeocode', () => {
  it('prefers city, then locality, then town', () => {
    assert.equal(cityFromGeocode({ city: 'Hyderabad', locality: 'Gachibowli' }), 'Hyderabad');
    assert.equal(cityFromGeocode({ locality: 'Tirupati' }), 'Tirupati');
    assert.equal(cityFromGeocode({ town: 'Dharmavaram' }), 'Dharmavaram');
  });

  it('reads Nominatim address objects', () => {
    assert.equal(
      cityFromGeocode({
        address: { city: 'Anantapur', state: 'Andhra Pradesh' },
      }),
      'Anantapur',
    );
  });

  it('maps Bengaluru aliases to Bangalore so they match listings', () => {
    assert.equal(cityFromGeocode({ city: 'Bengaluru' }), 'Bangalore');
    assert.equal(cityFromGeocode({ city: 'Bengaluru Urban' }), 'Bangalore');
    assert.equal(cityFromGeocode({ city: 'Bangalore Urban' }), 'Bangalore');
  });

  it('returns null when no city-like field is present', () => {
    assert.equal(cityFromGeocode({}), null);
    assert.equal(cityFromGeocode({ principalSubdivision: 'Karnataka' }), null);
    assert.equal(cityFromGeocode(null), null);
  });
});

describe('reverseGeocodeUrl', () => {
  it('includes the requested coordinates', () => {
    const url = reverseGeocodeUrl(12.9716, 77.5946);
    assert.match(url, /latitude=12\.9716/);
    assert.match(url, /longitude=77\.5946/);
  });
});
