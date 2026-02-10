<script setup lang="ts">
import { ref, type Ref } from "vue";
import type { Operator } from "@/lib/types/operator";
import NavbarOperator from "../components/NavbarOperator.vue";
import OperatorProfileCard from "../components/OperatorProfileCard.vue";
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const showNavbar = computed(() => !route.meta.hideNavbar);

// Riceve l'operatore dal router
const props = defineProps<{
    currentOperator: Ref<Operator | null>;
}>();

const isProfileOpen = ref(false);

// Gestisce l'evento change-tab della navbar
const handleTabChange = (tab: string) => {
  if (tab === "profile") {
    isProfileOpen.value = !isProfileOpen.value; // toggle profilo
  } else {
    isProfileOpen.value = false; // chiude profilo se cambio pagina o evento close-profile
  }
};
</script>

<template>
  <div class="relative min-h-screen bg-background overflow-hidden">
    <main class="h-full">
      <router-view :currentOperator="currentOperator" />
    </main>

    <div class="fixed bottom-0 left-0 right-0 z-[1000] flex flex-col items-center pointer-events-none gap-3 p-8">
      
      <div v-if="isProfileOpen" class="w-full max-w-md pointer-events-auto pb-6">
        <div class="bg-background rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <OperatorProfileCard :operator="currentOperator" />
        </div>
      </div>

      <NavbarOperator 
        v-if="showNavbar"
        class="pointer-events-auto" 
        @change-tab="handleTabChange" 
      />
    </div>
  </div>
</template>