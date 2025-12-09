import { createRouter, createWebHistory } from "vue-router";
import OperatorView from "../views/OperatorView.vue";
import HomeView from "../views/HomeView.vue";

const routes = [
    { path: "/", component: HomeView },
    { path: "/operator", component: OperatorView },
];

export const router = createRouter({
    history: createWebHistory(),
    routes,
});
