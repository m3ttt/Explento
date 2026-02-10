<script setup lang="ts">
import { ref, onMounted } from "vue";
import {
  VisXYContainer,
  VisStackedBar,
  VisAxis,
  VisTooltip,
} from "@unovis/vue";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, BarChart3, AlertCircle } from "lucide-vue-next";
import { makeOperatorAuthenticatedRequest } from "@/lib/operatorAuth";

interface MissionData {
  name: string;
  completedMissions: number;
}

const chartData = ref<{ x: number; y: number; label: string }[]>([]);
const isLoading = ref(true);
const error = ref<string | null>(null);

// Accessor functions
const x = (d: any) => d.x;
const y = (d: any) => d.y;
const tickFormat = (i: number) => chartData.value[i]?.label || "";

async function fetchStats() {
  try {
    isLoading.value = true;
    const res = await makeOperatorAuthenticatedRequest("/heatmap/missions", {});
    if (!res.ok) throw new Error("Errore nel caricamento dei dati statistici");

    const data = await res.json();

    chartData.value = data.map((item: any, i: number) => ({
      x: i,
      y: item.completedMissions,
      label: item.name,
    }));
  } catch (err: any) {
    error.value = err.message;
  } finally {
    isLoading.value = false;
  }
}

onMounted(fetchStats);
</script>

<template>
  <div class="container mx-auto p-6">
    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
    >
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Statistiche Missioni</h1>
        <p class="text-muted-foreground">
          Monitoraggio del completamento missioni per utente.
        </p>
      </div>
    </div>

    <Card class="w-full shadow-sm">
      <CardHeader
        class="flex flex-row items-center justify-between space-y-0 pb-7"
      >
        <div class="space-y-1">
          <CardTitle class="text-xl font-semibold"
            >Distribuzione Completamenti</CardTitle
          >
          <CardDescription
            >Visualizzazione aggregata dei dati backend</CardDescription
          >
        </div>
        <BarChart3 class="h-5 w-5 text-muted-foreground" />
      </CardHeader>

      <CardContent>
        <div
          v-if="isLoading"
          class="flex flex-col items-center justify-center h-[400px] gap-3"
        >
          <Loader2 class="h-8 w-8 animate-spin text-primary" />
          <p class="text-sm text-muted-foreground">
            Elaborazione dati in corso...
          </p>
        </div>

        <div
          v-else-if="error"
          class="flex flex-col items-center justify-center h-[400px] text-center border border-destructive/20 rounded-lg bg-destructive/10 p-6"
        >
          <AlertCircle class="h-10 w-10 text-destructive mb-2" />
          <p class="text-destructive font-medium">{{ error }}</p>
          <button
            @click="fetchStats"
            class="mt-4 text-sm underline hover:opacity-80"
          >
            Riprova
          </button>
        </div>

        <div v-else class="unovis-wrapper">
          <VisXYContainer
            :data="chartData"
            :height="400"
            :margin="{ top: 10, right: 10, bottom: 40, left: 40 }"
          >
            <VisStackedBar
              :x="x"
              :y="y"
              :rounded-corners="4"
              :bar-padding="0.15"
              color="#2563eb"
            />
            <VisAxis
              type="x"
              :tickFormat="tickFormat"
              :gridLine="false"
              :numTicks="chartData.length"
            />
            <VisAxis type="y" :gridLine="true" label="Missioni" />
            <VisTooltip />
          </VisXYContainer>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<style scoped>
.unovis-wrapper {
  width: 100%;
  /* Colore delle linee degli assi per matchare Tailwind muted */
  --vis-axis-grid-color: #e2e8f0;
  --vis-axis-tick-label-color: #64748b;
  --vis-axis-label-color: #64748b;
  --vis-tooltip-background-color: #ffffff;
  --vis-tooltip-border-color: #e2e8f0;
  --vis-tooltip-text-color: #0f172a;
}

:deep(svg) {
  display: block;
  overflow: visible;
}

/* Stile per i tick dell'asse X se i nomi sono lunghi */
:deep(.vis-axis-x .tick text) {
  font-size: 12px;
}
</style>
