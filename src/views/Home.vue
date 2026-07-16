<template>
  <main class="home-view">
    <header class="hero" :style="heroStyle">
      <div class="hero-overlay"></div>
      <div class="hero-inner container">
        <h1 class="hero-title">서울의 모든 정보, LocalHub에서</h1>
        <p class="hero-subtitle">관광지·숙박·쇼핑부터 우리 동네 이야기까지</p>
        <button class="btn hero-cta" @click="scrollToCategories">카테고리 둘러보기</button>
      </div>
    </header>

    <section class="cards-section" id="categories-section">
      <div class="container">
        <div class="section-head reveal">
          <div class="head-row">
            <span class="accent-bar"></span>
            <h2>카테고리 바로가기</h2>
          </div>
          <p class="muted">원하는 카테고리를 선택해 지역 정보를 빠르게 찾아보세요.</p>
        </div>

        <div class="cards-grid">
          <router-link
            v-for="(c, idx) in categoriesPreview"
            :key="idx"
            class="card reveal"
            :style="{ transitionDelay: Math.min(idx * 0.06, 0.42) + 's' }"
            :to="{ name: 'Category', params: { id: c.id } }"
          >
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
      </div>
    </section>

    <section class="recent-section">
      <div class="container">
        <div class="section-head reveal">
          <div class="head-row">
            <span class="accent-bar"></span>
            <h2>최근 게시글</h2>
          </div>
          <p class="muted">최근에 작성된 글을 한눈에 확인하세요.</p>
        </div>

        <div class="recent-list">
          <article
            v-for="(p, idx) in recentPosts"
            :key="p.id"
            class="post-card reveal"
            :style="{ transitionDelay: Math.min(idx * 0.06, 0.42) + 's' }"
          >
            <router-link :to="`/posts/${p.id}`" class="post-title">{{ p.title }}</router-link>
            <div class="post-meta">{{ formatDate(p.created_at) }}</div>
          </article>
          <div v-if="recentPosts.length===0" class="empty reveal">게시글이 없습니다.</div>
        </div>
      </div>
    </section>
  </main>
</template>

<script>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
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

    // ---------------------------------------------------------------------
    // 스크롤 리빌 애니메이션: .reveal 요소가 화면에 들어오면 is-visible 클래스를 붙임
    // 카테고리 카드/게시글 항목이 비동기로 렌더링되므로, 데이터가 갱신될 때마다
    // 아직 관찰 중이지 않은 새 .reveal 요소를 다시 찾아 관찰 대상에 추가함
    // ---------------------------------------------------------------------
    let revealObserver = null

    const observeReveals = () => {
      if (!revealObserver) {
        revealObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('is-visible')
              revealObserver.unobserve(entry.target)
            }
          })
        }, { threshold: 0.15 })
      }
      document.querySelectorAll('.reveal:not(.is-visible)').forEach(el => {
        revealObserver.observe(el)
      })
    }

    onMounted(async () => {
      fetchCategories()
      fetchRecent()
      const mapEl = document.getElementById('kakao-map')
      if (mapEl) {
        mapEl.dataset._home_was_hidden = mapEl.style.display || ''
        mapEl.style.display = 'none'
      }
      await nextTick()
      observeReveals()
    })

    // 카테고리/게시글 데이터가 늦게 도착해 새로 렌더링된 .reveal 요소를 추가 관찰
    watch([categories, recentPosts], async () => {
      await nextTick()
      observeReveals()
    })

    onUnmounted(() => {
      const mapEl = document.getElementById('kakao-map')
      if (mapEl && mapEl.dataset._home_was_hidden !== undefined) {
        mapEl.style.display = mapEl.dataset._home_was_hidden
        delete mapEl.dataset._home_was_hidden
      }
      if (revealObserver) {
        revealObserver.disconnect()
        revealObserver = null
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

    const scrollToCategories = () => {
      const el = document.getElementById('categories-section')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }

    return { categoriesPreview, recentPosts, formatDate, heroStyle, scrollToCategories }
  }
}
</script>

<style scoped>
/* Design tokens (as requested) */
:root {
  --font-title: 'Outfit', 'Pretendard', sans-serif;
  --font-body: 'Pretendard', sans-serif;
  --bg-main: #fff7f2; /* warm background */
  --bg-card: #ffffff;
  --primary: #ff6b3d; /* warm coral */
  --primary-light: #ffe6dc;
  --secondary: #f59e0b;
  --text-main: #17212a;
  --text-dim: #7a7f86;
  --border: #efe6dd;
  --radius: 16px;
  --shadow-sm: 0 2px 8px rgba(23, 33, 42, 0.04);
  --shadow-md: 0 12px 30px -10px rgba(255,107,61,0.06), 0 4px 12px -2px rgba(0, 0, 0, 0.02);
}

/* Page */
.home-view { background:var(--bg-main); min-height:100vh; font-family:var(--font-body); color:var(--text-main) }
.container{max-width:1200px;margin:0 auto;padding:0 24px}

/* Hero / Banner */
.hero{
  position:relative;
  height:320px;
  display:flex;
  align-items:center;
  justify-content:center;
  overflow:hidden;
  animation: fadeIn 0.6s ease both;
}
.hero-overlay{
  position:absolute;
  inset:0;
  /* 왼쪽에 텍스트를 배치하므로 왼쪽을 더 진하게, 오른쪽은 이미지가 살도록 옅게 */
  background: linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0.08) 75%, rgba(0,0,0,0.05) 100%);
  pointer-events:none;
}
.hero-inner{
  position:relative;
  z-index:2;
  width:100%;
  height:100%;
  display:flex;
  flex-direction:column;
  align-items:flex-start;
  justify-content:center;
  padding:24px;
}
.hero-title{
  margin:0 0 10px;
  font-family:var(--font-title);
  font-size:32px;
  font-weight:700;
  color:#fff;
  text-shadow:0 2px 10px rgba(0,0,0,0.4);
  max-width:560px;
}
.hero-subtitle{
  margin:0 0 20px;
  font-size:15px;
  color:rgba(255,255,255,0.92);
  text-shadow:0 1px 6px rgba(0,0,0,0.35);
}
.hero-cta{ font-size:14px }

