<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { makeUserAuthenticatedRequest, refreshUser } from "@/lib/auth";
import { Mission, MissionSchema } from "@/lib/types/mission";
import { onMounted, Ref, ref } from "vue";
import { toast } from "vue-sonner";
import z from "zod";
import MissionView from "./MissionView.vue";
import { User } from "@/lib/types/user";
import MissionProgress from "./MissionProgress.vue";
import { Separator } from "@/components/ui/separator";

const props = defineProps<{
  user: Ref<User>;
}>();

// Missioni disponibili
const missions = ref<Mission[]>([]);

// Caricamento missioni
async function loadMissions() {
  const resp = await makeUserAuthenticatedRequest("/missions/available", {});

  if (!resp.ok) {
    toast.error("Errore caricamento missioni");
    return;
  }

  const data = await resp.json();

  const res = z.array(MissionSchema).safeParse(data);
  if (res.error) {
    toast.error("Errore caricamento missioni");
    console.error(res.error);
    return;
  }

  missions.value = res.data;
}

onMounted(loadMissions);

// Quando viene presa una missione in carico
const handleTakeMission = async (m: Mission) => {
  const resp = await makeUserAuthenticatedRequest(`/missions/activate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ missionId: m._id }),
  });

  if (resp.ok) {
    toast.success("Missione presa in carico");
    // Aggiorno utente e missioni
    await loadMissions();
    await refreshUser();
    return;
  }

  toast.error("Errore nel prendere la missione");
};

const handleRemoveMission = async (m: Mission) => {
  const resp = await makeUserAuthenticatedRequest(`/missions/${m._id}`, {
    method: "DELETE",
  });

  if (resp.ok) {
    toast.success("Missione rimossa con successo");
    await loadMissions();
    await refreshUser();
    return;
  }
  toast.error("Errore nella rimozione della missione");
};
</script>

<template>
  <Card
    class="w-full bg-background border-none max-h-[85vh] flex flex-col overflow-y-auto"
  >
    <!-- Mostra tab attive se ne abbiamo alcune attive -->
    <Tabs
      :default-value="
        props.user.value.missionsProgresses?.filter((m) => !m.completed)
          .length === 0
          ? 'new'
          : 'active'
      "
      class="w-full flex flex-col flex-1"
    >
      <CardHeader class="flex flex-col gap-4 shrink-0">
        <div class="flex items-center justify-between">
          <CardTitle class="text-xl"> Missioni </CardTitle>
        </div>
        <TabsList class="w-full">
          <TabsTrigger value="new"> Nuove </TabsTrigger>
          <TabsTrigger value="active"> Attive </TabsTrigger>
        </TabsList>
      </CardHeader>

      <CardContent class="pt-4 flex-1 overflow-y-auto">
        <!-- Tab missioni da prendere -->
        <TabsContent value="new">
          <div v-if="missions.length > 0" class="grid gap-4">
            <MissionView
              v-for="mis in missions"
              :key="mis._id"
              :mission="mis"
              @take="handleTakeMission"
            />
          </div>

          <div v-else class="flex flex-col py-12 items-center justify-center">
            <p class="text-muted-foreground font-medium">
              Nessuna nuova missione disponibile
            </p>
            <p class="text-sm text-muted-foreground">
              Torna più tardi per nuove sfide!
            </p>
          </div>
        </TabsContent>

        <!-- Tab missioni attive -->
        <TabsContent value="active" class="mt-0">
          <div
            v-if="
              props.user.value.missionsProgresses?.filter((m) => !m.completed)
                .length
            "
            class="grid gap-4"
          >
            <MissionProgress
              v-for="mis in props.user.value.missionsProgresses.filter(
                (m) => !m.completed,
              )"
              :key="mis.missionId"
              :mission-progress="mis"
              @remove="handleRemoveMission"
            />
          </div>

          <div
            v-else
            class="flex flex-col items-center justify-center py-12 text-center"
          >
            <p class="text-muted-foreground font-medium">
              Nessuna missione in corso
            </p>
            <p class="text-sm text-muted-foreground">
              Attiva una missione dalla tab "Nuove"
            </p>
          </div>

          <Separator class="my-4" />

          <!-- Missioni completate -->
          <div class="flex flex-col gap-4">
            <MissionProgress
              v-for="mis in props.user.value.missionsProgresses.filter(
                (m) => m.completed,
              )"
              :key="mis.missionId"
              :mission-progress="mis"
            />
          </div>
        </TabsContent>
      </CardContent>
    </Tabs>
  </Card>
</template>
