<template>
  <div class="post-detail">
    <h1>{{ post.title }}</h1>
    <p class="meta">{{ post.region }}</p>
    <div class="content">{{ post.content }}</div>
    <button class="edit-btn" @click="onEdit">수정</button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const id = route.params.id
const post = ref({ title: '로딩중...', region: '', content: '' })

onMounted(() => {
  const raw = localStorage.getItem('localhub_posts')
  const arr = raw ? JSON.parse(raw) : []
  const found = arr.find(p => String(p.id) === String(id))
  if (found) post.value = { title: found.title, region: found.region, content: found.content || found.excerpt }
  else post.value = { title: `게시물 ${id}`, region: 'A 권역', content: '게시물 내용 예시입니다.' }
})

function onEdit() { router.push({ path: `/posts/${id}/edit` }) }
</script>

<style scoped>
.meta { color:var(--muted) }
.content { margin-top:12px; color:var(--text) }
.edit-btn { margin-top:12px; padding:8px 12px; border-radius:6px; border:1px solid var(--accent); background:transparent; color:var(--accent); cursor:pointer }
</style>
