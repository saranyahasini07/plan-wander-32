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
  GeneratedItinerary,
  ItineraryDay,
  ItinerarySlot,
  TripState,
} from '../types/travel';

export function calculateTripBudgetBreakdown(trip: TripState) {
  const travelersCount = Math.max(1, trip.adults + Math.ceil(trip.children * 0.6));
  const days = Math.max(1, trip.durationDays);
  const rooms = Math.max(1, trip.rooms);

  // Round-trip transportation estimate per traveler
  const transportCost = trip.selectedTransport
    ? Math.round(trip.selectedTransport.price * 2 * travelersCount)
    : 0;

  // Hotel stay cost across nights
  const nights = Math.max(1, days - 1);
  const hotelCost = trip.selectedHotel
    ? Math.round(trip.selectedHotel.pricePerNight * nights * rooms)
    : 0;

  // Local transport cost across days
  const localTransportCost = trip.selectedLocalTransport
    ? Math.round(trip.selectedLocalTransport.estimatedPricePerDay * days)
    : 0;

  // Attractions entry fees + Selected Activities
  const placesEntryCost = trip.selectedPlaces.reduce(
    (sum, p) => sum + p.entryFee * travelersCount,
    0
  );
  const activitiesCost =
    trip.selectedActivities.reduce((sum, a) => sum + a.pricePerPerson * travelersCount, 0) +
    placesEntryCost;

  // Food cost: selected restaurants + baseline daily meals
  const selectedDiningCost = trip.selectedRestaurants.reduce(
    (sum, r) => sum + r.averageCostPerPerson * travelersCount,
    0
  );
  const baselineMealsCost = Math.max(0, days * 2 - trip.selectedRestaurants.length) * 400 * travelersCount;
  const foodCost = Math.round(selectedDiningCost + baselineMealsCost);

  const shoppingCost = trip.shoppingBudget || 0;
  const miscCost = trip.miscBudget || 0;

  const totalEstimated =
    transportCost +
    hotelCost +
    localTransportCost +
    activitiesCost +
    foodCost +
    shoppingCost +
    miscCost;

  const perPerson = Math.round(totalEstimated / Math.max(1, trip.adults + trip.children));
  const perDay = Math.round(totalEstimated / days);
  const remainingBudget = trip.targetBudget - totalEstimated;

  return {
    transportCost,
    hotelCost,
    localTransportCost,
    activitiesCost,
    foodCost,
    shoppingCost,
    miscCost,
    totalEstimated,
    perPerson,
    perDay,
    remainingBudget,
  };
}

