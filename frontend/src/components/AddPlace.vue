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

import { Plus } from "lucide-vue-next";
import { reactive, ref } from "vue";
import { getPosition } from "@/lib/position";

const isLoading = ref(false);
const formData = reactive({
    name: "",
    description: "",
    location: {
        lat: 0,
        lon: 0,
    },
});

const position = getPosition();

formData.location.lat = position.coords.latitude;
formData.location.lon = position.coords.longitude;
</script>
<template>
    <Card class="w-full h-full border-0">
        <CardHeader>
            <CardTitle class="text-lg">Aggiungi nuovo Luogo</CardTitle>
            <CardDescription>
                Questa richiesta verrà revisionata da un operatore prima di
                entrare nel sistema
            </CardDescription>
        </CardHeader>

        <form @submit.prevent="">
            <CardContent class="grid gap-4">
                <div class="grid gap-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                        id="name"
                        v-model="formData.name"
                        placeholder=""
                        required
                    />
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="location">Coordinate</Label>
                    <div class="flex flex-row gap-2">
                        <Input
                            id="location"
                            type="number"
                            v-model="formData.location.lat"
                        />
                        <Input
                            id="location"
                            type="number"
                            v-model="formData.location.lon"
                        />
                    </div>
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                        id="description"
                        v-model="formData.description"
                        placeholder="Brief details about this place..."
                    />
                </div>
            </CardContent>

            <CardFooter class="flex justify-between">
                <Button
                    variant="outline"
                    type="button"
                    @click="$emit('cancel')"
                >
                    Cancel
                </Button>
                <Button type="submit" :disabled="isLoading">
                    <Plus class="mr-2 h-4 w-4" />
                    Add
                </Button>
            </CardFooter>
        </form>
    </Card>
</template>
