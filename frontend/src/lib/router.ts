import { createRouter, createWebHistory, type RouteLocation } from "vue-router";
import HomeView from "../views/HomeView.vue";
import { checkAuth } from "./auth";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import OperatorLoginView from "../views/OperatorLoginView.vue";
import { checkAuthOp } from "./operatorAuth";
import SurveyView from "../views/SurveyView.vue";
import HeatmapMissions from "../views/HeatmapMissions.vue";
import OperatorRequests from "../views/OperatorRequests.vue";
import OperatorHomeView from "../views/OperatorHomeView.vue";
import OperatorLayout from "../components/OperatorLayout.vue";
import MissionStats from "../views/MissionStats.vue";

const routes = [
    {
        path: "/",
        component: HomeView,
        meta: { userAuth: true },
        props: (route: RouteLocation) => ({
            currentUser: route.meta.currentUser,
        }),
    },
    // Gruppo operatore con layout
    {
        path: "/operator",
        component: OperatorLayout,
        meta: { operatorAuth: true },
        props: (route: RouteLocation) => ({
            currentOperator: route.meta.currentOperator,
        }),
        children: [
            {
                path: "", // Corrisponde a /operator
                component: OperatorHomeView,
                meta: { hideNavbar: true },
            },
            {
                path: "heatmap", // Corrisponde a /operator/heatmap
                component: HeatmapMissions,
            },
            {
                path: "dashboard",
                component: MissionStats,
            },
            {
                path: "requests",
                component: OperatorRequests,
            },
        ]
    },
    {
        path: "/operator/login",
        component: OperatorLoginView,
    },
    {
        path: "/survey",
        component: SurveyView,
        meta: { userAuth: true },
        props: (route: RouteLocation) => ({
            currentUser: route.meta.currentUser,
        }),
    },
    { path: "/login", component: LoginView },
    { path: "/register", component: RegisterView },
];

export const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach(async (to, _, next) => {
    // Se route operatore faccio auth operatore
    if (to.path.startsWith("/operator")) {
        const operator = await checkAuthOp();
        if (to.path == "/operator/login" && operator.value) {
            return next("/operator");
        }

        if (to.meta.operatorAuth) {
            if (!operator.value) {
                return next("/operator/login");
            }
            to.meta.currentOperator = operator;
        }
        return next();
    }

    // Route utente
    const user = await checkAuth();

    // Redirect utente se prova a fare /login ma autenticato
    if ((to.path == "/login" || to.path == "/register") && user.value) {
        return next("/");
    }

    if (to.meta.userAuth) {
        if (!user.value) {
            return next(`/login`);
        }

        to.meta.currentUser = user;

        if (
            user.value.preferences?.categories.length == 0 &&
            to.path != "/survey"
        )
            return next("/survey");
    }

    return next();
});
