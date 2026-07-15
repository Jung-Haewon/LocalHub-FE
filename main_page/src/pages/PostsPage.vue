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
import { api } from '../api'

const router = useRouter()
const loading = ref(false)
const posts = ref([])

const samplePosts = [
  { id: 101, title: '지역 생활 정보 공유합니다', region: 'A 권역', excerpt: '동네 소식과 생활 정보를 나눠요.' },
  { id: 102, title: '주말에 볼만한 동네 작은 전시', region: 'B 권역', excerpt: '소규모 전시 소개합니다.' }
]

function normalizeServerItem(it) {
  return {
    id: it.id,
    title: it.title,
    category: it.category,
    region: it.region || '',
    excerpt: it.excerpt || '',
    content: it.content || it.excerpt || '',
    author_nickname: it.author_nickname || '',
    created_at: it.created_at || '',
    likes: it.likes ?? 0,
    views: it.view_count ?? it.views ?? 0
  }
}

async function loadPosts() {
  loading.value = true
  try {
    const res = await api.getPosts(undefined, 1, 50)
    const items = (res && (res.items || res.data)) || (Array.isArray(res) ? res : null)
    if (Array.isArray(items)) {
      posts.value = items.map(normalizeServerItem)
      try { window.localStorage.setItem('localhub_posts', JSON.stringify(posts.value)) } catch(e) {}
      return
    }

    const raw = window.localStorage.getItem('localhub_posts')
    if (raw) {
      posts.value = JSON.parse(raw).map(p => ({ ...p, likes: p.likes ?? 0, views: p.views ?? 0 }))
      return
    }

    posts.value = samplePosts
  } catch (err) {
    console.error('loadPosts error', err)
    const raw = window.localStorage.getItem('localhub_posts')
    if (raw) {
      posts.value = JSON.parse(raw).map(p => ({ ...p, likes: p.likes ?? 0, views: p.views ?? 0 }))
    } else {
      posts.value = samplePosts
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadPosts()
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('storage', (e) => {
      if (e.key === 'localhub_posts') loadPosts()
    })
  }
})

const quick = ref({ title: '', excerpt: '' })

async function createQuick() {
  const title = quick.value.title && quick.value.title.trim()
  if (!title) return alert('제목을 입력하세요')

  const payload = {
    category: '',
    title,
    content: quick.value.excerpt || '',
    author_nickname: '익명',
    password: '' // quick-create에서는 빈 문자열로 전송 (필요하면 프론트에서 사용자 입력 추가)
  }

  try {
    const created = await api.createPost(payload)
    const item = normalizeServerItem(created)
    posts.value.unshift(item)
    try { window.localStorage.setItem('localhub_posts', JSON.stringify(posts.value)) } catch(e) {}
    quick.value.title = quick.value.excerpt = ''
  } catch (err) {
    console.error('createQuick error', err)
    alert('게시글 생성에 실패했습니다.')
  }
}

function createPost() { router.push({ path: '/posts/new' }) }

async function incViews(p) {
  try {
    const newViews = (Number(p.views) || 0) + 1
    await api.updatePost(p.id, { view_count: newViews })
    const idx = posts.value.findIndex(x => String(x.id) === String(p.id))
    if (idx >= 0) posts.value[idx].views = newViews
    try { window.localStorage.setItem('localhub_posts', JSON.stringify(posts.value)) } catch(e) {}
  } catch (err) {
    console.error('incViews error', err)
  }
}

async function incLikes(p) {
  try {
    const newLikes = (Number(p.likes) || 0) + 1
    await api.updatePost(p.id, { likes: newLikes })
    const idx = posts.value.findIndex(x => String(x.id) === String(p.id))
    if (idx >= 0) posts.value[idx].likes = newLikes
    try { window.localStorage.setItem('localhub_posts', JSON.stringify(posts.value)) } catch(e) {}
  } catch (err) {
    console.error('incLikes error', err)
  }
}

async function createQuick() {
  console.log('[PostsPage] createQuick called, quick=', quick.value);
  const title = quick.value.title && quick.value.title.trim();
  if (!title) return alert('제목을 입력하세요');

  const payload = {
    category: '',
    title,
    content: quick.value.excerpt || '',
    author_nickname: '익명',
    password: ''
  };

  try {
    console.log('[PostsPage] createQuick payload:', payload);
    const created = await api.createPost(payload);
    console.log('[PostsPage] createQuick response:', created);
    const item = normalizeServerItem(created);
    posts.value.unshift(item);
    try { window.localStorage.setItem('localhub_posts', JSON.stringify(posts.value)) } catch(e) {}
    quick.value.title = quick.value.excerpt = '';
  } catch (err) {
    console.error('createQuick error', err);
    alert('게시글 생성에 실패했습니다.');
  }
}

</script>

<style scoped>
.post-list { list-style:none; padding:0; display:grid; gap:12px }
.post-card { padding:12px; border:1px solid var(--border); border-radius:6px; background:var(--panel); color:var(--text) }
.meta { color:var(--muted); font-size:13px }
.excerpt { color:var(--text) }
.small-btn { background:transparent; border:1px solid var(--border); padding:4px 8px; border-radius:6px; cursor:pointer }
</style>