<template>
  <div class="post-form">
    <h2>{{ isEdit ? '게시글 수정' : '새 게시글 작성' }}</h2>
    <form @submit.prevent="onSave">
      <label>제목</label>
      <input v-model="form.title" required />

      <label>내용</label>
      <textarea v-model="form.content" rows="6"></textarea>

      <label>비밀번호 (삭제/수정용)</label>
      <input v-model="form.password" type="password" placeholder="비밀번호를 입력하세요" />

      <div class="actions">
        <button type="submit" :disabled="saving">{{ saving ? '저장 중...' : '저장' }}</button>
        <button type="button" @click="onCancel">취소</button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '../api'

const router = useRouter()
const route = useRoute()
const id = route.params.id
const isEdit = !!id

const form = reactive({ title: '', content: '', password: '' })
const saving = ref(false)

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

onMounted(async () => {
  if (isEdit) {
    try {
      const res = await api.getPost(id)
      const item = normalizeServerItem(res)
      form.title = item.title || ''
      form.content = item.content || ''
      return
    } catch (err) {
      console.warn('getPost failed, falling back to localStorage', err)
    }

    const raw = window.localStorage.getItem('localhub_posts')
    if (raw) {
      try {
        const arr = JSON.parse(raw)
        const found = arr.find(p => String(p.id) === String(id))
        if (found) {
          form.title = found.title || ''
          form.content = found.content || found.excerpt || ''
        }
      } catch (e) {}
    }
  }
})

async function onSave() {
  saving.value = true
  try {
    if (isEdit) {
      const payload = { title: form.title, content: form.content, password: form.password }
      await api.updatePost(id, payload)
      router.push({ path: `/posts/${id}` })
    } else {
      const payload = {
        category: '',
        title: form.title,
        content: form.content,
        author_nickname: '익명',
        password: form.password
      }
      const created = await api.createPost(payload)
      const item = normalizeServerItem(created)
      try {
        const raw = window.localStorage.getItem('localhub_posts')
        const arr = raw ? JSON.parse(raw) : []
        arr.unshift(item)
        window.localStorage.setItem('localhub_posts', JSON.stringify(arr))
      } catch (e) {}
      router.push({ path: '/posts' })
    }
  } catch (err) {
    console.error('onSave error', err)
    alert('저장 중 오류가 발생했습니다.')
  } finally {
    saving.value = false
  }
}

function onCancel() { router.back() }

async function onSave() {
  console.log('[PostForm] onSave called, isEdit=', isEdit, 'form=', { title: form.title, content: form.content, password: form.password });
  saving.value = true;
  try {
    if (isEdit) {
      const payload = { title: form.title, content: form.content, password: form.password };
      console.log('[PostForm] update payload:', payload);
      const updated = await api.updatePost(id, payload);
      console.log('[PostForm] update response:', updated);
      router.push({ path: `/posts/${id}` });
    } else {
      const payload = { category: '', title: form.title, content: form.content, author_nickname: '익명', password: form.password };
      console.log('[PostForm] create payload:', payload);
      const created = await api.createPost(payload);
      console.log('[PostForm] create response:', created);
      const item = normalizeServerItem(created);
      try {
        const raw = window.localStorage.getItem('localhub_posts');
        const arr = raw ? JSON.parse(raw) : [];
        arr.unshift(item);
        window.localStorage.setItem('localhub_posts', JSON.stringify(arr));
      } catch (e) {}
      router.push({ path: '/posts' });
    }
  } catch (err) {
    console.error('onSave error', err);
    alert('저장 중 오류가 발생했습니다.');
  } finally {
    saving.value = false;
  }
}

</script>

<style scoped>
.post-form { padding:16px; background:var(--panel); border:1px solid var(--border); border-radius:8px; color:var(--text) }
.post-form label { display:block; margin-top:8px; color:var(--muted) }
.post-form input, .post-form textarea { width:100%; padding:8px; margin-top:6px; border-radius:6px; border:1px solid var(--border); background:transparent; color:var(--text) }
.actions { margin-top:12px; display:flex; gap:8px }
.actions button { padding:8px 12px; border-radius:6px; border:1px solid var(--accent); background:transparent; color:var(--accent); cursor:pointer }
</style>