<script setup lang="ts">
import Map from "@/components/Map.vue";
import PlaceCard from "../components/PlaceCard.vue";
import Navbar from "../components/Navbar.vue";
import UserProfile from "@/components/UserProfile.vue";
import ModifyPlace from "@/components/ModifyPlace.vue";
import ExpertError from "@/components/ExpertError.vue";
import Mission from "@/components/Mission.vue";

import { onBeforeMount, onUnmounted, Ref, ref, watch } from "vue";
import z from "zod";

import { User } from "@/lib/types/user";
import { Place, PlaceSchema } from "@/lib/types/place";
import {
  getDistanceInMeters,
  getPosition,
  watchUserPosition,
} from "@/lib/position";
import { makeUserAuthenticatedRequest, refreshUser } from "@/lib/auth";
import { toast } from "vue-sonner";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPinOff } from "lucide-vue-next";

let places = ref<Place[]>([]);
const mapRef = ref();

const activeTab = ref<"home" | "add" | "edit" | "profile" | "missions">("home");
const selectedEditPlace = ref<Place | null>(null);

let watchId: number | null = null;
let stopTimer: ReturnType<typeof setTimeout> | null = null;
let lastValidPosition: GeolocationPosition | null = null;

const MIN_DISTANCE = 10; // metri minimi per considerare vero movimento
const MAX_ACCURACY = 50; // ignora GPS con accuracy maggiore di 50 metri
const STOP_DELAY = 4000; // 4 secondi fermo -> ricarico luoghi

defineProps<{
  currentUser: Ref<User | null>;
}>();

// Cambio pagina, refresh utente/luoghi in base a dove vado
watch(activeTab, async (newActive) => {
  if (newActive === "profile") {
    await refreshUser();
  } else if (newActive === "missions") {
    await refreshUser();
  }
});

// Funzione per apire la modalità modifica luogo
const openEdit = (place: Place) => {
  selectedEditPlace.value = place;
  activeTab.value = "edit";
};

async function fetchPlaces(position: GeolocationPosition) {
  places.value = [];

  toast.promise(
    async () => {
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

onBeforeMount(async () => {
  const position = await getPosition();
  lastValidPosition = position;
  console.log("Prima posizione trovata");

  await fetchPlaces(position);

  watchId = watchUserPosition((position) => {
    const { latitude, longitude, accuracy } = position.coords;

    // Se l'accuratezza è troppo bassa, ignora
    if (accuracy > MAX_ACCURACY) {
      console.log("Posizione poco accurata. Non faccio nulla");
      return;
    }

    // Prima posizione ricevuta
    if (!lastValidPosition) {
      console.log("Prima posizione ricevuta. Imposto timer");
      lastValidPosition = position;
      mapRef.value?.addPlayerMarker(latitude, longitude);
      return;
    }

    const distance = getDistanceInMeters(
      lastValidPosition.coords.latitude,
      lastValidPosition.coords.longitude,
      latitude,
      longitude,
    );

    // Se si è mosso meno di MIN_DISTANCE metri, ignora
    if (distance < MIN_DISTANCE) {
      console.log(
        "Trovato movimento minimo (margine di errore), non resetto timer",
      );
      return;
    }

    lastValidPosition = position;

    mapRef.value?.addPlayerMarker(latitude, longitude);

    if (stopTimer) clearTimeout(stopTimer);
    console.log("Movimento trovato. Resetto timer");

    stopTimer = setTimeout(() => {
      fetchPlaces(position);
    }, STOP_DELAY);
  });
});

onUnmounted(() => {
  if (watchId != null) {
    navigator.geolocation.clearWatch(watchId);
  }
});
</script>

<template>
  <template v-if="currentUser.value">
    <div class="relative w-full h-screen">
      <!-- Mappa -->
      <div class="absolute inset-0 z-0">
        <Map ref="mapRef" @click="activeTab = 'home'" />
      </div>

      <div
        class="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center pointer-events-none gap-3 p-8"
      >
        <!-- Luoghi consigliati -->
        <div
          v-if="activeTab === 'home'"
          class="relative md:px-12 pointer-events-auto"
        >
          <template v-if="places.length > 0" class="w-full">
            <Carousel
              class="w-full"
              :opts="{
                align: 'center',
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
          </template>

          <div v-else class="w-full flex justify-center">
            <Card
              class="w-full max-w-md border-0 bg-background/95 backdrop-blur-sm shadow-lg rounded-2xl"
            >
              <CardContent
                class="flex flex-col items-center justify-center text-center p-8 gap-4"
              >
                <div
                  class="flex items-center justify-center w-14 h-14 rounded-full bg-muted"
                >
                  <MapPinOff class="w-7 h-7 text-muted-foreground" />
                </div>

                <div class="space-y-1">
                  <CardTitle class="text-lg font-semibold">
                    Nessun luogo trovato
                  </CardTitle>
                  <CardDescription class="text-sm">
                    Prova a spostarti nel comune di Trento per scoprire nuovi
                    luoghi.
                  </CardDescription>
                </div>
              </CardContent>
            </Card>
          </div>
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
