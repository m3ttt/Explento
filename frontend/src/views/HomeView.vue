<script setup lang="ts">
import Map from "@/components/Map.vue";
import PlaceCard from "../components/PlaceCard.vue";
import Navbar from "../components/Navbar.vue";
import AddPlace from "@/components/AddPlace.vue";
import AddPlaceError from "@/components/AddPlaceError.vue";
import UserProfile from "@/components/UserProfile.vue";

import { onBeforeMount, Ref, ref } from "vue";
import z from "zod";

import { API_ENDPOINT } from "../lib/config";
import { User } from "@/lib/types/user";
import { Place, PlaceSchema } from "@/lib/types/place";
import { getPosition } from "@/lib/position";

// I luoghi da visualizzare come consigliati
let places = ref<Place[]>([]);

// Riferimento alla mappa
const mapRef = ref();

// Tab nella barra di navigazione attiva
const activeTab = ref("home");

defineProps<{
    currentUser: Ref<User | null>;
}>();

// Esecuzione prima che carichi il componente
onBeforeMount(async () => {
    const position = getPosition();

    // Richiediamo i luoghi vicini
    const res = await fetch(
        `${API_ENDPOINT}/places?lat=${position.coords.latitude}&lon=${position.coords.longitude}&radius=3`,
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
});
</script>

<template>
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
                        @click="
                            mapRef.flyToLocation(
                                item.location.lat,
                                item.location.lon,
                            )
                        "
                    />
                </div>
            </div>

            <UserProfile
                class="w-full max-w-md pointer-events-auto pb-6"
                :user="currentUser"
                v-else-if="activeTab === 'profile'"
            />

            <AddPlace
                class="w-full max-w-md pointer-events-auto pb-6"
                v-else-if="activeTab === 'add' && currentUser.value.expert"
            />

            <AddPlaceError
                class="w-full max-w-md pointer-events-auto pb-6"
                v-else-if="activeTab === 'add' && !currentUser.value.expert"
            />

            <Navbar
                :activeTab="activeTab"
                @change-tab="
                    (tabName: string) => {
                        activeTab = tabName;
                    }
                "
            />
        </div>
    </div>
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
