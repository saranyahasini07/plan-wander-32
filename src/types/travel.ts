export type RegionType = 'India' | 'International';

export type TransportCategory = 'Flights' | 'Trains' | 'Buses' | 'Cabs / Taxis' | 'Rental Cars';

export type StayBudgetTier = 'Budget Stay' | 'Comfortable Stay' | 'Premium Stay' | 'Luxury Stay';

export type StayPropertyType =
  | 'Hotels'
  | 'Resorts'
  | 'Hostels'
  | 'Villas'
  | 'Homestays'
  | 'Beach stays'
  | 'Mountain stays'
  | 'City stays';

export type PlaceCategory =
  | 'Historical'
  | 'Nature'
  | 'Beaches'
  | 'Mountains'
  | 'Adventure'
  | 'Shopping'
  | 'Food'
  | 'Museums'
  | 'Temples'
  | 'Religious places'
  | 'Nightlife'
  | 'Photography'
  | 'Hidden Gems'
  | 'Family activities';

export type RestaurantCategory =
  | 'Breakfast'
  | 'Lunch'
  | 'Dinner'
  | 'Cafes'
  | 'Street Food'
  | 'Fine Dining';

export type TravelStyleOption =
  | 'Budget'
  | 'Balanced'
  | 'Comfort'
  | 'Luxury'
  | 'Adventure'
  | 'Relaxed'
  | 'Family'
  | 'Romantic'
  | 'Cultural'
  | 'Nature'
  | 'Food-focused'
  | 'Photography';

export type InterestOption =
  | 'Beaches'
  | 'Mountains'
  | 'History'
  | 'Culture'
  | 'Food'
  | 'Shopping'
  | 'Nature'
  | 'Adventure'
  | 'Photography'
  | 'Nightlife'
  | 'Spirituality'
  | 'Hidden gems';

export interface SeasonalInfo {
  bestMonths: string;
  peakSeason: string;
  offSeason: string;
  offSeasonMonths: string[];
  weatherSummary: string;
  temperatureRange: string;
  rainfallLevel: string;
  crowdLevel: string;
  priceDifferenceNote: string;
  festivals: string[];
  seasonalActivities: string[];
  offSeasonAdvisory: string;
}

export interface TransportOption {
  id: string;
  category: TransportCategory;
  operator: string;
  code: string;
  departureCity: string;
  arrivalCity: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  durationLabel: string;
  price: number;
  stops: number;
  stopsLabel: string;
  comfortLevel: 'Standard' | 'High' | 'Premium';
  seatClass: string;
  availability: string;
}

export interface LocalTransportOption {
  id: string;
  type: 'Airport taxi' | 'Cab' | 'Bus' | 'Metro' | 'Auto' | 'Rental car' | 'Bike rental';
  name: string;
  estimatedPricePerDay: number;
  averageTravelTime: string;
  coverageDistance: string;
  comfort: 'Basic' | 'Comfortable' | 'Premium';
  availability: string;
  description: string;
}

export interface HotelOption {
  id: string;
  destinationId: string;
  name: string;
  tier: StayBudgetTier;
  propertyType: StayPropertyType;
  rating: number;
  reviewsCount: number;
  pricePerNight: number;
  location: string;
  distanceFromCenter: string;
  amenities: string[];
  breakfastIncluded: boolean;
  cancellationPolicy: string;
  roomType: string;
  description: string;
  visualTheme: 'coastal' | 'heritage' | 'himalaya' | 'island' | 'resort' | 'urban';
  coordinates: { x: number; y: number };
}

export interface PlaceToVisit {
  id: string;
  destinationId: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  rating: number;
  reviewsCount: number;
  category: PlaceCategory;
  isHiddenGem: boolean;
  entryFee: number;
  openingHours: string;
  recommendedDuration: string;
  bestTimeToVisit: string;
  distanceFromHotelKm: number;
  travelTimeMinutes: number;
  locationArea: string;
  nearbyRestaurants: string[];
  nearbyAttractions: string[];
  visualTheme: 'coastal' | 'heritage' | 'himalaya' | 'island' | 'resort' | 'urban';
  coordinates: { x: number; y: number };
}