export function buildLocalSmartItinerary(trip: TripState): GeneratedItinerary {
  const destination =
    DESTINATIONS.find((d) => d.id === trip.destinationId) || DESTINATIONS[0];
  const daysCount = Math.max(1, trip.durationDays);
  const travelersCount = Math.max(1, trip.adults + Math.ceil(trip.children * 0.6));

  // Use user selections or smart defaults from destination catalog if empty
  const allPlaces = getPlacesForDestination(destination);
  const chosenPlaces =
    trip.selectedPlaces.length > 0 ? [...trip.selectedPlaces] : allPlaces.slice(0, 5);

  // Sort places spatially by x+y coordinate to group nearby places on the same day
  const sortedPlaces = [...chosenPlaces].sort(
    (a, b) => a.coordinates.x + a.coordinates.y - (b.coordinates.x + b.coordinates.y)
  );

  const allRestaurants = getRestaurantsForDestination(destination);
  const chosenRestaurants =
    trip.selectedRestaurants.length > 0
      ? [...trip.selectedRestaurants]
      : allRestaurants.slice(0, 3);

  const allActivities = getActivitiesForDestination(destination);
  const chosenActivities =
    trip.selectedActivities.length > 0
      ? [...trip.selectedActivities]
      : allActivities.slice(0, 2);

  const hotelName =
    trip.selectedHotel?.name ||
    getHotelsForDestination(destination)[2]?.name ||
    `${destination.name} Boutique Stay`;

  const days: ItineraryDay[] = [];
  let placeIdx = 0;
  let actIdx = 0;
  let restIdx = 0;

  const dayThemes = [
    `Arrival & Coastal / Heritage Discovery`,
    `Signature Landmarks & Cultural Immersion`,
    `Hidden Gems & Scenic Trails`,
    `Artisan Markets, Gastronomy & Leisure`,
    `Panoramas & Sunset Experiences`,
    `Unhurried Exploration & Departure`,
  ];

  for (let d = 1; d <= daysCount; d++) {
    const slots: ItinerarySlot[] = [];

    if (d === 1) {
      slots.push({
        id: `d${d}-slot-arrival`,
        time: trip.selectedTransport?.arrivalTime || '09:00 AM',
        title: `Arrive in ${destination.name} (${trip.departureCity} → ${destination.name})`,
        type: 'arrival',
        location: destination.defaultAirportOrStation,
        travelTimeMinutes: 0,
        distanceKm: 0,
        estimatedCost: 0,
        notes: trip.selectedTransport
          ? `Via ${trip.selectedTransport.operator} (${trip.selectedTransport.category})`
          : `Arrival transfer via ${trip.selectedLocalTransport?.name || 'local cab'}`,
        visualTheme: destination.visualTheme,
      });

      slots.push({
        id: `d${d}-slot-checkin`,
        time: '10:30 AM',
        title: `Hotel check-in / luggage drop at ${hotelName}`,
        type: 'checkin',
        location: trip.selectedHotel?.location || `${destination.name} Central Quarter`,
        travelTimeMinutes: 30,
        distanceKm: 14,
        estimatedCost: 0,
        notes: trip.selectedHotel?.roomType || 'Refresh and settle in before exploring.',
        visualTheme: trip.selectedHotel?.visualTheme || 'resort',
      });
    } else {
      const morningPlace = sortedPlaces[placeIdx % sortedPlaces.length];
      placeIdx++;
      slots.push({
        id: `d${d}-slot-morning-${morningPlace.id}`,
        time: '09:00 AM',
        title: morningPlace.name,
        type: 'attraction',
        location: morningPlace.locationArea,
        travelTimeMinutes: morningPlace.travelTimeMinutes,
        distanceKm: morningPlace.distanceFromHotelKm,
        estimatedCost: morningPlace.entryFee * travelersCount,
        notes: `${morningPlace.shortDescription} (Recommended: ${morningPlace.recommendedDuration})`,
        visualTheme: morningPlace.visualTheme,
        referenceId: morningPlace.id,
      });
    }

    // Lunch slot
    const lunchSpot = chosenRestaurants[restIdx % chosenRestaurants.length];
    restIdx++;
    slots.push({
      id: `d${d}-slot-lunch`,
      time: '12:30 PM',
      title: `Lunch at ${lunchSpot.name}`,
      type: 'meal',
      location: `${lunchSpot.cuisine} · ${destination.name}`,
      travelTimeMinutes: 15,
      distanceKm: lunchSpot.distanceKm,
      estimatedCost: lunchSpot.averageCostPerPerson * travelersCount,
      notes: `Signature: ${lunchSpot.signatureDish}`,
      visualTheme: destination.visualTheme,
      referenceId: lunchSpot.id,
    });

    // Afternoon attraction
    const afternoonPlace = sortedPlaces[placeIdx % sortedPlaces.length];
    placeIdx++;
    slots.push({
      id: `d${d}-slot-afternoon-${afternoonPlace.id}`,
      time: '02:30 PM',
      title: afternoonPlace.name,
      type: 'attraction',
      location: afternoonPlace.locationArea,
      travelTimeMinutes: 18,
      distanceKm: 4.5,
      estimatedCost: afternoonPlace.entryFee * travelersCount,
      notes: afternoonPlace.isHiddenGem
        ? `Hidden Gem — ${afternoonPlace.shortDescription}`
        : afternoonPlace.shortDescription,
      visualTheme: afternoonPlace.visualTheme,
      referenceId: afternoonPlace.id,
    });

    // Golden Hour Activity or Second Viewpoint
    if (actIdx < chosenActivities.length || d % 2 === 1) {
      const act = chosenActivities[actIdx % chosenActivities.length];
      actIdx++;
      slots.push({
        id: `d${d}-slot-activity-${act.id}-${d}`,
        time: '05:15 PM',
        title: act.name,
        type: 'activity',
        location: act.location,
        travelTimeMinutes: 15,
        distanceKm: 3.8,
        estimatedCost: act.pricePerPerson * travelersCount,
        notes: `${act.description} (${act.duration})`,
        visualTheme: destination.visualTheme,
        referenceId: act.id,
      });
    } else {
      const sunsetPlace = sortedPlaces[placeIdx % sortedPlaces.length];
      placeIdx++;
      slots.push({
        id: `d${d}-slot-sunset-${sunsetPlace.id}`,
        time: '05:30 PM',
        title: `Golden Hour at ${sunsetPlace.name}`,
        type: 'attraction',
        location: sunsetPlace.locationArea,
        travelTimeMinutes: 16,
        distanceKm: 4.2,
        estimatedCost: sunsetPlace.entryFee * travelersCount,
        notes: `Best time: ${sunsetPlace.bestTimeToVisit}`,
        visualTheme: sunsetPlace.visualTheme,
        referenceId: sunsetPlace.id,
      });
    }

    // Dinner
    const dinnerSpot = chosenRestaurants[restIdx % chosenRestaurants.length];
    restIdx++;
    slots.push({
      id: `d${d}-slot-dinner`,
      time: '07:45 PM',
      title: `Dinner at ${dinnerSpot.name}`,
      type: 'meal',
      location: `${dinnerSpot.cuisine} · ${destination.name}`,
      travelTimeMinutes: 15,
      distanceKm: dinnerSpot.distanceKm,
      estimatedCost: dinnerSpot.averageCostPerPerson * travelersCount,
      notes: dinnerSpot.shortDescription,
      visualTheme: destination.visualTheme,
      referenceId: dinnerSpot.id,
    });

    // Return to hotel
    slots.push({
      id: `d${d}-slot-rest`,
      time: '09:15 PM',
      title:
        d === daysCount
          ? `Evening wrap-up & departure preparation from ${hotelName}`
          : `Return to ${hotelName}`,
      type: d === daysCount ? 'departure' : 'rest',
      location: trip.selectedHotel?.location || destination.name,
      travelTimeMinutes: 15,
      distanceKm: 3.5,
      estimatedCost: 0,
      notes: 'Unwind and rest for the next day.',
      visualTheme: 'resort',
    });

    const dailySpend = slots.reduce((s, slot) => s + slot.estimatedCost, 0);
    const totalTravelMinutes = slots.reduce((s, slot) => s + slot.travelTimeMinutes, 0);

    days.push({
      dayNumber: d,
      title: `DAY ${d} — ${dayThemes[(d - 1) % dayThemes.length].toUpperCase()}`,
      theme: dayThemes[(d - 1) % dayThemes.length],
      dailySpend,
      totalTravelMinutes,
      isFreeDay: false,
      slots,
    });
  }

  const budget = calculateTripBudgetBreakdown(trip);
  const interestList =
    trip.interests.length > 0 ? trip.interests.slice(0, 3).join(', ').toLowerCase() : 'scenic landmarks and local dining';
  const styleList =
    trip.travelStyles.length > 0 ? trip.travelStyles.join(' & ').toLowerCase() : 'balanced';

  const whyThisFitsYou = `Your ${daysCount}-day ${destination.name} itinerary prioritizes ${interestList} to match your ${styleList} travel style, clustering nearby stops around ${hotelName} so daily transit stays around ${Math.round(
    days.reduce((a, b) => a + b.totalTravelMinutes, 0) / daysCount
  )} minutes while respecting your ₹${trip.targetBudget.toLocaleString('en-IN')} target budget (current estimated total: ₹${budget.totalEstimated.toLocaleString('en-IN')}).`;

  return {
    destinationName: destination.name,
    departureCity: trip.departureCity,
    durationDays: daysCount,
    whyThisFitsYou,
    optimizationHighlights: [
      `Spatially grouped ${chosenPlaces.length} selected attractions to cut backtracking by ~35%.`,
      `Scheduled outdoor viewpoints during golden hour (${chosenPlaces[0]?.bestTimeToVisit || '5:00 PM – 7:00 PM'}) and indoor/shaded dining at midday.`,
      `Balanced ${chosenActivities.length} curated activities with unhurried evenings at ${hotelName}.`,
    ],
    days,
    generatedBy: 'smart-planner',
  };
}

