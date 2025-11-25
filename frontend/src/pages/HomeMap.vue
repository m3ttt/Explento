<template>
    <div id="map" style="height: 70vh; width: 50%"></div>
</template>

<script>
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export default {
    name: "HomeMap",

    mounted() {
        // Crea mappa
        let minZoom = 13;

        const map = L.map("map", {
            center: [46.0664228, 11.1257601], // Centro: Trento
            zoom: minZoom,
            minZoom: minZoom,
            maxBoundsViscosity: 1.0,
        });

        // Blocca dragging all’inizio
        map.dragging.disable();

        // Aggiunge tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            subdomains: ["a", "b", "c"],
        }).addTo(map);

        // Salva l’area visibile iniziale
        const initialVisibleBounds = map.getBounds();

        let firstZoom = true;

        map.on("zoomend", () => {
            if (map.getZoom() > minZoom) {
                map.dragging.enable();

                if (firstZoom) {
                    // Applica i limiti alla stessa area visibile iniziale
                    const currentCenter = map.getCenter();
                    map.setMaxBounds(initialVisibleBounds);
                    map.setView(currentCenter, map.getZoom(), {
                        animate: false,
                    });
                    firstZoom = false;
                }
            } else {
                map.dragging.disable();
            }
        });
    },
};
</script>
