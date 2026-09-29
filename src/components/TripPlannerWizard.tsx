import React, { useState, useMemo } from 'react';
import {
  DESTINATIONS,
  getActivitiesForDestination,
  getHotelsForDestination,
  getLocalTransportOptions,
  getPlacesForDestination,
  getRestaurantsForDestination,
  getTransportOptionsForRoute,
  getTripComparisonOptions,
} from '../data/destinations';
import {
  ActivityOption,
  Destination,
  FavoritesState,
  HotelOption,
  InterestOption,
  ItineraryDay,
  ItinerarySlot,
  PlaceCategory,
  PlaceToVisit,
  RegionType,
  RestaurantCategory,
  RestaurantOption,
  StayBudgetTier,
  StayPropertyType,
  TransportCategory,
  TravelStyleOption,
  TripState,
} from '../types/travel';
import {
  applyPackageToTripState,
  buildLocalSmartItinerary,
  calculateTripBudgetBreakdown,
} from '../services/itineraryEngine';
import { VisualMedia } from './VisualMedia';
import { InteractiveMap } from './InteractiveMap';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Search,
  Heart,
  SlidersHorizontal,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Bookmark,
  AlertTriangle,
  Calendar,
  Users,
  Compass,
} from 'lucide-react';

interface TripPlannerWizardProps {
  trip: TripState;
  activeStep: number;
  setActiveStep: (step: number) => void;
  updateTrip: (updater: (prev: TripState) => TripState) => void;
  favorites: FavoritesState;
  onToggleFavorite: (kind: keyof FavoritesState, id: string) => void;
  onInspectPlace: (place: PlaceToVisit) => void;
  onInspectHotel: (hotel: HotelOption) => void;
  onGenerateItinerary: () => Promise<void>;
  isGeneratingItinerary: boolean;
  onSaveTrip: () => void;
  savedNotice: string | null;
}

const TRAVEL_STYLES: TravelStyleOption[] = [
  'Budget',
  'Balanced',
  'Comfort',
  'Luxury',
  'Adventure',
  'Relaxed',
  'Family',
  'Romantic',
  'Cultural',
  'Nature',
  'Food-focused',
  'Photography',
];

const INTEREST_OPTIONS: InterestOption[] = [
  'Beaches',
  'Mountains',
  'History',
  'Culture',
  'Food',
  'Shopping',
  'Nature',
  'Adventure',
  'Photography',
  'Nightlife',
  'Spirituality',
  'Hidden gems',
];

const DEPARTURE_PRESETS = [
  'Visakhapatnam',
  'Mumbai',
  'New Delhi',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
];

