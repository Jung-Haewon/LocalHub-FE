<template>
  <main class="home-view">
    <header class="hero" :style="heroStyle">
      <div class="hero-overlay"></div>
      <div class="hero-inner container">
      </div>
    </header>

    <section class="cards container">
      <div class="section-head">
        <h2>카테고리 바로가기</h2>
        <p class="muted">원하는 카테고리를 선택해 지역 정보를 빠르게 찾아보세요.</p>
      </div>

      <div class="cards-grid">
        <router-link v-for="(c, idx) in categoriesPreview" :key="idx" class="card" :to="{ name: 'Category', params: { id: c.id } }">
          <div class="card-media">
            <img v-if="c.thumbnail" :src="c.thumbnail" alt="thumb" />
            <div v-else class="media-placeholder">사진</div>
            <div class="badge">{{ c.count }}</div>
          </div>
          <div class="card-body">
            <h3 class="card-title">{{ c.name }}</h3>
          </div>
        </router-link>
      </div>
    </section>

    <section class="recent container">
      <div class="section-head">
        <h2>최근 게시글</h2>
        <p class="muted">최근에 작성된 글을 한눈에 확인하세요.</p>
      </div>

      <div class="recent-list">
        <article v-for="p in recentPosts" :key="p.id" class="post-card">
          <router-link :to="`/posts/${p.id}`" class="post-title">{{ p.title }}</router-link>
          <div class="post-meta">{{ formatDate(p.created_at) }}</div>
        </article>
        <div v-if="recentPosts.length===0" class="empty">게시글이 없습니다.</div>
      </div>
    </section>
  </main>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import api from '../services/api'
import banner from '../assets/banner.jpg'

export default {
  name: 'HomeView',
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
        const r = await api.get('/posts', { params: { page: 1, size: 8 } })
        recentPosts.value = r.data.items || []
      } catch (e) {
        recentPosts.value = []
      }
    }

    onMounted(() => {
      fetchCategories()
      fetchRecent()
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
      { id: 'festival', name: '축제/공연/행사' },
      { id: 'accommodation', name: '숙박' },
      { id: 'shopping', name: '쇼핑' },
      { id: 'leports', name: '레포츠' },
      { id: 'culture', name: '문화시설' },
      { id: 'travel_course', name: '여행코스' }
    ]

    const categoriesPreview = computed(() => {
      const backend = categories.value || []
      const findBackend = (req) => {
        let found = backend.find(b => b.id === req.id)
        if (found) return found
        found = backend.find(b => (b.name && b.name.indexOf(req.name) !== -1) || (req.name && req.name.indexOf(b.name) !== -1))
        if (found) return found
        found = backend.find(b => b.id && req.id && b.id.indexOf(req.id) !== -1)
        return found
      }
      return recommendedOrder.map(r => {
        const b = findBackend(r)
        if (b) return { id: b.id || r.id, name: b.name || r.name, thumbnail: b.thumbnail || null, count: b.count || 0 }
        return { id: r.id, name: r.name, thumbnail: null, count: 0 }
      })
    })

    const formatDate = (s) => {
      if (!s) return ''
      const d = new Date(s)
      if (isNaN(d)) return s
      const yy = d.getFullYear()
      const mm = String(d.getMonth()+1).padStart(2,'0')
      const dd = String(d.getDate()).padStart(2,'0')
      return `${yy}-${mm}-${dd}`
    }

    const heroStyle = {
      backgroundImage: `url(${banner})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center center'
    }

    return { categoriesPreview, recentPosts, formatDate, heroStyle }
  }
}
</script>

<style scoped>
/* Design tokens (as requested) */
:root {
  --font-title: 'Outfit', 'Pretendard', sans-serif;
  --font-body: 'Pretendard', sans-serif;
  --bg-main: #f8fafc;
  --bg-card: #ffffff;
  --primary: #4f46e5;
  --primary-light: #e0e7ff;
  --secondary: #10b981;
  --text-main: #0f172a;
  --text-dim: #64748b;
  --border: #e2e8f0;
  --radius: 16px;
  --shadow-sm: 0 2px 8px rgba(15, 23, 42, 0.04);
  --shadow-md: 0 16px 36px -12px rgba(79, 70, 229, 0.08), 0 4px 12px -4px rgba(0, 0, 0, 0.03);
}

/* Page */
.home-view { background:var(--bg-main); min-height:100vh; font-family:var(--font-body); color:var(--text-main); padding-bottom:48px }
.container{max-width:1200px;margin:0 auto;padding:0 24px}

/* Hero / Banner */
.hero{
  position:relative;
  height:320px;
  display:flex;
  align-items:center;
  justify-content:center;
  margin-bottom:18px;
  border-radius:12px;
  overflow:hidden;
}
.hero-overlay{
  position:absolute;
  inset:0;
  background: linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.35) 100%);
  pointer-events:none;
}
.hero-inner{
  position:relative;
  z-index:2;
  width:100%;
  height:100%;
  display:flex;
  align-items:center;
  justify-content:flex-end;
  padding:24px;
}

/* Buttons */
.btn{ background:var(--primary); color:#fff; padding:12px 16px; border-radius:var(--radius); font-weight:700; box-shadow:var(--shadow-sm); transition:transform .15s ease, box-shadow .15s ease, background .15s ease }
.btn:hover{ transform:translateY(-3px); box-shadow:var(--shadow-md) }
.btn.secondary{ background:transparent; color:var(--text-main); border:1px solid var(--border); box-shadow:none }
.btn.secondary:hover{ background:var(--primary-light); color:var(--primary) }

/* Cards grid */
.cards{ padding:28px 0 }
.section-head h2{ font-family:var(--font-title); font-size:20px; margin:0; color:var(--text-main) }
.section-head .muted{ margin-top:6px; color:var(--text-dim); font-size:14px }
.cards-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:20px; margin-top:18px }
.card{ background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; transition:box-shadow .18s ease, transform .18s ease; display:flex; flex-direction:column; text-decoration:none }
.card:hover{ box-shadow:var(--shadow-md); transform:translateY(-6px) }
.card-media{ position:relative; height:140px; background:var(--primary-light); display:flex; align-items:center; justify-content:center }
.card-media img{ width:100%; height:100%; object-fit:cover }
.media-placeholder{ color:var(--text-dim) }
.badge{ position:absolute; right:12px; bottom:12px; background:rgba(15,23,42,0.85); color:#fff; padding:6px 10px; border-radius:999px; font-weight:700; font-size:12px }
.card-body{ padding:16px }
.card-title{ margin:0; font-family:var(--font-title); font-size:16px; color:var(--text-main) }

/* Recent posts */
.recent{ padding:28px 0 }
.recent-list{ display:flex; flex-direction:column; gap:12px; margin-top:12px }
.post-card{ background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:14px 16px; display:flex; justify-content:space-between; align-items:center; transition:box-shadow .12s ease }
.post-card:hover{ box-shadow:var(--shadow-sm) }
.post-title{ font-weight:700; color:var(--text-main); text-decoration:none }
.post-meta{ color:var(--text-dim); font-size:13px }
.empty{ color:var(--text-dim); padding:12px 0 }

/* Responsive */
@media (max-width: 1000px){ .cards-grid{ grid-template-columns:repeat(3,1fr) } .hero-inner{ flex-direction:column; align-items:flex-start } }
@media (max-width: 720px){ .cards-grid{ grid-template-columns:repeat(2,1fr) } .container{padding:0 14px} .hero{ height:220px } .hero-inner{ justify-content:center } }

</style>