const DEFAULT_LAT = 46.0726;
const DEFAULT_LON = 11.1191;

const fallBackPosition = {
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
    return fallBackPosition;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(fallBackPosition),
    );
  });
};
