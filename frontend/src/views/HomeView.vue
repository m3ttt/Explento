<script setup lang="ts">
import Map from "@/components/Map.vue";
import PlaceCard from "../components/PlaceCard.vue";
import Navbar from "../components/Navbar.vue";
import UserProfile from "@/components/UserProfile.vue";

import { onBeforeMount, Ref, ref, watch } from "vue";
import z from "zod";

import { API_ENDPOINT } from "../lib/config";
import { User } from "@/lib/types/user";
import { Place, PlaceSchema } from "@/lib/types/place";
import { getPosition } from "@/lib/position";
import ModifyPlace from "@/components/ModifyPlace.vue";
import ExpertError from "@/components/ExpertError.vue";
import { makeUserAuthenticatedRequest, refreshUser } from "@/lib/auth";

// I luoghi da visualizzare come consigliati
let places = ref<Place[]>([]);

// Riferimento alla mappa
const mapRef = ref();

// Tab nella barra di navigazione attiva
const activeTab = ref<"home" | "add" | "edit" | "profile">("home");
const selectedEditPlace = ref<Place | null>(null);

watch(activeTab, async (newActive) => {
  // Quando cambio pagina in home o profilo utente, aggiorna dati
  if (newActive == "profile") {
    await refreshUser();
  } else if (newActive == "home") {
    await fetchPlaces();
  }
});

defineProps<{
  currentUser: Ref<User | null>;
}>();

const openEdit = (place: Place) => {
  selectedEditPlace.value = place;
  activeTab.value = "edit";
};

async function fetchPlaces() {
  const position = await getPosition();

  // Richiediamo i luoghi vicini
  const res = await makeUserAuthenticatedRequest(
    // Radius in metri
    `/places?lat=${position.coords.latitude}&lon=${position.coords.longitude}&radius=3000`,
    {},
  );

  if (!res.ok) {
    places.value = [];
    return;
  }

  const data = await res.json();

  // Faccio il parsing dei dati
  const parsed = await z.array(PlaceSchema).safeParseAsync(data);

  if (!parsed.success) {
    places.value = [];
    console.error(parsed.error);
    return;
  }

  places.value = parsed.data;

  mapRef.value.addPlayerMarker(
    position.coords.latitude,
    position.coords.longitude,
  );
}

// Esecuzione prima che carichi il componente
onBeforeMount(fetchPlaces);
</script>

<template>
  <template v-if="currentUser.value">
    <div class="relative w-full h-screen overflow-hidden">
      <div class="absolute inset-0 z-0">
        <Map ref="mapRef" />
      </div>

      <!-- In modo da impostare la navbar + tab sopra tutto -->
      <div
        class="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center pointer-events-none gap-3 p-8"
      >
        <div
          v-if="activeTab === 'home'"
          class="w-full overflow-x-auto snap-x snap-mandatory no-scrollbar pointer-events-auto rounded-2xl pb-6"
        >
          <div class="flex gap-3 w-full">
            <PlaceCard
              v-for="item in places"
              :key="item._id"
              :place="item"
              :user="currentUser"
              @click="
                mapRef.flyToLocation(item.location.lat, item.location.lon)
              "
              @edit="openEdit"
            />
          </div>
        </div>

        <UserProfile
          class="w-full max-w-md pointer-events-auto pb-6"
          :user="currentUser"
          v-else-if="activeTab === 'profile'"
        />

        <ModifyPlace
          class="w-full max-w-md pointer-events-auto pb-6"
          v-else-if="activeTab === 'add' && currentUser.value.expert"
          :initialData="null"
        />

        <ModifyPlace
          v-else-if="activeTab === 'edit' && currentUser.value.expert"
          class="w-full max-w-md pointer-events-auto pb-6"
          :initialData="selectedEditPlace"
        />

        <ExpertError
          class="w-full max-w-md pointer-events-auto pb-6"
          v-else-if="
            (activeTab === 'add' && !currentUser.value.expert) ||
            (activeTab === 'edit' && !currentUser.value.expert)
          "
        />

        <Navbar
          :activeTab="activeTab"
          @change-tab="
            (tabName: 'home' | 'profile' | 'add') => {
              activeTab = tabName;
            }
          "
        />
      </div>
    </div>
  </template>
</template>

<!-- Togliere le barre di scorrimento -->
<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
