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
        <li v-for="p in posts" :key="p.id" class="post-card" @click="openPost(p.id)">
          <h3>{{ p.title }}</h3>
          <p class="meta">{{ p.region }}</p>
          <p class="excerpt">{{ p.excerpt }}</p>
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
      posts.value = JSON.parse(raw)
      return
    } catch (e) {
      // fallthrough
    }
  }
  // initialize with samples
  posts.value = samplePosts.slice()
  localStorage.setItem('localhub_posts', JSON.stringify(posts.value))
}

onMounted(() => {
  loading.value = true
  try {
    loadPosts()
  } finally {
    loading.value = false
  }
})

function openPost(id) { router.push({ path: `/posts/${id}` }) }

function createQuick() {
  const title = quick.title && quick.title.trim()
  if (!title) return alert('제목을 입력하세요')
  const newPost = { id: Date.now(), title, excerpt: quick.excerpt || '' }
  const raw = localStorage.getItem('localhub_posts')
  const arr = raw ? JSON.parse(raw) : []
  arr.unshift(newPost)
  localStorage.setItem('localhub_posts', JSON.stringify(arr))
  loadPosts()
  quick.title = quick.region = quick.excerpt = ''
}

const quick = ref({ title: '', excerpt: '' })

function createPost() { router.push({ path: '/posts/new' }) }
</script>

<style scoped>
.post-list { list-style:none; padding:0; display:grid; gap:12px }
.post-card { padding:12px; border:1px solid var(--border); border-radius:6px; cursor:pointer; background:var(--panel); color:var(--text) }
.meta { color:var(--muted); font-size:13px }
.excerpt { color:var(--text) }
.new-post { margin:10px 0; padding:8px 12px; border-radius:6px; border:1px solid var(--accent); background:transparent; color:var(--accent); cursor:pointer }
</style>
