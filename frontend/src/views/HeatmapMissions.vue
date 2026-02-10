<template>
  <div class="relative w-full h-screen">
    <div class="fixed top-6 right-6 z-[1000]">
      <button
        @click="exportToJson"
        class="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow transition cursor-pointer"
      >
        Export JSON
      </button>
    </div>

    <div id="map"></div>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";

import L from "leaflet";
import "leaflet.heat";
import "leaflet/dist/leaflet.css";
import { makeOperatorAuthenticatedRequest } from "@/lib/operatorAuth";

// Funzione per recuperare i dati della heatmap
async function fetchHeatmapData() {
  const token = localStorage.getItem("token");
  if (!token) throw new Error("Utente non autenticato");

  const res = await makeOperatorAuthenticatedRequest("/heatmap/missions", {});

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

const heatmapData = ref([]);

// Funzione per scaricare il file
const exportToJson = () => {
  if (!heatmapData.value || heatmapData.value.length === 0) {
    return alert("Nessun dato da esportare");
  }

  // Crea un Blob (Binary Large Object) per gestire file di qualsiasi dimensione
  const blob = new Blob([JSON.stringify(heatmapData.value, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const linkElement = document.createElement("a");

  linkElement.href = url;
  linkElement.download = "heatmap_data.json";

  document.body.appendChild(linkElement);
  linkElement.click();

  // Pulizia
  document.body.removeChild(linkElement);
  URL.revokeObjectURL(url);
};

onMounted(async () => {
  // Inizializza la mappa
  const map = L.map("map").setView([46.0669, 11.1211], 13);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: "© OpenStreetMap contributors",
    attributionControl: false,
  }).addTo(map);

  // Recupera dati
  const data = await fetchHeatmapData();
  if (!data.length) return;

  heatmapData.value = data;

  // Calcola il valore massimo per normalizzare l'intensità
  const maxVal = Math.max(...data.map((p) => p.completedMissions), 1);

  // Prepara dati per la heatmap
  const heatData = data
    .map((p) => {
      const lat = p.location?.lat;
      const lon = p.location?.lon;
      if (typeof lat !== "number" || typeof lon !== "number") {
        console.warn("Dati non validi per la heatmap:", p);
        return null;
      }
      return [lat, lon, Math.max(p.completedMissions / maxVal, 0.1)];
    })
    .filter((p) => p !== null);

  console.log("Heatmap data:", heatData);

  // Aggiunge la heatmap e salva il layer in una variabile
  const heatLayer = L.heatLayer(heatData, {
    radius: 200, // grande per essere visibile anche da lontano
    blur: 60, // sfumatura ampia
    maxZoom: 15.5,
    minOpacity: 0.4, // mantiene visibile anche zone meno dense
    gradient: {
      0.0: "blue",
      0.4: "lime",
      0.7: "yellow",
      1.0: "red",
    },
  }).addTo(map);

  // Heatmap dinamica in base allo zoom
  map.on("zoomend", () => {
    const zoom = map.getZoom();
    const scale = Math.max(20, zoom * 5);

    heatLayer.setOptions({
      radius: scale,
      blur: scale * 0.25, // blur più contenuto = centro più preciso
    });
  });

  // Aggiungiunta marker
  data.forEach((place) => {
    const lat = place.location?.lat;
    const lon = place.location?.lon;
    if (typeof lat === "number" && typeof lon === "number") {
      //   L.circleMarker([lat, lon], {
      //     radius: 6,
      //     color: "blue",
      //     weight: 2,
      //     fillOpacity: 1
      //   })
      //   .bindPopup(`${place.name}: ${place.completedMissions} missioni completate`)
      //   .addTo(map);
      L.marker([lat, lon])
        .bindPopup(
          `${place.name}: ${place.completedMissions} missioni completate`,
        )
        .addTo(map);
    }
  });

  // Garantisce che la mappa sia ridisegnata correttamente
  setTimeout(() => map.invalidateSize(), 200);
});
</script>

<style>
/* Assicura altezza piena della mappa e corretto posizionamento del canvas */
#map {
  width: 100%;
  height: 100vh;
  position: relative;
  overflow: hidden;
}
</style>
