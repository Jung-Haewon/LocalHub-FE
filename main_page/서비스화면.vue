<template>
  <div class="home-view">
    <section class="banner">
      <h1>지역 정보 공유 커뮤니티 LocalHub</h1>
      <p>서울의 알짜배기 지역 정보를 한눈에 만나보세요.</p>

      <div class="search-row">
        <input v-model="q" placeholder="지역/키워드 검색" @keyup.enter="onSearch" />
        <select v-model="filter">
          <option value="">전체</option>
          <option value="tour">관광지</option>
          <option value="food">맛집</option>
          <option value="event">축제·행사</option>
        </select>
        <button @click="onSearch">검색</button>
      </div>
    </section>

    <section class="categories">
      <button @click="openCategory('tour')">관광지</button>
      <button @click="openCategory('food')">맛집</button>
      <button @click="openCategory('event')">축제·행사</button>
    </section>

    <section class="content-grid">
      <div class="intro">
        <h2>커뮤니티 게시글</h2>
        <p>사용자들이 작성하는 일반 게시글은 별도의 커뮤니티 게시판으로 분리됩니다.</p>
        <button @click="goPosts">커뮤니티 게시글 보기</button>

        <div class="posts-preview">
          <h3>추천 게시물</h3>
          <div v-if="loading">로딩 중...</div>
          <div v-else-if="filteredPosts.length === 0">게시물이 없습니다.</div>
          <ul class="post-list">
            <li v-for="p in filteredPosts.slice(0,6)" :key="p.id" class="post-card" @click="openPost(p.id)">
              <h4>{{ p.title }}</h4>
              <p class="meta">{{ p.categoryLabel }} · {{ p.region }}</p>
              <p class="excerpt">{{ p.excerpt }}</p>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <!-- 챗봇 위젯 자리표시자 (나중에 연결) -->
    <ChatbotWidget v-if="showChatbot" @open="onChatOpen" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineAsyncComponent, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'

let router
try {
  router = useRouter()
} catch (e) {
  router = null
}
const q = ref('')
const filter = ref('')
const loading = ref(false)
const posts = ref([])

// Lazy-load chatbot widget component (실제 구현은 나중에 추가)
const ChatbotWidget = defineAsyncComponent(() => import('./src/components/ChatbotWidget.vue').catch(() => ({
  // 간단한 폴백 컴포넌트: 렌더 함수로 null 반환
  setup() { return () => null }
})))

const showChatbot = ref(true) // 플로팅 위젯 노출 토글

const sampleData = [
  { id: 1, title: '한적한 뷰 포인트', category: 'tour', categoryLabel: '관광지', region: 'A 권역', excerpt: '강변에 위치한 산책로와 전망대.', coords: [37.5, 127.0] },
  { id: 2, title: '숨은 맛집 김밥천국', category: 'food', categoryLabel: '맛집', region: 'A 권역', excerpt: '지역 주민들이 추천하는 분식집.', coords: [37.51, 127.01] },
  { id: 3, title: '봄꽃 축제', category: 'event', categoryLabel: '축제·행사', region: 'A 권역', excerpt: '매년 열리는 소규모 꽃 축제입니다.', coords: [37.52, 127.02] }
]

async function fetchPosts() {
  loading.value = true
  try {
    // 백엔드가 준비되면 아래 경로로 교체하세요. (절대 백엔드 먼저 구현하지 마세요)
    const res = await fetch('/api/posts?region=A') // 자리표시자
    if (!res.ok) throw new Error('no api')
    const data = await res.json()
    posts.value = data
  } catch (err) {
    // 개발 초반에는 샘플 데이터로 폴백
    posts.value = sampleData
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchPosts()
  // 지도 초기화는 별도 컴포넌트에서 처리하세요
})

const filteredPosts = computed(() => {
  return posts.value.filter(p => {
    if (filter.value && p.category !== filter.value) return false
    if (q.value && !`${p.title} ${p.excerpt} ${p.region}`.toLowerCase().includes(q.value.toLowerCase())) return false
    return true
  })
})

function goCategory(cat) {
  filter.value = cat
  if (router) router.push({ path: '/posts', query: { category: cat } })
}

function openCategory(cat) {
  // open a simple vanilla/static page per category in a new window
  const map = { tour: '/category-tour.html', food: '/category-food.html', event: '/category-event.html' }
  const url = map[cat] || '/category.html'
  window.open(url, '_blank', 'noopener')
}

function openPost(id) {
  if (router) router.push({ path: `/posts/${id}` })
}

function onSearch() {
  // 검색 결과 페이지로 이동하거나 현재 필터링된 목록을 사용
  if (router) router.push({ path: '/posts', query: { q: q.value, category: filter.value } })
}

function openMapModal() {
  // 지도 모달을 열도록 이벤트 발행 또는 라우트 이동 처리
  if (router) router.push({ path: '/map' })
}

function goPosts() {
  // Open posts popup page in a new browser tab/window
  window.open('/posts-popup.html', '_blank')
}

function onChatOpen() {
  // 챗봇 열기 시 동작 — 나중에 구현
}
</script>

<style scoped>
:root {
  --bg: #0b1220;
  --panel: #0f1724;
  --muted: #98a0b3;
  --text: #e6eef8;
  --border: #223142;
  --accent: #3b82f6;
}
.home-view { padding: 24px; max-width: 1100px; margin: 0 auto; color:var(--text); background:var(--bg); }
.banner { background: var(--panel); padding: 28px; text-align: center; border-radius: 8px; margin-bottom: 20px; }
.banner h1 { margin: 0 0 8px 0; font-size: 28px; }
.search-row { margin-top: 12px; display:flex; gap:8px; justify-content:center; }
.search-row input { padding:8px 12px; width:320px; border-radius:4px; border:1px solid var(--border); background:transparent; color:var(--text) }
.search-row select, .search-row button { padding:8px 12px; border-radius:4px; border:1px solid var(--border); background:transparent; cursor:pointer; color:var(--text) }

.categories { display:flex; gap:12px; justify-content:center; margin:18px 0; }
.categories button { padding:10px 18px; border-radius:6px; border:1px solid var(--accent); background:transparent; cursor:pointer; color:var(--accent); }

.content-grid { display:flex; gap:20px; align-items:flex-start; }
.intro { flex:1; }
.post-list { list-style:none; padding:0; margin:0; display:grid; grid-template-columns: repeat(auto-fill,minmax(240px,1fr)); gap:12px; }
.post-card { background:var(--panel); border:1px solid var(--border); padding:12px; border-radius:6px; cursor:pointer; transition: box-shadow .12s; color:var(--text) }
.post-card:hover { box-shadow:0 6px 18px rgba(0,0,0,0.4); }
.meta { color:var(--muted); font-size:13px; margin:6px 0; }
.excerpt { color:var(--text); font-size:14px; }

.map-section { width:360px; }
.map-placeholder { height:220px; background:transparent; border:1px dashed var(--border); display:flex; align-items:center; justify-content:center; color:var(--muted); border-radius:6px; margin-bottom:10px; }
.open-map { width:100%; padding:10px; border-radius:6px; border:1px solid var(--accent); background:transparent; color:var(--accent); cursor:pointer; }
</style>