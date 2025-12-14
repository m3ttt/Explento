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

const isLoading = ref(false);
const formData = reactive({
    name: "",
    description: "",
    location: "",
});
</script>
<template>
    <Card class="w-full h-full">
        <CardHeader>
            <CardTitle>Aggiungi nuovo luogo</CardTitle>
            <CardDescription>
                Inserisci i dettagli del nuovo lougo
            </CardDescription>
        </CardHeader>

        <form @submit.prevent="">
            <CardContent class="grid gap-4">
                <div class="grid gap-2">
                    <Label htmlFor="name"></Label>
                    <Input
                        id="name"
                        v-model="formData.name"
                        placeholder=""
                        required
                    />
                </div>

                <div class="grid gap-2">
                    <Label htmlFor="location">Location / Address</Label>
                    <Input
                        id="location"
                        v-model="formData.location"
                        placeholder="e.g. New York, NY"
                    />
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