export interface RestaurantOption {
  id: string;
  destinationId: string;
  name: string;
  category: RestaurantCategory;
  cuisine: string;
  rating: number;
  reviewsCount: number;
  averageCostPerPerson: number;
  priceRangeLabel: '₹' | '₹₹' | '₹₹₹' | '₹₹₹₹';
  distanceKm: number;
  isVegetarianFriendly: boolean;
  isVeganFriendly: boolean;
  shortDescription: string;
  signatureDish: string;
  coordinates: { x: number; y: number };
}

export interface ActivityOption {
  id: string;
  destinationId: string;
  name: string;
  category: string;
  description: string;
  pricePerPerson: number;
  duration: string;
  rating: number;
  reviewsCount: number;
  location: string;
  bestTime: string;
  coordinates: { x: number; y: number };
}

export interface TripPackageOption {
  id: string;
  label: 'OPTION A' | 'OPTION B' | 'OPTION C';
  tierName: 'Budget' | 'Balanced' | 'Premium';
  estimatedTotal: number;
  days: number;
  transportSummary: string;
  hotelSummary: string;
  localTransportSummary: string;
  highlights: string[];
  transportCategory: TransportCategory;
  hotelTier: StayBudgetTier;
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  region: RegionType;
  tagline: string;
  shortDescription: string;
  bestTimeToVisit: string;
  startingBudget: number;
  popularityTag: 'Popular' | 'Trending' | 'Hidden Gem';
  isTrending?: boolean;
  isHiddenGem?: boolean;
  visualTheme: 'coastal' | 'heritage' | 'himalaya' | 'island' | 'resort' | 'urban';
  seasonal: SeasonalInfo;
  defaultAirportOrStation: string;
}

export interface ItinerarySlot {
  id: string;
  time: string;
  title: string;
  type: 'arrival' | 'checkin' | 'attraction' | 'meal' | 'activity' | 'rest' | 'departure';
  location: string;
  travelTimeMinutes: number;
  distanceKm: number;
  estimatedCost: number;
  notes: string;
  visualTheme: 'coastal' | 'heritage' | 'himalaya' | 'island' | 'resort' | 'urban';
  referenceId?: string;
}

export interface ItineraryDay {
  dayNumber: number;
  title: string;
  theme: string;
  dailySpend: number;
  totalTravelMinutes: number;
  isFreeDay?: boolean;
  slots: ItinerarySlot[];
}

export interface GeneratedItinerary {
  destinationName: string;
  departureCity: string;
  durationDays: number;
  whyThisFitsYou: string;
  optimizationHighlights: string[];
  days: ItineraryDay[];
  generatedBy: 'ai-engine' | 'n8n-webhook' | 'smart-planner';
}

export interface TripState {
  id: string;
  title: string;
  destinationId: string;
  departureCity: string;
  dateMode: 'exact' | 'flexible';
  startDate: string;
  endDate: string;
  preferredMonth: string;
  durationDays: number;
  adults: number;
  children: number;
  rooms: number;
  targetBudget: number;
  travelStyles: TravelStyleOption[];
  interests: InterestOption[];
  selectedTransport: TransportOption | null;
  selectedLocalTransport: LocalTransportOption | null;
  selectedHotel: HotelOption | null;
  selectedPlaces: PlaceToVisit[];
  selectedRestaurants: RestaurantOption[];
  selectedActivities: ActivityOption[];
  shoppingBudget: number;
  miscBudget: number;
  itinerary: GeneratedItinerary | null;
  updatedAt: string;
}

export interface FavoritesState {
  destinations: string[];
  hotels: string[];
  places: string[];
  restaurants: string[];
  activities: string[];
}
