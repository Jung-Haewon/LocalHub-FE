<template>
  <div class="posts-list">
    <div class="page-container">
      <div class="posts-header">
        <h2>게시판</h2>
        <router-link to="/posts/new" class="btn">글쓰기</router-link>
      </div>

      <div v-if="loading" class="status">로딩중...</div>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-else-if="!loading && !items.length" class="status">등록된 게시글이 없습니다.</div>

      <div v-if="!loading && items.length" class="posts-table">
        <div class="posts-row header">
          <div class="col num">번호</div>
          <div class="col title">제목</div>
          <div class="col author">작성자</div>
          <div class="col date">작성일</div>
        </div>
        <div v-for="(item, idx) in items" :key="item.id" class="posts-row">
          <div class="col num">{{ total - ((page-1)*size) - idx }}</div>
          <div class="col title">
            <router-link :to="`/posts/${item.id}`">{{ item.title }}</router-link>
            <span class="mobile-meta">{{ item.author_nickname || '익명' }} · {{ formatDate(item.created_at) }}</span>
          </div>
          <div class="col author">{{ item.author_nickname || '익명' }}</div>
          <div class="col date">{{ formatDate(item.created_at) }}</div>
        </div>
      </div>

      <div class="pagination" v-if="total > size">
        <button :disabled="page<=1" @click="changePage(page-1)">&#8249; 이전</button>
        <span>페이지 {{ page }} / {{ Math.ceil(total/size) }}</span>
        <button :disabled="page>=Math.ceil(total/size)" @click="changePage(page+1)">다음 &#8250;</button>
      </div>
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
.posts-list { background: transparent; }

.page-container {
  max-width: min(96vw, 1200px);
  margin: 0 auto;
  padding: clamp(1rem, 2vw, 2rem) 1rem 3rem;
}

.posts-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.posts-header h2 { margin: 0; }
.btn {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
}

.status { padding: 2rem 0; text-align: center; color: #888; font-size: 0.9rem; }
.error { padding: 1rem 0; color: #d33; font-size: 0.9rem; }

.posts-table {
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}
.posts-row {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #f3f3f3;
}
.posts-row:last-child { border-bottom: none; }
.posts-row:not(.header):hover { background: #fafafa; }
.posts-row.header {
  font-weight: 600;
  font-size: 0.85rem;
  color: #888;
  background: #fafafa;
  padding: 12px 16px;
}
.col { padding: 0 8px; min-width: 0; }
.col.num { width: 70px; color: #999; font-size: 0.9rem; }
.col.title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.col.title a {
  color: #1a1a1a;
  text-decoration: none;
  font-size: 0.95rem;
}
.col.title a:hover { text-decoration: underline; }
.col.author { width: 140px; color: #666; font-size: 0.9rem; }
.col.date { width: 150px; text-align: right; color: #999; font-size: 0.85rem; }

.mobile-meta { display: none; }

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid #eee;
}
.pagination span { font-size: 0.85rem; color: #777; }
.pagination button {
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: #fff;
  font-size: 0.85rem;
  cursor: pointer;
}
.pagination button:hover:not(:disabled) { background: #f7f7f7; }
.pagination button:disabled { opacity: 0.45; cursor: not-allowed; }

/* 모바일: 작성자/날짜 컬럼을 숨기고 제목 아래 작은 메타 텍스트로 대체 */
@media (max-width: 640px) {
  .col.author, .col.date { display: none; }
  .col.title {
    display: flex;
    flex-direction: column;
    gap: 2px;
    white-space: normal;
  }
  .mobile-meta {
    display: block;
    font-size: 0.78rem;
    color: #999;
  }
  .col.num { width: 44px; }
}
</style>