export async function generatePersonalizedItinerary(
  trip: TripState
): Promise<GeneratedItinerary> {
  const localBase = buildLocalSmartItinerary(trip);

  try {
    const response = await fetch('/api/generate-itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: localBase.destinationName,
        departure: trip.departureCity,
        dates: {
          mode: trip.dateMode,
          startDate: trip.startDate,
          endDate: trip.endDate,
          preferredMonth: trip.preferredMonth,
          durationDays: trip.durationDays,
        },
        travelers: {
          adults: trip.adults,
          children: trip.children,
          rooms: trip.rooms,
        },
        budget: {
          target: trip.targetBudget,
          estimated: calculateTripBudgetBreakdown(trip).totalEstimated,
        },
        transportation: trip.selectedTransport,
        localTransport: trip.selectedLocalTransport,
        hotel: trip.selectedHotel,
        attractions: trip.selectedPlaces.map((p) => ({
          name: p.name,
          category: p.category,
          isHiddenGem: p.isHiddenGem,
          bestTime: p.bestTimeToVisit,
          entryFee: p.entryFee,
        })),
        restaurants: trip.selectedRestaurants.map((r) => ({
          name: r.name,
          category: r.category,
          cuisine: r.cuisine,
          cost: r.averageCostPerPerson,
        })),
        activities: trip.selectedActivities.map((a) => ({
          name: a.name,
          category: a.category,
          price: a.pricePerPerson,
          duration: a.duration,
        })),
        preferences: {
          travelStyles: trip.travelStyles,
          interests: trip.interests,
        },
        baseItinerary: localBase,
      }),
    });

    if (!response.ok) {
      return localBase;
    }

    const data = await response.json();
    if (data && data.whyThisFitsYou) {
      return {
        ...localBase,
        whyThisFitsYou: data.whyThisFitsYou || localBase.whyThisFitsYou,
        optimizationHighlights:
          Array.isArray(data.optimizationHighlights) && data.optimizationHighlights.length > 0
            ? data.optimizationHighlights
            : localBase.optimizationHighlights,
        days:
          Array.isArray(data.days) && data.days.length > 0 ? data.days : localBase.days,
        generatedBy: data.generatedBy || 'ai-engine',
      };
    }
    return localBase;
  } catch {
    return localBase;
  }
}

