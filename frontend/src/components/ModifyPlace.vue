<script lang="ts" setup>
import {
    Card,
    CardContent,
    CardDescription,
    CardTitle,
    CardHeader,
    CardFooter,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, Loader2 } from "lucide-vue-next";
import { reactive, ref, onMounted, computed, watchEffect } from "vue";
import { getPosition } from "@/lib/position";
import { API_ENDPOINT } from "@/lib/config";
import { CategoriesEnum, Place } from "@/lib/types/place";
import { formatCategory } from "@/lib/utils";

const props = defineProps<{
    initialData: Place | null;
}>();

const isSubmitted = ref(false);
const isLoading = ref(false);
const MAX_CATEGORIES = 3;

// Determiniamo se siamo in modalità "Modifica"
const isEditMode = computed(() => props.initialData != null);

const formData = reactive({
    name: props.initialData?.name ?? "",
    description: props.initialData?.description ?? "",
    categories: props.initialData?.categories ?? ([] as string[]),
    location: {
        lat: props.initialData?.location.lat ?? 0,
        lon: props.initialData?.location.lon ?? 0,
    },
    isFree: props.initialData?.isFree ?? true,
});

onMounted(async () => {
    // Recuperiamo la posizione solo se è un NUOVO inserimento
    if (!isEditMode.value) {
        const position = await getPosition();
        if (position) {
            formData.location.lat = position.coords.latitude;
            formData.location.lon = position.coords.longitude;
        }
    }
});

const updateCategories = (newValues: string[]) => {
    formData.categories = newValues;
};

const handleSubmit = async () => {
    isLoading.value = true;
    try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const url = isEditMode.value
            ? `${API_ENDPOINT}/places/${props.initialData._id}`
            : `${API_ENDPOINT}/places/request`;

        const method = isEditMode.value ? "PUT" : "POST";

        const resp = await fetch(url, {
            method: method,
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
    } finally {
        isLoading.value = false;
    }
};
</script>

<template>
    <Card class="w-full h-full border-none shadow-none bg-background">
        <template v-if="!isSubmitted">
            <CardHeader>
                <CardTitle class="text-xl">
                    {{ isEditMode ? "Modifica Luogo" : "Aggiungi nuovo Luogo" }}
                </CardTitle>
                <CardDescription>
                    {{
                        isEditMode
                            ? "Invia una richiesta di modifica del luogo"
                            : "Questa richiesta verrà revisionata da un operatore prima di entrare nel sistema."
                    }}
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
                        <p
                            v-if="!isEditMode"
                            class="italic text-muted-foreground text-sm"
                        >
                            Le coordinate iniziali sono la tua posizione attuale
                        </p>
                    </div>

                    <div class="grid gap-2">
                        <Label>
                            Categorie ({{ formData.categories.length }}/{{
                                MAX_CATEGORIES
                            }})
                        </Label>

                        <Select
                            @update:modelValue="updateCategories"
                            multiple
                            :defaultValue="formData.categories"
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder="Seleziona le categorie"
                                />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem
                                    v-for="cat in CategoriesEnum.options"
                                    :key="cat"
                                    :value="cat"
                                    :disabled="
                                        formData.categories.length >=
                                            MAX_CATEGORIES &&
                                        !formData.categories.includes(cat)
                                    "
                                >
                                    {{ formatCategory(cat) }}
                                </SelectItem>
                            </SelectContent>
                        </Select>
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
                            :defaultValue="isEditMode ? formData.isFree : false"
                            @update:modelValue="
                                (val: any) => (formData.isFree = val)
                            "
                        />
                        <Label for="isFree" class="cursor-pointer">
                            L'accesso a questo luogo è gratuito
                        </Label>
                    </div>
                </CardContent>

                <CardFooter class="pt-4">
                    <Button
                        type="submit"
                        :disabled="isLoading"
                        class="w-full md:w-auto"
                    >
                        <Loader2
                            v-if="isLoading"
                            class="mr-2 h-4 w-4 animate-spin"
                        />
                        {{ isEditMode ? "Invia Modifiche" : "Invia Richiesta" }}
                    </Button>
                </CardFooter>
            </form>
        </template>

        <template v-else>
            <CardContent
                class="flex flex-col items-center justify-center py-12 text-center"
            >
                <CheckCircle2 class="w-16 h-16 text-green-500 mb-4" />
                <h3 class="text-2xl font-semibold mb-2">
                    {{ isEditMode ? "Modifica inviata" : "Richiesta inviata" }}
                </h3>
                <p class="text-muted-foreground mb-8">
                    {{
                        isEditMode
                            ? "La modifica è stata presa in carico per la revisione."
                            : "Il luogo è stato preso in carico per la revisione."
                    }}
                </p>
            </CardContent>
        </template>
    </Card>
</template>
