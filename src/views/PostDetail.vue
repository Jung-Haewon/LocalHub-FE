<template>
  <div class="post-detail container" v-if="post">
    <nav class="breadcrumb">홈 &gt; 게시판 &gt; 게시글 상세</nav>

    <div class="title-row">
      <h1 class="post-title">{{ post.title }}</h1>
      <div class="meta">
        <span class="author">{{ post.author_nickname || '익명' }}</span>
        <span class="dot">·</span>
        <span class="date">{{ formattedDate }}</span>
      </div>
    </div>

    <div class="content-box">
      <div class="content" v-html="post.content"></div>
    </div>

    <div class="actions">
      <router-link class="btn" to="/posts">목록으로</router-link>
      <router-link class="btn secondary" :to="`/posts/${post.id}/edit`">수정</router-link>
      <button class="btn danger" @click="onDelete">삭제</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue'
import api from '../services/api'
import { useRouter } from 'vue-router'
import { showToast } from '../components/Toast.vue'
import { showPasswordModal } from '../services/modal'

export default {
  props: ['id'],
  setup (props) {
    const post = ref(null)
    const router = useRouter()

    const fetch = async () => {
      try {
        const r = await api.get(`/posts/${props.id}`)
        post.value = r.data
      } catch (e) {
        showToast(e.response?.data?.detail || e.message || '게시글을 불러오는 중 오류', 'error')
      }
    }

    const onDelete = async () => {
      const pwd = await showPasswordModal()
      if (!pwd) return
      try {
        await api.delete(`/posts/${props.id}`, { data: { password: pwd } })
        showToast('삭제되었습니다.', 'success')
        router.push('/posts')
      } catch (e) {
        showToast(e.response?.data?.detail || e.message || '삭제 중 오류', 'error')
      }
    }

    const formattedDate = computed(() => {
      if (!post.value || !post.value.created_at) return ''
      let s = post.value.created_at
      if (typeof s !== 'string') return s
      s = s.replace(/\.(\d{3})\d+/, '.$1')
      if (!/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) s = s + 'Z'
      const d = new Date(s)
      if (isNaN(d)) return post.value.created_at
      const yy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      const hh = String(d.getHours()).padStart(2, '0')
      const min = String(d.getMinutes()).padStart(2, '0')
      return `${yy}-${mm}-${dd} ${hh}:${min}`
    })

    onMounted(fetch)
    return { post, onDelete, formattedDate }
  }
}
</script>

<style scoped>
.breadcrumb { color: var(--color-muted); font-size:0.95rem; margin-bottom:14px }
.title-row { display:flex; flex-direction:column; align-items:flex-start; gap:8px; width:calc(100vw - 120px); margin-left:50%; transform:translateX(-50%); box-sizing:border-box }
.post-title { margin:0; font-size:2rem; color:var(--color-primary); font-weight:700 }
.meta { color: var(--color-muted); font-size:0.9rem }
.meta .dot { margin: 0 6px }
.category { font-size:0.9rem; color:var(--color-secondary); margin-top:6px }
.content-box { border:1px solid var(--card-border); padding:22px; border-radius:10px; min-height:360px; background:#fff; margin-top:14px; width:calc(100vw - 120px); max-width:none; margin-left:50%; transform:translateX(-50%); box-sizing:border-box; max-height:calc(100vh - 220px); overflow:auto }
.content { line-height:1.9; color:#222; white-space:pre-wrap; word-break:break-word }
.actions { margin-top:16px; display:flex; gap:10px; justify-content:flex-end; width:calc(100vw - 120px); margin-left:50%; transform:translateX(-50%); box-sizing:border-box }

@media (max-width: 1200px) {
  .title-row, .content-box, .actions { width:100%; transform:none; margin-left:0 }
}
.btn { padding:8px 14px; border-radius:6px; background:#e6eefc; color:#0b5ed7; border:none; cursor:pointer; text-decoration:none; text-align:center }
.btn.secondary { background:#f3f4f6; color:#222 }
.btn.danger { background:#ffe9e9; color:#c1121f }
</style>
