<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Operator } from "@/lib/types/operator";
import { Ref } from "vue";
import { logoutOp } from "@/lib/operatorAuth";
import { useRouter } from "vue-router";

const router = useRouter();

defineProps<{
    currentOperator: Ref<Operator | null>;
}>();

function handleLogout() {
    logoutOp();
    router.push("/operator/login");
}
</script>
<template>
    <template v-if="currentOperator.value">
        <h1>Pagina Operatore PRIVATA</h1>
        <p>
            Bentornato {{ currentOperator.value.name }}
            {{ currentOperator.value.surname }}
        </p>
        <Button variant="destructive" @click="handleLogout">Logout</Button>
    </template>
</template>
