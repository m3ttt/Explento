import { createRouter, createWebHistory } from "vue-router";
import OperatorView from "../views/OperatorView.vue";
import HomeView from "../views/HomeView.vue";
import { checkAuth } from "./auth";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";

const routes = [
    {
        path: "/",
        component: HomeView,
        meta: { userAuth: true },
        props: (route: any) => ({ currentUser: route.meta.currentUser }),
    },
    {
        path: "/operator",
        component: OperatorView,
        meta: { operatorAuth: true },
    },
    { path: "/login", component: LoginView },
    { path: "/register", component: RegisterView },
];

export const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach(async (to, _, next) => {
    // Redirect utente se prova a fare /login ma autenticato
    if (
        (to.path == "/login" || to.path == "/register") &&
        (await checkAuth())
    ) {
        return next("/");
    }

    if (to.meta.userAuth) {
        const user = await checkAuth();

        if (!user) {
            return next(`/login`);
        }

        to.meta.currentUser = user;
        return next();
    }
    if (to.meta.operatorAuth) {
        // TODO: Operator auth middleware
        // Per ora fa passare tutto
        return next();
    }
    return next();
});
