<script setup lang="ts">
import { ref, computed, Ref } from "vue";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Mountain,
    Waves,
    Landmark,
    Microscope,
    Map,
    Building2,
    Utensils,
    Home,
    Trees,
    Zap,
    Coffee,
    Baby,
    ChevronRight,
    ChevronLeft,
    BadgeEuro,
    CircleSlash,
} from "lucide-vue-next";
import { User } from "@/lib/types/user";
import { API_ENDPOINT } from "@/lib/config";
import { useRouter } from "vue-router";

const props = defineProps<{
    currentUser: Ref<User>;
}>();

const steps = [
    {
        id: "location",
        title: "Dove vorresti andare?",
        multipleChoice: true,
        options: [
            { id: "montagna", label: "Montagna", icon: Mountain },
            { id: "lago", label: "Lago", icon: Waves },
            { id: "città", label: "Città", icon: Building2 },
            { id: "borgo", label: "Piccoli Borghi", icon: Map },
        ],
    },
    {
        id: "interests",
        title: "Cosa ti appassiona?",
        multipleChoice: true,
        options: [
            { id: "cultura", label: "Cultura e Arte", icon: Landmark },
            { id: "scienza", label: "Scienza e Natura", icon: Microscope },
            { id: "gusto", label: "Enogastronomia", icon: Utensils },
            { id: "indoor", label: "Attività al Chiuso", icon: Home },
            { id: "outdoor", label: "Attività all'Aperto", icon: Trees },
        ],
    },
    {
        id: "style",
        title: "Qual è il tuo stile?",
        multipleChoice: true,
        options: [
            { id: "impegnativo", label: "Impegnativo", icon: Zap },
            { id: "rilassante", label: "Rilassante", icon: Coffee },
            { id: "per famiglie", label: "Per Famiglie", icon: Baby },
        ],
    },
    {
        id: "budget",
        title: "Budget",
        description: "Vuoi includere anche luoghi con ingresso a pagamento?",
        multipleChoice: false,
        options: [
            {
                id: "free",
                label: "Solo Gratuiti",
                icon: CircleSlash,
                value: false,
            },
            {
                id: "paid",
                label: "Anche a Pagamento",
                icon: BadgeEuro,
                value: true,
            },
        ],
    },
];

const currentStep = ref(1);
const totalSteps = steps.length;

// Stato dei dati
const selectedCategories = ref<string[]>(
    props.currentUser.value.preferences.categories,
);
const alsoPaid = ref<boolean | null>(
    props.currentUser.value.preferences.alsoPaid,
);

const currentStepData = computed(() => steps[currentStep.value - 1]);
const progressWidth = computed(() => (currentStep.value / totalSteps) * 100);

const router = useRouter();

// Gestione della selezione
const handleSelect = (option: any) => {
    if (currentStepData.value.multipleChoice) {
        const index = selectedCategories.value.indexOf(option.id);
        // Controllo se appartiene a categories e in caso lo tolgo o metto
        if (index > -1) selectedCategories.value.splice(index, 1);
        else selectedCategories.value.push(option.id);
    } else {
        // Selezione singola, metto in alsoPaid
        alsoPaid.value = option.value;
    }
};

// Controllo se l'opzione è selezionata, per cambiare il colore
const isSelected = (option: any) => {
    if (currentStepData.value.multipleChoice) {
        return selectedCategories.value.includes(option.id);
    }
    return alsoPaid.value === option.value;
};

// Controllo per procedere domande sucessiva
const canProceed = computed(() => {
    if (currentStepData.value.multipleChoice) {
        // Almeno una scelta tra le opzioni dello step corrente
        const currentOptionIds = currentStepData.value.options.map(
            (o: any) => o.id,
        );
        return selectedCategories.value.some((id) =>
            currentOptionIds.includes(id),
        );
    }
    return alsoPaid.value !== null;
});

const handleFinish = async () => {
    const finalData = {
        alsoPaid: alsoPaid.value,
        categories: selectedCategories.value,
    };

    const token = localStorage.getItem("token");

    const resp = await fetch(`${API_ENDPOINT}/me/preferences`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
        },
        body: JSON.stringify(finalData),
    });

    if (resp.ok) return router.push("/");
    console.error("Errore nel aggiornare le preferenze " + resp.status);
};
</script>

<template>
    <div
        class="max-w-md mx-auto p-6 space-y-8 min-h-[90vh] flex flex-col justify-center"
    >
        <h1 class="text-3xl text-foreground font-bold">
            Questionario Interessi
        </h1>
        <p class="text-muted-foreground">
            Compila il questionario per ricevere consigli personalizzati sui
            luoghi da visitare
        </p>
        <div class="space-y-2">
            <div
                class="flex justify-between text-xs font-medium text-muted-foreground uppercase tracking-wider"
            >
                <span>Passo {{ currentStep }} di {{ totalSteps }}</span>
                <span>{{ Math.round(progressWidth) }}%</span>
            </div>
            <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                    class="bg-primary h-full transition-all duration-500 ease-out"
                    :style="{ width: `${progressWidth}%` }"
                ></div>
            </div>
        </div>

        <div class="space-y-6">
            <div class="space-y-1">
                <h2 class="text-2xl font-bold tracking-tight">
                    {{ currentStepData.title }}
                </h2>
                <p class="text-muted-foreground text-sm">
                    {{
                        currentStepData.description ||
                        (currentStepData.multipleChoice
                            ? "Seleziona una o più opzioni"
                            : "Scegli un'opzione")
                    }}
                </p>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <Card
                    v-for="item in currentStepData.options"
                    :key="item.id"
                    class="cursor-pointer transition-all border-2 relative overflow-hidden group"
                    :class="
                        isSelected(item)
                            ? 'border-primary ring-1 ring-primary bg-primary/5'
                            : 'hover:border-slate-400 border-slate-200'
                    "
                    @click="handleSelect(item)"
                >
                    <CardContent
                        class="p-6 flex flex-col items-center justify-center text-center space-y-3"
                    >
                        <div
                            :class="
                                isSelected(item)
                                    ? 'text-primary'
                                    : 'text-foreground group-hover:text-primary'
                            "
                        >
                            <!-- Per renderizzare l'icona devo creare un fake-component -->
                            <component :is="item.icon" class="w-10 h-10" />
                        </div>
                        <p class="font-bold text-sm">{{ item.label }}</p>
                    </CardContent>
                </Card>
            </div>
        </div>

        <div class="flex gap-3 pt-4">
            <Button
                v-if="currentStep > 1"
                variant="ghost"
                class="flex-1"
                @click="currentStep--"
            >
                <ChevronLeft class="w-4 h-4 mr-2" /> Indietro
            </Button>

            <Button
                class="flex-2 shadow-lg shadow-primary/20"
                :disabled="!canProceed"
                @click="
                    currentStep === totalSteps ? handleFinish() : currentStep++
                "
            >
                {{ currentStep === totalSteps ? "Conferma" : "Continua" }}
                <ChevronRight
                    v-if="currentStep < totalSteps"
                    class="w-4 h-4 ml-2"
                />
            </Button>
        </div>
    </div>
</template>
