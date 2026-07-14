<template>
  <div class="post-form">
    <h2>{{ isEdit ? '게시글 수정' : '새 게시글 작성' }}</h2>
    <form @submit.prevent="onSave">
      <label>제목</label>
      <input v-model="form.title" required />

      <label>내용</label>
      <textarea v-model="form.content" rows="6"></textarea>

      <div class="actions">
        <button type="submit">저장</button>
        <button type="button" @click="onCancel">취소</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()
const id = route.params.id
const isEdit = !!id

const form = reactive({ title: '', content: '' })

onMounted(() => {
  const raw = localStorage.getItem('localhub_posts')
  const arr = raw ? JSON.parse(raw) : []
  if (isEdit) {
    const found = arr.find(p => String(p.id) === String(id))
    if (found) {
      form.title = found.title || ''
      form.content = found.content || found.excerpt || ''
    }
  }
})

function onSave() {
  const raw = localStorage.getItem('localhub_posts')
  const arr = raw ? JSON.parse(raw) : []
  if (isEdit) {
    const idx = arr.findIndex(p => String(p.id) === String(id))
      if (idx >= 0) {
      arr[idx] = { ...arr[idx], title: form.title, content: form.content, excerpt: form.content }
    }
    localStorage.setItem('localhub_posts', JSON.stringify(arr))
    router.push({ path: `/posts/${id}` })
  } else {
    const newPost = { id: Date.now(), title: form.title, content: form.content, excerpt: form.content }
    arr.unshift(newPost)
    localStorage.setItem('localhub_posts', JSON.stringify(arr))
    router.push({ path: '/posts' })
  }
}

function onCancel() { router.back() }
</script>

<style scoped>
.post-form { padding:16px; background:var(--panel); border:1px solid var(--border); border-radius:8px; color:var(--text) }
.post-form label { display:block; margin-top:8px; color:var(--muted) }
.post-form input, .post-form textarea { width:100%; padding:8px; margin-top:6px; border-radius:6px; border:1px solid var(--border); background:transparent; color:var(--text) }
.actions { margin-top:12px; display:flex; gap:8px }
.actions button { padding:8px 12px; border-radius:6px; border:1px solid var(--accent); background:transparent; color:var(--accent); cursor:pointer }
</style>
