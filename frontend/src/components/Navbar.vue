<script setup lang="ts">
import { CirclePlus, Home, User } from "lucide-vue-next";
import { Button } from "../components/ui/button";

defineEmits(["change-tab"]);

defineProps<{
  activeTab?: string;
}>();
</script>

<template>
  <div
    class="flex w-full max-w-md items-center justify-between gap-2 p-2 mx-6 rounded-full bg-background pointer-events-auto"
  >
    <Button
      variant="ghost"
      class="flex-1 rounded-full hover:bg-muted"
      @click="$emit('change-tab', 'home')"
    >
      <Home class="w-5 h-5" />
    </Button>

    <Button
      variant="ghost"
      class="flex-1 rounded-full hover:bg-muted"
      @click="$emit('change-tab', 'add')"
    >
      <CirclePlus class="w-5 h-5" />
    </Button>

    <Button
      variant="ghost"
      class="flex-1 rounded-full hover:bg-muted"
      @click="$emit('change-tab', 'profile')"
    >
      <User class="w-5 h-5" />
    </Button>
  </div>
</template>