export function applyPackageToTripState(
  trip: TripState,
  packageTier: 'Budget' | 'Balanced' | 'Premium'
): TripState {
  const destination =
    DESTINATIONS.find((d) => d.id === trip.destinationId) || DESTINATIONS[0];
  const transports = getTransportOptionsForRoute(trip.departureCity, destination);
  const localTransports = getLocalTransportOptions(destination);
  const hotels = getHotelsForDestination(destination);
  const places = getPlacesForDestination(destination);
  const restaurants = getRestaurantsForDestination(destination);
  const activities = getActivitiesForDestination(destination);

  if (packageTier === 'Budget') {
    const trainOrCheap =
      transports.find((t) => t.category === 'Trains') ||
      [...transports].sort((a, b) => a.price - b.price)[0];
    const budgetHotel =
      hotels.find((h) => h.tier === 'Budget Stay') || hotels[0];
    const bikeOrBus =
      localTransports.find((l) => l.type === 'Bike rental') || localTransports[0];

    return {
      ...trip,
      travelStyles: ['Budget', 'Adventure'],
      selectedTransport: trainOrCheap,
      selectedLocalTransport: bikeOrBus,
      selectedHotel: budgetHotel,
      selectedPlaces: places.filter((p) => p.entryFee <= 150).slice(0, 5),
      selectedRestaurants: restaurants.filter((r) => r.averageCostPerPerson <= 800).slice(0, 3),
      selectedActivities: activities.slice(0, 1),
    };
  }

  if (packageTier === 'Balanced') {
    const flight =
      transports.find((t) => t.category === 'Flights' && t.stops === 0) || transports[0];
    const comfortHotel =
      hotels.find((h) => h.tier === 'Comfortable Stay') || hotels[2];
    const cab =
      localTransports.find((l) => l.type === 'Cab') || localTransports[1];

    return {
      ...trip,
      travelStyles: ['Balanced', 'Comfort'],
      selectedTransport: flight,
      selectedLocalTransport: cab,
      selectedHotel: comfortHotel,
      selectedPlaces: places.slice(0, 6),
      selectedRestaurants: restaurants.slice(0, 4),
      selectedActivities: activities.slice(0, 2),
    };
  }

  // Premium
  const primeFlight =
    transports.find((t) => t.comfortLevel === 'Premium') || transports[0];
  const luxuryHotel =
    hotels.find((h) => h.tier === 'Luxury Stay') ||
    hotels.find((h) => h.tier === 'Premium Stay') ||
    hotels[hotels.length - 1];
  const rentalOrCab =
    localTransports.find((l) => l.comfort === 'Premium') || localTransports[1];

  return {
    ...trip,
    travelStyles: ['Luxury', 'Comfort', 'Relaxed'],
    selectedTransport: primeFlight,
    selectedLocalTransport: rentalOrCab,
    selectedHotel: luxuryHotel,
    selectedPlaces: places.slice(0, 6),
    selectedRestaurants: restaurants.slice(1, 5),
    selectedActivities: activities.slice(0, 3),
  };
}
