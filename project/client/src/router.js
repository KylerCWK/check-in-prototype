import { createRouter, createWebHistory } from 'vue-router';
import HomePage from './components/HomePage.vue';
import QRCodeGenerator from './components/QRCodeGenerator.vue';
import LoginPage from './components/LoginPage.vue';
import SignUpPage from './components/SignUpPage.vue';
import AboutPage from './components/AboutPage.vue';
import PricingPage from './components/PricingPage.vue';
import APIPage from './components/APIPage.vue';
import AdminDashboard from './components/AdminDashboard.vue';

const routes = [
  { path: '/', component: HomePage },
  { path: '/qrcode', component: QRCodeGenerator },
  { path: '/login', component: LoginPage },
  { path: '/signup', component: SignUpPage },
  { path: '/about', component: AboutPage },
  { path: '/pricing', component: PricingPage },
  { path: '/api', component: APIPage },
  { path: '/admin', component: AdminDashboard },
  { path: '/:catchAll(.*)', redirect: '/' }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
