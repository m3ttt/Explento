<script setup lang="ts">
import { logout } from "@/lib/auth";
import type { User } from "@/lib/types/user";
import { initials } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { computed } from "vue";
import { useRouter } from "vue-router";
import type { Ref } from "vue";
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
    Trophy,
    Star,
    MapPin,
    Sparkles,
} from "lucide-vue-next";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { formatCategory } from "@/lib/utils";

const props = defineProps<{
    user: Ref<User | null>;
}>();

const router = useRouter();

const avatar = computed(() => {
    if (!props.user?.value) return "";

    return createAvatar(initials, {
        seed: props.user.value.username,
        size: 128,
    }).toDataUri();
});

const handleLogout = async () => {
    await logout();
    router.push("/login");
};

const goToSurvey = () => {
    router.push("/survey");
};
</script>

<template>
    <Card
        class="w-full border-0 shadow-none bg-background flex flex-col items-center justify-center p-4"
        v-if="user.value"
    >
        <CardHeader class="flex flex-col items-center pb-4 w-full">
            <div class="relative flex flex-col items-center mb-6">
                <div :class="['p-1 rounded-full transition-all duration-500']">
                    <Avatar class="w-24 h-24 border-4 border-background">
                        <AvatarImage :src="avatar" :alt="user.value.username" />
                    </Avatar>
                </div>

                <div
                    v-if="user.value.expert"
                    class="absolute -bottom-3 bg-yellow-700 text-white text-sm font-bold px-3 py-1 rounded-full border-2 border-background shadow-lg flex items-center gap-1 uppercase"
                >
                    <Star class="w-3 h-3 fill-current" />
                    Esperto
                </div>
            </div>

            <div class="text-center space-y-1">
                <CardTitle class="text-2xl font-bold tracking-tight">
                    {{ user.value.username }}
                </CardTitle>
                <CardDescription
                    class="text-sm font-medium text-muted-foreground"
                >
                    {{ user.value.name }} {{ user.value.surname }}
                </CardDescription>
            </div>

            <div class="flex gap-3 mt-4">
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
                        class="text-[9px] uppercase text-muted-foreground font-bold tracking-tighter mt-1"
                        >Esperienza</span
                    >
                </div>
                <div
                    class="flex flex-col items-center bg-muted/40 px-5 py-2 rounded-2xl border border-border/50"
                >
                    <div class="flex items-center gap-1.5 text-blue-500">
                        <MapPin class="w-4 h-4" />
                        <span class="font-bold text-lg leading-none">{{
                            user.value.visitedPlaces?.length || 0
                        }}</span>
                    </div>
                    <span
                        class="text-[9px] uppercase text-muted-foreground font-bold tracking-tighter mt-1"
                        >Visitati</span
                    >
                </div>
            </div>
        </CardHeader>

        <CardContent class="w-full space-y-6 pt-2">
            <Separator />

            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <span
                        class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest"
                    >
                        Preferenze Ricerca
                    </span>
                    <Badge
                        :variant="
                            user.value.preferences?.alsoPaid
                                ? 'default'
                                : 'secondary'
                        "
                        class="text-[10px] px-2 py-0 h-5"
                    >
                        {{
                            user.value.preferences?.alsoPaid
                                ? "Anche a pagamento"
                                : "Solo Gratuiti"
                        }}
                    </Badge>
                </div>

                <div class="flex flex-wrap gap-2 justify-center">
                    <template v-if="user.value.preferences?.categories?.length">
                        <Badge
                            v-for="cat in user.value.preferences.categories"
                            :key="cat"
                            variant="outline"
                            class="bg-secondary/30 border-primary/10 text-[11px] px-2.5 py-0.5"
                        >
                            {{ formatCategory(cat) }}
                        </Badge>
                    </template>
                    <p v-else class="text-xs text-muted-foreground italic py-2">
                        Nessun interesse selezionato.
                    </p>
                </div>

                <div class="flex justify-center pt-1">
                    <Button
                        variant="outline"
                        size="sm"
                        class="text-xs gap-2 h-8 border-dashed"
                        @click="goToSurvey"
                    >
                        <Settings2 class="w-3.5 h-3.5" />
                        Aggiorna Preferenze
                    </Button>
                </div>
            </div>
        </CardContent>

        <CardFooter class="w-full pt-4">
            <Button
                variant="ghost"
                size="sm"
                class="w-full gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                @click="handleLogout"
            >
                <LogOut class="w-4 h-4" />
                Logout Account
            </Button>
        </CardFooter>
    </Card>
</template>
