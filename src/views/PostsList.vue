<template>
  <div class="posts-list">
    <h2>게시판</h2>
    <div class="controls">
      <router-link to="/posts/new">글쓰기</router-link>
    </div>

    <div v-if="loading">로딩중...</div>
    <div v-if="error" class="error">{{ error }}</div>

    <div v-if="!loading && items.length" class="posts-table">
      <div class="posts-row header">
        <div class="col num">번호</div>
        <div class="col title">제목</div>
        <div class="col author">작성자</div>
        <div class="col date">작성일</div>
      </div>
      <div v-for="(item, idx) in items" :key="item.id" class="posts-row">
        <div class="col num">{{ total - ((page-1)*size) - idx }}</div>
        <div class="col title"><router-link :to="`/posts/${item.id}`">{{ item.title }}</router-link></div>
        <div class="col author">{{ item.author_nickname || '익명' }}</div>
        <div class="col date">{{ formatDate(item.created_at) }}</div>
      </div>
    </div>

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

    onMounted(async () => {
      await fetchCategories()
      await fetchPosts()
    })

    watch([page, size], () => {
      fetchPosts()
    })

    return { items, categories, loading, error, page, size, total, changePage, formatDate }
  }
}
</script>

<style scoped>
.controls { display:flex; gap:12px; align-items:center; margin-bottom:18px }
.posts-list { padding:24px; background:transparent }
.posts-table { border-top:1px solid var(--card-border); margin-top:20px }
.posts-row { display:flex; align-items:center; padding:18px 12px; border-bottom:1px solid #f3f3f3 }
.posts-row.header { font-weight:700; color:var(--color-muted); padding:14px 12px }
.col { padding:0 12px }
.col.num { width:90px }
.col.title { flex:1 }
.col.author { width:180px }
.col.date { width:160px; text-align:right }
.pagination { margin-top:18px; display:flex; gap:12px; align-items:center }
.error { color: #c00 }
</style>
