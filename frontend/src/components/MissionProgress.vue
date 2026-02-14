<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import z from "zod";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { makeUserAuthenticatedRequest } from "@/lib/auth";
import { CheckCircle2, Circle } from "lucide-vue-next";
import { MissionProgressSchema, type MissionProgress } from "@/lib/types/user";
import { toast } from "vue-sonner";
import { Mission, MissionSchema } from "@/lib/types/mission";
import { X } from "lucide-vue-next";

const props = defineProps<{
  missionProgress: MissionProgress;
}>();

const emit = defineEmits<{
  (e: "remove", mission: Mission): void;
}>();

const missionDetails = ref<Mission | null>(null);
const placesNames = ref<Record<string, string>>({});

// Caricamento dati missioni
const fetchAllData = async () => {
  try {
    const validProgress = MissionProgressSchema.parse(props.missionProgress);

    const missionRes = await makeUserAuthenticatedRequest(
      `/missions/${validProgress.missionId}`,
    );
    const rawMission = await missionRes.json();

    const parsedMission = MissionSchema.safeParse(rawMission);
    if (parsedMission.error) {
      console.error(parsedMission.error);
      toast.error("Errore caricamento dati missioni");
      return;
    }
    missionDetails.value = parsedMission.data;

    if (
      parsedMission.data.requiredPlaces &&
      parsedMission.data.requiredPlaces.length > 0
    ) {
      const namePromises = parsedMission.data.requiredPlaces.map(async (p) => {
        try {
          const res = await makeUserAuthenticatedRequest(
            `/places/${p.placeId}`,
          );
          const placeData = await res.json();
          return {
            id: p.placeId,
            name: z.string().parse(placeData.name),
          };
        } catch {
          return { id: p.placeId, name: "Luogo sconosciuto" };
        }
      });

      const results = await Promise.all(namePromises);
      results.forEach((res) => {
        placesNames.value[res.id] = res.name;
      });
    }
  } catch (err) {
    console.error("Errore caricamento dati missioni", err);
    toast.error("Errore caricamento dati missioni");
  }
};

onMounted(fetchAllData);

// Controlla se posto visitato missione visita X, Y, Z luoghi
const isPlaceVisited = (placeId: string) => {
  const res =
    props.missionProgress.requiredPlacesVisited?.some(
      (p) => p.placeId == placeId,
    ) ?? false;
  return res;
};

// Funzione che calcola progress in base al tipo di missione
const progress = computed(() => {
  if (!missionDetails.value) return 0;

  if (
    missionDetails.value.categories &&
    missionDetails.value.categories.length != 0
  ) {
    return Math.round(
      (props.missionProgress.progress / missionDetails.value.requiredCount) *
        100,
    );
  }

  return Math.round(
    (props.missionProgress.requiredPlacesVisited?.length /
      missionDetails.value.requiredPlaces.length) *
      100,
  );
});
</script>

<template>
  <Card class="group overflow-hidden border-none">
    <CardContent>
      <div v-if="missionDetails" class="space-y-4">
        <div class="flex justify-between items-start gap-3">
          <div class="flex-1 min-w-0 space-y-1">
            <CardTitle
              class="flex flex-row gap-2 items-center text-base font-semibold"
            >
              {{ missionDetails.name }}
              <Badge variant="secondary" class="text-xs font-medium">
                +{{ missionDetails.rewardExp }} EXP
              </Badge>
            </CardTitle>

            <Badge
              v-if="missionProgress.completed"
              variant="outline"
              class="text-xs"
            >
              Completata
            </Badge>
          </div>
          <!-- TODO: Migliorare?? -->
          <Button
            v-if="!missionProgress.completed"
            variant="destructive"
            size="icon"
            class="opacity-0 group-hover:opacity-100 h-8"
            @click="emit('remove', missionDetails)"
            ><X class="w-3 h-3" />
          </Button>
        </div>

        <div class="space-y-2" v-if="!missionProgress.completed">
          <div
            class="flex justify-between text-[10px] uppercase tracking-wider font-semibold text-muted-foreground"
          >
            <span>Progresso</span>
            <span>{{ progress }}%</span>
          </div>

          <Progress :model-value="progress" class="h-2 rounded-full" />
        </div>

        <!-- Tipologia missione visita X,Y,Z luoghi -->
        <div
          v-if="missionDetails.requiredPlaces?.length"
          class="space-y-3 pt-3 border-t"
        >
          <p class="text-[10px] font-semibold uppercase text-muted-foreground">
            Luoghi da visitare
          </p>

          <div class="grid gap-2">
            <div
              v-for="target in missionDetails.requiredPlaces"
              :key="target.placeId"
              class="flex items-center gap-3 p-2 rounded-lg border bg-muted/40 transition-colors"
            >
              <div class="shrink-0">
                <CheckCircle2
                  v-if="isPlaceVisited(target.placeId)"
                  class="w-4 h-4 text-primary"
                />
                <Circle v-else class="w-4 h-4 text-muted-foreground" />
              </div>

              <span
                class="text-xs flex-1 truncate"
                :class="
                  isPlaceVisited(target.placeId)
                    ? 'line-through text-muted-foreground'
                    : 'text-foreground'
                "
              >
                {{ placesNames[target.placeId] || "Caricamento..." }}
              </span>
            </div>
          </div>
        </div>

        <!-- Tipologia missione visita X luoghi della categorie X, Y, Z -->
        <div
          v-else-if="
            missionDetails.categories?.length && !missionProgress.completed
          "
          class="p-3 rounded-lg border bg-muted text-xs text-muted-foreground"
        >
          Obiettivo:
          <strong class="text-foreground">
            {{ missionDetails.requiredCount }}
          </strong>
          luoghi della categoria
          <span class="font-medium text-primary">
            {{ missionDetails.categories.join(", ") }}
          </span>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
