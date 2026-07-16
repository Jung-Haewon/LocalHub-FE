<template>
  <div class="post-detail" v-if="post">
    <div class="page-container">
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
.post-detail { background: transparent; }

/* 다른 페이지들과 통일된 컨테이너 패턴.
   기존의 width:100vw 강제 breakout(margin-left:50%+translateX) 제거 -->
   화면이 넓어져도 콘텐츠가 무한정 늘어나지 않음 */
.page-container {
  max-width: min(96vw, 1200px);
  margin: 0 auto;
  padding: clamp(1rem, 2vw, 2rem) 1rem 3rem;
}

.breadcrumb { color: #999; font-size: 0.85rem; margin-bottom: 1rem; }

.title-row {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 1.25rem;
}
.post-title { margin: 0; font-size: 1.6rem; color: #1a1a1a; font-weight: 700; }
.meta { color: #888; font-size: 0.85rem; }
.meta .dot { margin: 0 6px; }

.content-box {
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 1.5rem;
  min-height: 280px;
  background: #fff;
}
.content {
  line-height: 1.8;
  color: #222;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.95rem;
}

.actions {
  margin-top: 1.25rem;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
.btn {
  padding: 8px 16px;
  border-radius: 8px;
  background: #e6eefc;
  color: #0b5ed7;
  border: none;
  cursor: pointer;
  text-decoration: none;
  text-align: center;
  font-size: 0.85rem;
  transition: opacity 0.15s;
}
.btn:hover { opacity: 0.85; }
.btn.secondary { background: #f3f4f6; color: #222; }
.btn.danger { background: #ffe9e9; color: #c1121f; }

@media (max-width: 640px) {
  .actions { flex-wrap: wrap; }
  .btn { flex: 1; min-width: 90px; }
}
</style>