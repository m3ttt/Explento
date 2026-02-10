<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useRouter } from "vue-router";
import type { Ref } from "vue";
import { logout, makeUserAuthenticatedRequest } from "@/lib/auth";
import type { User } from "@/lib/types/user";
import { initials } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import {
  LogOut,
  Settings2,
  Star,
  MapPin,
  Sparkles,
  ChevronDown,
  Map,
} from "lucide-vue-next";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatCategory } from "@/lib/utils";

const props = defineProps<{
  user: Ref<User | null>;
}>();

const router = useRouter();
const activeSection = ref<"preferences" | "discovered" | null>(null);

const toggleSection = (section: "preferences" | "discovered") => {
  activeSection.value = activeSection.value === section ? null : section;
};

const placeNames = ref<Record<string, string>>({});

// Faccio una variabile dinamica computed, perchè props.user è una ref
// Aggiorno discoveredPlaces solo quando si aggiorna props.user
const discoveredPlaces = computed(() => {
  if (!props.user?.value?.visitedPlaces) return [];

  const discoveryMap: Record<string, string> = {};

  props.user.value.visitedPlaces.forEach((p) => {
    // Se il luogo non c'è o la data corrente è precedente a quella salvata, aggiorna
    if (
      !discoveryMap[p.placeId] ||
      new Date(p.date) < new Date(discoveryMap[p.placeId])
    ) {
      discoveryMap[p.placeId] = p.date;
    }
  });

  // Trasforma l'oggetto in un array e ordina per data più recente di scoperta
  return Object.entries(discoveryMap)
    .map(([placeId, date]) => ({ placeId, date }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
});

const avatar = computed(() => {
  if (!props.user?.value) return "";
  return createAvatar(initials, {
    seed: props.user.value.username,
    size: 128,
  }).toDataUri();
});

const fetchPlaceNames = async () => {
  const uniqueIds = discoveredPlaces.value.map((p) => p.placeId);
  if (uniqueIds.length === 0) return;

  const promises = uniqueIds.map(async (id) => {
    // Salta se già caricato (risparmio qualche chiamata API)
    if (placeNames.value[id]) return;

    try {
      const resp = await makeUserAuthenticatedRequest(`/places/${id}`, {});
      if (resp.ok) placeNames.value[id] = (await resp.json()).name;
      else placeNames.value[id] = "Luogo sconosciuto";
    } catch (e) {
      placeNames.value[id] = "Luogo sconosciuto";
    }
  });
  await Promise.all(promises);
};

onMounted(fetchPlaceNames);
// Quando props.user.value.visitedPlaces cambia faccio il fetchPlaceNames
watch(() => props.user?.value?.visitedPlaces, fetchPlaceNames, { deep: true });

const handleLogout = async () => {
  await logout();
  router.push("/login");
};

const goToSurvey = () => {
  router.push("/survey");
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
</script>

<template>
  <Card
    class="w-full max-h-[85vh] border-0 shadow-none bg-background flex flex-col p-4"
    v-if="user.value"
  >
    <CardHeader class="flex flex-col items-center pb-4 w-full shrink-0">
      <div class="relative flex flex-col items-center mb-8">
        <div class="p-1.5 rounded-full transition-all duration-700">
          <Avatar class="w-24 h-24 border-4 border-background shadow-sm">
            <AvatarImage :src="avatar" :alt="user.value.username" />
          </Avatar>
        </div>

        <div
          v-if="user.value.expert"
          class="absolute -bottom-3 bg-yellow-600 text-white text-[10px] font-black px-4 py-1 rounded-full border-2 border-background shadow-xl flex items-center gap-1.5 uppercase tracking-tighter"
        >
          <Star class="w-3 h-3 fill-current" />
          Expert
        </div>
      </div>

      <div class="text-center space-y-1">
        <CardTitle class="text-2xl font-bold tracking-tight text-foreground">
          {{ user.value.username }}
        </CardTitle>
        <CardDescription class="text-sm font-medium text-muted-foreground">
          {{ user.value.name }} {{ user.value.surname }}
        </CardDescription>
      </div>

      <div class="flex gap-3 mt-6">
        <div
          class="flex flex-col items-center bg-muted/40 px-5 py-2 rounded-2xl border border-border/50"
        >
          <div class="flex items-center gap-1.5 text-primary">
            <Sparkles class="w-4 h-4" />
            <span class="font-bold text-lg leading-none">{{
              user.value.exp
            }}</span>
          </div>
          <span
            class="text-[9px] uppercase text-muted-foreground font-bold mt-1"
            >Esperienza</span
          >
        </div>

        <div
          @click="toggleSection('discovered')"
          class="flex flex-col items-center bg-muted/40 px-5 py-2 rounded-2xl border border-border/50 cursor-pointer hover:bg-muted/60 transition-colors"
        >
          <div class="flex items-center gap-1.5 text-chart-3">
            <MapPin class="w-4 h-4" />
            <span class="font-bold text-lg leading-none">{{
              discoveredPlaces.length
            }}</span>
          </div>
          <span
            class="text-[9px] uppercase text-muted-foreground font-bold mt-1"
            >Scoperte</span
          >
        </div>
      </div>
    </CardHeader>

    <CardContent
      class="w-full space-y-3 pt-2 overflow-y-auto flex-1 scrollbar-hide"
    >
      <Separator class="mb-4 opacity-50" />

      <div
        class="rounded-xl border border-border/40 overflow-hidden bg-card/50"
      >
        <button
          @click="toggleSection('preferences')"
          class="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
        >
          <div class="flex items-center gap-2">
            <Settings2 class="w-4 h-4 text-muted-foreground" />
            <span
              class="text-xs font-bold uppercase tracking-widest text-muted-foreground"
              >Preferenze</span
            >
          </div>
          <ChevronDown
            :class="[
              'w-4 h-4 transition-transform duration-300',
              activeSection === 'preferences' ? 'rotate-180' : '',
            ]"
          />
        </button>

        <div
          v-show="activeSection === 'preferences'"
          class="px-4 pb-4 space-y-4"
        >
          <div class="flex items-center justify-between pt-2">
            <span class="text-[11px] font-medium text-foreground">Budget</span>
            <Badge
              :variant="
                user.value.preferences?.alsoPaid ? 'default' : 'secondary'
              "
              class="text-[10px]"
            >
              {{
                user.value.preferences?.alsoPaid
                  ? "Anche a pagamento"
                  : "Solo Gratuiti"
              }}
            </Badge>
          </div>
          <div class="flex flex-wrap gap-2">
            <Badge
              v-for="cat in user.value.preferences?.categories"
              :key="cat"
              variant="outline"
              class="bg-secondary/30 text-[10px] border-border/50"
            >
              {{ formatCategory(cat) }}
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            class="w-full text-xs h-8 border-dashed border-primary/30 hover:border-primary/60 transition-colors"
            @click="goToSurvey"
          >
            Aggiorna Preferenze
          </Button>
        </div>
      </div>

      <div
        class="rounded-xl border border-border/40 overflow-hidden bg-card/50"
      >
        <button
          @click="toggleSection('discovered')"
          class="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
        >
          <div class="flex items-center gap-2">
            <Map class="w-4 h-4 text-muted-foreground" />
            <span
              class="text-xs font-bold uppercase tracking-widest text-muted-foreground"
              >Luoghi Scoperti</span
            >
          </div>
          <ChevronDown
            :class="[
              'w-4 h-4 transition-transform duration-300',
              activeSection === 'discovered' ? 'rotate-180' : '',
            ]"
          />
        </button>

        <div v-show="activeSection === 'discovered'" class="px-4 pb-4">
          <div v-if="discoveredPlaces.length" class="space-y-2 pt-2">
            <div
              v-for="place in discoveredPlaces"
              :key="place.placeId"
              class="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/20"
            >
              <div class="flex flex-col">
                <span class="text-[13px] font-bold text-foreground">
                  {{ placeNames[place.placeId] }}
                </span>
                <span
                  class="text-[10px] text-muted-foreground uppercase font-medium"
                >
                  Scoperto il {{ formatDate(place.date) }}
                </span>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-6">
            <p class="text-xs text-muted-foreground italic">
              Ancora nessun luogo scoperto.
            </p>
          </div>
        </div>
      </div>
    </CardContent>

    <CardFooter class="w-full pt-4 shrink-0">
      <Button
        variant="ghost"
        size="sm"
        class="w-full gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        @click="handleLogout"
      >
        <LogOut class="w-4 h-4" />
        Logout Account
      </Button>
    </CardFooter>
  </Card>
</template>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
