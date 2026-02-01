<script>
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

export default {
    name: "HomeMap",
    data() {
        return {
            map: null,
            markersLayer: null,
            playerMarker: null, // Riferimento per il marker utente
        };
    },
    methods: {
        flyToLocation(lat, lng) {
            if (!this.map || !this.markersLayer) return;

            this.markersLayer.clearLayers();
            L.marker([lat, lng]).addTo(this.markersLayer);

            this.map.flyTo([lat, lng], 16, {
                duration: 1.5,
            });
        },

        addPlayerMarker(lat, lng) {
            if (!this.map) return;

            // Icona personalizzata per il giocatore
            const playerIcon = L.divIcon({
                className: "custom-player-icon",
                html: `<div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-md"></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8],
            });

            // Se esiste già, aggiorna solo la posizione
            if (this.playerMarker) {
                this.playerMarker.setLatLng([lat, lng]);
            } else {
                this.playerMarker = L.marker([lat, lng], {
                    icon: playerIcon,
                    zIndexOffset: 1000,
                }).addTo(this.map);
            }
        },
    },
    mounted() {
        let minZoom = 13;

        this.map = L.map(this.$refs.mapContainer, {
            center: [46.0664228, 11.1257601],
            zoom: minZoom,
            minZoom: minZoom,
            maxBoundsViscosity: 1.0,
        });

        this.map.attributionControl.setPrefix("");
        this.map.dragging.disable();

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            subdomains: ["a", "b", "c"],
            attributionControl: true,
        }).addTo(this.map);

        this.markersLayer = L.layerGroup().addTo(this.map);

        const initialVisibleBounds = this.map.getBounds();
        let firstZoom = true;

        this.map.on("zoomend", () => {
            if (this.map.getZoom() > minZoom) {
                this.map.dragging.enable();
                if (firstZoom) {
                    const currentCenter = this.map.getCenter();
                    this.map.setMaxBounds(initialVisibleBounds);
                    this.map.setView(currentCenter, this.map.getZoom(), {
                        animate: false,
                    });
                    firstZoom = false;
                }
            } else {
                this.map.dragging.disable();
            }
        });
    },
    beforeUnmount() {
        if (this.map) {
            this.map.remove();
        }
    },
};
</script>

<template>
    <div ref="mapContainer" class="w-full h-full z-0"></div>
</template>

<style>
/* Animazione opzionale per il marker giocatore */
.custom-player-icon div {
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.7);
    }
    70% {
        transform: scale(1);
        box-shadow: 0 0 0 10px rgba(37, 99, 235, 0);
    }
    100% {
        transform: scale(0.95);
        box-shadow: 0 0 0 0 rgba(37, 99, 235, 0);
    }
}
</style>
