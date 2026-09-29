import React, { useState, useMemo } from 'react';
import { DESTINATIONS, getPlacesForDestination } from '../data/destinations';
import { Destination, PlaceToVisit, RegionType } from '../types/travel';
import { VisualMedia } from './VisualMedia';
import { ArrowRight, Search } from 'lucide-react';

interface HomePageProps {
  departureCity: string;
  selectedDestinationId: string;
  onUpdateDeparture: (city: string) => void;
  onStartPlanningWithDestination: (dest: Destination) => void;
  onLaunchTripPlanner: () => void;
  onInspectPlace: (place: PlaceToVisit) => void;
  onOpenExplore: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  departureCity,
  selectedDestinationId,
  onUpdateDeparture,
  onStartPlanningWithDestination,
  onLaunchTripPlanner,
  onInspectPlace,
  onOpenExplore,
}) => {
  const [regionFilter, setRegionFilter] = useState<'All' | RegionType>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickDestId, setQuickDestId] = useState(selectedDestinationId || 'goa');

  const filteredDestinations = useMemo(() => {
    return DESTINATIONS.filter((d) => {
      const matchesRegion = regionFilter === 'All' || d.region === regionFilter;
      const matchesSearch =
        !searchQuery ||
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.shortDescription.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesRegion && matchesSearch;
    });
  }, [regionFilter, searchQuery]);

  const popularDestinations = useMemo(
    () => DESTINATIONS.filter((d) => d.popularityTag === 'Popular').slice(0, 4),
    []
  );

  const trendingDestinations = useMemo(
    () => DESTINATIONS.filter((d) => d.isTrending).slice(0, 4),
    []
  );

  const hiddenGemSpots = useMemo(() => {
    return [
      ...getPlacesForDestination(DESTINATIONS[0]).filter((p) => p.isHiddenGem),
      ...getPlacesForDestination(DESTINATIONS[1]).filter((p) => p.isHiddenGem),
    ].slice(0, 4);
  }, []);

  const indiaDestinations = useMemo(
    () => DESTINATIONS.filter((d) => d.region === 'India'),
    []
  );

  const worldDestinations = useMemo(
    () => DESTINATIONS.filter((d) => d.region === 'International'),
    []
  );

  const howItWorksSteps = [
    {
      num: '01.',
      title: "Choose where you're going",
      desc: 'Select from 20 curated destinations across India and the world, check seasonal weather advisories, and set your travel dates.',
    },
    {
      num: '02.',
      title: 'Compare transportation',
      desc: 'Enter your exact departure city to compare flights, trains, buses, and cabs side-by-side by price, speed, and comfort.',
    },
    {
      num: '03.',
      title: 'Pick your stay',
      desc: 'Browse multiple hotels, resorts, villas, and homestays organized from ₹1,000 budget stays to luxury sanctuaries.',
    },
    {
      num: '04.',
      title: 'Discover places',
      desc: 'Explore iconic landmarks alongside uncrowded hidden gems, regional restaurants, and adventure activities.',
    },
    {
      num: '05.',
      title: 'Build your trip',
      desc: 'Every transport, stay, attraction, and restaurant you choose is added to your live My Trip basket with real-time budget tracking.',
    },
    {
      num: '06.',
      title: 'Get your personalized itinerary',
      desc: 'Our invisible AI engine groups nearby places, respects opening hours and your budget, and creates an editable day-by-day plan.',
    },
  ];

  return (
    <div>
      {/* ================================================================== */}
      {/* 1. HERO SECTION                                                    */}
      {/* ================================================================== */}
      <section className="relative mx-auto max-w-[1380px] px-4 pt-6 sm:px-6 lg:px-8">
        <div className="relative min-h-[540px] w-full overflow-hidden border border-slate-200">
          <VisualMedia
            theme="coastal"
            seed="hero"
            alt="Plan & Wander coastal sanctuary at golden hour"
            overlayGradient
            className="absolute inset-0 h-full w-full"
          />

          <div className="relative z-10 flex min-h-[540px] flex-col justify-end p-6 sm:p-12 lg:p-16">
            <div className="max-w-3xl">
              <div className="text-xs font-medium tracking-wide text-white/85">
                Plan the journey. Wander the world. · EXPLORE → COMPARE → CHOOSE → BUILD → PLAN
              </div>

              <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Where will you wander next?
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
                Discover places, compare your options, build your perfect trip, and let AI organize
                everything for you.
              </p>
            </div>

            {/* Interactive Route & Trip Launcher Bar */}
            <div className="mt-8 max-w-4xl border border-white/25 bg-white/95 p-4 backdrop-blur-md sm:p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-12 sm:items-end">
                <div className="sm:col-span-4">
                  <label
                    htmlFor="hero-departure"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Travelling From (Departure)
                  </label>
                  <input
                    id="hero-departure"
                    type="text"
                    value={departureCity}
                    onChange={(e) => onUpdateDeparture(e.target.value)}
                    placeholder="e.g., Visakhapatnam"
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-teal-700 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-5">
                  <label
                    htmlFor="hero-destination"
                    className="block text-xs font-semibold text-slate-700"
                  >
                    Destination (Arrival)
                  </label>
                  <select
                    id="hero-destination"
                    value={quickDestId}
                    onChange={(e) => setQuickDestId(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-teal-700 focus:outline-none"
                  >
                    <optgroup label="Explore India (10)">
                      {indiaDestinations.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} — From ₹{d.startingBudget.toLocaleString('en-IN')}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Explore the World (10)">
                      {worldDestinations.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}, {d.country} — From ₹{d.startingBudget.toLocaleString('en-IN')}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <button
                    type="button"
                    onClick={() => {
                      const chosen =
                        DESTINATIONS.find((d) => d.id === quickDestId) || DESTINATIONS[0];
                      onStartPlanningWithDestination(chosen);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-teal-800 whitespace-nowrap"
                  >
                    <span>Plan My Trip</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 2. HOW PLAN & WANDER WORKS (6 Editorial Steps)                     */}
      {/* ================================================================== */}
      <section className="mx-auto mt-16 max-w-[1380px] px-4 sm:px-6 lg:px-8">
        <div className="border-y border-slate-200 py-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs text-slate-500">
                Visual Travel Planning Workspace · You Make Every Decision
              </div>
              <h2 className="mt-1 font-display text-2xl font-semibold text-slate-900 sm:text-3xl">
                How Plan &amp; Wander Works
              </h2>
            </div>
            <button
              type="button"
              onClick={onLaunchTripPlanner}
              className="text-xs font-semibold text-teal-800 hover:underline"
            >
              Launch Interactive Trip Builder →
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6">
            {howItWorksSteps.map((step) => (
              <div key={step.num} className="border-l border-slate-200 pl-4">
                <div className="font-mono text-sm font-semibold text-teal-800">{step.num}</div>
                <h3 className="mt-1.5 font-display text-base font-semibold text-slate-900">
                  {step.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 3. BROWSE ALL 20 DESTINATIONS (All | India | International)        */}
      {/* ================================================================== */}
      <section className="mx-auto mt-14 max-w-[1380px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500">
              20 Curated Destinations · Transparent Budgets &amp; Seasonal Windows
            </div>
            <h2 className="mt-1 font-display text-3xl font-semibold text-slate-900">
              Explore Destinations: All | India | International
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search destinations..."
                className="rounded-lg border border-slate-300 bg-white py-1.5 pr-3 pl-8 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
              {(['All', 'India', 'International'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setRegionFilter(tab)}
                  className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    regionFilter === tab
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredDestinations.map((dest) => (
            <div
              key={dest.id}
              onClick={() => onStartPlanningWithDestination(dest)}
              className="group flex cursor-pointer flex-col justify-between border border-slate-200 bg-white transition-colors hover:border-slate-300"
            >
              <div>
                <div className="h-52 w-full">
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
                    <span className="font-mono font-semibold text-slate-900">
                      ₹{dest.startingBudget.toLocaleString('en-IN')}+
                    </span>
                  </div>

                  <h3 className="mt-1.5 font-display text-xl font-semibold text-slate-900 group-hover:text-teal-800">
                    {dest.name}
                  </h3>

                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600">
                    {dest.shortDescription}
                  </p>

                  <div className="mt-3 border-t border-slate-100 pt-2.5 text-xs text-slate-500">
                    Best time: <span className="text-slate-800">{dest.bestTimeToVisit}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 bg-[#FBFBF9] px-5 py-3 text-xs font-semibold text-teal-800">
                <span>Plan {departureCity || 'Visakhapatnam'} → {dest.name}</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================== */}
      {/* 4. POPULAR DESTINATIONS & TRENDING PLACES                          */}
      {/* ================================================================== */}
      <section className="mx-auto mt-16 max-w-[1380px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Popular Destinations */}
          <div className="border border-slate-200 bg-white p-6">
            <div className="text-xs text-slate-500">Most Planned Classics</div>
            <h2 className="mt-0.5 font-display text-2xl font-semibold text-slate-900">
              Popular Destinations
            </h2>
            <div className="mt-5 space-y-4">
              {popularDestinations.map((d) => (
                <div
                  key={d.id}
                  onClick={() => onStartPlanningWithDestination(d)}
                  className="group flex cursor-pointer items-center gap-4 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="h-20 w-28 shrink-0 overflow-hidden">
                    <VisualMedia
                      theme={d.visualTheme}
                      seed={d.id}
                      alt={d.name}
                      className="h-full w-full"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-slate-500">
                      {d.country} · Best: {d.bestTimeToVisit}
                    </div>
                    <h3 className="font-display text-base font-semibold text-slate-900 group-hover:text-teal-800">
                      {d.name}
                    </h3>
                    <p className="truncate text-xs text-slate-600">{d.shortDescription}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-semibold text-slate-900">
                      ₹{d.startingBudget.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[11px] font-medium text-teal-700">Plan →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Places */}
          <div className="border border-slate-200 bg-white p-6">
            <div className="text-xs text-slate-500">High-Momentum Escapes</div>
            <h2 className="mt-0.5 font-display text-2xl font-semibold text-slate-900">
              Trending Places
            </h2>
            <div className="mt-5 space-y-4">
              {trendingDestinations.map((d) => (
                <div
                  key={d.id}
                  onClick={() => onStartPlanningWithDestination(d)}
                  className="group flex cursor-pointer items-center gap-4 border-b border-slate-100 pb-4 last:border-b-0 last:pb-0"
                >
                  <div className="h-20 w-28 shrink-0 overflow-hidden">
                    <VisualMedia
                      theme={d.visualTheme}
                      seed={`${d.id}-trend`}
                      alt={d.name}
                      className="h-full w-full"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-slate-500">
                      {d.country} · Trending Season: {d.bestTimeToVisit}
                    </div>
                    <h3 className="font-display text-base font-semibold text-slate-900 group-hover:text-teal-800">
                      {d.name}
                    </h3>
                    <p className="truncate text-xs text-slate-600">{d.tagline}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm font-semibold text-slate-900">
                      ₹{d.startingBudget.toLocaleString('en-IN')}
                    </div>
                    <span className="text-[11px] font-medium text-teal-700">Plan →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* 5. HIDDEN GEMS SPOTLIGHT                                           */}
      {/* ================================================================== */}
      <section className="mx-auto mt-16 max-w-[1380px] px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs text-slate-500">Beyond the Crowds · Less-Visited Sanctuaries</div>
            <h2 className="mt-1 font-display text-2xl font-semibold text-slate-900 sm:text-3xl">
              Hidden Gems
            </h2>
          </div>
          <button
            type="button"
            onClick={onOpenExplore}
            className="text-xs font-semibold text-teal-800 hover:underline"
          >
            Explore All Hidden Gems →
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {hiddenGemSpots.map((gem) => (
            <div
              key={gem.id}
              className="group flex flex-col justify-between border border-slate-200 bg-white"
            >
              <div>
                <div className="h-44 w-full">
                  <VisualMedia
                    theme={gem.visualTheme}
                    seed={gem.id}
                    alt={gem.name}
                    className="h-full w-full"
                  />
                </div>
                <div className="p-5">
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-teal-800">Hidden Gem</span> · ★{' '}
                    {gem.rating.toFixed(1)}
                  </div>
                  <h3 className="mt-1 font-display text-lg font-semibold text-slate-900">
                    {gem.name}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                    {gem.shortDescription}
                  </p>
                </div>
              </div>
              <div className="border-t border-slate-200 px-5 py-3">
                <button
                  type="button"
                  onClick={() => onInspectPlace(gem)}
                  className="text-xs font-semibold text-slate-800 hover:text-teal-800 hover:underline"
                >
                  Inspect Gem &amp; Add to Trip →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================== */}
      {/* 6. EXPLORE INDIA & EXPLORE THE WORLD QUICK ATLAS                   */}
      {/* ================================================================== */}
      <section className="mx-auto mt-16 mb-16 max-w-[1380px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="border border-slate-200 bg-white p-6">
            <div className="text-xs text-slate-500">Domestic Collection · 10 Iconic Regions</div>
            <h2 className="mt-1 font-display text-2xl font-semibold text-slate-900">
              Explore India
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              From Himalayan passes in Ladakh and Kashmir to royal palaces in Udaipur and coral reefs in Andaman.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {indiaDestinations.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onStartPlanningWithDestination(d)}
                  className="rounded-md border border-slate-200 bg-[#FBFBF9] px-3 py-1.5 text-xs font-medium text-slate-800 hover:border-teal-700 hover:text-teal-800"
                >
                  {d.name} · ₹{d.startingBudget.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-slate-200 bg-white p-6">
            <div className="text-xs text-slate-500">Global Collection · 10 International Journeys</div>
            <h2 className="mt-1 font-display text-2xl font-semibold text-slate-900">
              Explore the World
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              From Bali’s terraced valleys and Japan’s shrines to Swiss alpine trains and Australian coastlines.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {worldDestinations.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => onStartPlanningWithDestination(d)}
                  className="rounded-md border border-slate-200 bg-[#FBFBF9] px-3 py-1.5 text-xs font-medium text-slate-800 hover:border-teal-700 hover:text-teal-800"
                >
                  {d.name} ({d.country}) · ₹{d.startingBudget.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
