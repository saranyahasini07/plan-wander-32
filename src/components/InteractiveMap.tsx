import React, { useState } from 'react';
import {
  ActivityOption,
  Destination,
  HotelOption,
  PlaceToVisit,
  RestaurantOption,
  TransportOption,
} from '../types/travel';
import { Navigation, MapPin, Compass, Plane, Train, Hotel, Utensils, Sparkles } from 'lucide-react';

interface InteractiveMapProps {
  destination: Destination;
  departureCity: string;
  selectedTransport: TransportOption | null;
  selectedHotel: HotelOption | null;
  places: PlaceToVisit[];
  restaurants: RestaurantOption[];
  activities: ActivityOption[];
  onSelectPlace?: (place: PlaceToVisit) => void;
}

interface MapPinNode {
  id: string;
  label: string;
  sublabel: string;
  kind: 'hub' | 'hotel' | 'place' | 'restaurant' | 'activity';
  x: number;
  y: number;
  meta: string;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  destination,
  departureCity,
  selectedTransport,
  selectedHotel,
  places,
  restaurants,
  activities,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'place' | 'restaurant' | 'activity'>('all');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const nodes: MapPinNode[] = [
    {
      id: 'arrival-hub',
      label: destination.defaultAirportOrStation.split('(')[0].trim(),
      sublabel: `Arrival from ${departureCity || 'Origin'} (${selectedTransport?.category || 'Transit'})`,
      kind: 'hub',
      x: 16,
      y: 22,
      meta: selectedTransport
        ? `${selectedTransport.operator} · ${selectedTransport.durationLabel}`
        : 'Arrival Airport / Railway Hub',
    },
  ];

  if (selectedHotel) {
    nodes.push({
      id: selectedHotel.id,
      label: selectedHotel.name,
      sublabel: `${selectedHotel.tier} · ${selectedHotel.location}`,
      kind: 'hotel',
      x: selectedHotel.coordinates.x,
      y: selectedHotel.coordinates.y,
      meta: `₹${selectedHotel.pricePerNight.toLocaleString('en-IN')}/night · Base Camp`,
    });
  } else {
    nodes.push({
      id: 'default-hotel-hub',
      label: `${destination.name} Central Stay Zone`,
      sublabel: 'Select a hotel to anchor exact distances',
      kind: 'hotel',
      x: 46,
      y: 52,
      meta: 'Central Stay Hub',
    });
  }

  if (activeFilter === 'all' || activeFilter === 'place') {
    places.forEach((p) => {
      nodes.push({
        id: p.id,
        label: p.name,
        sublabel: `${p.category}${p.isHiddenGem ? ' · Hidden Gem' : ''}`,
        kind: 'place',
        x: p.coordinates.x,
        y: p.coordinates.y,
        meta: `${p.travelTimeMinutes} min from stay · ${p.entryFee === 0 ? 'Free Entry' : `₹${p.entryFee}`}`,
      });
    });
  }

  if (activeFilter === 'all' || activeFilter === 'restaurant') {
    restaurants.forEach((r) => {
      nodes.push({
        id: r.id,
        label: r.name,
        sublabel: `${r.category} · ${r.cuisine}`,
        kind: 'restaurant',
        x: r.coordinates.x,
        y: r.coordinates.y,
        meta: `₹${r.averageCostPerPerson}/person · ${r.distanceKm} km`,
      });
    });
  }

  if (activeFilter === 'all' || activeFilter === 'activity') {
    activities.forEach((a) => {
      nodes.push({
        id: a.id,
        label: a.name,
        sublabel: `${a.category} · ${a.duration}`,
        kind: 'activity',
        x: a.coordinates.x,
        y: a.coordinates.y,
        meta: `₹${a.pricePerPerson.toLocaleString('en-IN')}/person`,
      });
    });
  }

  const activeNode = nodes.find((n) => n.id === selectedNodeId) || nodes[1] || nodes[0];

  // Build route polyline points starting from Arrival Hub -> Hotel -> Places
  const routeNodes = [
    nodes[0],
    nodes.find((n) => n.kind === 'hotel') || nodes[0],
    ...nodes.filter((n) => n.kind !== 'hub' && n.kind !== 'hotel'),
  ];

  const polylinePoints = routeNodes.map((n) => `${n.x},${n.y}`).join(' ');

