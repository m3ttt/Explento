<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Mission } from "@/lib/types/mission";
import { makeUserAuthenticatedRequest } from "@/lib/auth";
import { toast } from "vue-sonner";
const props = defineProps<{
  mission: Mission;
}>();

const emit = defineEmits(["take"]);

const placesNames = ref<Record<string, string>>({});

const fetchPlaceDetails = async () => {
  if (
    !props.mission.requiredPlaces ||
    props.mission.requiredPlaces.length === 0
  )
    return;

  try {
    const promises = props.mission.requiredPlaces.map(async (p) => {
      const response = await makeUserAuthenticatedRequest(
        `/places/${p.placeId}`,
      );
      const data = await response.json();
      return { id: p.placeId, name: data.name };
    });

    const results = await Promise.all(promises);

    results.forEach((res) => {
      placesNames.value[res.id] = res.name;
    });
  } catch (error) {
    console.error("Errore nel recupero dei luoghi:", error);
    toast.error("Errore recupero informazioni missione");
  }
};

onMounted(fetchPlaceDetails);
</script>

<template>
  <Card class="group overflow-hidden border-none">
    <CardContent>
      <div class="flex items-start gap-4">
        <div class="flex-1 min-w-0 space-y-2">
          <div class="flex items-center gap-2">
            <h3 class="font-semibold text-base truncate tracking-tight">
              {{ mission.name }}
            </h3>

            <Badge variant="secondary" class="text-xs font-medium">
              +{{ mission.rewardExp }} XP
            </Badge>
          </div>

          <div
            class="flex flex-col text-sm text-muted-foreground gap-1 leading-relaxed"
          >
            <!-- Variante missione visita categorie -->
            <div v-if="mission.categories?.length">
              Visita
              <strong class="text-foreground">
                {{
                  mission.requiredCount === 1
                    ? `${mission.requiredCount} luogo`
                    : `${mission.requiredCount} luoghi`
                }}
              </strong>
              delle categorie
              <span class="text-primary font-medium">
                {{ mission.categories.join(", ") }}
              </span>
            </div>

            <!-- Luoghi specifici -->
            <div v-if="mission.requiredPlaces?.length">
              Visita i luoghi:
              <span class="text-foreground font-medium">
                {{
                  mission.requiredPlaces
                    .map((p) => placesNames[p.placeId] || "Caricamento...")
                    .join(", ")
                }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex items-center">
          <Button @click="emit('take', mission)"> Prendi </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
