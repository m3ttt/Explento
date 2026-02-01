import { createRouter, createWebHistory } from "vue-router";
import OperatorView from "../views/OperatorView.vue";
import HomeView from "../views/HomeView.vue";
import { checkAuth } from "./auth";
import LoginView from "../views/LoginView.vue";
import RegisterView from "../views/RegisterView.vue";
import OperatorLoginView from "../views/OperatorLoginView.vue";
import { checkAuthOp } from "./operatorAuth";

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
        props: (route: any) => ({
            currentOperator: route.meta.currentOperator,
        }),
    },
    {
        path: "/operator/login",
        component: OperatorLoginView,
    },
    { path: "/login", component: LoginView },
    { path: "/register", component: RegisterView },
];

export const router = createRouter({
    history: createWebHistory(),
    routes,
});

router.beforeEach(async (to, _, next) => {
    const operator = await checkAuthOp();
    if (to.path == "/operator/login" && operator.value) {
        return next("/operator");
    }

    if (to.meta.operatorAuth) {
        if (!operator.value) {
            return next("/operator/login");
        }

        to.meta.currentOperator = operator;
        return next();
    }

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
        return next();
    }

    return next();
});
