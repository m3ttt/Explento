<script setup lang="ts">
import Map from "@/components/Map.vue";
import PlaceCard from "../components/PlaceCard.vue";
import Navbar from "../components/Navbar.vue";
import UserProfile from "@/components/UserProfile.vue";
import ModifyPlace from "@/components/ModifyPlace.vue";
import ExpertError from "@/components/ExpertError.vue";
import Mission from "@/components/Mission.vue";

import { onBeforeMount, Ref, ref, watch } from "vue";
import z from "zod";

import { User } from "@/lib/types/user";
import { Place, PlaceSchema } from "@/lib/types/place";
import { getPosition } from "@/lib/position";
import { makeUserAuthenticatedRequest, refreshUser } from "@/lib/auth";
import { toast } from "vue-sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

let places = ref<Place[]>([]);
const mapRef = ref();

const activeTab = ref<"home" | "add" | "edit" | "profile" | "missions">("home");
const selectedEditPlace = ref<Place | null>(null);

defineProps<{
  currentUser: Ref<User | null>;
}>();

// Cambio pagina, refresh utente/luoghi in base a dove vado
watch(activeTab, async (newActive) => {
  if (newActive === "profile") {
    await refreshUser();
  } else if (newActive === "home") {
    await fetchPlaces();
  } else if (newActive === "missions") {
    await refreshUser();
  }
});

// Funzione per apire la modalità modifica luogo
const openEdit = (place: Place) => {
  selectedEditPlace.value = place;
  activeTab.value = "edit";
};

async function fetchPlaces() {
  places.value = [];

  toast.promise(
    async () => {
      const position = await getPosition();

      const res = await makeUserAuthenticatedRequest(
        `/places?lat=${position.coords.latitude}&lon=${position.coords.longitude}&radius=3000`,
        {},
      );

      if (!res.ok) {
        throw new Error("Impossibile caricare i luoghi consigliati");
      }

      const data = await res.json();
      const parsed = await z.array(PlaceSchema).safeParseAsync(data);

      if (!parsed.success) {
        console.error(parsed.error);
        throw new Error("Impossibile caricare i luoghi consigliati");
      }

      places.value = parsed.data;

      mapRef.value.addPlayerMarker(
        position.coords.latitude,
        position.coords.longitude,
      );
    },
    {
      loading: "Caricamento luoghi consigliati",
      error: (err: Error) => `Errore: ${err.message}`,
    },
  );
}

onBeforeMount(fetchPlaces);
</script>

<template>
  <template v-if="currentUser.value">
    <div class="relative w-full h-screen">
      <!-- Mappa -->
      <div class="absolute inset-0 z-0">
        <Map ref="mapRef" />
      </div>

      <div
        class="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center pointer-events-none gap-3 p-8"
      >
        <!-- Luoghi consigliati -->
        <div
          v-if="activeTab === 'home'"
          class="relative w-full md:px-12 pointer-events-auto"
        >
          <Carousel
            class="w-full"
            :opts="{
              align: 'center',
              // Permettere di scrollare senza limiti
              skipSnaps: true,
              slidesToScroll: 1,
            }"
          >
            <CarouselContent>
              <CarouselItem
                v-for="item in places"
                :key="item._id"
                class="basis-auto pl-4"
              >
                <PlaceCard
                  :place="item"
                  :user="currentUser"
                  @click="
                    mapRef.flyToLocation(item.location.lat, item.location.lon)
                  "
                  @edit="openEdit"
                />
              </CarouselItem>
            </CarouselContent>

            <CarouselPrevious class="hidden md:flex -left-10" />
            <CarouselNext class="hidden md:flex -right-10" />
          </Carousel>
        </div>

        <!-- Profilo -->
        <UserProfile
          v-else-if="activeTab === 'profile'"
          class="w-full max-w-md pointer-events-auto pb-6"
          :user="currentUser"
        />

        <!-- Aggiunta luogo -->
        <ModifyPlace
          v-else-if="activeTab === 'add' && currentUser.value.expert"
          class="w-full max-w-md pointer-events-auto pb-6"
          :initialData="null"
        />

        <!-- Modifica luogo -->
        <ModifyPlace
          v-else-if="activeTab === 'edit' && currentUser.value.expert"
          class="w-full max-w-md pointer-events-auto pb-6"
          :initialData="selectedEditPlace"
        />

        <!-- Non Expert -->
        <ExpertError
          v-else-if="
            (activeTab === 'add' && !currentUser.value.expert) ||
            (activeTab === 'edit' && !currentUser.value.expert)
          "
          class="w-full max-w-md pointer-events-auto pb-6"
        />

        <!-- Missioni -->
        <Mission
          v-else-if="activeTab === 'missions'"
          class="w-full max-w-md pointer-events-auto pb-6"
          :user="currentUser"
        />

        <Navbar
          :activeTab="activeTab"
          @change-tab="(tabName) => (activeTab = tabName)"
        />
      </div>
    </div>
  </template>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
