/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  DESTINATIONS,
  getActivitiesForDestination,
  getHotelsForDestination,
  getLocalTransportOptions,
  getPlacesForDestination,
  getRestaurantsForDestination,
  getTransportOptionsForRoute,
} from './data/destinations';
import {
  Destination,
  FavoritesState,
  HotelOption,
  PlaceToVisit,
  TripState,
} from './types/travel';
import {
  calculateTripBudgetBreakdown,
  generatePersonalizedItinerary,
} from './services/itineraryEngine';
import { HomePage } from './components/HomePage';
import { TripPlannerWizard } from './components/TripPlannerWizard';
import {
  ExplorePage,
  FavoritesPage,
  HotelsDirectoryPage,
  MyTripsPage,
  TransportationPage,
} from './components/SecondaryPages';
import { HotelDetailModal, PlaceDetailModal } from './components/DetailModals';
import { MyTripDrawer } from './components/MyTripDrawer';
import { N8nChatbot } from './components/N8nChatbot';
import { Menu, X } from 'lucide-react';

type MainNavView =
  | 'home'
  | 'plan'
  | 'explore'
  | 'hotels'
  | 'transportation'
  | 'my-trips'
  | 'favorites';

function createInitialTrip(dest: Destination = DESTINATIONS[0]): TripState {
  const defaultTransports = getTransportOptionsForRoute('Visakhapatnam', dest);
  const defaultLocals = getLocalTransportOptions(dest);
  const defaultHotels = getHotelsForDestination(dest);
  const defaultPlaces = getPlacesForDestination(dest);
  const defaultRests = getRestaurantsForDestination(dest);
  const defaultActs = getActivitiesForDestination(dest);

  return {
    id: `trip-${dest.id}-default`,
    title: `${dest.name} — 4 Days`,
    destinationId: dest.id,
    departureCity: 'Visakhapatnam',
    dateMode: 'flexible',
    startDate: '2026-11-12',
    endDate: '2026-11-15',
    preferredMonth: 'November',
    durationDays: 4,
    adults: 2,
    children: 0,
    rooms: 1,
    targetBudget: 35000,
    travelStyles: ['Balanced', 'Photography', 'Food-focused'],
    interests: ['Beaches', 'Photography', 'Hidden gems', 'Food'],
    selectedTransport: defaultTransports[0] || null,
    selectedLocalTransport: defaultLocals[0] || null,
    selectedHotel: defaultHotels[2] || defaultHotels[0] || null,
    selectedPlaces: defaultPlaces.slice(0, 3),
    selectedRestaurants: defaultRests.slice(0, 2),
    selectedActivities: defaultActs.slice(0, 1),
    shoppingBudget: 2000,
    miscBudget: 1500,
    itinerary: null,
    updatedAt: new Date().toISOString(),
  };
}

