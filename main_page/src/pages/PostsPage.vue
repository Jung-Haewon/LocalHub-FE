<template>
  <div class="posts-page">
    <h1>커뮤니티 게시글</h1>
    <p>사용자들이 작성한 일반 게시글 목록입니다. (관광지/맛집/축제 데이터와 분리)</p>

    <div class="quick-create">
      <input v-model="quick.title" placeholder="제목" />
      <input v-model="quick.excerpt" placeholder="간단 내용" />
      <button class="new-post" @click="createQuick">빠른 작성</button>
      <button class="new-post" @click="createPost">전체 작성 화면</button>
    </div>

      <div v-if="loading">로딩 중...</div>
      <div v-else>
        <ul class="post-list">
          <li v-for="p in posts" :key="p.id" class="post-card">
            <h3>
              <a :href="`/posts/${p.id}`" target="_blank" rel="noopener" class="post-link">{{ p.title }}</a>
              <span class="post-actions">
                <button class="small-btn" @click.stop="incViews(p)">👁 {{ p.views || 0 }}</button>
                <button class="small-btn" @click.stop="incLikes(p)">👍 {{ p.likes || 0 }}</button>
              </span>
            </h3>
            <p class="meta">{{ p.region }}</p>
            <p class="excerpt">{{ p.content ?? p.excerpt ?? '' }}</p>
          </li>
        </ul>
      </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const loading = ref(false)
const posts = ref([])

const samplePosts = [
  { id: 101, title: '지역 생활 정보 공유합니다', region: 'A 권역', excerpt: '동네 소식과 생활 정보를 나눠요.' },
  { id: 102, title: '주말에 볼만한 동네 작은 전시', region: 'B 권역', excerpt: '소규모 전시 소개합니다.' }
]

function loadPosts() {
  const raw = localStorage.getItem('localhub_posts')
  if (raw) {
    try {
      const arr = JSON.parse(raw)
      posts.value = arr.map(p => ({ ...p, likes: p.likes ?? 0, views: p.views ?? 0 }))
      return
    } catch (e) {
      // fallthrough
    }
  }
  // initialize with samples
  posts.value = samplePosts.slice().map(p => ({ ...p, likes: p.likes ?? 0, views: p.views ?? 0 }))
  localStorage.setItem('localhub_posts', JSON.stringify(posts.value))
}

onMounted(() => {
  loading.value = true
  try {
    loadPosts()
  } finally {
    loading.value = false
  }
  // Listen for storage changes from other windows (popup) to refresh list
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('storage', (e) => {
      if (e.key === 'localhub_posts') loadPosts()
    })
  }
})

const truncate = (text, n = 250) => {
  const s = String(text || '')
  return s.length > n ? s.slice(0, n) + '…' : s
}

function openPost(id) { router.push({ path: `/posts/${id}` }) }

function createQuick() {
  const title = quick.title && quick.title.trim()
  if (!title) return alert('제목을 입력하세요')
  const newPost = { id: Date.now(), title, excerpt: quick.excerpt || '', likes: 0, views: 0 }
  const raw = localStorage.getItem('localhub_posts')
  const arr = raw ? JSON.parse(raw) : []
  arr.unshift(newPost)
  localStorage.setItem('localhub_posts', JSON.stringify(arr))
  loadPosts()
  quick.title = quick.region = quick.excerpt = ''
}

const quick = ref({ title: '', excerpt: '' })

function createPost() { router.push({ path: '/posts/new' }) }

function savePostsArray(arr) {
  localStorage.setItem('localhub_posts', JSON.stringify(arr))
}

function incViews(p) {
  const raw = localStorage.getItem('localhub_posts')
  const arr = raw ? JSON.parse(raw) : []
  const idx = arr.findIndex(x => String(x.id) === String(p.id))
  if (idx >= 0) {
    arr[idx].views = (Number(arr[idx].views) || 0) + 1
    savePostsArray(arr)
    loadPosts()
  }
}

function incLikes(p) {
  const raw = localStorage.getItem('localhub_posts')
  const arr = raw ? JSON.parse(raw) : []
  const idx = arr.findIndex(x => String(x.id) === String(p.id))
  if (idx >= 0) {
    arr[idx].likes = (Number(arr[idx].likes) || 0) + 1
    savePostsArray(arr)
    loadPosts()
  }
}
</script>

<style scoped>
.post-list { list-style:none; padding:0; display:grid; gap:12px }
.post-card { padding:12px; border:1px solid var(--border); border-radius:6px; cursor:pointer; background:var(--panel); color:var(--text) }
.meta { color:var(--muted); font-size:13px }
.excerpt { color:var(--text) }

/* Prevent overflow on long text in posts list */
.post-card { overflow: hidden; word-break: break-word; overflow-wrap: anywhere; }
.post-card h3 { margin:0 0 6px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.post-link { color: var(--text); text-decoration: none; }
.post-link:hover { text-decoration: underline; }
.post-actions { margin-left: 12px; display:inline-flex; gap:6px; vertical-align: middle }
.small-btn { background:transparent; border:1px solid var(--border); color:var(--text); padding:4px 8px; border-radius:6px; cursor:pointer }
.small-btn:hover { background: rgba(255,255,255,0.02) }
.post-card .excerpt { display: -webkit-box; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; line-height:1.25em; -webkit-line-clamp:3; max-height: calc(1.25em * 3); word-break: break-word; overflow-wrap: anywhere; white-space: normal; }
.new-post { margin:10px 0; padding:8px 12px; border-radius:6px; border:1px solid var(--accent); background:transparent; color:var(--accent); cursor:pointer }
</style>
