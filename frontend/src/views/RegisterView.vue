<script lang="ts" setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
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
import { login, register } from "../lib/auth";

const router = useRouter();

const name = ref("");
const surname = ref("");
const username = ref("");
const email = ref("");
const password = ref("");
const confirmPassword = ref("");

const isLoading = ref(false);
const errorMessage = ref("");

async function handleRegister() {
    errorMessage.value = "";

    if (password.value !== confirmPassword.value) {
        errorMessage.value = "Le password non coincidono";
        return;
    }

    if (password.value.length < 8) {
        errorMessage.value = "La password deve essere di almeno 8 caratteri";
        return;
    }

    isLoading.value = true;

    let err = await register(
        username.value,
        password.value,
        email.value,
        name.value,
        surname.value,
    );

    if (err.error) {
        errorMessage.value = "Registrazione fallita";
        return;
    }

    err = await login(username.value, password.value);

    if (err.error) {
        router.push("/login");
        return;
    }

    router.push("/");
}
</script>

<template>
    <div
        class="w-full h-screen flex items-center justify-center bg-muted/20 px-4"
    >
        <Card class="w-full max-w-md shadow-lg border-muted-foreground/10">
            <CardHeader class="space-y-1 text-center">
                <CardTitle class="text-2xl font-bold tracking-tight"
                    >Crea un account</CardTitle
                >
                <CardDescription>
                    Inserisci i tuoi dati per registrarti su Explento
                </CardDescription>
            </CardHeader>

            <form @submit.prevent="handleRegister">
                <CardContent class="grid gap-4">
                    <div
                        v-if="errorMessage"
                        class="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20 text-center"
                    >
                        {{ errorMessage }}
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div class="grid gap-2">
                            <Label for="name">Nome</Label>
                            <Input
                                id="name"
                                v-model="name"
                                placeholder="Mario"
                                required
                                class="bg-background"
                            />
                        </div>
                        <div class="grid gap-2">
                            <Label for="surname">Cognome</Label>
                            <Input
                                id="surname"
                                v-model="surname"
                                placeholder="Rossi"
                                required
                                class="bg-background"
                            />
                        </div>
                    </div>

                    <div class="grid gap-2">
                        <Label for="username">Username</Label>
                        <Input
                            id="username"
                            v-model="username"
                            placeholder="mariorossi88"
                            required
                            class="bg-background"
                        />
                    </div>

                    <div class="grid gap-2">
                        <Label for="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            v-model="email"
                            placeholder="mario@esempio.com"
                            required
                            class="bg-background"
                        />
                    </div>

                    <div class="grid gap-2">
                        <Label for="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            v-model="password"
                            required
                            class="bg-background"
                        />
                    </div>

                    <div class="grid gap-2">
                        <Label for="confirm-password">Conferma Password</Label>
                        <Input
                            id="confirm-password"
                            type="password"
                            v-model="confirmPassword"
                            required
                            class="bg-background"
                        />
                    </div>
                </CardContent>

                <CardFooter class="flex flex-col gap-4 pt-6">
                    <Button
                        class="w-full font-semibold"
                        type="submit"
                        :disabled="isLoading"
                    >
                        <span
                            v-if="isLoading"
                            class="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
                        ></span>
                        {{ isLoading ? "Registrazione..." : "Registrati" }}
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
                        Hai già un account?
                        <router-link
                            to="/login"
                            class="font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
                        >
                            Accedi
                        </router-link>
                    </div>
                </CardFooter>
            </form>
        </Card>
    </div>
</template>
