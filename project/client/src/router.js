import { createRouter, createWebHistory } from 'vue-router';
import HomePage from './components/HomePage.vue';
import QRCodeGenerator from './components/QRCodeGenerator.vue';
import QRScanner from './components/QRScanner.vue';
import LoginPage from './components/LoginPage.vue';
import RegisterPage from './components/RegisterPage.vue';
import AboutPage from './components/AboutPage.vue';
import PricingPage from './components/PricingPage.vue';
import APIPage from './components/APIPage.vue';
import AdminDashboard from './components/AdminDashboard.vue';
import UserDashboard from './components/UserDashboard.vue';
import CatalogPage from './components/CatalogPage.vue';

// Authentication guard
const requireAuth = (to, from, next) => {
  const token = localStorage.getItem('token');
  if (!token) {
    next('/login');
  } else {
    next();
  }
};

const routes = [
  { path: '/', component: HomePage },
  { path: '/qrcode', component: QRCodeGenerator, beforeEnter: requireAuth },
  { path: '/scan', component: QRScanner, beforeEnter: requireAuth },
  { path: '/login', component: LoginPage },
  { path: '/register', component: RegisterPage },
  { path: '/about', component: AboutPage },
  { path: '/pricing', component: PricingPage },
  { path: '/api', component: APIPage },
  { path: '/admin', component: AdminDashboard, beforeEnter: requireAuth },
  { path: '/dashboard', component: UserDashboard, beforeEnter: requireAuth },
  { path: '/catalog', component: CatalogPage, beforeEnter: requireAuth },
  { path: '/:catchAll(.*)', redirect: '/' }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