  return (
    <div className="border border-slate-200 bg-white">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Interactive Route &amp; Spatial Map</span>
            <span aria-hidden="true">·</span>
            <span>Demo Spatial Engine (API-Ready)</span>
          </div>
          <h3 className="mt-0.5 font-display text-lg font-semibold text-slate-900">
            {departureCity || 'Visakhapatnam'} → {destination.name} Spatial Circuit
          </h3>
        </div>

        {/* Interactive Filter Controls */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
          {(
            [
              { id: 'all', label: `All Stops (${nodes.length})` },
              { id: 'place', label: `Attractions (${places.length})` },
              { id: 'restaurant', label: `Dining (${restaurants.length})` },
              { id: 'activity', label: `Activities (${activities.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                activeFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Canvas + Stop Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12">
        <div className="relative min-h-[380px] overflow-hidden bg-[#F3F4F0] lg:col-span-8">
          {/* Topographic SVG Grid & Coastline/Contour Art */}
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
          >
            <defs>
              <pattern id="map-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path
                  d="M 10 0 L 0 0 0 10"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="0.3"
                />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#map-grid)" />

            {/* Stylized water body / river contour */}
            <path
              d="M 0,15 Q 25,28 18,55 T 32,100 L 0,100 Z"
              fill="#DCEEF2"
              opacity="0.7"
            />
            <path
              d="M 60,0 Q 75,35 90,45 L 100,45 L 100,0 Z"
              fill="#E4EFE7"
              opacity="0.65"
            />

            {/* Connected itinerary route path */}
            {routeNodes.length > 1 && (
              <polyline
                fill="none"
                stroke="#0F766E"
                strokeWidth="0.7"
                strokeDasharray="1.8 1.2"
                points={polylinePoints}
              />
            )}
          </svg>

          {/* Origin -> Arrival Corridor Banner inside Map */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-md border border-slate-200/90 bg-white/95 px-3 py-1.5 text-xs text-slate-700 backdrop-blur-xs">
            {selectedTransport?.category === 'Trains' ? (
              <Train className="h-3.5 w-3.5 text-teal-700" />
            ) : (
              <Plane className="h-3.5 w-3.5 text-teal-700" />
            )}
            <span className="font-medium text-slate-900">{departureCity || 'Visakhapatnam'}</span>
            <span className="text-slate-400">→</span>
            <span className="font-medium text-teal-800">{destination.name}</span>
            <span className="text-slate-400">·</span>
            <span className="font-mono text-slate-600">
              {selectedTransport ? selectedTransport.durationLabel : 'Select transit'}
            </span>
          </div>

          {/* Interactive Pin Markers */}
          {nodes.map((node, index) => {
            const isSelected = activeNode?.id === node.id;
            const colorClasses =
              node.kind === 'hub'
                ? 'bg-slate-900 text-white border-white'
                : node.kind === 'hotel'
                ? 'bg-teal-700 text-white border-white'
                : node.kind === 'place'
                ? 'bg-amber-700 text-white border-white'
                : node.kind === 'restaurant'
                ? 'bg-rose-700 text-white border-white'
                : 'bg-indigo-700 text-white border-white';

            return (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelectedNodeId(node.id)}
                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                className={`group absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-150 focus:outline-none ${
                  isSelected ? 'z-30 scale-110' : 'z-20 hover:scale-105'
                }`}
                title={node.label}
              >
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full border-2 shadow-sm ${colorClasses}`}
                >
                  <span className="font-mono text-[11px] font-semibold">{index + 1}</span>
                </div>
                <div
                  className={`mt-1 max-w-[140px] truncate rounded bg-white/95 px-2 py-0.5 text-[11px] font-medium text-slate-900 shadow-xs ring-1 ring-slate-200/80 ${
                    isSelected ? 'ring-teal-700 font-semibold' : ''
                  }`}
                >
                  {node.label}
                </div>
              </button>
            );
          })}

          {/* Legend */}
          <div className="absolute right-4 bottom-4 left-4 z-10 flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200/90 bg-white/95 px-3 py-2 text-xs text-slate-600 backdrop-blur-xs">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-slate-900" /> Arrival Hub
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-700" /> Selected Stay
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-700" /> Attractions
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-700" /> Dining
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-indigo-700" /> Activities
              </span>
            </div>
            <span className="font-mono text-[11px] text-slate-500">
              Click any numbered pin to inspect route hop
            </span>
          </div>
        </div>

        {/* Right Column: Active Pin & Route Sequence */}
        <div className="flex flex-col justify-between border-t border-slate-200 p-6 lg:col-span-4 lg:border-t-0 lg:border-l">
          <div>
            <div className="text-xs text-slate-500">Selected Map Node</div>
            <h4 className="mt-1 font-display text-base font-semibold text-slate-900">
              {activeNode?.label}
            </h4>
            <p className="mt-1 text-xs text-slate-600">{activeNode?.sublabel}</p>
            <p className="mt-2 font-mono text-xs text-teal-800">{activeNode?.meta}</p>

            <div className="mt-6 border-t border-slate-200 pt-4">
              <div className="text-xs font-medium text-slate-900">
                Connected Route Sequence ({routeNodes.length} stops)
              </div>
              <div className="mt-3 max-h-[220px] space-y-2.5 overflow-y-auto pr-1">
                {routeNodes.map((rNode, i) => (
                  <button
                    key={rNode.id}
                    type="button"
                    onClick={() => setSelectedNodeId(rNode.id)}
                    className={`flex w-full items-start gap-2.5 rounded-md p-2 text-left text-xs transition-colors ${
                      activeNode?.id === rNode.id
                        ? 'bg-teal-50/80 text-slate-900'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="font-mono text-xs font-semibold text-teal-700">
                      {String(i + 1).padStart(2, '0')}.
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-slate-900">{rNode.label}</div>
                      <div className="truncate text-[11px] text-slate-500">{rNode.meta}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-3 text-[11px] text-slate-500">
            Routes update automatically as you add or reorder places in your trip.
          </div>
        </div>
      </div>
    </div>
  );
};
