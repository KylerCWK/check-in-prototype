import { createRouter, createWebHistory } from 'vue-router';
import HomePage from './components/HomePage.vue';
import QRCodeGenerator from './components/QRCodeGenerator.vue';
import LoginPage from './components/LoginPage.vue';
import RegisterPage from './components/RegisterPage.vue';
import AboutPage from './components/AboutPage.vue';
import PricingPage from './components/PricingPage.vue';
import APIPage from './components/APIPage.vue';
import AdminDashboard from './components/AdminDashboard.vue';
import UserDashboard from './components/UserDashboard.vue';
import CatalogPage from './components/CatalogPage.vue';
import FavoritesPage from './components/FavoritesPage.vue';

// Authentication guard
const requireAuth = (to, from, next) => {
  const token = localStorage.getItem('token');
  if (!token) {
    // Store the path they were trying to visit
    localStorage.setItem('redirectAfterLogin', to.fullPath);
    next({ path: '/login', query: { redirect: to.fullPath } });
  } else {
    next();
  }
};

// Guest guard (for pages that should only be accessible when logged out)
const requireGuest = (to, from, next) => {
  const token = localStorage.getItem('token');
  if (token) {
    next('/dashboard');
  } else {
    next();
  }
};

const routes = [
  { path: '/', component: HomePage },
  { path: '/qrcode', component: QRCodeGenerator, beforeEnter: requireAuth },
  { path: '/login', component: LoginPage, beforeEnter: requireGuest },
  { path: '/register', component: RegisterPage, beforeEnter: requireGuest },
  { path: '/about', component: AboutPage },
  { path: '/pricing', component: PricingPage },
  { path: '/api', component: APIPage },
  { path: '/admin', component: AdminDashboard, beforeEnter: requireAuth },
  { path: '/dashboard', component: UserDashboard, beforeEnter: requireAuth },
  { path: '/catalog', component: CatalogPage, beforeEnter: requireAuth },
  { 
    path: '/recommended', 
    component: CatalogPage, // Using the same component for now with different props
    beforeEnter: requireAuth,
    props: { recommendedMode: true }
  },
  { path: '/favorites', component: FavoritesPage, beforeEnter: requireAuth },
  { path: '/:catchAll(.*)', redirect: '/' }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
