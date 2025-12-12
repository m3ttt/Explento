<script lang="ts" setup>
import { ref } from "vue";
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

const router = useRouter();

const username = ref("");
const password = ref("");
const loading = ref(false);
const error = ref("");

async function triggerLogin() {
    loading.value = true;
    const res = await login(username.value, password.value);
    if (res.error) {
        error.value = "Login fallito. Username o password errati";
        loading.value = false;

        username.value = "";
        password.value = "";
        return;
    }

    loading.value = false;
    router.push("/");
    return;
}
</script>

<template>
    <div class="w-full h-screen flex items-center justify-center">
        <Card class="w-full max-w-sm">
            <CardHeader>
                <CardTitle>Accesso</CardTitle>
                <CardDescription>
                    Inserisci username e password per accedere a Explento
                </CardDescription>
            </CardHeader>

            <form @submit.prevent="triggerLogin">
                <CardContent>
                    <div class="grid w-full items-center gap-4">
                        <div class="flex flex-col space-y-1.5">
                            <Label for="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                v-model="username"
                                required
                            />
                        </div>

                        <div class="flex flex-col space-y-1.5">
                            <div class="flex items-center">
                                <Label for="password">Password</Label>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                v-model="password"
                                required
                            />
                        </div>
                    </div>
                </CardContent>

                <CardFooter class="flex flex-col gap-2 pt-5">
                    <Button class="w-full" type="submit" :disabled="loading">
                        {{ loading ? "Accesso..." : "Accedi" }}
                    </Button>
                    <div v-if="error" class="text-sm text-red-500 font-medium">
                        {{ error }}
                    </div>
                </CardFooter>
            </form>
        </Card>
    </div>
</template>
