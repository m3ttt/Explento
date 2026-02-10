<script lang="ts" setup>
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";

import { Lock } from "lucide-vue-next";
</script>

<template>
  <Card class="border-none w-full h-full bg-background">
    <CardHeader class="text-center pb-2">
      <div
        class="mx-auto bg-primary w-12 h-12 rounded-full flex items-center justify-center mb-2"
      >
        <Lock class="w-6 h-6 text-background" />
      </div>
      <CardTitle class="text-lg">Diventa un Esperto</CardTitle>
      <CardDescription>
        Questa funzionalità è riservata agli utenti con grado Esperto.
      </CardDescription>
    </CardHeader>
    <CardContent class="text-center w-full">
      <p class="text-sm text-muted-foreground">
        Continua a esplorare nuovi luoghi e interagire con la community per
        guadagnare i punti
        <strong>EXP</strong> necessari allo sblocco.
      </p>
    </CardContent>
  </Card>
</template>
