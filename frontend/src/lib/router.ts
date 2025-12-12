import { createRouter, createWebHistory } from "vue-router";
import OperatorView from "../views/OperatorView.vue";
import HomeView from "../views/HomeView.vue";
import { checkAuth } from "./auth";
import LoginView from "../views/LoginView.vue";
import LogoutView from "../views/LogoutView.vue";

const routes = [
    { path: "/", component: HomeView, meta: { userAuth: true } },
    {
        path: "/operator",
        component: OperatorView,
        meta: { operatorAuth: true },
    },
    { path: "/login", component: LoginView },
    { path: "/logout", component: LogoutView, meta: { userAuth: true } },
];

export const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach(async (to, _, next) => {
    // Redirect utente se prova a fare /login ma autenticato
    if (to.path == "/login" && (await checkAuth())) {
        return next("/");
    }

    if (to.meta.userAuth) {
        const user = await checkAuth();

        if (!user) {
            return next(`/login`);
        }
        return next();
    }
    if (to.meta.operatorAuth) {
        // TODO: Operator auth middleware
        return next();
    }
    return next();
});
