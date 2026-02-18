<script setup lang="ts">
import { useRoute, useRouter } from "vue-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Frown } from "lucide-vue-next";

const router = useRouter();
const route = useRoute();

const goHome = () => router.push({ path: "/", force: true });

const message = route.query.message?.toString() || "Errore sconosciuto";
const code = route.query.code?.toString();
</script>

<template>
  <div class="flex justify-center items-center min-h-screen bg-background">
    <Card class="max-w-md w-full p-6 shadow-lg border-none rounded-2xl">
      <CardHeader class="flex flex-col items-center gap-4">
        <Frown class="w-12 h-12 text-destructive" />
        <CardTitle class="text-2xl font-semibold text-center">
          Qualcosa è andato storto
        </CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col gap-4 items-center">
        <p class="text-lg text-center text-gray-700">{{ message }}</p>
        <p v-if="code" class="text-sm text-gray-500 text-center">
          {{ code }}
        </p>
        <Button @click="goHome" variant="default" class="w-full">
          Torna alla Home
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
