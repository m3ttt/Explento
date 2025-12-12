<script setup lang="ts">
import HomeMap from "../components/HomeMap.vue";
import { API_ENDPOINT } from "../lib/config";
import { onBeforeMount, ref } from "vue";
import PlaceCard from "../components/PlaceCard.vue";
import Navbar from "../components/Navbar.vue";
import { getUser } from "@/lib/auth";
import { createAvatar } from "@dicebear/core";
import { initials } from "@dicebear/collection";

// Stato per i dati
let places = ref();
const mapRef = ref();

// Stato per la navigazione: 'home' oppure 'profile'
const activeTab = ref("home");

const user = getUser();

function handlePlaceClick(place: any) {
    if (!place.location) return;
    mapRef.value.flyToLocation(place.location.lat, place.location.lon);
}

// Funzione per gestire il cambio tab dalla Navbar
function handleTabChange(tabName: string) {
    activeTab.value = tabName;
}

onBeforeMount(async () => {
    try {
        const res = await fetch(`${API_ENDPOINT}/places`);
        if (res.status === 200) {
            places.value = await res.json();
        } else {
            places.value = [];
        }
    } catch (e) {
        console.error(e);
        places.value = [];
    }
});

const avatar = createAvatar(initials, {
    seed: user.username + user.name + user.surname,
    size: 128,
}).toDataUri();
</script>

<template>
    <div class="relative w-full h-screen overflow-hidden">
        <div class="absolute inset-0 z-0">
            <HomeMap ref="mapRef" />
        </div>

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
                        :key="item.id"
                        :place="item"
                        @click="handlePlaceClick(item)"
                    />
                </div>
            </div>

            <div
                v-else-if="activeTab === 'profile'"
                class="w-full max-w-md pointer-events-auto pb-6"
            >
                <div
                    class="bg-background rounded-2xl p-6 shadow-xl border w-full h-64 flex flex-col items-center justify-center gap-4"
                >
                    <div
                        class="w-20 h-20 bg-muted rounded-full flex items-center justify-center"
                    >
                        <img :src="avatar" alt="Avatar" class="rounded-full" />
                    </div>
                    <div class="text-center">
                        <h2 class="text-xl font-bold">
                            {{ user.username }}
                        </h2>
                        <p class="text-muted-foreground text-sm">
                            {{ user.name }} {{ user.surname }}
                        </p>
                    </div>
                    <button class="text-sm text-primary underline">
                        <RouterLink to="/logout"> Logout </RouterLink>
                    </button>
                </div>
            </div>

            <div
                v-else-if="activeTab === 'add'"
                class="w-full max-w-md pointer-events-auto pb-6"
            >
                <div class="bg-background rounded-2xl p-6 w-full">
                    <h1>Add new Place</h1>
                </div>
            </div>

            <Navbar :activeTab="activeTab" @change-tab="handleTabChange" />
        </div>
    </div>
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