/* Buttons */
.btn{ background:var(--primary); color:#fff; padding:12px 16px; border-radius:var(--radius); font-weight:700; box-shadow:var(--shadow-sm); transition:transform .15s ease, box-shadow .15s ease, background .15s ease }
.btn:hover{ transform:translateY(-3px); box-shadow:var(--shadow-md) }
.btn.secondary{ background:transparent; color:var(--text-main); border:1px solid var(--border); box-shadow:none }
.btn.secondary:hover{ background:var(--primary-light); color:var(--primary) }

/* 섹션 전체를 밴드로 나눠서 색으로 구분 (카드로 가두지 않고 화면 끝까지 배경을 바꿈) */
.cards-section{ background:var(--bg-main); padding:44px 0 }
.recent-section{
  background:#ffffff;
  border-top:1px solid var(--border);
  border-bottom:1px solid var(--border);
  padding:44px 0 56px;
}

/* Section heading: accent bar + title */
.section-head{ margin-bottom:20px }
.head-row{ display:flex; align-items:center; gap:10px }
.accent-bar{ display:block; width:4px; height:18px; background:var(--primary); border-radius:0 }
.section-head h2{ font-family:var(--font-title); font-size:20px; margin:0; color:var(--text-main) }
.section-head .muted{ margin:6px 0 0 14px; color:var(--text-dim); font-size:14px }

/* 스크롤 리빌: JS가 is-visible을 붙이기 전까지 살짝 아래 + 투명 상태로 대기 */
.reveal{
  opacity:0;
  transform:translateY(22px);
  transition: opacity .55s ease, transform .55s ease;
}
.reveal.is-visible{ opacity:1; transform:translateY(0) }

/* Cards grid */
.cards-grid{ display:grid; grid-template-columns:repeat(4,1fr); gap:20px; margin-top:18px }
.card{ background:var(--bg-card); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; transition:box-shadow .18s ease, transform .18s ease; display:flex; flex-direction:column; text-decoration:none }
.card:hover{ box-shadow:var(--shadow-md); transform:translateY(-6px) }
.card-media{ position:relative; height:140px; background:var(--primary-light); display:flex; align-items:center; justify-content:center; overflow:hidden }
.card-media img{ width:100%; height:100%; object-fit:cover; transition:transform .35s ease }
.card:hover .card-media img{ transform:scale(1.06) }
.media-placeholder{ color:var(--text-dim) }
.badge{ position:absolute; right:12px; bottom:12px; background:rgba(15,23,42,0.85); color:#fff; padding:6px 10px; border-radius:999px; font-weight:700; font-size:12px }
.card-body{ padding:16px }
.card-title{ margin:0; font-family:var(--font-title); font-size:16px; color:#000 }
.label { color: #000; }

/* Recent posts */
.recent-list{ display:flex; flex-direction:column; gap:12px; margin-top:12px }
.post-card{ background:var(--bg-main); border:1px solid var(--border); border-radius:12px; padding:14px 16px; display:flex; justify-content:space-between; align-items:center; transition:box-shadow .12s ease, transform .12s ease }
.post-card:hover{ box-shadow:var(--shadow-sm); transform:translateX(4px) }
.post-title{ font-weight:700; color:var(--text-main); text-decoration:none }
.post-meta{ color:var(--text-dim); font-size:13px }
.empty{ color:var(--text-dim); padding:12px 0 }

@keyframes fadeIn {
  from { opacity:0 }
  to { opacity:1 }
}

/* 모션을 원치 않는 사용자를 위한 배려 */
@media (prefers-reduced-motion: reduce) {
  .reveal{ opacity:1; transform:none; transition:none }
  .hero{ animation:none }
  .card, .post-card, .card-media img{ transition:none }
}

/* Responsive */
@media (max-width: 1000px){ .cards-grid{ grid-template-columns:repeat(3,1fr) } }
@media (max-width: 720px){
  .cards-grid{ grid-template-columns:repeat(2,1fr) }
  .container{padding:0 14px}
  .hero{ height:220px }
  .hero-title{ font-size:22px; max-width:100% }
  .hero-subtitle{ font-size:13px }
  .cards-section{ padding:32px 0 }
  .recent-section{ padding:32px 0 40px }
}

</style>