import Link from 'next/link';
import { ArrowRight, BedDouble, MapPin, Sparkles } from 'lucide-react';
import { PgCardCover } from '@/components/images/pg-card-cover';
import { Badge } from '@/components/ui/badge';

type PgImageCardProps = {
  id: string;
  name: string;
  address: string;
  city?: string;
  priceLabel: string;
  imageUrl?: string | null;
  roomsAvailable?: number;
  totalRooms?: number;
  matchScore?: number;
  amenities?: string[];
};

export function PgImageCard({
  id,
  name,
  address,
  city,
  priceLabel,
  imageUrl,
  roomsAvailable,
  totalRooms,
  matchScore,
  amenities = [],
}: PgImageCardProps) {
  const fullAddress = city ? `${address}, ${city}` : address;
  const hasRooms = typeof roomsAvailable === 'number' && typeof totalRooms === 'number';
  const occupiedRooms = hasRooms ? Math.max(0, totalRooms - roomsAvailable) : 0;

  return (
    <Link
      href={`/pgs/${id}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-300 hover:shadow-2xl hover:shadow-blue-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-400/40 dark:hover:shadow-blue-400/10"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden">
        <PgCardCover
          src={imageUrl}
          alt={name}
          seed={id || name}
          aspectRatio="auto"
          className="h-full w-full"
          imgClassName="group-hover:scale-105"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />

        <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
          <Badge className="bg-white/90 text-zinc-900 backdrop-blur transition-colors duration-200 hover:bg-white dark:bg-zinc-950/80 dark:text-zinc-100">
            Verified
          </Badge>
          {typeof matchScore === 'number' ? (
            <Badge className="gap-1 bg-zinc-900/85 text-white backdrop-blur transition-colors duration-200 hover:bg-zinc-900/85 group-hover:bg-blue-600">
              <Sparkles className="h-3 w-3" aria-hidden /> {matchScore}% match
            </Badge>
          ) : null}
        </div>

        {hasRooms ? (
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent p-3 text-white">
            <span className="inline-flex items-center gap-1 text-xs">
              <BedDouble className="h-3.5 w-3.5" aria-hidden />
              {occupiedRooms} of {totalRooms} rooms occupied
            </span>
            <span className="rounded-full bg-emerald-500/90 px-2 py-0.5 font-medium text-xs">
              {roomsAvailable} available
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="space-y-1">
          <h3 className="line-clamp-1 font-semibold text-base text-zinc-900 transition-colors duration-200 group-hover:text-blue-600 dark:text-zinc-100 dark:group-hover:text-blue-400">
            {name}
          </h3>
          <p className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
            <MapPin className="h-3.5 w-3.5" aria-hidden />
            <span className="line-clamp-1">{fullAddress}</span>
          </p>
        </div>

        {amenities.length ? (
          <div className="flex flex-wrap gap-1">
            {amenities.slice(0, 3).map((a) => (
              <Badge
                key={a}
                variant="outline"
                className="rounded-full border-zinc-200 text-[10px] text-zinc-600 dark:border-zinc-700 dark:text-zinc-300"
              >
                {a}
              </Badge>
            ))}
            {amenities.length > 3 ? (
              <Badge variant="outline" className="rounded-full text-[10px]">
                +{amenities.length - 3}
              </Badge>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-3 pt-1">
          <div className="text-zinc-900 dark:text-zinc-100">
            <div className="font-semibold text-lg leading-none">{priceLabel}</div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">per month</div>
          </div>
          <span className="inline-flex items-center gap-1 font-medium text-blue-600 text-sm transition-transform duration-300 group-hover:translate-x-1 dark:text-blue-400">
            View details
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </span>
        </div>
      </div>
    </Link>
  );
}
