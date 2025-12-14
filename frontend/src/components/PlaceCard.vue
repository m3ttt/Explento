<script setup lang="ts">
import { MapPin } from "lucide-vue-next";

interface Place {
    id: number | string;
    name: string;
    categories: string;
    distance: number;
    [key: string]: any;
}

defineProps<{
    place: Place;
    distance?: string | number;
}>();
</script>

<template>
    <div
        class="relative flex flex-col w-48 h-32 p-3 rounded-2xl bg-background snap-center shrink-0 overflow-hidden group cursor-pointer transition-colors"
    >
        <div class="relative z-10 flex flex-col justify-between h-full">
            <div class="flex justify-between items-start">
                <span
                    class="text-[10px] font-bold uppercase text-muted-foreground px-1.5 py-0.5 rounded-md"
                >
                    {{ place.categories }}
                </span>
            </div>

            <div>
                <h3 class="font-semibold text-sm leading-tight text-foreground">
                    {{ place.name }}
                </h3>
                <div
                    class="flex items-center text-xs text-muted-foreground mt-1"
                >
                    <MapPin class="w-3 h-3 mr-1" />
                    <span>{{ place.distance.toFixed(1) || "--" }} km</span>
                </div>
            </div>
        </div>
    </div>
</template>
