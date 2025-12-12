<script setup lang="ts">
import { ref, onMounted } from "vue";
import { Button } from "../components/ui/button";
import Navbar from "../components/Navbar.vue";
import { z } from "zod";

// Schema Zod
const PlaceEditRequestSchema = z.object({
  _id: z.string(),
  placeId: z.string().nullable().optional(),
  userId: z.string().nullable().optional(),
  proposedChanges: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    categories: z.array(z.string()).optional(),
    location: z
      .object({
        lat: z.number(),
        lon: z.number(),
      })
      .optional(),
    images: z.array(z.any()).optional(),
    isFree: z.boolean().optional(),
  }),
  isNewPlace: z.boolean(),
  status: z.enum(["pending", "approved", "rejected"]),
  operatorId: z.string().nullable().optional(),
  operatorComment: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  __v: z.number().optional(),
});

type PlaceEditRequest = z.infer<typeof PlaceEditRequestSchema>;

const requests = ref<PlaceEditRequest[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);

// commenti operatore
const operatorComments = ref<Record<string, string>>({});

// FILTRI
const filters = ref({
  status: "",
  isNewPlace: "",
});

async function fetchRequests() {
  loading.value = true;
  error.value = null;

  try {
    const params = new URLSearchParams();

    if (filters.value.status) params.append("status", filters.value.status);
    if (filters.value.isNewPlace) params.append("isNewPlace", filters.value.isNewPlace);

    const res = await fetch(
      "http://localhost:3000/api/v1/operator/place_edit_requests?" +
        params.toString()
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

function statusColor(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-200 text-yellow-800";
    case "approved":
      return "bg-green-200 text-green-800";
    case "rejected":
      return "bg-red-200 text-red-800";
    default:
      return "";
  }
}

async function updateRequestStatus(
  requestId: string,
  newStatus: "approved" | "rejected",
  comment?: string
) {
  try {
    const res = await fetch(
      `http://localhost:3000/api/v1/operator/place_edit_requests/${requestId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
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

onMounted(fetchRequests);
</script>

<template>
  <div class="p-6 overflow-x-auto">
    <h1 class="text-3xl font-bold mb-4">Richieste di modifica/aggiunta luoghi</h1>

    <!-- FILTRI -->
    <div class="flex items-end gap-4 mb-6">

      <!-- filtro stato -->
      <div class="flex flex-col">
        <label class="text-sm font-medium">Stato</label>
        <select
          v-model="filters.status"
          @change="fetchRequests"
          class="border rounded px-2 py-1 text-sm"
        >
          <option value="">Tutti</option>
          <option value="pending">In attesa</option>
          <option value="approved">Approvati</option>
          <option value="rejected">Rifiutati</option>
        </select>
      </div>

      <!-- filtro nuovo luogo -->
      <div class="flex flex-col">
        <label class="text-sm font-medium">Nuovo luogo</label>
        <select
          v-model="filters.isNewPlace"
          @change="fetchRequests"
          class="border rounded px-2 py-1 text-sm"
        >
          <option value="">Tutti</option>
          <option value="true">Sì</option>
          <option value="false">No</option>
        </select>
      </div>

      <Button size="sm" variant="secondary"
        @click="
          filters.status = '';
          filters.isNewPlace = '';
          fetchRequests();
        "
      >
        Reset
      </Button>
    </div>

    <div v-if="loading">Caricamento...</div>
    <div v-if="error" class="text-red-600">{{ error }}</div>

    <!-- TABELLA -->
    <table
      v-if="requests.length"
      class="table-auto w-full border-collapse border border-gray-300 text-sm"
    >
      <thead>
        <tr class="bg-gray-100">
          <th class="border px-2 py-1">Stato</th>
          <th class="border px-2 py-1">ID</th>
          <th class="border px-2 py-1">Luogo</th>
          <th class="border px-2 py-1">Nuovo</th>
          <th class="border px-2 py-1 min-w-[250px]">Nome</th>
          <th class="border px-2 py-1 min-w-[350px]">Descrizione</th>
          <th class="border px-2 py-1">Categorie</th>
          <th class="border px-2 py-1">Lat</th>
          <th class="border px-2 py-1">Lon</th>
          <th class="border px-2 py-1">Free</th>
          <th class="border px-2 py-1 min-w-[150px]">Data</th>
          <th class="border px-2 py-1 min-w-[350px]">Commento</th>
          <th class="border px-2 py-1">Azioni</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="req in requests" :key="req._id" class="hover:bg-gray-50">
          <td class="border px-2 py-1">
            <span
              :class="[
                'px-2 py-1 rounded-full font-semibold',
                statusColor(req.status),
              ]"
            >
              {{ req.status }}
            </span>
          </td>

          <td class="border px-2 py-1">{{ req._id }}</td>
          <td class="border px-2 py-1">{{ req.placeId ?? "N/A" }}</td>
          <td class="border px-2 py-1">{{ req.isNewPlace ? "Sì" : "No" }}</td>

          <td class="border px-2 py-1 min-w-[250px]">
            {{ req.proposedChanges.name ?? "" }}
          </td>

          <td class="border px-2 py-1 min-w-[350px]">
            {{ req.proposedChanges.description ?? "" }}
          </td>

          <td class="border px-2 py-1">
            {{ req.proposedChanges.categories?.join(", ") ?? "" }}
          </td>

          <td class="border px-2 py-1">
            {{ req.proposedChanges.location?.lat ?? "" }}
          </td>

          <td class="border px-2 py-1">
            {{ req.proposedChanges.location?.lon ?? "" }}
          </td>

          <td class="border px-2 py-1">
            {{ req.proposedChanges.isFree ? "Sì" : "No" }}
          </td>

          <td class="border px-2 py-1 min-w-[150px]">
            {{ new Date(req.createdAt).toLocaleString() }}
          </td>

          <!-- COMMENTO -->
          <td class="border px-2 py-1 min-w-[350px]">
            <template v-if="req.status === 'pending'">
              <textarea
                v-model="operatorComments[req._id]"
                class="w-full border rounded px-1 py-1 text-sm"
                placeholder="Scrivi un commento..."
              ></textarea>
            </template>

            <template v-else>
              <textarea
                class="w-full border rounded px-1 py-1 bg-gray-100 text-gray-500 text-sm"
                :value="req.operatorComment ?? ''"
                disabled
              ></textarea>
            </template>
          </td>

          <!-- AZIONI -->
          <td class="border px-2 py-1 space-x-1">
            <Button
              size="sm"
              variant="default"
              :disabled="req.status !== 'pending'"
              @click="
                updateRequestStatus(req._id, 'approved', operatorComments[req._id])
              "
            >
              Accetta
            </Button>

            <Button
              size="sm"
              variant="destructive"
              :disabled="req.status !== 'pending'"
              @click="
                updateRequestStatus(req._id, 'rejected', operatorComments[req._id])
              "
            >
              Rifiuta
            </Button>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-else class="mt-4">Nessuna richiesta trovata.</div>
  </div>

  <div class="fixed bottom-0 left-0 w-full flex justify-center pb-4">
    <Navbar />
  </div>
</template>

<style scoped>
table th,
table td {
  text-align: left;
  vertical-align: top;
}
textarea {
  resize: vertical;
}
</style>
