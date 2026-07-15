<template>
  <div class="posts-list">
    <h2>커뮤니티</h2>
    <div class="controls">
      <select v-model="category">
        <option value="">전체</option>
        <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
      </select>
      <router-link to="/posts/new">글쓰기</router-link>
    </div>

    <div v-if="loading">로딩중...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <ul v-if="!loading && items.length">
      <li v-for="item in items" :key="item.id">
        <router-link :to="`/posts/${item.id}`">{{ item.title }}</router-link>
        <small>{{ item.author_nickname }} · {{ formatDate(item.created_at) }}</small>
      </li>
    </ul>

    <div class="pagination" v-if="total > size">
      <button :disabled="page<=1" @click="changePage(page-1)">이전</button>
      <span>페이지 {{ page }} / {{ Math.ceil(total/size) }}</span>
      <button :disabled="page>=Math.ceil(total/size)" @click="changePage(page+1)">다음</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../services/api'

export default {
  setup () {
    const items = ref([])
    const categories = ref([])
    const category = ref('')

    const loading = ref(false)
    const error = ref(null)
    const page = ref(1)
    const size = ref(10)
    const total = ref(0)

    const fetchCategories = async () => {
      try {
        const r = await api.get('/categories')
        if (Array.isArray(r.data)) {
          categories.value = r.data.map(x => (typeof x === 'string' ? x : x.name || x.title))
        } else {
          categories.value = []
        }
      } catch (e) {
        categories.value = []
      }
    }

    const fetchPosts = async () => {
      loading.value = true
      error.value = null
      try {
        const params = { page: page.value, size: size.value }
        if (category.value) params.category = category.value
        const r = await api.get('/posts', { params })
        items.value = r.data.items || []
        total.value = r.data.total || items.value.length
      } catch (e) {
        error.value = e.response?.data?.detail || e.message || '목록을 불러오는 중 오류가 발생했습니다.'
      } finally {
        loading.value = false
      }
    }

    const changePage = (p) => { page.value = p }

    const formatDate = (s) => {
      if (!s) return ''
      return new Date(s).toLocaleString()
    }

    const route = useRoute()
    const router = useRouter()

    onMounted(async () => {
      await fetchCategories()
      if (route.query.category) category.value = route.query.category
      if (route.query.page) page.value = parseInt(route.query.page)
      await fetchPosts()
    })

    watch([category, page, size], () => {
      fetchPosts()
    })

    // when user changes category via select, update route query
    watch(category, (val) => {
      const q = { ...route.query }
      if (val) q.category = val
      else delete q.category
      q.page = 1
      router.replace({ name: 'Posts', query: q })
      page.value = 1
    })

    watch(page, (p) => {
      const q = { ...route.query, page: p }
      router.replace({ name: 'Posts', query: q })
    })

    return { items, categories, category, loading, error, page, size, total, changePage, formatDate }
  }
}
</script>

<style scoped>
.controls { display:flex; gap:12px; align-items:center; margin-bottom:12px }
ul { list-style:none; padding:0 }
li { padding:8px 0; border-bottom:1px solid #eee }
.pagination { margin-top:12px; display:flex; gap:8px; align-items:center }
.error { color: #c00 }
</style>
