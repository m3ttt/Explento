import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import HomeMap from '../pages/HomeMap.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/map', name: 'Map', component: HomeMap }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
