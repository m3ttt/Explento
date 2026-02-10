<script setup lang="ts">
import { LayoutDashboard, Map, ClipboardCheck, User, Home, LayoutDashboardIcon } from "lucide-vue-next";
import { Button } from "./ui/button";
import { useRouter, useRoute } from "vue-router";
import { computed } from "vue";

// Definisce l'evento che la navbar invia al genitore
const emit = defineEmits<{
  (e: "change-tab", tab: string): void
}>();

const router = useRouter();
const route = useRoute();

// Determina quale tab è attiva guardando l'URL attuale
const activeTab = computed(() => route.path);

// Funzione per cambiare pagina
const navigate = (path: string) => {
  if (activeTab.value !== path) {
    emit('change-tab', 'close-profile'); // chiude il profilo quando pagina cambia
  }
  router.push(path);
};
</script>

<template>
  <div class="flex w-full max-w-md items-center justify-between gap-2 p-2 mx-6 rounded-full bg-background shadow-sm pointer-events-auto">
    
    <Button
      variant="ghost"
      :class="['flex-1 rounded-full hover:bg-muted', activeTab === '/operator' ? 'bg-muted text-primary' : '']"
      @click="navigate('/operator')"
    >
      <Home class="w-5 h-5" />
    </Button>

    <Button
      variant="ghost"
      :class="['flex-1 rounded-full hover:bg-muted', activeTab === '/operator/requests' ? 'bg-muted text-primary' : '']"
      @click="navigate('/operator/requests')"
    >
      <ClipboardCheck class="w-5 h-5" />
    </Button>

    <Button
      variant="ghost"
      :class="['flex-1 rounded-full hover:bg-muted', activeTab === '/operator/heatmap' ? 'bg-muted text-primary' : '']"
      @click="navigate('/operator/heatmap')"
    >
      <Map class="w-5 h-5" />
    </Button>

    <Button
      variant="ghost"
      :class="['flex-1 rounded-full hover:bg-muted', activeTab === '/operator/dashboard' ? 'bg-muted text-primary' : '']"
      @click="navigate('/operator/dashboard')"
    >
      <LayoutDashboardIcon class="w-5 h-5" />
    </Button>

    <Button
      variant="ghost"
      class="flex-1 rounded-full hover:bg-muted"
      @click="emit('change-tab', 'profile')"
    >
      <User class="w-5 h-5" />
    </Button>
    
  </div>
</template>
