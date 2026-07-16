<template>
  <div class="category-page">
    <div class="category-header container">
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

    <div v-if="loading">로딩중...</div>
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
      <button :disabled="page<=1" @click="changePage(page-1)">이전</button>
      <span>페이지 {{ page }} / {{ Math.ceil(total/size) }}</span>
      <button :disabled="page>=Math.ceil(total/size)" @click="changePage(page+1)">다음</button>
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
.grid { display:flex; gap:12px; flex-wrap:wrap }
.card { width:30%; border:1px solid #eee; padding:8px }
.card img { width:100%; height:140px; object-fit:cover }
.addr { color:#666; font-size:0.9rem }
.controls { margin-bottom:12px }
</style>
