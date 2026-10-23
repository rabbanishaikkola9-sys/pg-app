'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SEARCH_FEATURES, toggleListValue } from '@/lib/pg-features';

export function FeatureCheckboxList({
  value,
  onChange,
  options = SEARCH_FEATURES,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  options?: readonly string[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
      {options.map((feature) => {
        const checked = value.includes(feature);
        const id = `feature-${feature.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        return (
          <div key={feature} className="flex items-center gap-2">
            <Checkbox
              id={id}
              checked={checked}
              onCheckedChange={(next) => onChange(toggleListValue(value, feature, next === true))}
            />
            <Label htmlFor={id} className="cursor-pointer font-normal text-sm">
              {feature}
            </Label>
          </div>
        );
      })}
    </div>
  );
}
