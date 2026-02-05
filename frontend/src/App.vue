<script setup lang="ts">
import "vue-sonner/style.css";
import { Toaster } from "@/components/ui/sonner";
</script>

<script lang="ts">
export default {
    name: "App",
};
</script>

<template>
    <main>
        <RouterView />
    </main>
    <Toaster position="top-center" />
</template>
