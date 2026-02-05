<script setup lang="ts">
import { ref, onMounted } from "vue";
import { z } from "zod";
import NavbarOperator from "../components/NavbarOperator.vue";

// Componenti Shadcn
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

import { PlaceEditRequest, PlaceEditRequestSchema } from "@/lib/types/placeEditRequest";
import { Loader2, Copy, Check } from "lucide-vue-next"; 

// --- STATO ---
const requests = ref<PlaceEditRequest[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const operatorComments = ref<Record<string, string>>({});

// Stato per l'icona di feedback: memorizza l'ID della richiesta copiata
const copiedRequestId = ref<string | null>(null); 

// Filtri
const filters = ref({
  status: "all",
  isNewPlace: "all",
});

// --- LOGICA ---
async function fetchRequests() {
  loading.value = true;
  error.value = null;

  try {
    const params = new URLSearchParams();

    if (filters.value.status && filters.value.status !== "all") {
      params.append("status", filters.value.status);
    }
    if (filters.value.isNewPlace && filters.value.isNewPlace !== "all") {
      params.append("isNewPlace", filters.value.isNewPlace);
    }

    const token = localStorage.getItem("token"); // Prendo token
    if (!token) throw new Error("Operatore non autenticato");

    const res = await fetch(
      `http://localhost:3000/api/v1/operator/place_edit_requests?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) throw new Error("Errore nel caricamento delle richieste");

    const data = await res.json();
    const parsed = z.array(PlaceEditRequestSchema).safeParse(data);

    if (!parsed.success) {
      console.error(parsed.error);
      throw new Error("Dati API non validi");
    }

    requests.value = parsed.data;
  } catch (err: any) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

// Helper per colore Badge
function getStatusBadgeClass(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-200";
    case "approved":
      return "bg-green-100 text-green-800 hover:bg-green-200 border-green-200";
    case "rejected":
      return "bg-red-100 text-red-800 hover:bg-red-200 border-red-200";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

async function updateRequestStatus(
  requestId: string,
  newStatus: "approved" | "rejected",
  comment?: string
) {
  try {

    const token = localStorage.getItem("token"); // Prendo token
    if (!token) throw new Error("Operatore non autenticato");
    
    const res = await fetch(
      `http://localhost:3000/api/v1/operator/place_edit_requests/${requestId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus, operatorComment: comment }),
      }
    );

    if (!res.ok) throw new Error("Errore nell'aggiornamento dello stato");

    const idx = requests.value.findIndex((r) => r._id === requestId);
    if (idx !== -1) {
      requests.value[idx].status = newStatus;
      requests.value[idx].operatorComment = comment;
    }
  } catch (err: any) {
    alert(err.message);
  }
}

function resetFilters() {
  filters.value.status = "all";
  filters.value.isNewPlace = "all";
  fetchRequests();
}

// Funzione per copiare il commento negli appunti con feedback visivo
async function copyComment(requestId: string, comment: string | null | undefined) {
  if (comment) {
    try {
      await navigator.clipboard.writeText(comment);
      
      // Imposta lo stato per mostrare l'icona di spunta
      copiedRequestId.value = requestId;

      // Rimuovi lo stato dopo 2 secondi (animazione)
      setTimeout(() => {
        copiedRequestId.value = null;
      }, 2000); 

    } catch (err) {
      console.error("Impossibile copiare: ", err);
      alert("Errore nella copia del commento.");
      copiedRequestId.value = null;
    }
  }
}

onMounted(fetchRequests);
</script>

