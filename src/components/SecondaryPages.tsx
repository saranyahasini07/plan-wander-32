import React, { useState, useMemo } from 'react';
import {
  DESTINATIONS,
  getActivitiesForDestination,
  getHotelsForDestination,
  getLocalTransportOptions,
  getPlacesForDestination,
  getRestaurantsForDestination,
  getTransportOptionsForRoute,
} from '../data/destinations';
import {
  Destination,
  FavoritesState,
  HotelOption,
  PlaceToVisit,
  StayBudgetTier,
  StayPropertyType,
  TransportCategory,
  TripState,
} from '../types/travel';
import { calculateTripBudgetBreakdown } from '../services/itineraryEngine';
import { VisualMedia } from './VisualMedia';
import {
  Heart,
  Search,
  ArrowRight,
  Copy,
  Trash2,
  Edit3,
  Eye,
  Plus,
  Check,
} from 'lucide-react';

// ============================================================================
// 1. EXPLORE PAGE (Requirement 26)
// ============================================================================
interface ExplorePageProps {
  trip: TripState;
  favorites: FavoritesState;
  onSelectDestinationAndPlan: (dest: Destination) => void;
  onTogglePlaceInTrip: (place: PlaceToVisit) => void;
  onInspectPlace: (place: PlaceToVisit) => void;
  onToggleFavorite: (kind: keyof FavoritesState, id: string) => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({
  trip,
  favorites,
  onSelectDestinationAndPlan,
  onTogglePlaceInTrip,
  onInspectPlace,
  onToggleFavorite,
}) => {
  const [activeCollection, setActiveCollection] = useState<
    | 'all'
    | 'popular'
    | 'trending'
    | 'gems'
    | 'beaches'
    | 'mountains'
    | 'historical'
    | 'adventure'
    | 'food'
    | 'photography'
    | 'family'
    | 'international'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Aggregate curated attractions across destinations for category exploration
  const allPlacesPool = useMemo(() => {
    return DESTINATIONS.flatMap((d) =>
      getPlacesForDestination(d).map((p) => ({
        ...p,
        destinationName: d.name,
        country: d.country,
        region: d.region,
      }))
    );
  }, []);

  const filteredDestinations = useMemo(() => {
    return DESTINATIONS.filter((d) => {
      if (
        searchQuery &&
        !d.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !d.shortDescription.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      if (activeCollection === 'popular') return d.popularityTag === 'Popular';
      if (activeCollection === 'trending') return d.isTrending;
      if (activeCollection === 'gems') return d.isHiddenGem;
      if (activeCollection === 'international') return d.region === 'International';
      if (activeCollection === 'beaches') return d.visualTheme === 'coastal' || d.visualTheme === 'island';
      if (activeCollection === 'mountains') return d.visualTheme === 'himalaya';
      if (activeCollection === 'historical') return d.visualTheme === 'heritage';
      return true;
    });
  }, [activeCollection, searchQuery]);

  const filteredPlaces = useMemo(() => {
    return allPlacesPool
      .filter((p) => {
        if (
          searchQuery &&
          !p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !p.destinationName.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }
        if (activeCollection === 'gems') return p.isHiddenGem;
        if (activeCollection === 'beaches') return p.category === 'Beaches';
        if (activeCollection === 'mountains') return p.category === 'Mountains';
        if (activeCollection === 'historical')
          return p.category === 'Historical' || p.category === 'Museums' || p.category === 'Temples';
        if (activeCollection === 'adventure') return p.category === 'Adventure';
        if (activeCollection === 'food') return p.category === 'Food' || p.category === 'Shopping';
        if (activeCollection === 'photography') return p.category === 'Photography';
        if (activeCollection === 'family') return p.category === 'Family activities' || p.category === 'Nature';
        if (activeCollection === 'international') return p.region === 'International';
        return true;
      })
      .slice(0, 18);
  }, [allPlacesPool, activeCollection, searchQuery]);

  const collectionTabs = [
    { id: 'all', label: 'All Collections' },
    { id: 'popular', label: 'Popular Destinations' },
    { id: 'trending', label: 'Trending Places' },
    { id: 'gems', label: 'Hidden Gems' },
    { id: 'beaches', label: 'Beaches' },
    { id: 'mountains', label: 'Mountains' },
    { id: 'historical', label: 'Historical Places' },
    { id: 'adventure', label: 'Adventure' },
    { id: 'food', label: 'Food & Markets' },
    { id: 'photography', label: 'Photography' },
    { id: 'family', label: 'Family' },
    { id: 'international', label: 'International' },
  ] as const;

  return (
    <div className="mx-auto max-w-[1380px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-slate-200 pb-6">
        <div className="text-xs text-slate-500">
          Visual Discovery Atlas · 20 Destinations · 160+ Curated Places &amp; Hidden Gems
        </div>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-slate-900">
              Explore Destinations &amp; Hidden Gems
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Browse by landscape, interest, or crowd level and add any place directly into your trip.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search destinations or places..."
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pr-3 pl-9 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {collectionTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCollection(tab.id)}
              className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors ${
                activeCollection === tab.id
                  ? 'bg-teal-700 text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Destinations Section */}
      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl font-semibold text-slate-900">
            Destinations Matching Filter ({filteredDestinations.length})
          </h2>
          <span className="text-xs text-slate-500">
            Click any destination to launch its interactive planner
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredDestinations.map((dest) => (
            <div
              key={dest.id}
              className="group flex flex-col justify-between border border-slate-200 bg-white"
            >
              <div>
                <div className="h-48 w-full">
                  <VisualMedia
                    theme={dest.visualTheme}
                    seed={dest.id}
                    alt={dest.name}
                    className="h-full w-full"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {dest.country} · {dest.popularityTag}
                    </span>
                    <span className="font-mono font-medium text-slate-800">
                      ₹{dest.startingBudget.toLocaleString('en-IN')}+
                    </span>
                  </div>
                  <h3 className="mt-1 font-display text-lg font-semibold text-slate-900">
                    {dest.name}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                    {dest.shortDescription}
                  </p>
                  <div className="mt-3 text-[11px] text-slate-500">
                    Best months: <span className="text-slate-800">{dest.bestTimeToVisit}</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 px-5 py-3.5">
                <button
                  type="button"
                  onClick={() => onSelectDestinationAndPlan(dest)}
                  className="inline-flex w-full items-center justify-between text-xs font-semibold text-teal-800 hover:text-teal-950"
                >
                  <span>Plan a Trip to {dest.name}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Curated Attractions & Hidden Gems Across Destinations */}
      <section className="mt-12 border-t border-slate-200 pt-10">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs text-slate-500">Curated Landmarks &amp; Uncrowded Spots</div>
            <h2 className="mt-0.5 font-display text-2xl font-semibold text-slate-900">
              Featured Tourist Places &amp; Hidden Gems
            </h2>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlaces.map((place) => {
            const inTrip = trip.selectedPlaces.some((p) => p.id === place.id);
            const isFav = favorites.places.includes(place.id);
            return (
              <div
                key={place.id}
                className="group flex flex-col justify-between border border-slate-200 bg-white"
              >
                <div>
                  <div className="relative h-48 w-full">
                    <VisualMedia
                      theme={place.visualTheme}
                      seed={place.id}
                      alt={place.name}
                      className="h-full w-full"
                    />
                    <button
                      type="button"
                      onClick={() => onToggleFavorite('places', place.id)}
                      className="absolute top-3 right-3 rounded-full bg-white/90 p-2 text-slate-700 hover:bg-white"
                    >
                      <Heart className={`h-4 w-4 ${isFav ? 'fill-rose-600 text-rose-600' : ''}`} />
                    </button>
                  </div>

                  <div className="p-5">
                    <div className="text-xs text-slate-500">
                      <span className="font-medium text-slate-800">{place.destinationName}</span>
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span>{place.category}</span>
                      {place.isHiddenGem && (
                        <>
                          <span className="mx-1.5" aria-hidden="true">·</span>
                          <span className="font-semibold text-teal-800">Hidden Gem</span>
                        </>
                      )}
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      <span className="font-mono">★ {place.rating.toFixed(1)}</span>
                    </div>

                    <h3 className="mt-1 font-display text-lg font-semibold text-slate-900">
                      {place.name}
                    </h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                      {place.shortDescription}
                    </p>
                    <div className="mt-3 text-xs text-slate-500">
                      {place.entryFee === 0 ? '₹0 Entry' : `₹${place.entryFee} Entry`} · Best time:{' '}
                      {place.bestTimeToVisit}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3.5">
                  <button
                    type="button"
                    onClick={() => onInspectPlace(place)}
                    className="text-xs font-medium text-slate-700 hover:underline"
                  >
                    View Details
                  </button>
                  <button
                    type="button"
                    onClick={() => onTogglePlaceInTrip(place)}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-medium ${
                      inTrip
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {inTrip ? 'In My Trip ✓' : 'Add to Trip'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

// ============================================================================
// 2. HOTELS DIRECTORY PAGE
// ============================================================================
interface HotelsDirectoryPageProps {
  trip: TripState;
  favorites: FavoritesState;
  onSelectHotelForTrip: (destId: string, hotel: HotelOption) => void;
  onInspectHotel: (hotel: HotelOption) => void;
  onToggleFavorite: (kind: keyof FavoritesState, id: string) => void;
}

export const HotelsDirectoryPage: React.FC<HotelsDirectoryPageProps> = ({
  trip,
  favorites,
  onSelectHotelForTrip,
  onInspectHotel,
  onToggleFavorite,
}) => {
  const [selectedDestId, setSelectedDestId] = useState<string>(trip.destinationId);
  const [tierFilter, setTierFilter] = useState<'All' | StayBudgetTier>('All');
  const [typeFilter, setTypeFilter] = useState<'All' | StayPropertyType>('All');

  const activeDest = useMemo(
    () => DESTINATIONS.find((d) => d.id === selectedDestId) || DESTINATIONS[0],
    [selectedDestId]
  );

  const hotels = useMemo(() => {
    return getHotelsForDestination(activeDest).filter((h) => {
      if (tierFilter !== 'All' && h.tier !== tierFilter) return false;
      if (typeFilter !== 'All' && h.propertyType !== typeFilter) return false;
      return true;
    });
  }, [activeDest, tierFilter, typeFilter]);

  return (
    <div className="mx-auto max-w-[1380px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-slate-200 pb-6">
        <div className="text-xs text-slate-500">
          Hotel Discovery Platform · Demo Availability &amp; Transparent Nightly Rates
        </div>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold text-slate-900">
              Compare Stays — {activeDest.name}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Browse Budget, Comfortable, Premium, and Luxury stays across all 20 destinations.
            </p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600">Select Destination</label>
            <select
              value={selectedDestId}
              onChange={(e) => setSelectedDestId(e.target.value)}
              className="mt-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900"
            >
              {DESTINATIONS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.country})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {(['All', 'Budget Stay', 'Comfortable Stay', 'Premium Stay', 'Luxury Stay'] as const).map(
            (t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTierFilter(t)}
                className={`rounded-lg px-3.5 py-2 text-xs font-medium ${
                  tierFilter === t
                    ? 'bg-teal-700 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {t}
              </button>
            )
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {hotels.map((hotel) => {
          const isSelected = trip.selectedHotel?.id === hotel.id;
          const isFav = favorites.hotels.includes(hotel.id);
          const nights = Math.max(1, trip.durationDays - 1);
          const totalPrice = hotel.pricePerNight * nights * Math.max(1, trip.rooms);

          return (
            <div
              key={hotel.id}
              className={`flex flex-col justify-between border bg-white ${
                isSelected ? 'border-teal-700 ring-2 ring-teal-700/20' : 'border-slate-200'
              }`}
            >
              <div>
                <div className="relative h-56 w-full">
                  <VisualMedia
                    theme={hotel.visualTheme}
                    seed={hotel.id}
                    alt={hotel.name}
                    className="h-full w-full"
                  />
                  <button
                    type="button"
                    onClick={() => onToggleFavorite('hotels', hotel.id)}
                    className="absolute top-3 right-3 rounded-full bg-white/90 p-2 text-slate-700"
                  >
                    <Heart className={`h-4 w-4 ${isFav ? 'fill-rose-600 text-rose-600' : ''}`} />
                  </button>
                </div>
                <div className="p-5">
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-teal-800">{hotel.tier}</span> ·{' '}
                    {hotel.propertyType} · ★ {hotel.rating.toFixed(1)} ({hotel.reviewsCount} reviews)
                  </div>
                  <h3 className="mt-1 font-display text-xl font-semibold text-slate-900">
                    {hotel.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600">
                    {hotel.location} · {hotel.distanceFromCenter}
                  </p>
                  <p className="mt-2 text-xs text-slate-700">{hotel.description}</p>
                  <div className="mt-3 text-xs text-slate-500">
                    {hotel.amenities.join(' · ')}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">
                <div>
                  <div className="font-mono text-lg font-semibold text-slate-900">
                    ₹{hotel.pricePerNight.toLocaleString('en-IN')}/night
                  </div>
                  <div className="font-mono text-xs text-teal-800">
                    Total ({nights} nights): ₹{totalPrice.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onInspectHotel(hotel)}
                    className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    View Details
                  </button>
                  <button
                    type="button"
                    onClick={() => onSelectHotelForTrip(activeDest.id, hotel)}
                    className={`rounded-lg px-4 py-2 text-xs font-medium ${
                      isSelected
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {isSelected ? 'Selected in Trip ✓' : 'Select Stay'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// 3. TRANSPORTATION COMPARISON PAGE
// ============================================================================
interface TransportationPageProps {
  trip: TripState;
  updateTrip: (updater: (prev: TripState) => TripState) => void;
  onContinueToPlanner: () => void;
}

export const TransportationPage: React.FC<TransportationPageProps> = ({
  trip,
  updateTrip,
  onContinueToPlanner,
}) => {
  const [catFilter, setCatFilter] = useState<'All' | TransportCategory>('All');
  const [sortBy, setSortBy] = useState<'cheapest' | 'fastest' | 'comfortable'>('cheapest');

  const activeDest = useMemo(
    () => DESTINATIONS.find((d) => d.id === trip.destinationId) || DESTINATIONS[0],
    [trip.destinationId]
  );

  const transports = useMemo(() => {
    const raw = getTransportOptionsForRoute(trip.departureCity, activeDest);
    const filtered = catFilter === 'All' ? raw : raw.filter((t) => t.category === catFilter);
    return [...filtered].sort((a, b) => {
      if (sortBy === 'cheapest') return a.price - b.price;
      if (sortBy === 'fastest') return a.durationMinutes - b.durationMinutes;
      const rank = { Premium: 3, High: 2, Standard: 1 };
      return rank[b.comfortLevel] - rank[a.comfortLevel];
    });
  }, [trip.departureCity, activeDest, catFilter, sortBy]);

  const localTransports = useMemo(() => getLocalTransportOptions(activeDest), [activeDest]);

  return (
    <div className="mx-auto max-w-[1380px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="border border-slate-200 bg-white p-6">
        <div className="text-xs text-slate-500">
          Multi-Modal Route Comparison · Demo Availability / Estimated Price
        </div>
        <h1 className="mt-1 font-display text-3xl font-semibold text-slate-900">
          {trip.departureCity || 'Visakhapatnam'} → {activeDest.name} Transportation
        </h1>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-medium text-slate-600">
              Departure City / Hub
            </label>
            <input
              type="text"
              value={trip.departureCity}
              onChange={(e) => updateTrip((p) => ({ ...p, departureCity: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-[#FBFBF9] px-3.5 py-2 text-xs font-semibold text-slate-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">
              Arrival Destination
            </label>
            <select
              value={trip.destinationId}
              onChange={(e) => updateTrip((p) => ({ ...p, destinationId: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-[#FBFBF9] px-3.5 py-2 text-xs font-semibold text-slate-900"
            >
              {DESTINATIONS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.country})
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={onContinueToPlanner}
              className="w-full rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white hover:bg-teal-800"
            >
              Open Full Trip Builder with Route →
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <div className="flex flex-wrap gap-1.5">
            {(['All', 'Flights', 'Trains', 'Buses', 'Cabs / Taxis', 'Rental Cars'] as const).map(
              (c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCatFilter(c)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-medium ${
                    catFilter === c
                      ? 'bg-teal-700 text-white'
                      : 'border border-slate-200 bg-[#FBFBF9] text-slate-700'
                  }`}
                >
                  {c}
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {(['cheapest', 'fastest', 'comfortable'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSortBy(s)}
                className={`rounded-md px-3 py-1 text-xs font-medium capitalize ${
                  sortBy === s ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {transports.map((item) => {
            const isSelected = trip.selectedTransport?.id === item.id;
            return (
              <div
                key={item.id}
                className={`flex flex-wrap items-center justify-between gap-4 border p-4 ${
                  isSelected ? 'border-teal-700 bg-teal-50/25' : 'border-slate-200 bg-[#FBFBF9]'
                }`}
              >
                <div>
                  <div className="text-xs text-slate-500">
                    <strong className="text-slate-800">{item.category}</strong> · {item.operator} ·{' '}
                    <span className="font-mono">{item.code}</span>
                  </div>
                  <div className="mt-1 font-mono text-base font-semibold text-slate-900">
                    {item.departureTime} → {item.arrivalTime}{' '}
                    <span className="text-xs font-normal text-slate-600">
                      ({item.durationLabel} · {item.stopsLabel})
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {item.seatClass} · Comfort: {item.comfortLevel} · {item.availability}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-mono text-lg font-semibold text-slate-900">
                      ₹{item.price.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[11px] text-slate-500">Est. price / person</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateTrip((p) => ({ ...p, selectedTransport: item }))}
                    className={`rounded-lg px-4 py-2 text-xs font-medium ${
                      isSelected
                        ? 'bg-teal-700 text-white'
                        : 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? 'Selected ✓' : 'Select'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Local Transport Section */}
      <div className="mt-8 border border-slate-200 bg-white p-6">
        <h2 className="font-display text-xl font-semibold text-slate-900">
          Local Transportation in {activeDest.name}
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {localTransports.map((loc) => {
            const isSelected = trip.selectedLocalTransport?.id === loc.id;
            return (
              <div
                key={loc.id}
                className={`flex flex-col justify-between border p-4 ${
                  isSelected ? 'border-teal-700 bg-teal-50/25' : 'border-slate-200 bg-[#FBFBF9]'
                }`}
              >
                <div>
                  <div className="text-xs text-slate-500">
                    {loc.type} · Comfort: {loc.comfort}
                  </div>
                  <h3 className="mt-1 font-display text-base font-semibold text-slate-900">
                    {loc.name}
                  </h3>
                  <p className="mt-1 text-xs text-slate-600">{loc.description}</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="font-mono text-sm font-semibold text-slate-900">
                    ₹{loc.estimatedPricePerDay.toLocaleString('en-IN')}/day
                  </span>
                  <button
                    type="button"
                    onClick={() => updateTrip((p) => ({ ...p, selectedLocalTransport: loc }))}
                    className={`rounded-md px-3.5 py-1.5 text-xs font-medium ${
                      isSelected
                        ? 'bg-teal-700 text-white'
                        : 'border border-slate-300 bg-white text-slate-800'
                    }`}
                  >
                    {isSelected ? 'Selected ✓' : 'Select'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 4. MY TRIPS & FAVORITES PAGES (Requirement 25)
// ============================================================================
interface MyTripsPageProps {
  savedTrips: TripState[];
  currentTrip: TripState;
  onSaveCurrentTrip: () => void;
  onOpenTrip: (trip: TripState, step?: number) => void;
  onDuplicateTrip: (trip: TripState) => void;
  onDeleteTrip: (tripId: string) => void;
}

export const MyTripsPage: React.FC<MyTripsPageProps> = ({
  savedTrips,
  currentTrip,
  onSaveCurrentTrip,
  onOpenTrip,
  onDuplicateTrip,
  onDeleteTrip,
}) => {
  return (
    <div className="mx-auto max-w-[1380px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="text-xs text-slate-500">Saved Workspaces &amp; Itineraries</div>
          <h1 className="mt-1 font-display text-3xl font-semibold text-slate-900">My Trips</h1>
          <p className="mt-1 text-sm text-slate-600">
            Open previous trips, duplicate a baseline to compare options, edit selections, or view itineraries.
          </p>
        </div>

        <button
          type="button"
          onClick={onSaveCurrentTrip}
          className="rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-medium text-white hover:bg-teal-800"
        >
          + Save Current Active Trip ({currentTrip.title})
        </button>
      </div>

      {savedTrips.length === 0 ? (
        <div className="mt-8 border border-slate-200 bg-white p-12 text-center">
          <h2 className="font-display text-xl font-semibold text-slate-900">
            No saved trips yet
          </h2>
          <p className="mt-2 text-xs text-slate-600">
            Save your active {currentTrip.title} workspace to compare, duplicate, or revisit later.
          </p>
          <button
            type="button"
            onClick={onSaveCurrentTrip}
            className="mt-5 rounded-lg bg-slate-900 px-5 py-2.5 text-xs font-medium text-white hover:bg-slate-800"
          >
            Save Active Trip Now
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {savedTrips.map((st) => {
            const dest =
              DESTINATIONS.find((d) => d.id === st.destinationId) || DESTINATIONS[0];
            const budget = calculateTripBudgetBreakdown(st);

            return (
              <div
                key={st.id}
                className="flex flex-col justify-between border border-slate-200 bg-white"
              >
                <div>
                  <div className="h-44 w-full">
                    <VisualMedia
                      theme={dest.visualTheme}
                      seed={st.id}
                      alt={st.title}
                      className="h-full w-full"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {st.departureCity} → {dest.name}
                      </span>
                      <span className="font-mono">{st.durationDays} Days</span>
                    </div>
                    <h3 className="mt-1 font-display text-xl font-semibold text-slate-900">
                      {st.title}
                    </h3>
                    <div className="mt-2 font-mono text-lg font-semibold text-teal-800">
                      Est. ₹{budget.totalEstimated.toLocaleString('en-IN')}
                    </div>

                    <div className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-xs text-slate-600">
                      <div>
                        ✓ Transit: {st.selectedTransport?.operator || 'Not selected'}
                      </div>
                      <div>✓ Stay: {st.selectedHotel?.name || 'Not selected'}</div>
                      <div>
                        ✓ {st.selectedPlaces.length} Attractions · {st.selectedRestaurants.length}{' '}
                        Restaurants · {st.selectedActivities.length} Activities
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-[#FBFBF9] px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenTrip(st, 1)}
                      className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenTrip(st, 6)}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
                    >
                      <Eye className="h-3 w-3" />
                      <span>View Itinerary</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onDuplicateTrip(st)}
                      title="Duplicate trip"
                      className="rounded border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteTrip(st.id)}
                      title="Delete trip"
                      className="rounded border border-slate-200 bg-white p-1.5 text-slate-500 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface FavoritesPageProps {
  favorites: FavoritesState;
  onToggleFavorite: (kind: keyof FavoritesState, id: string) => void;
  onAddPlaceToTrip: (place: PlaceToVisit) => void;
  onSelectHotelInTrip: (destId: string, hotel: HotelOption) => void;
  onOpenExplore: () => void;
}

export const FavoritesPage: React.FC<FavoritesPageProps> = ({
  favorites,
  onToggleFavorite,
  onAddPlaceToTrip,
  onSelectHotelInTrip,
  onOpenExplore,
}) => {
  const allHotels = useMemo(
    () => DESTINATIONS.flatMap((d) => getHotelsForDestination(d)),
    []
  );
  const allPlaces = useMemo(
    () => DESTINATIONS.flatMap((d) => getPlacesForDestination(d)),
    []
  );
  const allRestaurants = useMemo(
    () => DESTINATIONS.flatMap((d) => getRestaurantsForDestination(d)),
    []
  );
  const allActivities = useMemo(
    () => DESTINATIONS.flatMap((d) => getActivitiesForDestination(d)),
    []
  );

  const favHotels = allHotels.filter((h) => favorites.hotels.includes(h.id));
  const favPlaces = allPlaces.filter((p) => favorites.places.includes(p.id));
  const favRestaurants = allRestaurants.filter((r) => favorites.restaurants.includes(r.id));
  const favActivities = allActivities.filter((a) => favorites.activities.includes(a.id));

  const totalCount =
    favHotels.length + favPlaces.length + favRestaurants.length + favActivities.length;

  return (
    <div className="mx-auto max-w-[1380px] px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-slate-200 pb-6">
        <div className="text-xs text-slate-500">Saved Inspiration Board</div>
        <h1 className="mt-1 font-display text-3xl font-semibold text-slate-900">
          Favorites ({totalCount})
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Your bookmarked hotels, tourist attractions, hidden gems, restaurants, and activities.
        </p>
      </div>

      {totalCount === 0 ? (
        <div className="mt-8 border border-slate-200 bg-white p-12 text-center">
          <h2 className="font-display text-xl font-semibold text-slate-900">
            No favorites saved yet
          </h2>
          <p className="mt-2 text-xs text-slate-600">
            Click the heart icon on any hotel, attraction, restaurant, or activity while exploring to save it here.
          </p>
          <button
            type="button"
            onClick={onOpenExplore}
            className="mt-5 rounded-lg bg-teal-700 px-5 py-2.5 text-xs font-medium text-white hover:bg-teal-800"
          >
            Explore Destinations &amp; Places
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {favPlaces.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-semibold text-slate-900">
                Saved Attractions &amp; Hidden Gems ({favPlaces.length})
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {favPlaces.map((p) => (
                  <div key={p.id} className="border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{p.category}</span>
                      <button
                        type="button"
                        onClick={() => onToggleFavorite('places', p.id)}
                        className="text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <h3 className="mt-1 font-display text-lg font-semibold text-slate-900">
                      {p.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600">{p.shortDescription}</p>
                    <button
                      type="button"
                      onClick={() => onAddPlaceToTrip(p)}
                      className="mt-4 rounded-lg bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800"
                    >
                      Add to Active Trip
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {favHotels.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-semibold text-slate-900">
                Saved Hotels &amp; Stays ({favHotels.length})
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {favHotels.map((h) => (
                  <div key={h.id} className="border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>
                        {h.tier} · ₹{h.pricePerNight.toLocaleString('en-IN')}/night
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleFavorite('hotels', h.id)}
                        className="text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <h3 className="mt-1 font-display text-lg font-semibold text-slate-900">
                      {h.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600">{h.location}</p>
                    <button
                      type="button"
                      onClick={() => onSelectHotelInTrip(h.destinationId, h)}
                      className="mt-4 rounded-lg bg-teal-700 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-teal-800"
                    >
                      Select Stay for Trip
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(favRestaurants.length > 0 || favActivities.length > 0) && (
            <section>
              <h2 className="font-display text-xl font-semibold text-slate-900">
                Saved Dining &amp; Activities ({favRestaurants.length + favActivities.length})
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {favRestaurants.map((r) => (
                  <div key={r.id} className="border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Restaurant · {r.cuisine}</span>
                      <button
                        type="button"
                        onClick={() => onToggleFavorite('restaurants', r.id)}
                        className="text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <h3 className="mt-1 font-display text-lg font-semibold text-slate-900">
                      {r.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600">{r.shortDescription}</p>
                  </div>
                ))}
                {favActivities.map((a) => (
                  <div key={a.id} className="border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Activity · {a.category}</span>
                      <button
                        type="button"
                        onClick={() => onToggleFavorite('activities', a.id)}
                        className="text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <h3 className="mt-1 font-display text-lg font-semibold text-slate-900">
                      {a.name}
                    </h3>
                    <p className="mt-1 text-xs text-slate-600">{a.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
