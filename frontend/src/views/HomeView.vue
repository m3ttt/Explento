<script setup lang="ts">
import HomeMap from "../components/HomeMap.vue";
import { API_ENDPOINT } from "../lib/config";
import {
    onBeforeMount,
    onBeforeUnmount,
    ref,
    computed,
    onActivated,
} from "vue"; // Import computed
import PlaceCard from "../components/PlaceCard.vue";
import Navbar from "../components/Navbar.vue";
import { checkAuth, logout } from "@/lib/auth";
import { createAvatar } from "@dicebear/core";
import { initials } from "@dicebear/collection";
import { User } from "@/lib/type";
import { useRouter } from "vue-router";

let places = ref([]); // Initialize as empty array
const mapRef = ref();
const router = useRouter();

const activeTab = ref("home");

let user = ref<User | null>(null);

onBeforeMount(async () => {
    user.value = await checkAuth();

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

const avatar = computed(() => {
    if (!user.value) return "";

    return createAvatar(initials, {
        seed: user.value.username,
        size: 128,
    }).toDataUri();
});

function handlePlaceClick(place: any) {
    if (!place.location) return;
    mapRef.value.flyToLocation(place.location.lat, place.location.lon);
}

function handleTabChange(tabName: string) {
    activeTab.value = tabName;
}

const handleLogout = async () => {
    user.value = null;

    await logout();

    router.push("/login");
};
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
                v-else-if="activeTab === 'profile' && user"
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
                    <button
                        class="text-sm text-primary underline"
                        @click="handleLogout"
                    >
                        <p>Logout</p>
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
