<template>
  <div class="post-detail">
    <h1>{{ post.title }}</h1>
    <p class="meta">{{ post.region }} · 조회수: {{ post.views || 0 }}</p>
    <div class="content">{{ post.content }}</div>
    <div class="detail-actions">
      <button class="edit-btn" @click="onEdit">수정</button>
      <button class="del-btn" @click="onDelete">삭제</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const id = route.params.id
const post = ref({ title: '로딩중...', region: '', content: '' })
const router = useRouter()

onMounted(() => {
  const raw = localStorage.getItem('localhub_posts')
  const arr = raw ? JSON.parse(raw) : []
  const idx = arr.findIndex(p => String(p.id) === String(id))
  if (idx >= 0) {
    // increment views
    arr[idx].views = (Number(arr[idx].views) || 0) + 1
    localStorage.setItem('localhub_posts', JSON.stringify(arr))
    const found = arr[idx]
    post.value = { title: found.title, region: found.region, content: found.content || found.excerpt, views: found.views || 0 }
  } else post.value = { title: `게시물 ${id}`, region: 'A 권역', content: '게시물 내용 예시입니다.' }
})

function onEdit() {
  // require password if post has password
  const raw = localStorage.getItem('localhub_posts')
  const arr = raw ? JSON.parse(raw) : []
  const idx = arr.findIndex(p => String(p.id) === String(id))
  if (idx < 0) return
  const found = arr[idx]
  if (found.password) {
    const pwd = prompt('게시글 비밀번호를 입력하세요 (수정용)')
    if (String(found.password) !== String(pwd)) { alert('비밀번호가 일치하지 않습니다.'); return }
  }
  router.push({ path: `/posts/${id}/edit` })
}

function onDelete() {
  const raw = localStorage.getItem('localhub_posts')
  const arr = raw ? JSON.parse(raw) : []
  const idx = arr.findIndex(p => String(p.id) === String(id))
  if (idx < 0) return
  const found = arr[idx]
  if (found.password) {
    const pwd = prompt('게시글 비밀번호를 입력하세요 (삭제용)')
    if (String(found.password) !== String(pwd)) { alert('비밀번호가 일치하지 않습니다.'); return }
  }
  if (!confirm('정말 삭제하시겠습니까?')) return
  const filtered = arr.filter(x => String(x.id) !== String(id))
  localStorage.setItem('localhub_posts', JSON.stringify(filtered))
  router.push({ path: '/posts' })
}
</script>

<style scoped>
.meta { color:var(--muted) }
.content { margin-top:12px; color:var(--text) }
.edit-btn { margin-top:12px; padding:8px 12px; border-radius:6px; border:1px solid var(--accent); background:transparent; color:var(--accent); cursor:pointer }
</style>
