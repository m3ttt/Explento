<script setup lang="ts">
import { logoutOp } from "@/lib/operatorAuth";
import { computed } from "vue";
import { useRouter } from "vue-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User, ShieldCheck, Mail, Fingerprint } from "lucide-vue-next";
import { Separator } from "@/components/ui/separator";

const props = defineProps<{
  operator: any;
}>();

const router = useRouter();

const opData = computed(() => {
  return props.operator?.value || props.operator;
});

const initials = computed(() => {
  if (!opData.value) return "OP";
  const { name, surname } = opData.value;
  // Gestione nel caso name o surname fossero undefined nello schema
  const n = name ? name[0] : "O";
  const s = surname ? surname[0] : "P";
  return `${n}${s}`.toUpperCase();
});

const handleLogout = async () => {
  await logoutOp();
  router.push("/operator/login");
};
</script>

<template>
  <Card
    class="w-full border-0 shadow-none bg-background flex flex-col items-center justify-center p-4"
    v-if="opData"
  >
    <CardHeader class="flex flex-col items-center pb-4 w-full">
      <Avatar class="w-24 h-24 mb-3 border-2 border-muted shadow-sm">
        <AvatarFallback
          class="bg-primary text-primary-foreground text-xl font-bold"
        >
          {{ initials }}
        </AvatarFallback>
      </Avatar>
      <div class="text-center space-y-1">
        <CardTitle class="text-2xl font-bold tracking-tight">
          {{ opData.name }} {{ opData.surname }}
        </CardTitle>
        <p
          class="text-xs text-muted-foreground flex items-center justify-center gap-1.5 mt-1"
        >
          <Mail class="w-3 h-3" />
          {{ opData.email }}
        </p>
      </div>
    </CardHeader>

    <CardContent class="w-full space-y-6 pt-2">
      <Separator />
      <div class="space-y-4">
        <div class="space-y-3 px-1">
          <div class="flex items-center justify-between">
            <span
              class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1"
            >
              <ShieldCheck class="w-3 h-3" /> Ruolo
            </span>
            <span
              class="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase"
            >
              {{ opData.role }}
            </span>
          </div>
        </div>
      </div>
      <Separator />
    </CardContent>

    <CardFooter class="flex flex-col gap-2 w-full pt-0">
      <Button
        variant="ghost"
        size="sm"
        class="w-full gap-2 text-muted-foreground hover:bg-destructive hover:text-white transition-colors"
        @click="handleLogout"
      >
        <LogOut class="w-4 h-4" />
        <span>Logout</span>
      </Button>
    </CardFooter>
  </Card>
</template>
