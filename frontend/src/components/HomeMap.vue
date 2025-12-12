<script>
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix per le icone che a volte scompaiono in build
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
    },
    mounted() {
        let minZoom = 13;

        // Inizializza usando this.$refs.mapContainer invece dell'ID
        this.map = L.map(this.$refs.mapContainer, {
            center: [46.0664228, 11.1257601],
            zoom: minZoom,
            minZoom: minZoom,
            maxBoundsViscosity: 1.0,
            // zoomControl: false,
        });

        this.map.attributionControl.setPrefix("");

        this.map.dragging.disable();

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            subdomains: ["a", "b", "c"],
            // Importante: sposta il copyright in alto se il div rosso copre il basso
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

    // Importante: distruggi la mappa quando il componente viene smontato
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
