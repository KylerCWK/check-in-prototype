import { createRouter, createWebHistory } from 'vue-router';
import HomePage from './components/HomePage.vue';
import QRCodeGenerator from './components/QRCodeGenerator.vue';
import CompanyQRGenerator from './components/CompanyQRGenerator.vue';
import LoginPage from './components/LoginPage.vue';
import RegisterPage from './components/RegisterPage.vue';
import AboutPage from './components/AboutPage.vue';
import PricingPage from './components/PricingPage.vue';
import APIPage from './components/APIPage.vue';
import AdminDashboard from './components/AdminDashboard.vue';
import UserDashboard from './components/UserDashboard.vue';
import CatalogPage from './components/CatalogPage.vue';
import FavoritesPage from './components/FavoritesPage.vue';
import RecommendationsPage from './components/RecommendationsPage.vue';
import INCRegisterPage from './components/INCRegisterPage.vue';
import INCDashboard from './components/INCDashboard.vue';

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

// Company guard (for INC dashboard access)
const requireCompany = (to, from, next) => {
  const token = localStorage.getItem('token');
  const currentCompany = localStorage.getItem('currentCompany');
  
  if (!token) {
    localStorage.setItem('redirectAfterLogin', to.fullPath);
    next({ path: '/login', query: { redirect: to.fullPath } });
    return;
  }
  
  if (!currentCompany) {
    // User doesn't have a company, redirect to regular dashboard
    next('/dashboard');
    return;
  }
  
  next();
};

const routes = [
  { path: '/', component: HomePage },
  { path: '/login', component: LoginPage, beforeEnter: requireGuest },
  { path: '/register', component: RegisterPage, beforeEnter: requireGuest },
  { path: '/about', component: AboutPage },
  { path: '/pricing', component: PricingPage },
  { path: '/api', component: APIPage },
  { path: '/qrcode', component: QRCodeGenerator, beforeEnter: requireAuth },
  { path: '/admin', component: AdminDashboard, beforeEnter: requireAuth },
  { path: '/dashboard', component: UserDashboard, beforeEnter: requireAuth },
  { path: '/catalog', component: CatalogPage, beforeEnter: requireAuth },
  { path: '/favorites', component: FavoritesPage, beforeEnter: requireAuth },
  { path: '/recommendations', component: RecommendationsPage, beforeEnter: requireAuth },  // INC Routes
  { 
    path: '/inc/register',
    component: INCRegisterPage,
    beforeEnter: requireGuest
  },
  {
    path: '/inc/dashboard',
    component: INCDashboard,
    beforeEnter: requireCompany
  },
  { 
    path: '/inc/qr-generator',
    component: CompanyQRGenerator,
    beforeEnter: requireCompany
  },
  { path: '/:catchAll(.*)', redirect: '/' }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
