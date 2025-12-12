<script setup lang="ts">
import Map from "../components/Map.vue";
import { Search, Compass, Menu } from "lucide-vue-next"; // Icone d'esempio
import { Button } from "../components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
    DrawerTrigger,
} from "../components/ui/drawer";
import { getUser } from "../lib/auth";
</script>

<template>
    <div class="relative w-full h-screen overflow-hidden bg-background">
        <div class="absolute inset-0 z-0">
            <Map />
        </div>

        <Drawer>
            <DrawerTrigger as-child>
                <div class="absolute bottom-0 left-0 w-full z-50 outline-none">
                    <div
                        class="bg-white rounded-t-2xl p-4 flex flex-col gap-3 cursor-pointer transition-colors hover:bg-gray-50"
                    >
                        <div
                            class="mx-auto w-12 h-1.5 bg-gray-300 rounded-full mb-1"
                        ></div>

                        <div class="flex items-center gap-3">
                            <div class="flex-1 relative">
                                <div
                                    class="absolute left-3 top-2.5 text-gray-400"
                                >
                                    <Search class="w-4 h-4" />
                                </div>
                                <div
                                    class="w-full h-10 pl-9 pr-4 rounded-md border border-input bg-background text-sm text-muted-foreground flex items-center"
                                >
                                    Cerca luoghi...
                                </div>
                            </div>

                            <Button variant="outline" size="icon">
                                <Compass class="w-5 h-5" />
                            </Button>

                            <Button variant="ghost" size="icon">
                                <Menu class="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </DrawerTrigger>

            <DrawerContent>
                <div class="mx-auto w-full max-w-sm">
                    <DrawerHeader>
                        <DrawerTitle></DrawerTitle>
                        <DrawerDescription
                            >Luoghi trovati vicino a te.</DrawerDescription
                        >
                    </DrawerHeader>

                    <div class="p-4 h-[50vh] overflow-y-auto space-y-4"></div>
                </div>
            </DrawerContent>
        </Drawer>
    </div>
</template>
