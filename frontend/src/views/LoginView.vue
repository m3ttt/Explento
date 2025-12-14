<script lang="ts" setup>
import { Button } from "../components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

import { login } from "../lib/auth";

import { useRouter } from "vue-router";
import { ref } from "vue";

const router = useRouter();

const formData = ref({
    username: "",
    password: "",
});

const loading = ref(false);
const error = ref("");

async function triggerLogin() {
    loading.value = true;
    error.value = "";

    const res = await login(formData.value.username, formData.value.password);

    if (res.error) {
        error.value = "Login fallito. Username o password errati";
        loading.value = false;
        return;
    }

    loading.value = false;
    router.push("/");
    return;
}
</script>

<template>
    <div
        class="w-full h-screen flex items-center justify-center bg-background px-4"
    >
        <Card class="w-full max-w-sm shadow-lg">
            <CardHeader class="space-y-1 text-center">
                <CardTitle class="text-2xl font-bold">Accesso</CardTitle>
                <CardDescription>
                    Inserisci le tue credenziali per entrare in Explento
                </CardDescription>
            </CardHeader>

            <form @submit.prevent="triggerLogin">
                <CardContent class="grid gap-4">
                    <div
                        v-if="error"
                        class="p-3 text-sm text-destructive bg-destructive rounded-md border border-destructive text-center"
                    >
                        {{ error }}
                    </div>

                    <div class="grid gap-2">
                        <Label for="username">Username</Label>
                        <Input
                            id="username"
                            type="text"
                            v-model="formData.username"
                            placeholder="Test"
                            required
                            class="bg-background"
                        />
                    </div>

                    <div class="grid gap-2">
                        <div class="flex items-center justify-between">
                            <Label for="password">Password</Label>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Test"
                            v-model="formData.password"
                            required
                            class="bg-background"
                        />
                    </div>
                </CardContent>

                <CardFooter class="flex flex-col gap-4 pt-6">
                    <Button
                        class="w-full font-semibold"
                        type="submit"
                        :disabled="loading"
                    >
                        <span
                            v-if="loading"
                            class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                        ></span>
                        {{ loading ? "Accesso in corso..." : "Accedi" }}
                    </Button>

                    <div class="relative w-full">
                        <div class="absolute inset-0 flex items-center">
                            <span class="w-full border-t" />
                        </div>
                        <div
                            class="relative flex justify-center text-xs uppercase"
                        >
                            <span
                                class="bg-background px-2 text-muted-foreground"
                            >
                                Oppure
                            </span>
                        </div>
                    </div>

                    <div class="text-center text-sm text-muted-foreground">
                        Non hai ancora un account?
                        <router-link
                            to="/register"
                            class="font-medium text-primary underline underline-offset-4 hover:text-primary/70"
                        >
                            Registrati ora
                        </router-link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    </div>
</template>
