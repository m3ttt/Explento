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

// Funzione che usa le WEBAPI per ottenere la posizione GPS
export const getPosition = (): GeolocationPosition => {
    if (!navigator.geolocation) {
        return fallBackPosition;
    }

    let position = null;

    navigator.geolocation.getCurrentPosition((pos) => {
        position = pos;
    });

    if (position == null) {
        return fallBackPosition;
    }

    return position;
};
