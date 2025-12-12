<script setup lang="ts">
import { Button } from "../components/ui/button";
import { useRouter } from "vue-router";

const router = useRouter();

function goTo(page: string) {
  router.push(`/operator/${page}`);
}
</script>

<template>
  <div class="flex flex-col items-center justify-center h-screen space-y-4">
    <h1 class="text-3xl font-bold mb-6">Pagina Operatore</h1>

    <Button
      variant="default"
      class="w-64 font-semibold"
      @click="goTo('heatmap')"
    >
      Heatmaps
    </Button>

    <Button
      variant="default"
      class="w-64 font-semibold"
      @click="goTo('requests')"
    >
      Requests
    </Button>

    <Button
      variant="default"
      class="w-64 font-semibold"
      @click="goTo('dashboard')"
    >
      Dashboard
    </Button>
  </div>
</template>

<style scoped>

</style>
