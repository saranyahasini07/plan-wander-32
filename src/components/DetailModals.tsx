import React, { useState } from 'react';
import { HotelOption, PlaceToVisit } from '../types/travel';
import { VisualMedia } from './VisualMedia';
import { X, Check, Heart, ArrowLeft, MapPin, Clock, Navigation } from 'lucide-react';

interface PlaceDetailModalProps {
  place: PlaceToVisit | null;
  isSelected: boolean;
  isFavorite: boolean;
  hotelName?: string;
  onClose: () => void;
  onTogglePlace: (place: PlaceToVisit) => void;
  onToggleFavorite: (placeId: string) => void;
}

export const PlaceDetailModal: React.FC<PlaceDetailModalProps> = ({
  place,
  isSelected,
  isFavorite,
  hotelName,
  onClose,
  onTogglePlace,
  onToggleFavorite,
}) => {
  const [galleryIdx, setGalleryIdx] = useState(0);

  if (!place) return null;

  const galleryThemes: Array<'coastal' | 'heritage' | 'himalaya' | 'island' | 'resort'> = [
    place.visualTheme === 'urban' ? 'heritage' : place.visualTheme,
    'coastal',
    'island',
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto border border-slate-200 bg-[#FBFBF9] shadow-xl">
        {/* Top Bar */}
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-[#FBFBF9]/95 px-6 py-4 backdrop-blur-xs">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Explore</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onToggleFavorite(place.id)}
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                isFavorite
                  ? 'border-rose-300 bg-rose-50 text-rose-800'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-rose-600 text-rose-600' : ''}`} />
              <span>{isFavorite ? 'Saved to Favorites' : 'Favorite'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close details"
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Gallery */}
        <div className="grid grid-cols-1 gap-2 p-6 pb-0 md:grid-cols-12">
          <div className="h-64 overflow-hidden md:col-span-8 md:h-80">
            <VisualMedia
              theme={galleryThemes[galleryIdx % galleryThemes.length]}
              seed={`${place.id}-view-${galleryIdx}`}
              alt={place.name}
              className="h-full w-full"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 md:col-span-4 md:grid-cols-1">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => setGalleryIdx(i)}
                className={`relative h-20 overflow-hidden border text-left md:h-[102px] ${
                  galleryIdx === i ? 'border-teal-700 ring-2 ring-teal-700/30' : 'border-slate-200'
                }`}
              >
                <VisualMedia
                  theme={galleryThemes[i % galleryThemes.length]}
                  seed={`${place.id}-view-${i}`}
                  alt={`${place.name} perspective ${i + 1}`}
                  className="h-full w-full"
                />
                <span className="absolute bottom-1.5 left-2 bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-white">
                  View 0{i + 1}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="grid grid-cols-1 gap-8 p-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{place.category}</span>
              {place.isHiddenGem && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-teal-800">Hidden Gem · Less Crowded</span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>{place.locationArea}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-slate-800">
                ★ {place.rating.toFixed(1)} ({place.reviewsCount.toLocaleString('en-IN')} reviews)
              </span>
            </div>

            <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">
              {place.name}
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-slate-700">
              {place.fullDescription}
            </p>

            {/* Key Visitor Metadata Grid */}
            <div className="mt-6 grid grid-cols-2 gap-4 border-y border-slate-200 py-4 sm:grid-cols-4">
              <div>
                <div className="text-xs text-slate-500">Entry Fee</div>
                <div className="mt-1 font-mono text-sm font-semibold text-slate-900">
                  {place.entryFee === 0 ? '₹0 (Free Entry)' : `₹${place.entryFee}`}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Opening Hours</div>
                <div className="mt-1 font-mono text-xs font-medium text-slate-900">
                  {place.openingHours}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Best Time to Visit</div>
                <div className="mt-1 text-xs font-medium text-teal-800">
                  {place.bestTimeToVisit}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Recommended Duration</div>
                <div className="mt-1 font-mono text-xs font-medium text-slate-900">
                  {place.recommendedDuration}
                </div>
              </div>
            </div>

            {/* Nearby Restaurants & Nearby Attractions */}
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold text-slate-900">
                  Nearby Restaurants
                </h3>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                  {place.nearbyRestaurants.map((rest) => (
                    <li key={rest} className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span>{rest}</span>
                      <span className="font-mono text-[11px] text-slate-400">~8 min walk</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-900">
                  Nearby Attractions
                </h3>
                <ul className="mt-2 space-y-1.5 text-xs text-slate-600">
                  {place.nearbyAttractions.map((near) => (
                    <li key={near} className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                      <span>{near}</span>
                      <span className="font-mono text-[11px] text-slate-400">~12 min drive</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column: Map Snippet & Add to My Trip */}
          <div className="flex flex-col justify-between border-t border-slate-200 pt-6 lg:col-span-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
            <div>
              <div className="text-xs font-semibold text-slate-900">Location &amp; Transit from Stay</div>
              <p className="mt-1 text-xs text-slate-600">
                {place.travelTimeMinutes} min ({place.distanceFromHotelKm.toFixed(1)} km) from{' '}
                {hotelName || 'your selected hotel'}
              </p>

              {/* Mini Interactive Coordinate Map */}
              <div className="relative mt-3 h-40 overflow-hidden border border-slate-200 bg-[#F2F4F0]">
                <svg viewBox="0 0 100 100" className="h-full w-full">
                  <path d="M 0,30 Q 40,20 100,45" fill="none" stroke="#CBD5E1" strokeWidth="1" />
                  <line
                    x1="25"
                    y1="75"
                    x2={place.coordinates.x}
                    y2={place.coordinates.y}
                    stroke="#0F766E"
                    strokeWidth="1.2"
                    strokeDasharray="2 1.5"
                  />
                  <circle cx="25" cy="75" r="3.5" fill="#0F172A" />
                  <circle cx={place.coordinates.x} cy={place.coordinates.y} r="4.5" fill="#0F766E" />
                </svg>
                <div className="absolute bottom-2 left-2 rounded bg-white/90 px-2 py-0.5 font-mono text-[10px] text-slate-700">
                  Stay → {place.name} ({place.travelTimeMinutes}m)
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                onClick={() => onTogglePlace(place)}
                className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-emerald-800 text-white hover:bg-emerald-900'
                    : 'bg-teal-700 text-white hover:bg-teal-800'
                }`}
              >
                {isSelected ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Added to My Trip (Click to Remove)</span>
                  </>
                ) : (
                  <span>Add to My Trip</span>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Back to Explore
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface HotelDetailModalProps {
  hotel: HotelOption | null;
  nights: number;
  rooms: number;
  isSelected: boolean;
  onClose: () => void;
  onSelectHotel: (hotel: HotelOption) => void;
}

export const HotelDetailModal: React.FC<HotelDetailModalProps> = ({
  hotel,
  nights,
  rooms,
  isSelected,
  onClose,
  onSelectHotel,
}) => {
  const [bookingDemoTriggered, setBookingDemoTriggered] = useState(false);

  if (!hotel) return null;

  const totalStayPrice = hotel.pricePerNight * Math.max(1, nights) * Math.max(1, rooms);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto border border-slate-200 bg-[#FBFBF9] shadow-xl">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-[#FBFBF9]/95 px-6 py-4 backdrop-blur-xs">
          <div className="text-xs text-slate-500">
            <span>{hotel.tier}</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span>{hotel.propertyType}</span>
            <span className="mx-1.5" aria-hidden="true">·</span>
            <span>Demo Stay Preview</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="h-64 w-full">
          <VisualMedia
            theme={hotel.visualTheme}
            seed={hotel.id}
            alt={hotel.name}
            className="h-full w-full"
          />
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs text-slate-500">
                <span>{hotel.location}</span>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span>{hotel.distanceFromCenter}</span>
                <span className="mx-1.5" aria-hidden="true">·</span>
                <span className="font-mono text-slate-800">
                  ★ {hotel.rating.toFixed(1)} ({hotel.reviewsCount} reviews)
                </span>
              </div>
              <h2 className="mt-1 font-display text-2xl font-semibold text-slate-900">
                {hotel.name}
              </h2>
            </div>

            <div className="text-right">
              <div className="font-mono text-xl font-semibold text-slate-900">
                ₹{hotel.pricePerNight.toLocaleString('en-IN')}
                <span className="font-sans text-xs font-normal text-slate-500">/night</span>
              </div>
              <div className="font-mono text-xs text-teal-800">
                Total ({nights} {nights === 1 ? 'night' : 'nights'}, {rooms} {rooms === 1 ? 'room' : 'rooms'}): ₹
                {totalStayPrice.toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-slate-700">{hotel.description}</p>

          <div className="mt-6 grid grid-cols-1 gap-4 border-y border-slate-200 py-4 sm:grid-cols-3">
            <div>
              <div className="text-xs text-slate-500">Room Type</div>
              <div className="mt-1 text-xs font-medium text-slate-900">{hotel.roomType}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Breakfast</div>
              <div className="mt-1 text-xs font-medium text-emerald-800">
                {hotel.breakfastIncluded ? 'Complimentary daily breakfast included' : 'Available as add-on'}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Cancellation Policy</div>
              <div className="mt-1 text-xs font-medium text-slate-800">{hotel.cancellationPolicy}</div>
            </div>
          </div>

          <div className="mt-5">
            <div className="text-xs font-semibold text-slate-900">Included Amenities</div>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
              {hotel.amenities.map((am, i) => (
                <React.Fragment key={am}>
                  <span>{am}</span>
                  {i < hotel.amenities.length - 1 && <span aria-hidden="true">·</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

          {bookingDemoTriggered && (
            <div className="mt-5 border border-teal-200 bg-teal-50/70 p-4 text-xs text-teal-950">
              <div className="font-semibold">Demo Booking — Availability Verified (Prototype Mode)</div>
              <p className="mt-1 text-slate-700">
                This is a realistic demo availability check. Selecting this stay adds{' '}
                <strong>{hotel.name}</strong> (Estimated total ₹{totalStayPrice.toLocaleString('en-IN')}) to your{' '}
                <strong>My Trip</strong> basket without making a live payment reservation.
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setBookingDemoTriggered(true)}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Check Availability (Demo Booking)
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectHotel(hotel);
                onClose();
              }}
              className="rounded-lg bg-teal-700 px-5 py-2.5 text-xs font-medium text-white hover:bg-teal-800"
            >
              {isSelected ? 'Selected in My Trip ✓' : 'Select Stay & Save to Trip'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
