-- Room-level AC flag and feature list so search can filter PGs by
-- amenities on the property and features added on individual rooms.
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "has_ac" boolean NOT NULL DEFAULT false;
ALTER TABLE "rooms" ADD COLUMN IF NOT EXISTS "features" jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE rooms AS r
SET has_ac = true
FROM pg_properties AS p
WHERE r.pg_id = p.id
  AND r.has_ac = false
  AND p.amenities @> '["AC"]'::jsonb;
