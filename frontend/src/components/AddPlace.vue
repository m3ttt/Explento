<script lang="ts" setup>
import {
    Card,
    CardContent,
    CardDescription,
    CardTitle,
    CardHeader,
    CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, CheckCircle2 } from "lucide-vue-next";
import { reactive, ref, onMounted } from "vue";
import { getPosition } from "@/lib/position";
import { API_ENDPOINT } from "@/lib/config";

const isSubmitted = ref(false);
const categoryInput = ref("");

const MAX_CATEGORIES = 3;

const formData = reactive({
    name: "",
    description: "",
    categories: [] as string[],
    location: {
        lat: 0 as number | string,
        lon: 0 as number | string,
    },
    isFree: true,
});

onMounted(() => {
    const position = getPosition();
    if (position) {
        formData.location.lat = position.coords.latitude;
        formData.location.lon = position.coords.longitude;
    }
});

const addCategory = () => {
    if (formData.categories.length >= MAX_CATEGORIES) return;
    const val = categoryInput.value.trim();
    if (val && !formData.categories.includes(val)) {
        formData.categories.push(val);
        categoryInput.value = "";
    }
};

const removeCategory = (index: number) => {
    formData.categories.splice(index, 1);
};

const resetForm = () => {
    formData.name = "";
    formData.description = "";
    formData.categories = [];
    formData.isFree = true;
    isSubmitted.value = false;
};

const handleSubmit = async () => {
    try {
        const token = localStorage.getItem("token");
        if (!token) return;

        console.log(JSON.stringify(formData));

        const resp = await fetch(`${API_ENDPOINT}/places/request`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
        });

        if (resp.ok) {
            isSubmitted.value = true;
        }
    } catch (error) {
        console.error("Errore durante l'invio: ", error);
    }
};
</script>

<template>
    <Card class="w-full h-full border-0 shadow-none">
        <template v-if="!isSubmitted">
            <CardHeader>
                <CardTitle class="text-xl">Aggiungi nuovo Luogo</CardTitle>
                <CardDescription>
                    Questa richiesta verrà revisionata da un operatore prima di
                    entrare nel sistema.
                </CardDescription>
            </CardHeader>

            <form @submit.prevent="handleSubmit">
                <CardContent class="grid gap-6">
                    <div class="grid gap-2">
                        <Label for="name">Nome del luogo</Label>
                        <Input
                            id="name"
                            v-model="formData.name"
                            placeholder="Es: Parco Centrale"
                            required
                        />
                    </div>

                    <div class="grid gap-2">
                        <Label>Coordinate (Latitudine e Longitudine)</Label>
                        <div class="flex flex-row gap-2">
                            <Input
                                type="number"
                                step="any"
                                v-model="formData.location.lat"
                                placeholder="Lat"
                                required
                            />
                            <Input
                                type="number"
                                step="any"
                                v-model="formData.location.lon"
                                placeholder="Lon"
                                required
                            />
                        </div>
                        <p class="italic text-muted-foreground text-sm">
                            Le coordinate inserite sono la tua posizione attuale
                        </p>
                    </div>

                    <div class="grid gap-2">
                        <div class="flex flex-row gap-2 items-center">
                            <Label for="categories"
                                >Categorie ({{ formData.categories.length }}/{{
                                    MAX_CATEGORIES
                                }})</Label
                            >
                        </div>
                        <div class="flex gap-2">
                            <Input
                                id="categories"
                                v-model="categoryInput"
                                placeholder="Es: Natura, Sport..."
                                :disabled="
                                    formData.categories.length >= MAX_CATEGORIES
                                "
                                @keydown.enter.prevent="addCategory"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                :disabled="
                                    formData.categories.length >= MAX_CATEGORIES
                                "
                                @click="addCategory"
                                >Aggiungi</Button
                            >
                        </div>
                        <div class="flex flex-wrap gap-2 mt-1">
                            <Badge
                                v-for="(cat, index) in formData.categories"
                                :key="index"
                                variant="secondary"
                                class="pl-2"
                            >
                                {{ cat }}
                                <button
                                    type="button"
                                    @click="removeCategory(index)"
                                    class="ml-1 hover:text-destructive"
                                >
                                    <X class="w-3 h-3" />
                                </button>
                            </Badge>
                        </div>
                    </div>

                    <div class="grid gap-2">
                        <Label for="description">Descrizione</Label>
                        <Textarea
                            id="description"
                            v-model="formData.description"
                            placeholder="Cosa rende speciale questo posto?"
                        />
                    </div>

                    <div class="flex items-center space-x-2">
                        <Checkbox
                            id="isFree"
                            v-model:modelValue="formData.isFree"
                        />
                        <Label for="isFree" class="cursor-pointer">
                            L'accesso a questo luogo è gratuito
                        </Label>
                    </div>
                </CardContent>

                <CardFooter class="pt-4">
                    <Button
                        type="submit"
                        :disabled="isSubmitted"
                        class="w-full md:w-auto"
                    >
                        {{
                            isSubmitted
                                ? "Invio in corso..."
                                : "Invia Richiesta"
                        }}
                    </Button>
                </CardFooter>
            </form>
        </template>

        <template v-else>
            <CardContent
                class="flex flex-col items-center justify-center py-12 text-center"
            >
                <CheckCircle2 class="w-16 h-16 text-green-500 mb-4" />
                <h3 class="text-2xl font-semibold mb-2">Richiesta inviata</h3>
                <p class="text-muted-foreground mb-8">
                    Il luogo è stato preso in carico. Riceverai una notifica non
                    appena sarà approvato.
                </p>
                <Button @click="resetForm" variant="outline">
                    Aggiungi un altro luogo
                </Button>
            </CardContent>
        </template>
    </Card>
</template>
