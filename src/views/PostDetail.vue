<template>
  <div class="post-detail" v-if="post">
    <h2>{{ post.title }}</h2>
    <div class="meta">{{ post.author_nickname }} · {{ post.created_at }}</div>
    <div class="content" v-html="post.content"></div>
    <div class="actions">
      <router-link :to="`/posts/${post.id}/edit`">수정</router-link>
      <button @click="onDelete">삭제</button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
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
      const r = await api.get(`/posts/${props.id}`)
      post.value = r.data
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

    onMounted(fetch)
    return { post, onDelete }
  }
}
</script>

<style scoped>
.meta { color: #666; font-size: 0.9rem }
.actions { margin-top: 12px }
</style>
