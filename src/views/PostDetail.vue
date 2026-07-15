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
      const pwd = prompt('비밀번호를 입력하세요')
      if (!pwd) return
      await api.delete(`/posts/${props.id}`, { data: { password: pwd } })
      router.push('/posts')
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
