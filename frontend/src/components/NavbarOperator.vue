<script setup lang="ts">
import { LayoutDashboard, Map, ClipboardCheck } from "lucide-vue-next";
import { Button } from "./ui/button";
import { useRouter, useRoute } from "vue-router";
import { computed } from "vue";

const router = useRouter();
const route = useRoute();

// Funzione per cambiare pagina in base ai path definiti nel tuo router.ts
const navigate = (path: string) => {
  router.push(path);
};

// Determiniamo quale tab è attiva guardando l'URL attuale (route.path)
const activeTab = computed(() => route.path);
</script>

<template>
  <div class="flex w-full max-w-md items-center justify-between gap-2 p-2 mx-6 rounded-full bg-background shadow-sm pointer-events-auto">
    
    <Button
      variant="ghost"
      :class="['flex-1 rounded-full hover:bg-muted', activeTab === '/operator' ? 'bg-muted text-primary' : '']"
      @click="navigate('/operator')"
    >
      <LayoutDashboard class="w-5 h-5" />
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
      :class="['flex-1 rounded-full hover:bg-muted', activeTab === '/operator/requests' ? 'bg-muted text-primary' : '']"
      @click="navigate('/operator/requests')"
    >
      <ClipboardCheck class="w-5 h-5" />
    </Button>
    
  </div>
</template>
