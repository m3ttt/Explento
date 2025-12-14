<script setup lang="ts">
import { logout } from "@/lib/auth";
import type { User } from "@/lib/type";
import { initials } from "@dicebear/collection";
import { createAvatar } from "@dicebear/core";
import { computed } from "vue";
import { useRouter } from "vue-router";

const props = defineProps<{
    user: User;
}>();

const router = useRouter();

const avatar = computed(() => {
    if (!props.user) return "";

    return createAvatar(initials, {
        seed: props.user.username,
        size: 128,
    }).toDataUri();
});

const handleLogout = async () => {
    await logout();
    router.push("/login");
};
</script>

<template>
    <div
        class="bg-background rounded-2xl p-6 shadow-xl border w-full h-64 flex flex-col items-center justify-center gap-4"
    >
        <div
            class="w-20 h-20 bg-muted rounded-full flex items-center justify-center"
        >
            <img :src="avatar" alt="Avatar" class="rounded-full" />
        </div>
        <div class="text-center">
            <h2 class="text-xl font-bold">
                {{ user.username }}
            </h2>
            <p class="text-muted-foreground text-sm">
                {{ user.name }} {{ user.surname }}
            </p>
        </div>
        <button class="text-sm text-primary underline" @click="handleLogout">
            <p>Logout</p>
        </button>
    </div>
</template>