export default function App() {
  const [activeNav, setActiveNav] = useState<MainNavView>('home');
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [myTripDrawerOpen, setMyTripDrawerOpen] = useState(false);

  // Active Trip State
  const [trip, setTrip] = useState<TripState>(() => {
    try {
      const saved = localStorage.getItem('pw_active_trip_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore storage errors
    }
    return createInitialTrip(DESTINATIONS[0]);
  });

  // Saved Trips State ("My Trips")
  const [savedTrips, setSavedTrips] = useState<TripState[]>(() => {
    try {
      const saved = localStorage.getItem('pw_saved_trips_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [createInitialTrip(DESTINATIONS[0]), createInitialTrip(DESTINATIONS[6])];
  });

  // Favorites State
  const [favorites, setFavorites] = useState<FavoritesState>(() => {
    try {
      const saved = localStorage.getItem('pw_favorites_v1');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      destinations: ['goa', 'udaipur', 'bali'],
      hotels: ['goa-hotel-comfort-1'],
      places: ['goa-place-1', 'goa-place-6'],
      restaurants: ['goa-rest-1'],
      activities: ['goa-act-1'],
    };
  });

  // Modal Inspection State
  const [inspectedPlace, setInspectedPlace] = useState<PlaceToVisit | null>(null);
  const [inspectedHotel, setInspectedHotel] = useState<HotelOption | null>(null);
  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('pw_active_trip_v1', JSON.stringify(trip));
    } catch {
      // ignore
    }
  }, [trip]);

  useEffect(() => {
    try {
      localStorage.setItem('pw_saved_trips_v1', JSON.stringify(savedTrips));
    } catch {
      // ignore
    }
  }, [savedTrips]);

  useEffect(() => {
    try {
      localStorage.setItem('pw_favorites_v1', JSON.stringify(favorites));
    } catch {
      // ignore
    }
  }, [favorites]);

  const currentDestination = useMemo(
    () => DESTINATIONS.find((d) => d.id === trip.destinationId) || DESTINATIONS[0],
    [trip.destinationId]
  );

  const budgetBreakdown = useMemo(() => calculateTripBudgetBreakdown(trip), [trip]);

  const updateTrip = (updater: (prev: TripState) => TripState) => {
    setTrip((prev) => {
      const updated = updater(prev);
      return { ...updated, updatedAt: new Date().toISOString() };
    });
  };

  const handleToggleFavorite = (kind: keyof FavoritesState, id: string) => {
    setFavorites((prev) => {
      const list = prev[kind];
      const exists = list.includes(id);
      return {
        ...prev,
        [kind]: exists ? list.filter((item) => item !== id) : [...list, id],
      };
    });
  };

  const handleStartPlanningDestination = (dest: Destination) => {
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
        id: `trip-${dest.id}-${Date.now()}`,
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
    setActiveNav('plan');
    setWizardStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerateItinerary = async () => {
    setIsGeneratingItinerary(true);
    try {
      const generated = await generatePersonalizedItinerary(trip);
      updateTrip((prev) => ({
        ...prev,
        itinerary: generated,
      }));
    } finally {
      setIsGeneratingItinerary(false);
    }
  };

  const handleSaveTrip = () => {
    setSavedTrips((prev) => {
      const exists = prev.some((t) => t.id === trip.id);
      if (exists) {
        return prev.map((t) => (t.id === trip.id ? { ...trip } : t));
      }
      return [{ ...trip, id: `trip-${trip.destinationId}-${Date.now()}` }, ...prev];
    });
    setSavedNotice('Saved to My Trips ✓');
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const navItems: Array<{ id: MainNavView; label: string; hideOnMedium?: boolean }> = [
    { id: 'home', label: 'Home' },
    { id: 'plan', label: 'Plan a Trip' },
    { id: 'explore', label: 'Explore' },
    { id: 'hotels', label: 'Hotels' },
    { id: 'transportation', label: 'Transportation' },
    { id: 'my-trips', label: 'My Trips', hideOnMedium: true },
    { id: 'favorites', label: 'Favorites', hideOnMedium: true },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FBFBF9] text-slate-900">
      {/* ================================================================== */}
      {/* TOP BAR CONTRACT: 3 Zones (Brand Wordmark — Nav Links — Actions)   */}
      {/* ================================================================== */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-[#FBFBF9]/95 px-6 py-4 backdrop-blur-xs">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            setActiveNav('home');
          }}
          className="font-display text-xl font-semibold tracking-tight text-slate-900 whitespace-nowrap"
        >
          Plan &amp; Wander
        </a>

        {/* Zone 2: Clean text navigation links (no AI Travel Assistant) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveNav(item.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`${item.hideOnMedium ? 'hidden xl:inline-block' : ''} whitespace-nowrap transition-colors hover:text-slate-900 ${
                activeNav === item.id
                  ? 'text-slate-900 underline decoration-teal-700 decoration-2 underline-offset-8'
                  : ''
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1-2 Primary Actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMyTripDrawerOpen(true)}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 font-mono text-xs font-medium text-slate-800 transition-colors hover:bg-slate-50 whitespace-nowrap"
          >
            My Trip · ₹{budgetBreakdown.totalEstimated.toLocaleString('en-IN')}
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveNav('plan');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="hidden sm:inline-block rounded-lg bg-teal-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-800 whitespace-nowrap"
          >
            Plan My Trip
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="rounded-md p-1.5 text-slate-700 md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-6 py-4 md:hidden">
          <div className="flex flex-col space-y-2.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveNav(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`text-left text-sm font-medium ${
                  activeNav === item.id ? 'text-teal-800 font-semibold' : 'text-slate-700'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================== */}
      {/* MAIN CONTENT VIEWPORT                                              */}
      {/* ================================================================== */}
      <main className="flex-1">
        {activeNav === 'home' && (
          <HomePage
            departureCity={trip.departureCity}
            selectedDestinationId={trip.destinationId}
            onUpdateDeparture={(city) =>
              updateTrip((prev) => ({ ...prev, departureCity: city }))
            }
            onStartPlanningWithDestination={handleStartPlanningDestination}
            onLaunchTripPlanner={() => {
              setActiveNav('plan');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onInspectPlace={(place) => setInspectedPlace(place)}
            onOpenExplore={() => {
              setActiveNav('explore');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeNav === 'plan' && (
          <TripPlannerWizard
            trip={trip}
            activeStep={wizardStep}
            setActiveStep={setWizardStep}
            updateTrip={updateTrip}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onInspectPlace={(place) => setInspectedPlace(place)}
            onInspectHotel={(hotel) => setInspectedHotel(hotel)}
            onGenerateItinerary={handleGenerateItinerary}
            isGeneratingItinerary={isGeneratingItinerary}
            onSaveTrip={handleSaveTrip}
            savedNotice={savedNotice}
          />
        )}

        {activeNav === 'explore' && (
          <ExplorePage
            trip={trip}
            favorites={favorites}
            onSelectDestinationAndPlan={handleStartPlanningDestination}
            onTogglePlaceInTrip={(place) => {
              updateTrip((prev) => {
                const exists = prev.selectedPlaces.some((p) => p.id === place.id);
                return {
                  ...prev,
                  selectedPlaces: exists
                    ? prev.selectedPlaces.filter((p) => p.id !== place.id)
                    : [...prev.selectedPlaces, place],
                };
              });
            }}
            onInspectPlace={(place) => setInspectedPlace(place)}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {activeNav === 'hotels' && (
          <HotelsDirectoryPage
            trip={trip}
            favorites={favorites}
            onSelectHotelForTrip={(destId, hotel) => {
              const targetDest =
                DESTINATIONS.find((d) => d.id === destId) || currentDestination;
              if (destId !== trip.destinationId) {
                handleStartPlanningDestination(targetDest);
              }
              updateTrip((prev) => ({ ...prev, selectedHotel: hotel }));
              setActiveNav('plan');
              setWizardStep(3);
            }}
            onInspectHotel={(hotel) => setInspectedHotel(hotel)}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {activeNav === 'transportation' && (
          <TransportationPage
            trip={trip}
            updateTrip={updateTrip}
            onContinueToPlanner={() => {
              setActiveNav('plan');
              setWizardStep(2);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {activeNav === 'my-trips' && (
          <MyTripsPage
            savedTrips={savedTrips}
            currentTrip={trip}
            onSaveCurrentTrip={handleSaveTrip}
            onOpenTrip={(selected, step = 1) => {
              setTrip(selected);
              setActiveNav('plan');
              setWizardStep(step);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onDuplicateTrip={(source) => {
              const dup: TripState = {
                ...source,
                id: `trip-copy-${Date.now()}`,
                title: `${source.title} (Copy)`,
                updatedAt: new Date().toISOString(),
              };
              setSavedTrips((prev) => [dup, ...prev]);
            }}
            onDeleteTrip={(id) => {
              setSavedTrips((prev) => prev.filter((t) => t.id !== id));
            }}
          />
        )}

        {activeNav === 'favorites' && (
          <FavoritesPage
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onAddPlaceToTrip={(place) => {
              updateTrip((prev) => {
                const exists = prev.selectedPlaces.some((p) => p.id === place.id);
                return exists
                  ? prev
                  : { ...prev, selectedPlaces: [...prev.selectedPlaces, place] };
              });
              setMyTripDrawerOpen(true);
            }}
            onSelectHotelInTrip={(destId, hotel) => {
              updateTrip((prev) => ({
                ...prev,
                destinationId: destId,
                selectedHotel: hotel,
              }));
              setMyTripDrawerOpen(true);
            }}
            onOpenExplore={() => setActiveNav('explore')}
          />
        )}
      </main>

      {/* ================================================================== */}
      {/* MODALS & PERSISTENT MY TRIP DRAWER                                 */}
      {/* ================================================================== */}
      <PlaceDetailModal
        place={inspectedPlace}
        isSelected={
          inspectedPlace
            ? trip.selectedPlaces.some((p) => p.id === inspectedPlace.id)
            : false
        }
        isFavorite={
          inspectedPlace ? favorites.places.includes(inspectedPlace.id) : false
        }
        hotelName={trip.selectedHotel?.name}
        onClose={() => setInspectedPlace(null)}
        onTogglePlace={(place) => {
          updateTrip((prev) => {
            const exists = prev.selectedPlaces.some((p) => p.id === place.id);
            return {
              ...prev,
              selectedPlaces: exists
                ? prev.selectedPlaces.filter((p) => p.id !== place.id)
                : [...prev.selectedPlaces, place],
            };
          });
        }}
        onToggleFavorite={(placeId) => handleToggleFavorite('places', placeId)}
      />

      <HotelDetailModal
        hotel={inspectedHotel}
        nights={Math.max(1, trip.durationDays - 1)}
        rooms={trip.rooms}
        isSelected={
          inspectedHotel ? trip.selectedHotel?.id === inspectedHotel.id : false
        }
        onClose={() => setInspectedHotel(null)}
        onSelectHotel={(hotel) => {
          updateTrip((prev) => ({ ...prev, selectedHotel: hotel }));
        }}
      />

      <MyTripDrawer
        isOpen={myTripDrawerOpen}
        trip={trip}
        destination={currentDestination}
        onClose={() => setMyTripDrawerOpen(false)}
        onRemovePlace={(placeId) =>
          updateTrip((prev) => ({
            ...prev,
            selectedPlaces: prev.selectedPlaces.filter((p) => p.id !== placeId),
          }))
        }
        onRemoveRestaurant={(restId) =>
          updateTrip((prev) => ({
            ...prev,
            selectedRestaurants: prev.selectedRestaurants.filter((r) => r.id !== restId),
          }))
        }
        onRemoveActivity={(actId) =>
          updateTrip((prev) => ({
            ...prev,
            selectedActivities: prev.selectedActivities.filter((a) => a.id !== actId),
          }))
        }
        onClearTransport={() =>
          updateTrip((prev) => ({ ...prev, selectedTransport: null }))
        }
        onClearHotel={() => updateTrip((prev) => ({ ...prev, selectedHotel: null }))}
        onViewTripStep={(step) => {
          setActiveNav('plan');
          setWizardStep(step);
        }}
        onBuildItinerary={async () => {
          setActiveNav('plan');
          setWizardStep(6);
          await handleGenerateItinerary();
        }}
        onSaveTrip={handleSaveTrip}
      />

      <N8nChatbot trip={trip} destination={currentDestination} />

      {/* ================================================================== */}
      {/* QUIET FOOTER                                                       */}
      {/* ================================================================== */}
      <footer className="border-t border-slate-200 bg-white px-6 py-10">
        <div className="mx-auto flex max-w-[1380px] flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="font-display text-lg font-semibold text-slate-900">
              Plan &amp; Wander
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Plan the journey. Wander the world. · EXPLORE → COMPARE → CHOOSE → BUILD → PLAN → WANDER
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs text-slate-600">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveNav(item.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="hover:text-slate-900 hover:underline"
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400">
            Demo Prototype · Estimated Prices &amp; Availability
          </div>
        </div>
      </footer>
    </div>
  );
}
