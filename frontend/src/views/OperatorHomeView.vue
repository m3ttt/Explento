<script setup lang="ts">
import { logoutOp } from "@/lib/operatorAuth";
import { Button } from "../components/ui/button";
import { useRouter } from "vue-router";
import {
  LayoutDashboard,
  Map,
  ClipboardCheck,
  UserCircle,
  LogOutIcon,
} from "lucide-vue-next";
import { computed } from "vue";

// Riceve la prop (che sia Ref o oggetto)
const props = defineProps<{
  currentOperator: any;
}>();

const router = useRouter();

// Scompatta Ref se presente
const opData = computed(() => {
  const val = props.currentOperator;
  return val && "value" in val ? val.value : val;
});

const handleLogout = async () => {
  await logoutOp();
  router.push("/operator/login");
};

function goTo(page: string) {
  router.push(`/operator/${page}`);
}
</script>

<template>
  <div
    class="flex flex-col items-center justify-center min-h-screen bg-background p-6"
  >
    <div class="mb-12 text-center space-y-2">
      <h1
        class="text-4xl font-black tracking-tighter uppercase italic text-primary"
      >
        Pannello operatore
      </h1>
      <div class="h-1 w-12 bg-primary mx-auto rounded-full"></div>
    </div>

    <div class="flex flex-col gap-4 w-full max-w-sm menu-actions">
      <Button
        variant="secondary"
        class="h-20 rounded-3xl border-0 shadow-lg text-lg font-bold flex justify-between px-8 bg-card hover:bg-accent transition-all active:scale-95"
        @click="goTo('requests')"
      >
        <span class="flex items-center gap-4">
          <ClipboardCheck class="w-6 h-6 text-primary" />
          Requests
        </span>
        <div
          class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <div class="w-2 h-2 rounded-full bg-primary"></div>
        </div>
      </Button>
      
      <Button
        variant="secondary"
        class="h-20 rounded-3xl border-0 shadow-lg text-lg font-bold flex justify-between px-8 bg-card hover:bg-accent transition-all active:scale-95"
        @click="goTo('heatmap')"
      >
        <span class="flex items-center gap-4">
          <Map class="w-6 h-6 text-primary" />
          Heatmap
        </span>
        <div
          class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <div class="w-2 h-2 rounded-full bg-primary"></div>
        </div>
      </Button>

      <Button
        variant="secondary"
        class="h-20 rounded-3xl border-0 shadow-lg text-lg font-bold flex justify-between px-8 bg-card hover:bg-accent transition-all active:scale-95"
        @click="goTo('dashboard')"
      >
        <span class="flex items-center gap-4">
          <LayoutDashboard class="w-6 h-6 text-primary" />
          Dashboard
        </span>
        <div
          class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <div class="w-2 h-2 rounded-full bg-primary"></div>
        </div>
      </Button>
    </div>

    <div v-if="opData" class="mt-12 flex flex-col items-center">
      <div class="flex items-center gap-2 text-muted-foreground mb-1">
        <UserCircle class="w-4 h-4" />
        <span class="text-[10px] font-bold uppercase tracking-widest"
          >Sessione Attiva</span
        >
      </div>

      <p class="text-lg font-medium mb-4">
        Benvenuto,
        <span class="font-bold text-primary"
          >{{ opData.name }} {{ opData.surname }}</span
        >
      </p>

      <Button
        variant="ghost"
        @click="handleLogout"
        class="group flex items-center gap-2 px-6 py-2 rounded-2xl bg-muted/70 text-muted-foreground hover:bg-destructive transition-all duration-200 border border-transparent"
      >
        <LogOutIcon
          class="w-4 h-4 text-muted-foreground group-hover:text-white transition-colors"
        />
        <span
          class="text-sm font-semibold group-hover:text-white transition-colors"
        >
          Logout sessione
        </span>
      </Button>
    </div>
  </div>
</template>

<style scoped>
/* L'animazione si applica solo ai figli di .menu-actions */
.menu-actions > button {
  animation: fadeIn 0.5s ease-out forwards;
  opacity: 0;
}
.menu-actions > button:nth-child(1) {
  animation-delay: 0.05s;
}
.menu-actions > button:nth-child(2) {
  animation-delay: 0.1s;
}
.menu-actions > button:nth-child(3) {
  animation-delay: 0.15s;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>