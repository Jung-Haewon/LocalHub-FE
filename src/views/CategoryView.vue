<template>
  <div class="category-page">
    <div class="page-container">
      <div class="category-header">
        <div>
          <h2>{{ title }}</h2>
          <div class="meta-sub">총 {{ totalCount }}개</div>
        </div>
        <div class="actions">
          <router-link :to="{ name: 'Map', query: { category: id } }" class="btn">지도에서 보기</router-link>
        </div>
      </div>

      <div class="controls">
        <input v-model="q" placeholder="검색어" @keyup.enter="search" />
        <select v-model.number="size" @change="changePage(1)">
          <option :value="12">12개</option>
          <option :value="24">24개</option>
          <option :value="48">48개</option>
        </select>
      </div>

      <div v-if="loading" class="status">로딩중...</div>
      <div v-if="error" class="error">{{ error }}</div>
      <div v-else-if="statusMessage" class="status">{{ statusMessage }}</div>

      <div class="grid">
        <div v-for="item in items" :key="item.id || item.content_id" class="card">
          <router-link :to="{ name: 'LocationDetail', params: { id: item.id || item.content_id } }">
            <div class="card-thumb">
              <img v-if="item.first_image" :src="item.first_image" alt="thumb" />
              <div v-else class="card-placeholder">사진</div>
            </div>
            <div class="info">
              <h4>{{ item.title }}</h4>
              <p class="addr">{{ item.addr1 }}</p>
              <!-- 종류 정보는 목록에서 표시하지 않습니다 -->
            </div>
          </router-link>
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
import api from '../services/api'

export default {
  props: ['id'],
  setup (props) {
    const title = ref('')
    const items = ref([])
    const page = ref(1)
    const size = ref(12)
    const total = ref(0)
    const totalCount = ref(0)
    const loading = ref(false)
    const error = ref(null)
    const statusMessage = ref('')
    const q = ref('')
    const metaThumbnail = ref(null)

    const fetchList = async () => {
      loading.value = true
      error.value = null
      try {
        statusMessage.value = ''
        const params = { category: props.id, page: page.value, size: size.value }
        if (q.value) params.q = q.value
        const r = await api.get('/locations', { params })
        items.value = r.data.items || []
        total.value = r.data.total || items.value.length
        totalCount.value = r.data.total || items.value.length
        if ((items.value || []).length === 0) {
          statusMessage.value = '해당 카테고리에 대한 항목이 없습니다.'
        }
      } catch (e) {
        const status = e.response?.status
        if (status === 404) {
          items.value = []
          total.value = 0
          totalCount.value = 0
          statusMessage.value = '해당 카테고리에 대한 항목이 없습니다.'
          error.value = null
        } else {
          error.value = e.response?.data?.detail || e.message || '오류가 발생했습니다.'
        }
      } finally {
        loading.value = false
      }
    }

    const fetchCategoryMeta = async () => {
      try {
        const r = await api.get('/categories')
        const cat = (r.data.categories || r.data).find(c => c.id === props.id || (c.id && c.id.toLowerCase().includes(props.id)))
        title.value = cat ? (cat.name || props.id) : props.id
        metaThumbnail.value = cat ? (cat.thumbnail || null) : null
        if (cat && cat.count) totalCount.value = cat.count
      } catch (e) {
        title.value = props.id
      }
    }

    const changePage = (p) => { page.value = p }

    onMounted(async () => {
      await fetchCategoryMeta()
      await fetchList()
    })

    watch([page, size], fetchList)

    const search = () => { page.value = 1; fetchList() }

    return { title, items, page, size, total, loading, error, changePage, q, search, totalCount, metaThumbnail, statusMessage }
  }
}
</script>

<style scoped>
/* 전체 콘텐츠 최대 너비 제한 -> 화면이 넓어져도 카드가 무한정 늘어나지 않음 */
.page-container {
  max-width: min(96vw, 1200px);
  margin: 0 auto;
  padding: clamp(1rem, 2vw, 2rem) 1rem 3rem;
}

.category-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}
.category-header h2 { margin: 0 0 4px; }
.meta-sub { font-size: 0.85rem; color: #888; }
.btn {
  display: inline-block;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.85rem;
}

.controls {
  margin-bottom: 1.25rem;
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}
.controls input {
  flex: 1;
  min-width: 160px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
}
.controls select {
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.9rem;
  background: #fff;
}

.status { padding: 1rem 0; color: #777; font-size: 0.9rem; }
.error { padding: 1rem 0; color: #d33; font-size: 0.9rem; }

/* 카드가 뷰포트 폭에 그대로 끌려가지 않도록 grid + minmax로 자연스럽게 컬럼 수를 조절 */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}
.card {
  border: 1px solid #eee;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 6px rgba(16,24,40,0.03);
  overflow: hidden;
}
.card a { display: block; padding: 14px; color: inherit; text-decoration: none; }

/* 고정 height 대신 aspect-ratio로 카드 폭이 커져도 비율 유지 (길쭉해지는 문제 방지) */
.card-thumb {
  width: 100%;
  aspect-ratio: 4 / 3;
  border-radius: 6px;
  overflow: hidden;
  background: #f3f3f3;
}
.card-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.card-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: #999; font-size: 0.9rem;
}

.info { padding-top: 10px; }
.info h4 { margin: 0 0 6px; font-size: 1rem; }
.addr { color: #666; font-size: 0.9rem; margin: 0; }

/* 페이지네이션 영역 패딩 및 버튼 스타일 보강 */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-top: 2rem;
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

@media (max-width: 720px) {
  .grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
}
</style>