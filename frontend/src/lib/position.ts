const DEFAULT_LAT = 46.0726;
const DEFAULT_LON = 11.1191;

export const fallBackPosition = {
  coords: {
    latitude: DEFAULT_LAT,
    longitude: DEFAULT_LON,
    accuracy: 10,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
  timestamp: Date.now(),
} as GeolocationPosition;

export const getPosition = async (): Promise<GeolocationPosition> => {
  if (!navigator.geolocation) {
    throw new Error("Impossibile stabilire la posizione");
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => reject("Impossibile stabilire la posizione"),
    );
  });
};

export const watchUserPosition = (
  onChange: (position: GeolocationPosition) => void,
): number | null => {
  if (!navigator.geolocation) {
    onChange(fallBackPosition);
    return null;
  }

  const watchId = navigator.geolocation.watchPosition(
    (pos) => onChange(pos),
    () => onChange(fallBackPosition),
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000,
    },
  );

  return watchId;
};

export function getDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371000; // metri
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