<template>
  <div class="container mx-auto p-6 pb-24">
    <div
      class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4"
    >
      <h1 class="text-3xl font-bold tracking-tight">Richieste Luoghi</h1>

      <div
        class="flex items-end gap-4 w-full md:w-auto flex-wrap sm:flex-nowrap"
      >
        <div class="flex flex-col space-y-1.5 w-full sm:w-[180px]">
          <Label class="text-xs text-muted-foreground">Stato</Label>
          <Select v-model="filters.status" @update:model-value="fetchRequests">
            <SelectTrigger class="cursor-pointer">
              <SelectValue placeholder="Seleziona stato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" class="cursor-pointer">Tutti</SelectItem>
              <SelectItem value="pending" class="cursor-pointer"
                >In attesa</SelectItem
              >
              <SelectItem value="approved" class="cursor-pointer"
                >Approvati</SelectItem
              >
              <SelectItem value="rejected" class="cursor-pointer"
                >Rifiutati</SelectItem
              >
            </SelectContent>
          </Select>
        </div>

        <div class="flex flex-col space-y-1.5 w-full sm:w-[180px]">
          <Label class="text-xs text-muted-foreground">Tipo Luogo</Label>
          <Select
            v-model="filters.isNewPlace"
            @update:model-value="fetchRequests"
          >
            <SelectTrigger class="cursor-pointer">
              <SelectValue placeholder="Seleziona tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" class="cursor-pointer">Tutti</SelectItem>
              <SelectItem value="true" class="cursor-pointer"
                >Nuovo inserimento</SelectItem
              >
              <SelectItem value="false" class="cursor-pointer"
                >Modifica esistente</SelectItem
              >
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          @click="resetFilters"
          class="cursor-pointer hover:bg-accent w-full sm:w-auto"
        >
          Reset
        </Button>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <Loader2 class="w-8 h-8 animate-spin text-primary" />
    </div>

    <div
      v-else-if="error"
      class="text-destructive font-medium p-4 border border-destructive/20 rounded-md bg-destructive/10"
    >
      {{ error }}
    </div>

    <div
      v-else-if="requests.length"
      class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
    >
      <Card v-for="req in requests" :key="req._id" class="flex flex-col h-full">
        <CardHeader class="pb-3">
          <div class="flex justify-between items-start gap-2">
            <Badge variant="outline" :class="getStatusBadgeClass(req.status)">
              {{
                req.status === "pending"
                  ? "In Attesa"
                  : req.status === "approved"
                  ? "Approvato"
                  : "Rifiutato"
              }}
            </Badge>
            <Badge 
              :class="
                req.isNewPlace 
                  ? 'bg-blue-100 text-blue-800 border-blue-200' // Nuovo inserimento (Blu)
                  : 'bg-purple-100 text-purple-800 border-purple-200' // Modifica esistente (Viola)
              "
            >
              {{ req.isNewPlace ? "Nuovo" : "Modifica" }}
            </Badge>
          </div>
        </CardHeader>

        <CardContent class="flex-1 text-sm space-y-2.5">
          <div class="grid grid-cols-[100px_1fr] gap-2">
            <span class="font-medium text-muted-foreground">Nome:</span>
            <span class="font-semibold">{{
              req.proposedChanges.name ?? "-"
            }}</span>
          </div>

          <div class="grid grid-cols-[100px_1fr] gap-2">
            <span class="font-medium text-muted-foreground">Descrizione:</span>
            <span class="line-clamp-3" :title="req.proposedChanges.description">
              {{ req.proposedChanges.description ?? "-" }}
            </span>
          </div>

          <div class="grid grid-cols-[100px_1fr] gap-2">
            <span class="font-medium text-muted-foreground">Categorie:</span>
            <div class="flex flex-wrap gap-1 items-center">
              <Badge
                v-if="!req.proposedChanges.categories || req.proposedChanges.categories.length === 0"
                variant="outline"
              >
                -
              </Badge>
              <Badge
                v-for="category in req.proposedChanges.categories"
                :key="category"
                variant="secondary"
                class="text-xs px-2 py-0.5 font-normal"
              >
                {{ category }}
              </Badge>
            </div>
          </div>

          <div class="grid grid-cols-[100px_1fr] gap-2">
            <span class="font-medium text-muted-foreground">Location:</span>
            <span>
              {{
                req.proposedChanges.location
                  ? `${req.proposedChanges.location.lat.toFixed(
                      4
                    )}, ${req.proposedChanges.location.lon.toFixed(4)}`
                  : "-"
              }}
            </span>
          </div>

          <div class="grid grid-cols-[100px_1fr] gap-2">
            <span class="font-medium text-muted-foreground">Gratis:</span>
            <span>{{
              req.proposedChanges.isFree !== undefined
                ? req.proposedChanges.isFree
                  ? "Sì"
                  : "No"
                : "-"
            }}</span>
          </div>

          <div class="grid grid-cols-[100px_1fr] gap-2">
            <span class="font-medium text-muted-foreground">Data:</span>
            <span class="text-xs text-muted-foreground mt-0.5">
              {{ new Date(req.createdAt).toLocaleString() }}
            </span>
          </div>
        </CardContent>

        <CardFooter class="flex flex-col gap-3 pt-0">
          <div class="w-full">
            <Label class="mb-2 block text-xs select-text cursor-text"
              >Note Operatore</Label
            >

            <Textarea
              v-if="req.status === 'pending'"
              v-model="operatorComments[req._id]"
              placeholder="Inserisci un motivo..."
              class="min-h-[80px] resize-none focus-visible:ring-offset-0"
            />

            <div
              v-else
              class="min-h-[80px] relative bg-muted/50 p-3 rounded-md text-sm italic text-muted-foreground min-h-[60px] border pr-10 group max-h-[100px] overflow-y-auto"
            >
              {{ req.operatorComment || "Nessun commento dell'operatore." }}

              <Button
                v-if="req.operatorComment"
                variant="ghost"
                size="icon"
                class="absolute top-1 right-1 h-7 w-7 opacity-0 group-hover:opacity-100 bg-background/50 backdrop-blur-sm transition-all duration-300 cursor-pointer"
                @click="copyComment(req._id, req.operatorComment)"
                title="Copia commento"
              >
                <Check 
                  v-if="copiedRequestId === req._id" 
                  class="h-3.5 w-3.5 text-green-600 animate-in fade-in zoom-in"
                />
                <Copy 
                  v-else 
                  class="h-3.5 w-3.5" 
                />
              </Button>
            </div>
          </div>

          <div class="flex gap-3 w-full">
            <Button
              variant="default"
              class="flex-1 bg-green-600 hover:bg-green-700 cursor-pointer transition-colors"
              :disabled="req.status !== 'pending'"
              @click="
                updateRequestStatus(
                  req._id,
                  'approved',
                  operatorComments[req._id]
                )
              "
            >
              Accetta
            </Button>

            <Button
              variant="destructive"
              class="flex-1 hover:bg-red-700 cursor-pointer transition-colors"
              :disabled="req.status !== 'pending'"
              @click="
                updateRequestStatus(
                  req._id,
                  'rejected',
                  operatorComments[req._id]
                )
              "
            >
              Rifiuta
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>

    <div v-else class="text-center py-12 text-muted-foreground">
      Nessuna richiesta trovata con i filtri correnti.
    </div>

    <div class="fixed bottom-6 left-0 right-0 z-[1000] flex justify-center">
      <NavbarOperator />
    </div>
  </div>
</template>
