<template>
  <div class="map-wrapper">
    <div id="map" ref="mapContainer"></div>
    <div class="fixed top-6 right-6 z-[1001]">
      <button
        @click="exportToJson"
        class="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow transition cursor-pointer"
      >
        Export JSON
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, nextTick } from "vue";
import L from "leaflet";
import "leaflet.heat";
import "leaflet/dist/leaflet.css";
import { makeOperatorAuthenticatedRequest } from "@/lib/operatorAuth";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

const heatmapData = ref([]);
let map = null;
let heatLayer = null;

async function fetchHeatmapData() {
  try {
    const res = await makeOperatorAuthenticatedRequest("/heatmap/missions", {});
    return res.ok ? await res.json() : [];
  } catch (err) {
    console.error("Errore fetch:", err);
    return [];
  }
}

const exportToJson = () => {
  if (!heatmapData.value || heatmapData.value.length === 0) return alert("Nessun dato");
  const blob = new Blob([JSON.stringify(heatmapData.value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "heatmap_data.json";
  link.click();
  URL.revokeObjectURL(url);
};

onMounted(async () => {
  await nextTick();

  map = L.map("map", {
    attributionControl: false,
    zoomControl: true,
  }).setView([46.0669, 11.1211], 13);

  map.createPane("heatmapPane");

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    zIndex: 1,
  }).addTo(map);

  const data = await fetchHeatmapData();
  heatmapData.value = data;

  if (data.length > 0) {
    const maxVal = Math.max(...data.map((p) => p.completedMissions), 1);
    const heatPoints = data
      .map((p) => (p.location?.lat ? [p.location.lat, p.location.lon, p.completedMissions / maxVal] : null))
      .filter(Boolean);

    heatLayer = L.heatLayer(heatPoints, {
      radius: 35,
      blur: 20,
      max: 1.0,
      minOpacity: 0.8,
      gradient: { 0.4: "blue", 0.6: "lime", 1.0: "red" },
    }).addTo(map);

    // Sposta canvas
    const heatCanvas = heatLayer._canvas;
    if (heatCanvas) {
      map.getPane("heatmapPane").appendChild(heatCanvas);
    }

    data.forEach((p) => {
      if (p.location?.lat && p.location?.lon) {
        L.marker([p.location.lat, p.location.lon], { 
          icon: L.icon({ ...DefaultIcon.options, className: "marker-color-green" }) 
        })
        .bindPopup(`<b>${p.name}</b><br>${p.completedMissions} missioni completate`)
        .addTo(map);
      }
    });
  }

  map.on("moveend", () => { if (heatLayer) heatLayer.redraw(); });
  setTimeout(() => map.invalidateSize(), 200);
});

onUnmounted(() => {
  if (map) {
    if (heatLayer && heatLayer._canvas) {
      const canvas = heatLayer._canvas;
      // Riporta canvas nel contenitore originale prima di distruggere
      // ( Leaflet si aspetta di trovarlo nell'overlayPane )
      const originalContainer = map.getPane('overlayPane');
      if (canvas.parentNode && originalContainer) {
        originalContainer.appendChild(canvas);
      }
    }
    map.remove();
    map = null;
    heatLayer = null;
  }
});
</script>

<style>
.map-wrapper { position: absolute; inset: 0; width: 100%; height: 100%; }
#map { width: 100%; height: 100%; background: white; }

.leaflet-heatmapPane-pane {
  z-index: 450;
  pointer-events: none;
}
.leaflet-heatmapPane-pane canvas {
  filter: saturate(1.2);
  mix-blend-mode: multiply;
}

.marker-color-green { filter: hue-rotate(240deg) saturate(1.5) brightness(0.9) !important; }
</style>