<script setup lang="ts">
import { computed } from "vue";
import { Euro, MapPin, Ticket, Pencil } from "lucide-vue-next"; // Aggiunto Pencil
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // Aggiunto Button
import { Place } from "@/lib/types/place";
import { formatCategory } from "@/lib/utils";

const props = defineProps<{
    place: Place;
}>();

const emit = defineEmits<{
    (e: "edit", place: Place): void;
}>();

const parsedCategories = computed(() => {
    if (!props.place.categories) return [];
    return props.place.categories.slice(0, 3).map(formatCategory);
});

const handleEdit = () => {
    emit("edit", props.place);
};
</script>

<template>
    <div
        class="relative flex flex-col w-48 h-32 p-3 rounded-2xl bg-background snap-center shrink-0 overflow-hidden group cursor-pointer transition-all shadow-sm"
    >
        <div class="absolute top-2 right-2 z-20 flex gap-1">
            <Button
                variant="secondary"
                size="icon"
                class="w-7 h-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                @click.stop="handleEdit"
            >
                <Pencil class="w-3.5 h-3.5" />
            </Button>

            <div
                v-if="!place.isFree"
                class="bg-amber-100 text-amber-700 p-1.5 rounded-full shadow-sm"
            >
                <Ticket class="w-3 h-3" />
            </div>
        </div>

        <div class="relative z-10 flex flex-col justify-between h-full">
            <div
                class="flex justify-start items-start gap-1 flex-wrap content-start pr-8"
            >
                <Badge
                    v-for="category in parsedCategories"
                    :key="category"
                    variant="secondary"
                    class="text-[10px] px-1.5 py-0 h-5"
                >
                    {{ category }}
                </Badge>
            </div>

            <div>
                <h3
                    class="font-semibold text-sm leading-tight text-foreground line-clamp-2"
                >
                    {{ place.name }}
                </h3>
                <div
                    class="flex items-center text-xs text-muted-foreground mt-1"
                >
                    <MapPin class="w-3 h-3 mr-1" />
                    <span> {{ place.distance.toFixed(1) }} km</span>
                </div>
            </div>
        </div>
    </div>
</template>
