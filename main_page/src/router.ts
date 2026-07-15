import { createRouter, createWebHistory } from 'vue-router'

const ServicePage = () => import('../서비스화면.vue')
const PostsPage = () => import('./pages/PostsPage.vue')
const PostDetail = () => import('./pages/PostDetail.vue')
const PostForm = () => import('./components/PostForm.vue')
const MapPage = () => import('./pages/CategoryPage.vue')
const CategoryPage = () => import('./pages/CategoryPage.vue')

const routes = [
  { path: '/', component: ServicePage },
  { path: '/posts', component: PostsPage },
  { path: '/posts/new', component: PostForm },
  { path: '/posts/:id', component: PostDetail },
  { path: '/posts/:id/edit', component: PostForm },
  { path: '/map', component: MapPage },
  { path: '/category', component: CategoryPage }
]

const router = createRouter({ history: createWebHistory(), routes })

export default router
