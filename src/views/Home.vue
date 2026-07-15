<template>
  <main class="home">
    <section class="banner">
      <div class="banner-inner">
        <h2>지역 정보 공유 커뮤니티 LocalHub</h2>
        <p class="sub">선정 권역(○○시/○○구) 지역 정보를 한눈에 만나보세요</p>
      </div>
    </section>

    <section class="categories">
      <h3>카테고리 바로가기</h3>
      <div class="grid">
        <router-link v-for="(c, idx) in categoriesPreview" :key="idx" class="cat-card" :to="{ name: 'Category', params: { id: c.id } }">
          <div class="thumb">
            <img v-if="c.thumbnail" :src="c.thumbnail" alt="카테고리 이미지" />
            <div v-else class="placeholder">사진</div>
            <div class="count" v-if="c.count">{{ c.count }}</div>
          </div>
          <div class="label">{{ c.name }}</div>
        </router-link>
      </div>
    </section>

    <section class="recent">
      <h3>최근 게시글</h3>
      <div class="list">
        <div v-for="(p,i) in recentPosts" :key="p.id" class="recent-item">
          <router-link :to="`/posts/${p.id}`" class="recent-title">{{ p.title }}</router-link>
          <div class="recent-date">{{ formatDate(p.created_at) }}</div>
        </div>
        <div v-if="recentPosts.length===0">게시글이 없습니다.</div>
      </div>
    </section>
  </main>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import api from '../services/api'

export default {
  setup () {
    const categories = ref([])
    const recentPosts = ref([])

    const fetchCategories = async () => {
      try {
        const r = await api.get('/categories')
        const payload = r.data && r.data.categories ? r.data.categories : r.data
        if (Array.isArray(payload)) {
          categories.value = payload.map(x => ({ id: x.id, name: x.name, thumbnail: x.thumbnail || x.image || null, count: x.count || 0 }))
        } else {
          categories.value = []
        }
      } catch (e) {
        categories.value = []
      }
    }

    const fetchRecent = async () => {
      try {
        const r = await api.get('/posts', { params: { page: 1, size: 5 } })
        recentPosts.value = r.data.items || []
      } catch (e) {
        recentPosts.value = []
      }
    }

    onMounted(() => {
      fetchCategories()
      fetchRecent()
      // if a map element exists on the page (rendered elsewhere), hide it on Home
      const mapEl = document.getElementById('kakao-map')
      if (mapEl) {
        mapEl.dataset._home_was_hidden = mapEl.style.display || ''
        mapEl.style.display = 'none'
      }
    })

    onUnmounted(() => {
      const mapEl = document.getElementById('kakao-map')
      if (mapEl && mapEl.dataset._home_was_hidden !== undefined) {
        mapEl.style.display = mapEl.dataset._home_was_hidden
        delete mapEl.dataset._home_was_hidden
      }
    })

    const recommendedOrder = [
      { id: 'tourist_spot', name: '관광지' },
      { id: 'festival', name: '축제공연행사' },
      { id: 'accommodation', name: '숙박' },
      { id: 'shopping', name: '쇼핑' },
      { id: 'leports', name: '레포츠' },
      { id: 'culture', name: '문화시설' },
      { id: 'travel_course', name: '여행코스' }
    ]

    const categoriesPreview = computed(() => {
      // Merge backend categories into recommended list with flexible matching
      const backend = categories.value || []

      const findBackend = (req) => {
        // exact id match
        let found = backend.find(b => b.id === req.id)
        if (found) return found
        // match by name
        found = backend.find(b => (b.name && b.name.indexOf(req.name) !== -1) || (req.name && req.name.indexOf(b.name) !== -1))
        if (found) return found
        // special-case: travel course variants (like '서울_여행코스')
        if (req.id === 'travel_course') {
          found = backend.find(b => b.id && b.id.toLowerCase().includes('여행') || (b.name && b.name.indexOf('여행') !== -1))
          if (found) return found
        }
        // match by id substring
        found = backend.find(b => req.id && b.id && b.id.indexOf(req.id) !== -1)
        return found
      }

      return recommendedOrder.map(r => {
        const b = findBackend(r)
        if (b) {
          const displayName = (r.id === 'travel_course') ? '여행코스' : (b.name || r.name)
          // use backend id when available so category pages query the correct id
          return { id: b.id || r.id, name: displayName, thumbnail: b.thumbnail || null, count: b.count || 0 }
        }
        return { id: r.id, name: r.name, thumbnail: null, count: 0 }
      })
    })

    const formatDate = (s) => s ? new Date(s).toLocaleDateString() : ''

    return { categories, recentPosts, categoriesPreview, formatDate }
  }
}
</script>

<style scoped>
.banner { background:#e9f1ff; padding:28px 12px; text-align:center; border:1px solid #e1e7f0 }
.banner-inner h2 { margin:0; color:#1a63b8 }
.banner-inner .sub { margin-top:6px; color:#666 }
.categories { padding:18px 12px }
.categories .grid { display:flex; gap:12px; margin-top:8px }
.cat-card { flex:1; border:1px solid #ddd; padding:12px; display:flex; flex-direction:column; align-items:center }
.thumb { width:100%; height:100px; display:flex; align-items:center; justify-content:center; background:#fafafa; margin-bottom:8px; position:relative }
.thumb img { width:100%; height:100%; object-fit:cover }
.count { position:absolute; right:6px; bottom:6px; background:rgba(0,0,0,0.6); color:#fff; padding:2px 6px; border-radius:12px; font-size:0.8rem }
.placeholder { color:#999 }
.label { font-weight:600 }
.recent { padding:18px 12px }
.recent .list { border-top:1px solid #eee }
.recent-item { display:flex; justify-content:space-between; padding:12px 0; border-bottom:1px solid #f3f3f3 }
.recent-title { color:#333 }
.recent-date { color:#999 }
</style>
