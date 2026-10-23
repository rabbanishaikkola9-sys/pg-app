import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEFAULT_PG_PLACEHOLDERS,
  firstImageUrl,
  getDefaultPgPlaceholder,
  getPgCoverUrl,
  isDataUrlImage,
  sanitizeImageUrls,
} from './images';

const tinyJpeg =
  'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP/bAEMAAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGf/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPwB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwB//9k=';

describe('sanitizeImageUrls', () => {
  it('keeps valid data URLs, http(s) URLs, and local placeholder paths', () => {
    const result = sanitizeImageUrls([
      tinyJpeg,
      'https://cdn.example.com/pg.jpg',
      '  http://localhost:3000/photo.png  ',
      '/images/placeholders/pg-room-1.svg',
    ]);
    assert.equal(result.length, 4);
    assert.equal(result[0], tinyJpeg);
    assert.equal(result[1], 'https://cdn.example.com/pg.jpg');
    assert.equal(result[3], '/images/placeholders/pg-room-1.svg');
  });

  it('drops invalid, oversized, and non-image values', () => {
    const tooLong = `data:image/jpeg;base64,${'A'.repeat(900_001)}`;
    const result = sanitizeImageUrls([
      'not-an-image',
      'data:text/plain;base64,aaaa',
      'javascript:alert(1)',
      tooLong,
      42,
      null,
    ]);
    assert.deepEqual(result, []);
  });

  it('caps the number of stored images', () => {
    const result = sanitizeImageUrls(
      Array.from({ length: 12 }, () => tinyJpeg),
      3,
    );
    assert.equal(result.length, 3);
  });
});

describe('firstImageUrl', () => {
  it('returns the first valid stored image', () => {
    assert.equal(firstImageUrl(['bad', tinyJpeg]), tinyJpeg);
    assert.equal(firstImageUrl([]), null);
  });
});

describe('isDataUrlImage', () => {
  it('detects base64 image data URLs', () => {
    assert.equal(isDataUrlImage(tinyJpeg), true);
    assert.equal(isDataUrlImage('https://cdn.example.com/pg.jpg'), false);
  });
});

describe('getDefaultPgPlaceholder', () => {
  it('returns a valid default placeholder path', () => {
    const defaultPlaceholder = getDefaultPgPlaceholder();
    assert.ok(DEFAULT_PG_PLACEHOLDERS.includes(defaultPlaceholder as (typeof DEFAULT_PG_PLACEHOLDERS)[number]));
  });

  it('returns consistent deterministic placeholder for the same seed', () => {
    const first = getDefaultPgPlaceholder('pg-hyd-01');
    const second = getDefaultPgPlaceholder('pg-hyd-01');
    assert.equal(first, second);
    assert.ok(DEFAULT_PG_PLACEHOLDERS.includes(first as (typeof DEFAULT_PG_PLACEHOLDERS)[number]));
  });
});

describe('getPgCoverUrl', () => {
  it('prefers the first real image if present', () => {
    assert.equal(getPgCoverUrl([tinyJpeg], 'pg-123'), tinyJpeg);
  });

  it('falls back to deterministic placeholder when images array is empty or missing', () => {
    const cover = getPgCoverUrl([], 'pg-123');
    assert.equal(cover, getDefaultPgPlaceholder('pg-123'));
  });
});
