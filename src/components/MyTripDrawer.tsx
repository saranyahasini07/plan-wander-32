import React from 'react';
import { Destination, TripState } from '../types/travel';
import { calculateTripBudgetBreakdown } from '../services/itineraryEngine';
import { X, Check, Trash2, ArrowRight, Bookmark } from 'lucide-react';

interface MyTripDrawerProps {
  isOpen: boolean;
  trip: TripState;
  destination: Destination;
  onClose: () => void;
  onRemovePlace: (placeId: string) => void;
  onRemoveRestaurant: (restId: string) => void;
  onRemoveActivity: (actId: string) => void;
  onClearTransport: () => void;
  onClearHotel: () => void;
  onViewTripStep: (step: number) => void;
  onBuildItinerary: () => void;
  onSaveTrip: () => void;
}

export const MyTripDrawer: React.FC<MyTripDrawerProps> = ({
  isOpen,
  trip,
  destination,
  onClose,
  onRemovePlace,
  onRemoveRestaurant,
  onRemoveActivity,
  onClearTransport,
  onClearHotel,
  onViewTripStep,
  onBuildItinerary,
  onSaveTrip,
}) => {
  if (!isOpen) return null;

  const budget = calculateTripBudgetBreakdown(trip);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-xs">
      <div className="flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-[#FBFBF9] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <div className="text-xs font-medium text-teal-800">MY TRIP BASKET</div>
            <h3 className="font-display text-lg font-semibold text-slate-900">
              {destination.name} — {trip.durationDays} {trip.durationDays === 1 ? 'Day' : 'Days'}
            </h3>
            <p className="text-xs text-slate-500">
              {trip.departureCity || 'Visakhapatnam'} → {destination.name} · {trip.adults} Adults
              {trip.children > 0 ? `, ${trip.children} Children` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close My Trip panel"
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Selections Checklist */}
        <div className="flex-1 space-y-5 overflow-y-auto p-6">
          {/* 1. Transportation */}
          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
              <span>1. Transportation ({trip.departureCity} → {destination.name})</span>
              <button
                type="button"
                onClick={() => {
                  onViewTripStep(2);
                  onClose();
                }}
                className="text-teal-700 hover:underline"
              >
                Change
              </button>
            </div>
            {trip.selectedTransport ? (
              <div className="mt-2 flex items-start justify-between gap-2 text-xs">
                <div>
                  <div className="font-medium text-slate-900">
                    ✓ {trip.selectedTransport.category}: {trip.selectedTransport.operator}
                  </div>
                  <div className="text-slate-500">
                    {trip.selectedTransport.departureTime} → {trip.selectedTransport.arrivalTime} ·{' '}
                    <span className="font-mono">
                      ₹{trip.selectedTransport.price.toLocaleString('en-IN')}/way
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClearTransport}
                  className="text-slate-400 hover:text-rose-600"
                  title="Remove transport"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <p className="mt-1.5 text-xs text-slate-500">
                No main transit selected yet. Compare flights, trains, or buses.
              </p>
            )}

            {trip.selectedLocalTransport && (
              <div className="mt-2 text-xs text-slate-600">
                ✓ Local: {trip.selectedLocalTransport.name} (
                <span className="font-mono">
                  ₹{trip.selectedLocalTransport.estimatedPricePerDay.toLocaleString('en-IN')}/day
                </span>
                )
              </div>
            )}
          </div>

          {/* 2. Hotel Stay */}
          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
              <span>2. Hotel &amp; Stay</span>
              <button
                type="button"
                onClick={() => {
                  onViewTripStep(3);
                  onClose();
                }}
                className="text-teal-700 hover:underline"
              >
                Change
              </button>
            </div>
            {trip.selectedHotel ? (
              <div className="mt-2 flex items-start justify-between gap-2 text-xs">
                <div>
                  <div className="font-medium text-slate-900">✓ {trip.selectedHotel.name}</div>
                  <div className="text-slate-500">
                    {trip.selectedHotel.tier} ·{' '}
                    <span className="font-mono">
                      ₹{trip.selectedHotel.pricePerNight.toLocaleString('en-IN')}/night
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClearHotel}
                  className="text-slate-400 hover:text-rose-600"
                  title="Remove stay"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <p className="mt-1.5 text-xs text-slate-500">No hotel selected yet.</p>
            )}
          </div>

          {/* 3. Selected Attractions & Hidden Gems */}
          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
              <span>3. Places &amp; Hidden Gems ({trip.selectedPlaces.length})</span>
              <button
                type="button"
                onClick={() => {
                  onViewTripStep(4);
                  onClose();
                }}
                className="text-teal-700 hover:underline"
              >
                + Add More
              </button>
            </div>
            {trip.selectedPlaces.length > 0 ? (
              <ul className="mt-2 space-y-2 text-xs">
                {trip.selectedPlaces.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-2">
                    <span className="truncate text-slate-800">
                      ✓ {p.name}{' '}
                      <span className="text-slate-400">
                        ({p.entryFee === 0 ? 'Free' : `₹${p.entryFee}`})
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemovePlace(p.id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-xs text-slate-500">No attractions added yet.</p>
            )}
          </div>

          {/* 4. Selected Restaurants */}
          <div className="border-b border-slate-200 pb-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
              <span>4. Restaurants &amp; Cafes ({trip.selectedRestaurants.length})</span>
              <button
                type="button"
                onClick={() => {
                  onViewTripStep(4);
                  onClose();
                }}
                className="text-teal-700 hover:underline"
              >
                + Add Dining
              </button>
            </div>
            {trip.selectedRestaurants.length > 0 ? (
              <ul className="mt-2 space-y-2 text-xs">
                {trip.selectedRestaurants.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-2">
                    <span className="truncate text-slate-800">
                      ✓ {r.name}{' '}
                      <span className="font-mono text-slate-400">(~₹{r.averageCostPerPerson})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveRestaurant(r.id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-xs text-slate-500">No restaurants selected yet.</p>
            )}
          </div>

          {/* 5. Selected Activities */}
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-900">
              <span>5. Activities &amp; Experiences ({trip.selectedActivities.length})</span>
              <button
                type="button"
                onClick={() => {
                  onViewTripStep(4);
                  onClose();
                }}
                className="text-teal-700 hover:underline"
              >
                + Add Activities
              </button>
            </div>
            {trip.selectedActivities.length > 0 ? (
              <ul className="mt-2 space-y-2 text-xs">
                {trip.selectedActivities.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2">
                    <span className="truncate text-slate-800">
                      ✓ {a.name}{' '}
                      <span className="font-mono text-slate-400">
                        (₹{a.pricePerPerson.toLocaleString('en-IN')})
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveActivity(a.id)}
                      className="text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-xs text-slate-500">No activities added yet.</p>
            )}
          </div>
        </div>

        {/* Footer Totals & Actions */}
        <div className="border-t border-slate-200 bg-white p-6">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xs text-slate-500">Estimated Total (Demo Price)</div>
              <div className="text-[11px] text-slate-400">
                Target budget: ₹{trip.targetBudget.toLocaleString('en-IN')}
              </div>
            </div>
            <div className="font-mono text-2xl font-semibold text-slate-900">
              ₹{budget.totalEstimated.toLocaleString('en-IN')}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                onViewTripStep(5);
                onClose();
              }}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-800 hover:bg-slate-50"
            >
              View My Trip &amp; Budget
            </button>
            <button
              type="button"
              onClick={() => {
                onBuildItinerary();
                onClose();
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2.5 text-xs font-medium text-white hover:bg-teal-800"
            >
              <span>Build Itinerary</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onSaveTrip}
            className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            <Bookmark className="h-3.5 w-3.5 text-teal-700" />
            <span>Save Current Trip to My Trips</span>
          </button>
        </div>
      </div>
    </div>
  );
};