export const TripPlannerWizard: React.FC<TripPlannerWizardProps> = ({
  trip,
  activeStep,
  setActiveStep,
  updateTrip,
  favorites,
  onToggleFavorite,
  onInspectPlace,
  onInspectHotel,
  onGenerateItinerary,
  isGeneratingItinerary,
  onSaveTrip,
  savedNotice,
}) => {
  // Step 1 filters
  const [destSearch, setDestSearch] = useState('');
  const [destRegionFilter, setDestRegionFilter] = useState<'All' | RegionType>('All');

  // Step 2 filters
  const [transportCategoryFilter, setTransportCategoryFilter] = useState<'All' | TransportCategory>('All');
  const [transportSort, setTransportSort] = useState<
    'cheapest' | 'fastest' | 'earliest' | 'latest' | 'comfortable'
  >('cheapest');

  // Step 3 filters
  const [hotelTierFilter, setHotelTierFilter] = useState<'All' | StayBudgetTier>('All');
  const [hotelTypeFilter, setHotelTypeFilter] = useState<'All' | StayPropertyType>('All');

  // Step 4 filters
  const [exploreSubTab, setExploreSubTab] = useState<'places' | 'restaurants' | 'activities'>('places');
  const [placeViewMode, setPlaceViewMode] = useState<'all' | 'popular' | 'gems'>('all');
  const [placeCategoryFilter, setPlaceCategoryFilter] = useState<'All' | PlaceCategory>('All');
  const [restCategoryFilter, setRestCategoryFilter] = useState<'All' | RestaurantCategory>('All');
  const [restDietFilter, setRestDietFilter] = useState<'all' | 'veg' | 'vegan' | 'budget'>('all');

  // Step 6 add custom item state
  const [addingToDayNumber, setAddingToDayNumber] = useState<number | null>(null);

  const currentDestination: Destination = useMemo(
    () => DESTINATIONS.find((d) => d.id === trip.destinationId) || DESTINATIONS[0],
    [trip.destinationId]
  );

  const routeTransports = useMemo(
    () => getTransportOptionsForRoute(trip.departureCity, currentDestination),
    [trip.departureCity, currentDestination]
  );

  const localTransports = useMemo(
    () => getLocalTransportOptions(currentDestination),
    [currentDestination]
  );

  const destinationHotels = useMemo(
    () => getHotelsForDestination(currentDestination),
    [currentDestination]
  );

  const destinationPlaces = useMemo(
    () => getPlacesForDestination(currentDestination),
    [currentDestination]
  );

  const destinationRestaurants = useMemo(
    () => getRestaurantsForDestination(currentDestination),
    [currentDestination]
  );

  const destinationActivities = useMemo(
    () => getActivitiesForDestination(currentDestination),
    [currentDestination]
  );

  const comparisonPackages = useMemo(
    () => getTripComparisonOptions(currentDestination, trip.durationDays),
    [currentDestination, trip.durationDays]
  );

  const budgetBreakdown = useMemo(() => calculateTripBudgetBreakdown(trip), [trip]);

  // Check if selected date/month triggers seasonal advisory
  const isOffSeasonSelected = useMemo(() => {
    const offList = currentDestination.seasonal.offSeasonMonths;
    if (trip.dateMode === 'flexible') {
      return offList.some((m) => trip.preferredMonth.toLowerCase().includes(m.toLowerCase()));
    }
    if (trip.startDate) {
      const monthPart = trip.startDate.split('-')[1] || '';
      return offList.includes(monthPart);
    }
    return false;
  }, [currentDestination, trip.dateMode, trip.preferredMonth, trip.startDate]);

  // Filtered destinations for Step 1
  const filteredDestinations = useMemo(() => {
    return DESTINATIONS.filter((d) => {
      const matchesRegion = destRegionFilter === 'All' || d.region === destRegionFilter;
      const matchesSearch =
        d.name.toLowerCase().includes(destSearch.toLowerCase()) ||
        d.country.toLowerCase().includes(destSearch.toLowerCase()) ||
        d.shortDescription.toLowerCase().includes(destSearch.toLowerCase());
      return matchesRegion && matchesSearch;
    });
  }, [destRegionFilter, destSearch]);

  // Filtered & sorted transport options for Step 2
  const filteredTransports = useMemo(() => {
    const base =
      transportCategoryFilter === 'All'
        ? routeTransports
        : routeTransports.filter((t) => t.category === transportCategoryFilter);

    return [...base].sort((a, b) => {
      if (transportSort === 'cheapest') return a.price - b.price;
      if (transportSort === 'fastest') return a.durationMinutes - b.durationMinutes;
      if (transportSort === 'comfortable') {
        const rank = { Premium: 3, High: 2, Standard: 1 };
        return rank[b.comfortLevel] - rank[a.comfortLevel];
      }
      if (transportSort === 'earliest') return a.departureTime.localeCompare(b.departureTime);
      if (transportSort === 'latest') return b.departureTime.localeCompare(a.departureTime);
      return 0;
    });
  }, [routeTransports, transportCategoryFilter, transportSort]);

  // Filtered hotels for Step 3
  const filteredHotels = useMemo(() => {
    return destinationHotels.filter((h) => {
      const matchesTier = hotelTierFilter === 'All' || h.tier === hotelTierFilter;
      const matchesType = hotelTypeFilter === 'All' || h.propertyType === hotelTypeFilter;
      return matchesTier && matchesType;
    });
  }, [destinationHotels, hotelTierFilter, hotelTypeFilter]);

  // Filtered places for Step 4
  const filteredPlaces = useMemo(() => {
    return destinationPlaces.filter((p) => {
      if (placeViewMode === 'popular' && p.isHiddenGem) return false;
      if (placeViewMode === 'gems' && !p.isHiddenGem) return false;
      if (placeCategoryFilter !== 'All' && p.category !== placeCategoryFilter) return false;
      return true;
    });
  }, [destinationPlaces, placeViewMode, placeCategoryFilter]);

  // Filtered restaurants for Step 4
  const filteredRestaurants = useMemo(() => {
    return destinationRestaurants.filter((r) => {
      if (restCategoryFilter !== 'All' && r.category !== restCategoryFilter) return false;
      if (restDietFilter === 'veg' && !r.isVegetarianFriendly) return false;
      if (restDietFilter === 'vegan' && !r.isVeganFriendly) return false;
      if (restDietFilter === 'budget' && r.averageCostPerPerson > 600) return false;
      return true;
    });
  }, [destinationRestaurants, restCategoryFilter, restDietFilter]);

  // Handlers for toggling trip items
  const handleSelectDestination = (dest: Destination) => {
    updateTrip((prev) => {
      if (prev.destinationId === dest.id) return prev;
      const defaultTransports = getTransportOptionsForRoute(prev.departureCity, dest);
      const defaultLocals = getLocalTransportOptions(dest);
      const defaultHotels = getHotelsForDestination(dest);
      const defaultPlaces = getPlacesForDestination(dest);
      const defaultRests = getRestaurantsForDestination(dest);
      const defaultActs = getActivitiesForDestination(dest);
      return {
        ...prev,
        destinationId: dest.id,
        title: `${dest.name} — ${prev.durationDays} Days`,
        targetBudget: Math.max(dest.startingBudget, prev.targetBudget),
        selectedTransport: defaultTransports[0] || null,
        selectedLocalTransport: defaultLocals[0] || null,
        selectedHotel: defaultHotels[2] || defaultHotels[0] || null,
        selectedPlaces: defaultPlaces.slice(0, 3),
        selectedRestaurants: defaultRests.slice(0, 2),
        selectedActivities: defaultActs.slice(0, 1),
        itinerary: null,
      };
    });
  };

  const togglePlaceInTrip = (place: PlaceToVisit) => {
    updateTrip((prev) => {
      const exists = prev.selectedPlaces.some((p) => p.id === place.id);
      const nextPlaces = exists
        ? prev.selectedPlaces.filter((p) => p.id !== place.id)
        : [...prev.selectedPlaces, place];
      return { ...prev, selectedPlaces: nextPlaces };
    });
  };

  const toggleRestaurantInTrip = (rest: RestaurantOption) => {
    updateTrip((prev) => {
      const exists = prev.selectedRestaurants.some((r) => r.id === rest.id);
      const nextRests = exists
        ? prev.selectedRestaurants.filter((r) => r.id !== rest.id)
        : [...prev.selectedRestaurants, rest];
      return { ...prev, selectedRestaurants: nextRests };
    });
  };

  const toggleActivityInTrip = (act: ActivityOption) => {
    updateTrip((prev) => {
      const exists = prev.selectedActivities.some((a) => a.id === act.id);
      const nextActs = exists
        ? prev.selectedActivities.filter((a) => a.id !== act.id)
        : [...prev.selectedActivities, act];
      return { ...prev, selectedActivities: nextActs };
    });
  };

  // Itinerary Editing Handlers (Step 6)
  const currentItinerary = useMemo(
    () => trip.itinerary || buildLocalSmartItinerary(trip),
    [trip]
  );

  const handleMoveSlot = (dayNumber: number, slotIndex: number, direction: 'up' | 'down') => {
    const baseItin = trip.itinerary || buildLocalSmartItinerary(trip);
    const nextDays = baseItin.days.map((d) => {
      if (d.dayNumber !== dayNumber) return d;
      const newSlots = [...d.slots];
      const targetIndex = direction === 'up' ? slotIndex - 1 : slotIndex + 1;
      if (targetIndex < 0 || targetIndex >= newSlots.length) return d;
      const temp = newSlots[slotIndex];
      newSlots[slotIndex] = newSlots[targetIndex];
      newSlots[targetIndex] = temp;
      return { ...d, slots: newSlots };
    });
    updateTrip((prev) => ({
      ...prev,
      itinerary: { ...baseItin, days: nextDays },
    }));
  };

  const handleRemoveSlot = (dayNumber: number, slotId: string) => {
    const baseItin = trip.itinerary || buildLocalSmartItinerary(trip);
    const nextDays = baseItin.days.map((d) => {
      if (d.dayNumber !== dayNumber) return d;
      const newSlots = d.slots.filter((s) => s.id !== slotId);
      const dailySpend = newSlots.reduce((sum, s) => sum + s.estimatedCost, 0);
      const totalTravelMinutes = newSlots.reduce((sum, s) => sum + s.travelTimeMinutes, 0);
      return { ...d, slots: newSlots, dailySpend, totalTravelMinutes };
    });
    updateTrip((prev) => ({
      ...prev,
      itinerary: { ...baseItin, days: nextDays },
    }));
  };

  const handleUpdateSlotTime = (dayNumber: number, slotId: string, newTime: string) => {
    const baseItin = trip.itinerary || buildLocalSmartItinerary(trip);
    const nextDays = baseItin.days.map((d) => {
      if (d.dayNumber !== dayNumber) return d;
      return {
        ...d,
        slots: d.slots.map((s) => (s.id === slotId ? { ...s, time: newTime } : s)),
      };
    });
    updateTrip((prev) => ({
      ...prev,
      itinerary: { ...baseItin, days: nextDays },
    }));
  };

  const handleAddFreeDay = () => {
    const baseItin = trip.itinerary || buildLocalSmartItinerary(trip);
    const nextDayNum = baseItin.days.length + 1;
    const freeDay: ItineraryDay = {
      dayNumber: nextDayNum,
      title: `DAY ${nextDayNum} — UNHURRIED LEISURE & FREE EXPLORATION`,
      theme: 'Free Day & Spontaneous Discovery',
      dailySpend: 800,
      totalTravelMinutes: 20,
      isFreeDay: true,
      slots: [
        {
          id: `d${nextDayNum}-free-morning`,
          time: '09:30 AM',
          title: `Slow Morning & Breakfast at ${trip.selectedHotel?.name || currentDestination.name}`,
          type: 'rest',
          location: trip.selectedHotel?.location || currentDestination.name,
          travelTimeMinutes: 0,
          distanceKm: 0,
          estimatedCost: 0,
          notes: 'Enjoy pool, spa, or neighborhood walk at your own pace.',
          visualTheme: currentDestination.visualTheme,
        },
        {
          id: `d${nextDayNum}-free-afternoon`,
          time: '04:30 PM',
          title: `Sunset Stroll & Local Cafe Hopping in ${currentDestination.name}`,
          type: 'attraction',
          location: `${currentDestination.name} Waterfront / Old Quarter`,
          travelTimeMinutes: 20,
          distanceKm: 4,
          estimatedCost: 800,
          notes: 'Flexible afternoon reserved for spontaneous discoveries or shopping.',
          visualTheme: currentDestination.visualTheme,
        },
      ],
    };
    updateTrip((prev) => ({
      ...prev,
      durationDays: nextDayNum,
      itinerary: {
        ...baseItin,
        durationDays: nextDayNum,
        days: [...baseItin.days, freeDay],
      },
    }));
  };

  const handleRegenerateDay = (dayNumber: number) => {
    const baseItin = trip.itinerary || buildLocalSmartItinerary(trip);
    const altPlace =
      destinationPlaces[(dayNumber * 2) % destinationPlaces.length] || destinationPlaces[0];
    const altGem =
      destinationPlaces.filter((p) => p.isHiddenGem)[dayNumber % 3] || destinationPlaces[1];
    const altRest =
      destinationRestaurants[dayNumber % destinationRestaurants.length] || destinationRestaurants[0];
    const altAct =
      destinationActivities[dayNumber % destinationActivities.length] || destinationActivities[0];
    const travelersCount = Math.max(1, trip.adults + Math.ceil(trip.children * 0.6));

    const newSlots: ItinerarySlot[] = [
      {
        id: `d${dayNumber}-regen-1-${Date.now()}`,
        time: '09:00 AM',
        title: altPlace.name,
        type: 'attraction',
        location: altPlace.locationArea,
        travelTimeMinutes: altPlace.travelTimeMinutes,
        distanceKm: altPlace.distanceFromHotelKm,
        estimatedCost: altPlace.entryFee * travelersCount,
        notes: `Freshly curated stop — ${altPlace.shortDescription}`,
        visualTheme: altPlace.visualTheme,
        referenceId: altPlace.id,
      },
      {
        id: `d${dayNumber}-regen-2-${Date.now()}`,
        time: '12:45 PM',
        title: `Regional Lunch at ${altRest.name}`,
        type: 'meal',
        location: altRest.cuisine,
        travelTimeMinutes: 14,
        distanceKm: altRest.distanceKm,
        estimatedCost: altRest.averageCostPerPerson * travelersCount,
        notes: `Signature: ${altRest.signatureDish}`,
        visualTheme: currentDestination.visualTheme,
      },
      {
        id: `d${dayNumber}-regen-3-${Date.now()}`,
        time: '03:00 PM',
        title: `${altGem.name} (Hidden Gem)`,
        type: 'attraction',
        location: altGem.locationArea,
        travelTimeMinutes: 18,
        distanceKm: 4.8,
        estimatedCost: altGem.entryFee * travelersCount,
        notes: altGem.shortDescription,
        visualTheme: altGem.visualTheme,
        referenceId: altGem.id,
      },
      {
        id: `d${dayNumber}-regen-4-${Date.now()}`,
        time: '05:30 PM',
        title: altAct.name,
        type: 'activity',
        location: altAct.location,
        travelTimeMinutes: 15,
        distanceKm: 3.5,
        estimatedCost: altAct.pricePerPerson * travelersCount,
        notes: altAct.description,
        visualTheme: currentDestination.visualTheme,
      },
    ];

    const dailySpend = newSlots.reduce((s, slot) => s + slot.estimatedCost, 0);
    const totalTravelMinutes = newSlots.reduce((s, slot) => s + slot.travelTimeMinutes, 0);

    const nextDays = baseItin.days.map((d) =>
      d.dayNumber === dayNumber
        ? {
            ...d,
            title: `DAY ${dayNumber} — CURATED ALTERNATIVE CIRCUIT`,
            slots: newSlots,
            dailySpend,
            totalTravelMinutes,
            isFreeDay: false,
          }
        : d
    );

    updateTrip((prev) => ({
      ...prev,
      itinerary: { ...baseItin, days: nextDays },
    }));
  };

  const handleAddPlaceToDay = (dayNumber: number, place: PlaceToVisit) => {
    const baseItin = trip.itinerary || buildLocalSmartItinerary(trip);
    const travelersCount = Math.max(1, trip.adults + Math.ceil(trip.children * 0.6));
    const newSlot: ItinerarySlot = {
      id: `d${dayNumber}-added-${place.id}-${Date.now()}`,
      time: '04:00 PM',
      title: place.name,
      type: 'attraction',
      location: place.locationArea,
      travelTimeMinutes: place.travelTimeMinutes,
      distanceKm: place.distanceFromHotelKm,
      estimatedCost: place.entryFee * travelersCount,
      notes: place.shortDescription,
      visualTheme: place.visualTheme,
      referenceId: place.id,
    };

    const nextDays = baseItin.days.map((d) => {
      if (d.dayNumber !== dayNumber) return d;
      const nextSlots = [...d.slots, newSlot];
      return {
        ...d,
        slots: nextSlots,
        dailySpend: nextSlots.reduce((s, item) => s + item.estimatedCost, 0),
        totalTravelMinutes: nextSlots.reduce((s, item) => s + item.travelTimeMinutes, 0),
      };
    });

    updateTrip((prev) => {
      const alreadyInPlaces = prev.selectedPlaces.some((p) => p.id === place.id);
      return {
        ...prev,
        selectedPlaces: alreadyInPlaces ? prev.selectedPlaces : [...prev.selectedPlaces, place],
        itinerary: { ...baseItin, days: nextDays },
      };
    });
    setAddingToDayNumber(null);
  };

  const steps = [
    { num: 1, label: '01. Destination & Dates' },
    { num: 2, label: '02. Compare Transport' },
    { num: 3, label: '03. Pick Your Stay' },
    { num: 4, label: '04. Discover Places' },
    { num: 5, label: '05. Budget & Map' },
    { num: 6, label: '06. Final Itinerary' },
  ];

  return (
    <div className="mx-auto max-w-[1380px] px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Route & Step Progress Header */}
      <div className="border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Interactive Trip Builder</span>
              <span aria-hidden="true">·</span>
              <span>EXPLORE → COMPARE → CHOOSE → BUILD → PLAN</span>
            </div>
            <div className="mt-1 flex flex-wrap items-baseline gap-3">
              <h1 className="font-display text-2xl font-semibold text-slate-900 sm:text-3xl">
                {trip.departureCity || 'Visakhapatnam'}{' '}
                <span className="font-sans text-teal-700">→</span> {currentDestination.name}
              </h1>
              <span className="font-mono text-xs text-slate-500">
                {trip.durationDays} Days · {trip.adults} Adults
                {trip.children > 0 ? `, ${trip.children} Children` : ''} · Est. ₹
                {budgetBreakdown.totalEstimated.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {savedNotice && (
              <span className="text-xs font-medium text-emerald-700">{savedNotice}</span>
            )}
            <button
              type="button"
              onClick={onSaveTrip}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50"
            >
              <Bookmark className="h-3.5 w-3.5 text-teal-700" />
              <span>Save Trip</span>
            </button>
            <button
              type="button"
              onClick={async () => {
                setActiveStep(6);
                await onGenerateItinerary();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white hover:bg-teal-800"
            >
              <span>Organize My Itinerary</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Stepper Navigation Buttons */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {steps.map((s) => {
            const isCurrent = activeStep === s.num;
            const isCompleted = activeStep > s.num;
            return (
              <button
                key={s.num}
                type="button"
                onClick={() => setActiveStep(s.num)}
                className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                  isCurrent
                    ? 'border-teal-700 bg-teal-700 text-white'
                    : isCompleted
                    ? 'border-teal-200 bg-teal-50/60 text-teal-950 hover:bg-teal-50'
                    : 'border-slate-200 bg-[#FBFBF9] text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span className="truncate">{s.label}</span>
                {isCompleted && <Check className="h-3.5 w-3.5 shrink-0 text-teal-700" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace Grid: Left 9 Columns Step Content + Right 3 Columns Persistent "My Trip" Sidebar */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-9">
          {/* ============================================================== */}
          {/* STEP 1: DESTINATION, DEPARTURE, DATES, STYLE & INTERESTS       */}
          {/* ============================================================== */}
          {activeStep === 1 && (
            <div className="space-y-8">
              {/* 1A. Departure & Arrival Route Configurator */}
              <section className="border border-slate-200 bg-white p-6">
                <div className="text-xs text-slate-500">
                  <span>Step 01 · Route &amp; Travel Dates</span>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  <span>Departure + Arrival Configuration</span>
                </div>
                <h2 className="mt-1 font-display text-xl font-semibold text-slate-900">
                  Where are you travelling from, and when?
                </h2>

                <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-12">
                  {/* Departure Input */}
                  <div className="md:col-span-5">
                    <label
                      htmlFor="departure-city-input"
                      className="block text-xs font-semibold text-slate-800"
                    >
                      Departure City / Airport / Railway Station
                    </label>
                    <input
                      id="departure-city-input"
                      type="text"
                      value={trip.departureCity}
                      onChange={(e) =>
                        updateTrip((prev) => ({ ...prev, departureCity: e.target.value }))
                      }
                      placeholder="e.g., Visakhapatnam"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 bg-[#FBFBF9] px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-teal-700 focus:outline-none"
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] text-slate-400">Quick pick:</span>
                      {DEPARTURE_PRESETS.map((city) => (
                        <button
                          key={city}
                          type="button"
                          onClick={() =>
                            updateTrip((prev) => ({ ...prev, departureCity: city }))
                          }
                          className={`rounded px-2 py-0.5 text-[11px] transition-colors ${
                            trip.departureCity.toLowerCase() === city.toLowerCase()
                              ? 'bg-teal-700 text-white font-medium'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Route Arrow Visual */}
                  <div className="flex flex-col items-center justify-center md:col-span-2">
                    <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-xs font-semibold text-teal-800">
                      → TO →
                    </div>
                  </div>

                  {/* Arrival Location Display */}
                  <div className="md:col-span-5">
                    <div className="block text-xs font-semibold text-slate-800">
                      Selected Arrival Location
                    </div>
                    <div className="mt-1.5 flex items-center justify-between rounded-lg border border-teal-700/40 bg-teal-50/40 px-3.5 py-2.5">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {currentDestination.name}, {currentDestination.country}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {currentDestination.defaultAirportOrStation}
                        </div>
                      </div>
                      <span className="font-mono text-xs font-semibold text-teal-800">
                        Arrival
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dates, Duration, Travelers & Budget */}
                <div className="mt-6 border-t border-slate-200 pt-6">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="text-xs font-semibold text-slate-900">
                      Travel Dates, Travelers &amp; Target Budget
                    </div>
                    <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                      <button
                        type="button"
                        onClick={() => updateTrip((p) => ({ ...p, dateMode: 'flexible' }))}
                        className={`rounded-md px-3 py-1 text-xs font-medium ${
                          trip.dateMode === 'flexible'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600'
                        }`}
                      >
                        Preferred Month &amp; Duration
                      </button>
                      <button
                        type="button"
                        onClick={() => updateTrip((p) => ({ ...p, dateMode: 'exact' }))}
                        className={`rounded-md px-3 py-1 text-xs font-medium ${
                          trip.dateMode === 'exact'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600'
                        }`}
                      >
                        Exact Start &amp; End Dates
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
                    {trip.dateMode === 'flexible' ? (
                      <div className="lg:col-span-2">
                        <label className="block text-xs text-slate-600">Preferred Month</label>
                        <select
                          value={trip.preferredMonth}
                          onChange={(e) =>
                            updateTrip((p) => ({ ...p, preferredMonth: e.target.value }))
                          }
                          className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900"
                        >
                          {[
                            'January',
                            'February',
                            'March',
                            'April',
                            'May',
                            'June',
                            'July',
                            'August',
                            'September',
                            'October',
                            'November',
                            'December',
                          ].map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <>
                        <div>
                          <label className="block text-xs text-slate-600">Start Date</label>
                          <input
                            type="date"
                            value={trip.startDate}
                            onChange={(e) =>
                              updateTrip((p) => ({ ...p, startDate: e.target.value }))
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 font-mono text-xs text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-slate-600">End Date</label>
                          <input
                            type="date"
                            value={trip.endDate}
                            onChange={(e) =>
                              updateTrip((p) => ({ ...p, endDate: e.target.value }))
                            }
                            className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 font-mono text-xs text-slate-900"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-xs text-slate-600">Trip Duration (Days)</label>
                      <select
                        value={trip.durationDays}
                        onChange={(e) =>
                          updateTrip((p) => ({
                            ...p,
                            durationDays: Number(e.target.value),
                            title: `${currentDestination.name} — ${e.target.value} Days`,
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs font-medium text-slate-900"
                      >
                        {[2, 3, 4, 5, 6, 7, 8, 10].map((d) => (
                          <option key={d} value={d}>
                            {d} Days / {d - 1} Nights
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-600">Adults &amp; Children</label>
                      <div className="mt-1 flex items-center gap-1.5">
                        <select
                          aria-label="Adults"
                          value={trip.adults}
                          onChange={(e) =>
                            updateTrip((p) => ({ ...p, adults: Number(e.target.value) }))
                          }
                          className="w-1/2 rounded-lg border border-slate-300 bg-white px-2 py-2 font-mono text-xs text-slate-900"
                        >
                          {[1, 2, 3, 4, 5, 6].map((n) => (
                            <option key={n} value={n}>
                              {n} Ad
                            </option>
                          ))}
                        </select>
                        <select
                          aria-label="Children"
                          value={trip.children}
                          onChange={(e) =>
                            updateTrip((p) => ({ ...p, children: Number(e.target.value) }))
                          }
                          className="w-1/2 rounded-lg border border-slate-300 bg-white px-2 py-2 font-mono text-xs text-slate-900"
                        >
                          {[0, 1, 2, 3, 4].map((n) => (
                            <option key={n} value={n}>
                              {n} Ch
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-600">Rooms</label>
                      <select
                        value={trip.rooms}
                        onChange={(e) =>
                          updateTrip((p) => ({ ...p, rooms: Number(e.target.value) }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs text-slate-900"
                      >
                        {[1, 2, 3, 4].map((r) => (
                          <option key={r} value={r}>
                            {r} {r === 1 ? 'Room' : 'Rooms'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-600">Target Budget (₹)</label>
                      <input
                        type="number"
                        step={2500}
                        min={10000}
                        value={trip.targetBudget}
                        onChange={(e) =>
                          updateTrip((p) => ({
                            ...p,
                            targetBudget: Math.max(5000, Number(e.target.value) || 0),
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs font-semibold text-slate-900"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* 1B. Best Time to Visit & Seasonal Weather Intelligence */}
              <section className="border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="text-xs text-slate-500">
                      Seasonal Intelligence · {currentDestination.name}
                    </div>
                    <h3 className="mt-0.5 font-display text-lg font-semibold text-slate-900">
                      Best Time to Visit: {currentDestination.seasonal.bestMonths}
                    </h3>
                  </div>
                  <div className="text-xs text-slate-600">
                    <span>Peak: {currentDestination.seasonal.peakSeason}</span>
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span>Off-season: {currentDestination.seasonal.offSeason}</span>
                  </div>
                </div>

                {isOffSeasonSelected && (
                  <div className="mt-4 flex items-start gap-3 border border-amber-300 bg-amber-50/80 p-4 text-xs text-amber-950">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                    <div>
                      <div className="font-semibold">
                        Seasonal Weather Advisory for {trip.dateMode === 'flexible' ? trip.preferredMonth : trip.startDate}
                      </div>
                      <p className="mt-1 leading-relaxed text-slate-700">
                        {currentDestination.seasonal.offSeasonAdvisory} (You can keep your dates or switch months anytime.)
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 sm:grid-cols-4">
                  <div>
                    <div className="text-xs text-slate-500">Temperature &amp; Weather</div>
                    <div className="mt-1 font-mono text-xs font-semibold text-slate-900">
                      {currentDestination.seasonal.temperatureRange}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-600">
                      {currentDestination.seasonal.weatherSummary}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Rainfall &amp; Crowds</div>
                    <div className="mt-1 text-xs font-medium text-slate-900">
                      {currentDestination.seasonal.rainfallLevel}
                    </div>
                    <div className="mt-0.5 text-[11px] text-slate-600">
                      Crowds: {currentDestination.seasonal.crowdLevel}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Festivals &amp; Events</div>
                    <div className="mt-1 text-xs text-slate-800">
                      {currentDestination.seasonal.festivals.join(' · ')}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Seasonal Tariff Note</div>
                    <div className="mt-1 text-xs text-teal-900">
                      {currentDestination.seasonal.priceDifferenceNote}
                    </div>
                  </div>
                </div>
              </section>

              {/* 1C. Where Do You Want to Go? (All 20 Destinations Grid) */}
              <section className="border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-xs text-slate-500">Step 01 · Choose Destination</div>
                    <h2 className="mt-0.5 font-display text-xl font-semibold text-slate-900">
                      Where do you want to go?
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                      <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={destSearch}
                        onChange={(e) => setDestSearch(e.target.value)}
                        placeholder="Search 20 destinations..."
                        className="rounded-lg border border-slate-200 bg-[#FBFBF9] py-1.5 pr-3 pl-8 text-xs text-slate-900 focus:border-teal-700 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                      {(['All', 'India', 'International'] as const).map((reg) => (
                        <button
                          key={reg}
                          type="button"
                          onClick={() => setDestRegionFilter(reg)}
                          className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                            destRegionFilter === reg
                              ? 'bg-white text-slate-900 shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {reg}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredDestinations.map((dest) => {
                    const isSelected = dest.id === trip.destinationId;
                    return (
                      <div
                        key={dest.id}
                        onClick={() => handleSelectDestination(dest)}
                        className={`group cursor-pointer border transition-colors ${
                          isSelected
                            ? 'border-teal-700 bg-teal-50/25 ring-2 ring-teal-700/20'
                            : 'border-slate-200 bg-[#FBFBF9] hover:border-slate-300'
                        }`}
                      >
                        <div className="h-44 w-full">
                          <VisualMedia
                            theme={dest.visualTheme}
                            seed={dest.id}
                            alt={dest.name}
                            className="h-full w-full"
                          />
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>
                              {dest.country} · {dest.popularityTag}
                            </span>
                            <span className="font-mono font-medium text-slate-800">
                              From ₹{dest.startingBudget.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-between">
                            <h3 className="font-display text-lg font-semibold text-slate-900">
                              {dest.name}
                            </h3>
                            {isSelected && (
                              <span className="text-xs font-semibold text-teal-800">
                                Selected ✓
                              </span>
                            )}
                          </div>
                          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-600">
                            {dest.shortDescription}
                          </p>
                          <div className="mt-3 border-t border-slate-200/80 pt-2.5 text-[11px] text-slate-500">
                            Best time: <span className="text-slate-800">{dest.bestTimeToVisit}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 1D. Travel Style & Interests Multi-Select */}
              <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="border border-slate-200 bg-white p-6">
                  <div className="text-xs text-slate-500">Personalize AI Optimization</div>
                  <h3 className="mt-0.5 font-display text-lg font-semibold text-slate-900">
                    What kind of trip do you want? (Travel Style)
                  </h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {TRAVEL_STYLES.map((style) => {
                      const active = trip.travelStyles.includes(style);
                      return (
                        <button
                          key={style}
                          type="button"
                          onClick={() =>
                            updateTrip((prev) => ({
                              ...prev,
                              travelStyles: active
                                ? prev.travelStyles.filter((s) => s !== style)
                                : [...prev.travelStyles, style],
                            }))
                          }
                          className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                            active
                              ? 'border-teal-700 bg-teal-700 text-white'
                              : 'border-slate-200 bg-[#FBFBF9] text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {style}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border border-slate-200 bg-white p-6">
                  <div className="text-xs text-slate-500">Experience Preferences</div>
                  <h3 className="mt-0.5 font-display text-lg font-semibold text-slate-900">
                    What do you want to experience? (Interests)
                  </h3>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map((interest) => {
                      const active = trip.interests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() =>
                            updateTrip((prev) => ({
                              ...prev,
                              interests: active
                                ? prev.interests.filter((i) => i !== interest)
                                : [...prev.interests, interest],
                            }))
                          }
                          className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                            active
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-200 bg-[#FBFBF9] text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </section>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-6 py-3 text-sm font-medium text-white hover:bg-teal-800"
                >
                  <span>Continue to Compare Transportation ({trip.departureCity} → {currentDestination.name})</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 2: TRIP COMPARISON & TRANSPORTATION COMPARISON            */}
          {/* ============================================================== */}
          {activeStep === 2 && (
            <div className="space-y-8">
              {/* 2A. Trip Comparison Packages (Option A, Option B, Option C) */}
              <section className="border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs text-slate-500">
                      Side-by-Side Trip Comparison · Customize Any Baseline
                    </div>
                    <h2 className="mt-0.5 font-display text-xl font-semibold text-slate-900">
                      Compare Trip Architectures for {currentDestination.name} ({trip.durationDays} Days)
                    </h2>
                  </div>
                  <span className="text-xs text-slate-500">
                    Select an option to pre-load selections, or choose individual transport below
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
                  {comparisonPackages.map((pkg) => {
                    const isMatched =
                      trip.selectedHotel?.tier === pkg.hotelTier &&
                      trip.selectedTransport?.category === pkg.transportCategory;
                    return (
                      <div
                        key={pkg.id}
                        className={`flex flex-col justify-between border p-5 ${
                          isMatched
                            ? 'border-teal-700 bg-teal-50/20'
                            : 'border-slate-200 bg-[#FBFBF9]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="font-mono font-semibold text-teal-800">
                              {pkg.label}
                            </span>
                            <span>{pkg.days} Days</span>
                          </div>
                          <h3 className="mt-1 font-display text-lg font-semibold text-slate-900">
                            {pkg.tierName} Trip
                          </h3>
                          <div className="mt-2 font-mono text-2xl font-semibold text-slate-900">
                            ₹{pkg.estimatedTotal.toLocaleString('en-IN')}
                            <span className="font-sans text-xs font-normal text-slate-500">
                              {' '}
                              est. total
                            </span>
                          </div>

                          <div className="mt-4 space-y-1.5 border-t border-slate-200 pt-3 text-xs text-slate-700">
                            <div>
                              <span className="text-slate-500">Transit:</span> {pkg.transportSummary}
                            </div>
                            <div>
                              <span className="text-slate-500">Stay:</span> {pkg.hotelSummary}
                            </div>
                            <div>
                              <span className="text-slate-500">Local:</span> {pkg.localTransportSummary}
                            </div>
                          </div>

                          <ul className="mt-3 space-y-1 text-xs text-slate-600">
                            {pkg.highlights.map((h) => (
                              <li key={h}>· {h}</li>
                            ))}
                          </ul>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            updateTrip((prev) => applyPackageToTripState(prev, pkg.tierName))
                          }
                          className={`mt-5 w-full rounded-lg px-4 py-2.5 text-xs font-medium transition-colors ${
                            isMatched
                              ? 'bg-teal-700 text-white'
                              : 'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          {isMatched
                            ? `Active Baseline (${pkg.tierName}) ✓`
                            : `Load ${pkg.label} & Customize`}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* 2B. Departure -> Arrival Transportation Comparison */}
              <section className="border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span>Demo availability / Estimated price</span>
                      <span aria-hidden="true">·</span>
                      <span>Multi-Modal Comparison</span>
                    </div>
                    <h2 className="mt-1 font-display text-xl font-semibold text-slate-900">
                      {trip.departureCity || 'Visakhapatnam'} → {currentDestination.name} Transportation
                    </h2>
                  </div>

                  {/* Sort Controls */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-slate-500">Filter &amp; Sort:</span>
                    {(
                      [
                        { id: 'cheapest', label: 'Cheapest' },
                        { id: 'fastest', label: 'Fastest' },
                        { id: 'earliest', label: 'Earliest' },
                        { id: 'latest', label: 'Latest' },
                        { id: 'comfortable', label: 'Most comfortable' },
                      ] as const
                    ).map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setTransportSort(s.id)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                          transportSort === s.id
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Transport Mode Tabs */}
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  {(
                    ['All', 'Flights', 'Trains', 'Buses', 'Cabs / Taxis', 'Rental Cars'] as const
                  ).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setTransportCategoryFilter(cat)}
                      className={`rounded-lg px-3.5 py-2 text-xs font-medium transition-colors ${
                        transportCategoryFilter === cat
                          ? 'bg-teal-700 text-white'
                          : 'border border-slate-200 bg-[#FBFBF9] text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Transport Cards List */}
                <div className="mt-5 space-y-3">
                  {filteredTransports.map((item) => {
                    const isSelected = trip.selectedTransport?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        className={`flex flex-wrap items-center justify-between gap-4 border p-4 transition-colors ${
                          isSelected
                            ? 'border-teal-700 bg-teal-50/25'
                            : 'border-slate-200 bg-[#FBFBF9] hover:border-slate-300'
                        }`}
                      >
                        <div className="min-w-[200px] flex-1">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-semibold text-slate-800">{item.category}</span>
                            <span aria-hidden="true">·</span>
                            <span>{item.operator}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono">{item.code}</span>
                          </div>
                          <div className="mt-1.5 flex items-baseline gap-3">
                            <span className="font-mono text-base font-semibold text-slate-900">
                              {item.departureTime} → {item.arrivalTime}
                            </span>
                            <span className="font-mono text-xs text-slate-600">
                              {item.durationLabel}
                            </span>
                            <span className="text-xs text-slate-500">({item.stopsLabel})</span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span>
                              Route: {item.departureCity} → {item.arrivalCity}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>Class: {item.seatClass}</span>
                            <span aria-hidden="true">·</span>
                            <span>Comfort: {item.comfortLevel}</span>
                            <span aria-hidden="true">·</span>
                            <span className="text-teal-800">{item.availability}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-mono text-lg font-semibold text-slate-900">
                              ₹{item.price.toLocaleString('en-IN')}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Est. price / person
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              updateTrip((prev) => ({ ...prev, selectedTransport: item }))
                            }
                            className={`rounded-lg px-4 py-2.5 text-xs font-medium transition-colors ${
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
              </section>

              {/* 2C. Local Transportation at Destination */}
              <section className="border border-slate-200 bg-white p-6">
                <div className="text-xs text-slate-500">
                  Step 02 · Local Mobility in {currentDestination.name}
                </div>
                <h2 className="mt-0.5 font-display text-xl font-semibold text-slate-900">
                  How do you want to get around after arriving in {currentDestination.name}?
                </h2>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {localTransports.map((loc) => {
                    const isSelected = trip.selectedLocalTransport?.id === loc.id;
                    return (
                      <div
                        key={loc.id}
                        className={`flex flex-col justify-between border p-4 ${
                          isSelected
                            ? 'border-teal-700 bg-teal-50/25'
                            : 'border-slate-200 bg-[#FBFBF9]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="font-medium text-slate-800">{loc.type}</span>
                            <span>Comfort: {loc.comfort}</span>
                          </div>
                          <h3 className="mt-1 font-display text-base font-semibold text-slate-900">
                            {loc.name}
                          </h3>
                          <p className="mt-1 text-xs text-slate-600">{loc.description}</p>

                          <div className="mt-3 space-y-1 border-t border-slate-200/80 pt-2.5 text-xs text-slate-600">
                            <div>Avg travel time: {loc.averageTravelTime}</div>
                            <div>Coverage: {loc.coverageDistance}</div>
                            <div className="text-teal-800">{loc.availability}</div>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                          <span className="font-mono text-sm font-semibold text-slate-900">
                            ₹{loc.estimatedPricePerDay.toLocaleString('en-IN')}/day
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateTrip((prev) => ({ ...prev, selectedLocalTransport: loc }))
                            }
                            className={`rounded-md px-3.5 py-1.5 text-xs font-medium ${
                              isSelected
                                ? 'bg-teal-700 text-white'
                                : 'border border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                            }`}
                          >
                            {isSelected ? 'Selected ✓' : 'Select'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Destination &amp; Dates</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-6 py-3 text-sm font-medium text-white hover:bg-teal-800"
                >
                  <span>Continue to Hotels &amp; Stays</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 3: HOTELS / STAY                                          */}
          {/* ============================================================== */}
          {activeStep === 3 && (
            <div className="space-y-8">
              <section className="border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <div className="text-xs text-slate-500">
                      Step 03 · Curated Stays in {currentDestination.name} · Demo Availability
                    </div>
                    <h2 className="mt-0.5 font-display text-xl font-semibold text-slate-900">
                      Where do you want to stay in {currentDestination.name}?
                    </h2>
                  </div>
                  <div className="font-mono text-xs text-slate-600">
                    Calculating for {Math.max(1, trip.durationDays - 1)} nights · {trip.rooms}{' '}
                    {trip.rooms === 1 ? 'room' : 'rooms'}
                  </div>
                </div>

                {/* Budget Tier Filters */}
                <div className="mt-4">
                  <div className="text-xs font-medium text-slate-600">Stay Budget Tier</div>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {(
                      [
                        { id: 'All', sub: 'All price ranges' },
                        { id: 'Budget Stay', sub: '₹1,000–₹3,000/night' },
                        { id: 'Comfortable Stay', sub: '₹3,000–₹7,000/night' },
                        { id: 'Premium Stay', sub: '₹7,000–₹15,000/night' },
                        { id: 'Luxury Stay', sub: '₹15,000+/night' },
                      ] as const
                    ).map((tier) => (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => setHotelTierFilter(tier.id)}
                        className={`rounded-lg border p-2.5 text-left transition-colors ${
                          hotelTierFilter === tier.id
                            ? 'border-teal-700 bg-teal-700 text-white'
                            : 'border-slate-200 bg-[#FBFBF9] text-slate-800 hover:bg-slate-100'
                        }`}
                      >
                        <div className="text-xs font-semibold">{tier.id}</div>
                        <div
                          className={`mt-0.5 font-mono text-[10px] ${
                            hotelTierFilter === tier.id ? 'text-teal-100' : 'text-slate-500'
                          }`}
                        >
                          {tier.sub}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Property Type Filters */}
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  {(
                    [
                      'All',
                      'Hotels',
                      'Resorts',
                      'Hostels',
                      'Villas',
                      'Homestays',
                      'Beach stays',
                      'Mountain stays',
                      'City stays',
                    ] as const
                  ).map((pt) => (
                    <button
                      key={pt}
                      type="button"
                      onClick={() => setHotelTypeFilter(pt)}
                      className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                        hotelTypeFilter === pt
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {pt}
                    </button>
                  ))}
                </div>

                {/* Hotels Grid */}
                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                  {filteredHotels.map((hotel) => {
                    const isSelected = trip.selectedHotel?.id === hotel.id;
                    const isFav = favorites.hotels.includes(hotel.id);
                    const nights = Math.max(1, trip.durationDays - 1);
                    const totalStay = hotel.pricePerNight * nights * Math.max(1, trip.rooms);

                    return (
                      <div
                        key={hotel.id}
                        className={`group flex flex-col justify-between border transition-colors ${
                          isSelected
                            ? 'border-teal-700 bg-teal-50/25 ring-2 ring-teal-700/20'
                            : 'border-slate-200 bg-[#FBFBF9] hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="relative h-52 w-full">
                            <VisualMedia
                              theme={hotel.visualTheme}
                              seed={hotel.id}
                              alt={hotel.name}
                              className="h-full w-full"
                            />
                            <button
                              type="button"
                              onClick={() => onToggleFavorite('hotels', hotel.id)}
                              aria-label="Toggle favorite hotel"
                              className="absolute top-3 right-3 rounded-full bg-white/90 p-2 text-slate-700 hover:bg-white"
                            >
                              <Heart
                                className={`h-4 w-4 ${
                                  isFav ? 'fill-rose-600 text-rose-600' : ''
                                }`}
                              />
                            </button>
                          </div>

                          <div className="p-5">
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                              <span className="font-medium text-teal-800">{hotel.tier}</span>
                              <span aria-hidden="true">·</span>
                              <span>{hotel.propertyType}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono text-slate-800">
                                ★ {hotel.rating.toFixed(1)} ({hotel.reviewsCount} reviews)
                              </span>
                            </div>

                            <h3 className="mt-1.5 font-display text-lg font-semibold text-slate-900">
                              {hotel.name}
                            </h3>

                            <div className="mt-1 text-xs text-slate-600">
                              {hotel.location} · {hotel.distanceFromCenter}
                            </div>

                            <div className="mt-3 space-y-1 border-y border-slate-200/80 py-2.5 text-xs text-slate-700">
                              <div>
                                <span className="text-slate-500">Room:</span> {hotel.roomType}
                              </div>
                              <div>
                                <span className="text-slate-500">Breakfast:</span>{' '}
                                {hotel.breakfastIncluded ? 'Included daily' : 'Optional add-on'}
                              </div>
                              <div>
                                <span className="text-slate-500">Cancellation:</span>{' '}
                                {hotel.cancellationPolicy}
                              </div>
                            </div>

                            <div className="mt-2.5 text-xs text-slate-500">
                              {hotel.amenities.join(' · ')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-4">
                          <div>
                            <div className="font-mono text-lg font-semibold text-slate-900">
                              ₹{hotel.pricePerNight.toLocaleString('en-IN')}
                              <span className="font-sans text-xs font-normal text-slate-500">
                                /night
                              </span>
                            </div>
                            <div className="font-mono text-xs text-teal-800">
                              Total stay: ₹{totalStay.toLocaleString('en-IN')}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onInspectHotel(hotel)}
                              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              View Details
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                updateTrip((prev) => ({ ...prev, selectedHotel: hotel }))
                              }
                              className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
                                isSelected
                                  ? 'bg-teal-700 text-white'
                                  : 'bg-slate-900 text-white hover:bg-slate-800'
                              }`}
                            >
                              {isSelected ? 'Selected ✓' : 'Select Stay'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Transportation</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(4)}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-6 py-3 text-sm font-medium text-white hover:bg-teal-800"
                >
                  <span>Continue to Explore {currentDestination.name} Places</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 4: EXPLORE PLACES, HIDDEN GEMS, RESTAURANTS & ACTIVITIES  */}
          {/* ============================================================== */}
          {activeStep === 4 && (
            <div className="space-y-8">
              <section className="border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <div className="text-xs text-slate-500">
                      Step 04 · Visual Discovery &amp; Curation
                    </div>
                    <h2 className="mt-0.5 font-display text-2xl font-semibold text-slate-900">
                      Explore {currentDestination.name}
                    </h2>
                  </div>

                  {/* Sub-Section Switcher: Attractions | Restaurants | Activities */}
                  <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                    <button
                      type="button"
                      onClick={() => setExploreSubTab('places')}
                      className={`rounded-md px-3.5 py-1.5 text-xs font-medium ${
                        exploreSubTab === 'places'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Attractions &amp; Hidden Gems ({destinationPlaces.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setExploreSubTab('restaurants')}
                      className={`rounded-md px-3.5 py-1.5 text-xs font-medium ${
                        exploreSubTab === 'restaurants'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Restaurants ({destinationRestaurants.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setExploreSubTab('activities')}
                      className={`rounded-md px-3.5 py-1.5 text-xs font-medium ${
                        exploreSubTab === 'activities'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Activities ({destinationActivities.length})
                    </button>
                  </div>
                </div>

                {/* 4A. PLACES TO VISIT (POPULAR ATTRACTIONS & HIDDEN GEMS) */}
                {exploreSubTab === 'places' && (
                  <div className="mt-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        {(
                          [
                            { id: 'all', label: 'All Places' },
                            { id: 'popular', label: 'Popular Attractions' },
                            { id: 'gems', label: 'Hidden Gems Only' },
                          ] as const
                        ).map((mode) => (
                          <button
                            key={mode.id}
                            type="button"
                            onClick={() => setPlaceViewMode(mode.id)}
                            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                              placeViewMode === mode.id
                                ? 'bg-teal-700 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {mode.label}
                          </button>
                        ))}
                      </div>

                      {/* Category Filter */}
                      <select
                        value={placeCategoryFilter}
                        onChange={(e) =>
                          setPlaceCategoryFilter(e.target.value as 'All' | PlaceCategory)
                        }
                        className="rounded-lg border border-slate-200 bg-[#FBFBF9] px-3 py-1.5 text-xs font-medium text-slate-800"
                      >
                        <option value="All">All Categories</option>
                        {[
                          'Historical',
                          'Nature',
                          'Beaches',
                          'Mountains',
                          'Adventure',
                          'Shopping',
                          'Food',
                          'Museums',
                          'Temples',
                          'Religious places',
                          'Nightlife',
                          'Photography',
                          'Hidden Gems',
                          'Family activities',
                        ].map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                      {filteredPlaces.map((place) => {
                        const inTrip = trip.selectedPlaces.some((p) => p.id === place.id);
                        const isFav = favorites.places.includes(place.id);

                        return (
                          <div
                            key={place.id}
                            className={`group flex flex-col justify-between border transition-colors ${
                              inTrip
                                ? 'border-teal-700 bg-teal-50/20'
                                : 'border-slate-200 bg-[#FBFBF9] hover:border-slate-300'
                            }`}
                          >
                            <div>
                              <div className="relative h-52 w-full">
                                <VisualMedia
                                  theme={place.visualTheme}
                                  seed={place.id}
                                  alt={place.name}
                                  className="h-full w-full"
                                />
                                <button
                                  type="button"
                                  onClick={() => onToggleFavorite('places', place.id)}
                                  aria-label="Favorite place"
                                  className="absolute top-3 right-3 rounded-full bg-white/90 p-2 text-slate-700 hover:bg-white"
                                >
                                  <Heart
                                    className={`h-4 w-4 ${
                                      isFav ? 'fill-rose-600 text-rose-600' : ''
                                    }`}
                                  />
                                </button>
                              </div>

                              <div className="p-5">
                                <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                                  <span className="font-medium text-slate-800">
                                    {place.category}
                                  </span>
                                  {place.isHiddenGem && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span className="font-semibold text-teal-800">
                                        Hidden Gem
                                      </span>
                                    </>
                                  )}
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono text-slate-800">
                                    ★★★★★ {place.rating.toFixed(1)} ({place.reviewsCount})
                                  </span>
                                </div>

                                <h3 className="mt-1.5 font-display text-lg font-semibold text-slate-900">
                                  {place.name}
                                </h3>

                                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                                  {place.shortDescription}
                                </p>

                                <div className="mt-4 space-y-1 border-t border-slate-200/80 pt-3 text-xs text-slate-600">
                                  <div className="flex items-center justify-between">
                                    <span>
                                      Entry:{' '}
                                      <strong className="font-mono text-slate-900">
                                        {place.entryFee === 0 ? '₹0 Entry' : `₹${place.entryFee}`}
                                      </strong>
                                    </span>
                                    <span>Duration: {place.recommendedDuration}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>Best time: {place.bestTimeToVisit}</span>
                                    <span className="font-mono text-teal-800">
                                      {place.travelTimeMinutes} min from your hotel
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-3.5">
                              <button
                                type="button"
                                onClick={() => onInspectPlace(place)}
                                className="text-xs font-medium text-slate-700 hover:text-slate-900 hover:underline"
                              >
                                View Details
                              </button>

                              <button
                                type="button"
                                onClick={() => togglePlaceInTrip(place)}
                                className={`rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
                                  inTrip
                                    ? 'bg-teal-700 text-white'
                                    : 'bg-slate-900 text-white hover:bg-slate-800'
                                }`}
                              >
                                {inTrip ? 'Added to Trip ✓' : 'Add to Trip'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4B. RESTAURANTS & DINING */}
                {exploreSubTab === 'restaurants' && (
                  <div className="mt-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(
                          [
                            'All',
                            'Breakfast',
                            'Lunch',
                            'Dinner',
                            'Cafes',
                            'Street Food',
                            'Fine Dining',
                          ] as const
                        ).map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setRestCategoryFilter(cat)}
                            className={`rounded-md px-3 py-1 text-xs font-medium ${
                              restCategoryFilter === cat
                                ? 'bg-teal-700 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {(
                          [
                            { id: 'all', label: 'All Diets' },
                            { id: 'veg', label: 'Vegetarian' },
                            { id: 'vegan', label: 'Vegan' },
                            { id: 'budget', label: 'Budget (<₹600)' },
                          ] as const
                        ).map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => setRestDietFilter(d.id)}
                            className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                              restDietFilter === d.id
                                ? 'bg-slate-900 text-white'
                                : 'border border-slate-200 bg-white text-slate-600'
                            }`}
                          >
                            {d.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                      {filteredRestaurants.map((rest) => {
                        const inTrip = trip.selectedRestaurants.some((r) => r.id === rest.id);
                        const isFav = favorites.restaurants.includes(rest.id);
                        return (
                          <div
                            key={rest.id}
                            className={`flex flex-col justify-between border p-5 ${
                              inTrip
                                ? 'border-teal-700 bg-teal-50/25'
                                : 'border-slate-200 bg-[#FBFBF9]'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between text-xs text-slate-500">
                                <span>
                                  {rest.category} · {rest.cuisine} · {rest.priceRangeLabel}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onToggleFavorite('restaurants', rest.id)}
                                  className="text-slate-400 hover:text-rose-600"
                                >
                                  <Heart
                                    className={`h-4 w-4 ${
                                      isFav ? 'fill-rose-600 text-rose-600' : ''
                                    }`}
                                  />
                                </button>
                              </div>
                              <h3 className="mt-1 font-display text-lg font-semibold text-slate-900">
                                {rest.name}
                              </h3>
                              <p className="mt-1 text-xs text-slate-600">
                                {rest.shortDescription}
                              </p>
                              <div className="mt-2 text-xs text-teal-900">
                                Must try: <strong>{rest.signatureDish}</strong>
                              </div>
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                                <span className="font-mono">★ {rest.rating.toFixed(1)}</span>
                                <span aria-hidden="true">·</span>
                                <span>{rest.distanceKm} km from stay</span>
                                {rest.isVegetarianFriendly && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span>Vegetarian friendly</span>
                                  </>
                                )}
                                {rest.isVeganFriendly && (
                                  <>
                                    <span aria-hidden="true">·</span>
                                    <span>Vegan options</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                              <span className="font-mono text-sm font-semibold text-slate-900">
                                ~₹{rest.averageCostPerPerson}/person
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleRestaurantInTrip(rest)}
                                className={`rounded-lg px-4 py-2 text-xs font-medium ${
                                  inTrip
                                    ? 'bg-teal-700 text-white'
                                    : 'bg-slate-900 text-white hover:bg-slate-800'
                                }`}
                              >
                                {inTrip ? 'Added to Trip ✓' : 'Add to Trip'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 4C. ACTIVITIES & EXPERIENCES */}
                {exploreSubTab === 'activities' && (
                  <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
                    {destinationActivities.map((act) => {
                      const inTrip = trip.selectedActivities.some((a) => a.id === act.id);
                      const isFav = favorites.activities.includes(act.id);
                      return (
                        <div
                          key={act.id}
                          className={`flex flex-col justify-between border p-5 ${
                            inTrip
                              ? 'border-teal-700 bg-teal-50/25'
                              : 'border-slate-200 bg-[#FBFBF9]'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>
                                {act.category} · {act.duration} · ★ {act.rating.toFixed(1)}
                              </span>
                              <button
                                type="button"
                                onClick={() => onToggleFavorite('activities', act.id)}
                                className="text-slate-400 hover:text-rose-600"
                              >
                                <Heart
                                  className={`h-4 w-4 ${
                                    isFav ? 'fill-rose-600 text-rose-600' : ''
                                  }`}
                                />
                              </button>
                            </div>
                            <h3 className="mt-1 font-display text-lg font-semibold text-slate-900">
                              {act.name}
                            </h3>
                            <p className="mt-1 text-xs leading-relaxed text-slate-600">
                              {act.description}
                            </p>
                            <div className="mt-2 text-xs text-slate-500">
                              Location: {act.location} · Best slot: {act.bestTime}
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                            <span className="font-mono text-sm font-semibold text-slate-900">
                              ₹{act.pricePerPerson.toLocaleString('en-IN')}/person
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleActivityInTrip(act)}
                              className={`rounded-lg px-4 py-2 text-xs font-medium ${
                                inTrip
                                  ? 'bg-teal-700 text-white'
                                  : 'bg-slate-900 text-white hover:bg-slate-800'
                              }`}
                            >
                              {inTrip ? 'Added to Trip ✓' : 'Add to Trip'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Hotels</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveStep(5)}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-6 py-3 text-sm font-medium text-white hover:bg-teal-800"
                >
                  <span>Review Budget &amp; Route Map</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 5: INTERACTIVE BUDGET PLANNER & SPATIAL MAP               */}
          {/* ============================================================== */}
          {activeStep === 5 && (
            <div className="space-y-8">
              <section className="border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <div className="text-xs text-slate-500">
                      Step 05 · Interactive Financial Breakdown
                    </div>
                    <h2 className="mt-0.5 font-display text-xl font-semibold text-slate-900">
                      Trip Budget Planner — {currentDestination.name}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-slate-600">Target Budget (₹):</label>
                    <input
                      type="number"
                      step={2000}
                      value={trip.targetBudget}
                      onChange={(e) =>
                        updateTrip((p) => ({
                          ...p,
                          targetBudget: Math.max(5000, Number(e.target.value) || 0),
                        }))
                      }
                      className="w-32 rounded-lg border border-slate-300 bg-[#FBFBF9] px-3 py-1.5 font-mono text-xs font-semibold text-slate-900"
                    />
                  </div>
                </div>

                {/* Top 4 Summary Metrics */}
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="border border-slate-200 bg-[#FBFBF9] p-4">
                    <div className="text-xs text-slate-500">Total Estimated Cost</div>
                    <div className="mt-1 font-mono text-xl font-semibold text-slate-900">
                      ₹{budgetBreakdown.totalEstimated.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="border border-slate-200 bg-[#FBFBF9] p-4">
                    <div className="text-xs text-slate-500">Cost Per Person</div>
                    <div className="mt-1 font-mono text-xl font-semibold text-slate-900">
                      ₹{budgetBreakdown.perPerson.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div className="border border-slate-200 bg-[#FBFBF9] p-4">
                    <div className="text-xs text-slate-500">Cost Per Day</div>
                    <div className="mt-1 font-mono text-xl font-semibold text-slate-900">
                      ₹{budgetBreakdown.perDay.toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div
                    className={`border p-4 ${
                      budgetBreakdown.remainingBudget < 0
                        ? 'border-rose-300 bg-rose-50/60'
                        : 'border-emerald-200 bg-emerald-50/50'
                    }`}
                  >
                    <div className="text-xs text-slate-600">
                      {budgetBreakdown.remainingBudget < 0 ? 'Over Target Budget' : 'Remaining Budget'}
                    </div>
                    <div
                      className={`mt-1 font-mono text-xl font-semibold ${
                        budgetBreakdown.remainingBudget < 0 ? 'text-rose-700' : 'text-emerald-800'
                      }`}
                    >
                      {budgetBreakdown.remainingBudget < 0
                        ? `-₹${Math.abs(budgetBreakdown.remainingBudget).toLocaleString('en-IN')}`
                        : `₹${budgetBreakdown.remainingBudget.toLocaleString('en-IN')}`}
                    </div>
                  </div>
                </div>

                {/* Over-Budget Smart Advisory & User-Controlled Alternatives */}
                {budgetBreakdown.remainingBudget < 0 && (
                  <div className="mt-6 border border-amber-300 bg-amber-50/70 p-5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-amber-950">
                      <AlertTriangle className="h-4 w-4 text-amber-700" />
                      <span>
                        Your current plan is ₹
                        {Math.abs(budgetBreakdown.remainingBudget).toLocaleString('en-IN')} over
                        budget.
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-700">
                      We never change your selections automatically. Choose any optional adjustment
                      below if you’d like to bring costs down:
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const cheaperStay = [...destinationHotels].sort(
                            (a, b) => a.pricePerNight - b.pricePerNight
                          )[0];
                          if (cheaperStay) {
                            updateTrip((p) => ({ ...p, selectedHotel: cheaperStay }));
                          }
                        }}
                        className="rounded-md border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-amber-100/50"
                      >
                        Switch to Cheaper Hotel (₹
                        {destinationHotels[0]?.pricePerNight.toLocaleString('en-IN')}/night)
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const cheapestTrans = [...routeTransports].sort(
                            (a, b) => a.price - b.price
                          )[0];
                          if (cheapestTrans) {
                            updateTrip((p) => ({ ...p, selectedTransport: cheapestTrans }));
                          }
                        }}
                        className="rounded-md border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-amber-100/50"
                      >
                        Switch to Cheapest Transport
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateTrip((p) => ({
                            ...p,
                            selectedPlaces: p.selectedPlaces.filter((pl) => pl.entryFee === 0),
                          }))
                        }
                        className="rounded-md border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-amber-100/50"
                      >
                        Keep Free Entry Attractions Only
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          updateTrip((p) => ({
                            ...p,
                            selectedRestaurants: destinationRestaurants
                              .filter((r) => r.averageCostPerPerson <= 550)
                              .slice(0, 2),
                          }))
                        }
                        className="rounded-md border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-amber-100/50"
                      >
                        Use Lower-Cost Local Dining
                      </button>
                    </div>
                  </div>
                )}

                {/* 7 Budget Category Bars */}
                <div className="mt-6 space-y-3.5">
                  {[
                    { label: 'Transportation (Round-trip)', amount: budgetBreakdown.transportCost },
                    { label: 'Hotels & Stay', amount: budgetBreakdown.hotelCost },
                    { label: 'Food & Restaurants', amount: budgetBreakdown.foodCost },
                    { label: 'Activities & Entry Fees', amount: budgetBreakdown.activitiesCost },
                    { label: 'Local Transport', amount: budgetBreakdown.localTransportCost },
                    { label: 'Shopping Allowance', amount: budgetBreakdown.shoppingCost },
                    { label: 'Miscellaneous & Buffer', amount: budgetBreakdown.miscCost },
                  ].map((cat) => {
                    const pct =
                      budgetBreakdown.totalEstimated > 0
                        ? Math.min(100, Math.round((cat.amount / budgetBreakdown.totalEstimated) * 100))
                        : 0;
                    return (
                      <div key={cat.label}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-slate-700">{cat.label}</span>
                          <span className="font-mono font-semibold text-slate-900">
                            ₹{cat.amount.toLocaleString('en-IN')} ({pct}%)
                          </span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full bg-teal-700 transition-all duration-300"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Editable Shopping & Misc Allowances */}
                <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs text-slate-600">
                      Shopping Budget Allowance (₹)
                    </label>
                    <input
                      type="number"
                      step={500}
                      min={0}
                      value={trip.shoppingBudget}
                      onChange={(e) =>
                        updateTrip((p) => ({
                          ...p,
                          shoppingBudget: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-[#FBFBF9] px-3 py-2 font-mono text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600">
                      Miscellaneous / Buffer Allowance (₹)
                    </label>
                    <input
                      type="number"
                      step={500}
                      min={0}
                      value={trip.miscBudget}
                      onChange={(e) =>
                        updateTrip((p) => ({
                          ...p,
                          miscBudget: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-[#FBFBF9] px-3 py-2 font-mono text-xs text-slate-900"
                    />
                  </div>
                </div>
              </section>

              {/* Interactive Spatial Map */}
              <InteractiveMap
                destination={currentDestination}
                departureCity={trip.departureCity}
                selectedTransport={trip.selectedTransport}
                selectedHotel={trip.selectedHotel}
                places={
                  trip.selectedPlaces.length > 0
                    ? trip.selectedPlaces
                    : destinationPlaces.slice(0, 4)
                }
                restaurants={trip.selectedRestaurants}
                activities={trip.selectedActivities}
              />

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStep(4)}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Places &amp; Dining</span>
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setActiveStep(6);
                    await onGenerateItinerary();
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-6 py-3 text-sm font-medium text-white hover:bg-teal-800"
                >
                  <span>Build My Personalized Itinerary</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 6: AI PERSONALIZED ITINERARY & INTERACTIVE EDITOR         */}
          {/* ============================================================== */}
          {activeStep === 6 && (
            <div className="space-y-8">
              {/* AI Personalization Rationale Box ("Why this itinerary fits you") */}
              <section className="border border-teal-800/30 bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <div className="text-xs font-medium text-teal-800">
                      YOUR PERSONALIZED TRIP PLAN · AI-ORGANIZED WORKSPACE
                    </div>
                    <h2 className="mt-1 font-display text-2xl font-semibold text-slate-900">
                      {trip.departureCity || 'Visakhapatnam'} → {currentDestination.name} ({trip.durationDays} Days)
                    </h2>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={onGenerateItinerary}
                      disabled={isGeneratingItinerary}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-[#FBFBF9] px-3.5 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`h-3.5 w-3.5 ${isGeneratingItinerary ? 'animate-spin' : ''}`}
                      />
                      <span>
                        {isGeneratingItinerary ? 'Optimizing Route...' : 'Re-Optimize with AI'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddFreeDay}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add a Free Day</span>
                    </button>
                    <button
                      type="button"
                      onClick={onSaveTrip}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-xs font-medium text-white hover:bg-teal-800"
                    >
                      <Bookmark className="h-3.5 w-3.5" />
                      <span>Save Final Trip</span>
                    </button>
                  </div>
                </div>

                {/* Why This Itinerary Fits You */}
                <div className="mt-5 border-l-2 border-teal-700 bg-teal-50/40 p-4">
                  <div className="text-xs font-semibold text-teal-950">
                    Why this itinerary fits you
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-slate-800">
                    {currentItinerary.whyThisFitsYou}
                  </p>
                  <ul className="mt-3 space-y-1 text-xs text-slate-600">
                    {currentItinerary.optimizationHighlights.map((hl, i) => (
                      <li key={i}>✓ {hl}</li>
                    ))}
                  </ul>
                </div>

                {/* Quick-Switch Bar for Transport & Hotel */}
                <div className="mt-5 grid grid-cols-1 gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
                  <div className="flex items-center justify-between border border-slate-200 bg-[#FBFBF9] px-4 py-2.5 text-xs">
                    <div>
                      <span className="text-slate-500">Selected Transit:</span>{' '}
                      <strong className="text-slate-900">
                        {trip.selectedTransport
                          ? `${trip.selectedTransport.operator} (${trip.selectedTransport.category})`
                          : 'None selected'}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveStep(2)}
                      className="font-medium text-teal-700 hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  <div className="flex items-center justify-between border border-slate-200 bg-[#FBFBF9] px-4 py-2.5 text-xs">
                    <div>
                      <span className="text-slate-500">Selected Hotel:</span>{' '}
                      <strong className="text-slate-900">
                        {trip.selectedHotel ? trip.selectedHotel.name : 'None selected'}
                      </strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveStep(3)}
                      className="font-medium text-teal-700 hover:underline"
                    >
                      Change
                    </button>
                  </div>
                </div>
              </section>

              {/* Day-by-Day Timeline & Interactive Editor */}
              <div className="space-y-6">
                {currentItinerary.days.map((day) => (
                  <section
                    key={day.dayNumber}
                    className="border border-slate-200 bg-white p-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-mono font-semibold text-teal-800">
                            DAY {String(day.dayNumber).padStart(2, '0')}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>Est. Daily Spend: ₹{day.dailySpend.toLocaleString('en-IN')}</span>
                          <span aria-hidden="true">·</span>
                          <span>Transit: {day.totalTravelMinutes} mins total</span>
                        </div>
                        <h3 className="mt-1 font-display text-lg font-semibold text-slate-900">
                          {day.title}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setAddingToDayNumber(
                              addingToDayNumber === day.dayNumber ? null : day.dayNumber
                            )
                          }
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-[#FBFBF9] px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Add Place to Day {day.dayNumber}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRegenerateDay(day.dayNumber)}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          <span>Regenerate Day</span>
                        </button>
                      </div>
                    </div>

                    {/* Add Place Picker Drawer for this Day */}
                    {addingToDayNumber === day.dayNumber && (
                      <div className="mt-4 border border-teal-200 bg-teal-50/40 p-4">
                        <div className="text-xs font-semibold text-slate-900">
                          Select a place or hidden gem to insert into Day {day.dayNumber}:
                        </div>
                        <div className="mt-2.5 flex flex-wrap gap-2">
                          {destinationPlaces.map((pl) => (
                            <button
                              key={pl.id}
                              type="button"
                              onClick={() => handleAddPlaceToDay(day.dayNumber, pl)}
                              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 hover:border-teal-700 hover:text-teal-800"
                            >
                              + {pl.name} ({pl.entryFee === 0 ? 'Free' : `₹${pl.entryFee}`})
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timeline Slots */}
                    <div className="mt-5 space-y-4">
                      {day.slots.map((slot, sIdx) => (
                        <div
                          key={slot.id}
                          className="flex flex-col gap-4 border border-slate-200/90 bg-[#FBFBF9] p-4 sm:flex-row sm:items-center"
                        >
                          {/* Thumbnail */}
                          <div className="h-20 w-full shrink-0 overflow-hidden sm:w-28">
                            <VisualMedia
                              theme={slot.visualTheme}
                              seed={slot.id}
                              alt={slot.title}
                              className="h-full w-full"
                            />
                          </div>

                          {/* Details */}
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <input
                                type="text"
                                value={slot.time}
                                aria-label="Activity time"
                                onChange={(e) =>
                                  handleUpdateSlotTime(day.dayNumber, slot.id, e.target.value)
                                }
                                className="w-24 rounded border border-slate-200 bg-white px-2 py-0.5 font-mono text-xs font-semibold text-teal-800"
                              />
                              <span>{slot.location}</span>
                              {slot.travelTimeMinutes > 0 && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono">
                                    {slot.travelTimeMinutes} min drive
                                  </span>
                                </>
                              )}
                              <span aria-hidden="true">·</span>
                              <span className="font-mono text-slate-800">
                                {slot.estimatedCost === 0
                                  ? '₹0 (Included)'
                                  : `Est. ₹${slot.estimatedCost.toLocaleString('en-IN')}`}
                              </span>
                            </div>

                            <h4 className="mt-1 font-display text-base font-semibold text-slate-900">
                              {slot.title}
                            </h4>
                            <p className="mt-0.5 text-xs text-slate-600">{slot.notes}</p>
                          </div>

                          {/* Reorder & Delete Controls */}
                          <div className="flex items-center gap-1 self-end sm:self-center">
                            <button
                              type="button"
                              onClick={() => handleMoveSlot(day.dayNumber, sIdx, 'up')}
                              disabled={sIdx === 0}
                              title="Move earlier"
                              className="rounded border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveSlot(day.dayNumber, sIdx, 'down')}
                              disabled={sIdx === day.slots.length - 1}
                              title="Move later"
                              className="rounded border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveSlot(day.dayNumber, slot.id)}
                              title="Remove stop"
                              className="rounded border border-slate-200 bg-white p-1.5 text-slate-500 hover:border-rose-200 hover:text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ============================================================== */}
        {/* PERSISTENT RIGHT COLUMN: "MY TRIP" LIVE BASKET                 */}
        {/* ============================================================== */}
        <aside className="lg:col-span-3">
          <div className="sticky top-20 border border-slate-200 bg-white p-5">
            <div className="border-b border-slate-200 pb-3">
              <div className="text-[11px] font-semibold tracking-wider text-teal-800">
                MY TRIP
              </div>
              <h3 className="mt-0.5 font-display text-lg font-semibold text-slate-900">
                {currentDestination.name} — {trip.durationDays} Days
              </h3>
              <div className="text-xs text-slate-500">
                {trip.departureCity || 'Visakhapatnam'} → {currentDestination.name}
              </div>
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-700">
                  {trip.selectedTransport
                    ? `✓ ${trip.selectedTransport.category} (${trip.selectedTransport.operator})`
                    : '○ Transport not selected'}
                </span>
                {trip.selectedTransport && (
                  <span className="font-mono text-slate-900">
                    ₹{trip.selectedTransport.price.toLocaleString('en-IN')}
                  </span>
                )}
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-slate-700">
                  {trip.selectedHotel
                    ? `✓ ${trip.selectedHotel.name}`
                    : '○ Hotel not selected'}
                </span>
                {trip.selectedHotel && (
                  <span className="font-mono text-slate-900">
                    ₹{trip.selectedHotel.pricePerNight.toLocaleString('en-IN')}/n
                  </span>
                )}
              </div>

              {trip.selectedLocalTransport && (
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-700">
                    ✓ {trip.selectedLocalTransport.type}
                  </span>
                  <span className="font-mono text-slate-900">
                    ₹{trip.selectedLocalTransport.estimatedPricePerDay}/d
                  </span>
                </div>
              )}

              {/* Selected Places */}
              {trip.selectedPlaces.map((pl) => (
                <div key={pl.id} className="flex items-center justify-between gap-2 text-slate-700">
                  <span className="truncate">✓ {pl.name}</span>
                  <span className="font-mono text-[11px] text-slate-500">
                    {pl.entryFee === 0 ? 'Free' : `₹${pl.entryFee}`}
                  </span>
                </div>
              ))}

              {/* Selected Restaurants */}
              {trip.selectedRestaurants.map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-2 text-slate-700">
                  <span className="truncate">✓ {r.name}</span>
                  <span className="font-mono text-[11px] text-slate-500">
                    ₹{r.averageCostPerPerson}
                  </span>
                </div>
              ))}

              {/* Selected Activities */}
              {trip.selectedActivities.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-2 text-slate-700">
                  <span className="truncate">✓ {a.name}</span>
                  <span className="font-mono text-[11px] text-slate-500">
                    ₹{a.pricePerPerson}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-slate-200 pt-4">
              <div className="text-xs text-slate-500">Estimated total:</div>
              <div className="mt-0.5 font-mono text-2xl font-semibold text-slate-900">
                ₹{budgetBreakdown.totalEstimated.toLocaleString('en-IN')}
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">
                Demo Data · Estimated Price ({trip.adults} Adults
                {trip.children > 0 ? `, ${trip.children} Children` : ''})
              </div>

              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  onClick={() => setActiveStep(5)}
                  className="w-full rounded-lg border border-slate-200 bg-[#FBFBF9] px-4 py-2 text-xs font-medium text-slate-800 hover:bg-slate-100"
                >
                  View My Trip &amp; Budget
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setActiveStep(6);
                    await onGenerateItinerary();
                  }}
                  className="w-full rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-medium text-white hover:bg-teal-800"
                >
                  Build Itinerary
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
