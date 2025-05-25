import { createRouter, createWebHistory } from 'vue-router';
import HomePage from './components/HomePage.vue';
import QRCodeGenerator from './components/QRCodeGenerator.vue';
import LoginPage from './components/LoginPage.vue';
import SignUpPage from './components/SignUpPage.vue';

const routes = [
  { path: '/', component: HomePage },
  { path: '/qrcode', component: QRCodeGenerator },
  { path: '/login', component: LoginPage },
  { path: '/signup', component: SignUpPage },
  { path: '/:catchAll(.*)', redirect: '/' }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
