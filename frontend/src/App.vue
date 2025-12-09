<template>
    <p><strong>Current route path:</strong> {{ $route.fullPath }}</p>
    <nav>
        <RouterLink to="/">Go to Home</RouterLink>
        <RouterLink to="/admin">Go to Admin</RouterLink>
    </nav>
    <main>
        <RouterView />
    </main>
</template>

<script>
export default {
    name: "App",
};
</script>

<style>
nav {
    margin-bottom: 1em;
}
nav a {
    margin-right: 1em;
}
</style>
