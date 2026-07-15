import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import MapView from '../views/MapView.vue'
import PostsList from '../views/PostsList.vue'
import PostDetail from '../views/PostDetail.vue'
import PostForm from '../views/PostForm.vue'
import CategoryView from '../views/CategoryView.vue'
import LocationDetail from '../views/LocationDetail.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/map', name: 'Map', component: MapView },
  { path: '/categories/:id', name: 'Category', component: CategoryView, props: true },
  { path: '/locations/:id', name: 'LocationDetail', component: LocationDetail, props: true },
  { path: '/posts', name: 'Posts', component: PostsList },
  { path: '/posts/new', name: 'PostNew', component: PostForm },
  { path: '/posts/:id', name: 'PostDetail', component: PostDetail, props: true },
  { path: '/posts/:id/edit', name: 'PostEdit', component: PostForm, props: true }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
