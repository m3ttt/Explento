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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LogOut } from "lucide-vue-next";

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
</script>

<template>
    <Card
        class="w-full border-0 shadow-none bg-background flex flex-col items-center justify-center p-4"
        v-if="user.value"
    >
        <CardHeader class="flex flex-col items-center pb-2 w-full h-full">
            <Avatar class="w-20 h-20 mb-2 border">
                <AvatarImage :src="avatar" :alt="user.value.username" />
            </Avatar>
            <div class="text-center w-">
                <CardTitle class="text-xl font-bold">
                    {{ user.value.username }}
                </CardTitle>
                <CardDescription class="text-sm w-full flex flex-row gap-2">
                    {{ user.value.name }} {{ user.value.surname }}
                </CardDescription>
            </div>
        </CardHeader>

        <CardFooter class="pt-2">
            <Button
                variant="ghost"
                size="sm"
                class="gap-2"
                @click="handleLogout"
            >
                <LogOut class="w-4 h-4" />
                Logout
            </Button>
        </CardFooter>
    </Card>
</template>
