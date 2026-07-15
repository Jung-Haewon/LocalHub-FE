<template>
  <div class="post-form">
    <h2>{{ isEdit ? '게시글 수정' : '게시글 작성' }}</h2>
    <form @submit.prevent="onSubmit">
      <div>
        <label>카테고리</label>
        <input v-model="form.category" required />
      </div>
      <div>
        <label>제목</label>
        <input v-model="form.title" required />
      </div>
      <div>
        <label>본문</label>
        <textarea v-model="form.content" required></textarea>
      </div>
      <div>
        <label>작성자</label>
        <input v-model="form.author_nickname" />
      </div>
      <div>
        <label>비밀번호</label>
        <input type="password" v-model="form.password" required />
      </div>
      <button type="submit">저장</button>
    </form>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import api from '../services/api'
import { useRoute, useRouter } from 'vue-router'

export default {
  setup () {
    const route = useRoute()
    const router = useRouter()
    const isEdit = route.name === 'PostEdit'
    const form = ref({ category: '', title: '', content: '', author_nickname: '', password: '' })

    const load = async () => {
      if (isEdit) {
        const id = route.params.id
        const r = await api.get(`/posts/${id}`)
        Object.assign(form.value, r.data)
      }
    }

    const onSubmit = async () => {
      if (isEdit) {
        await api.put(`/posts/${route.params.id}`, { title: form.value.title, content: form.value.content, password: form.value.password })
        router.push(`/posts/${route.params.id}`)
      } else {
        const r = await api.post('/posts', form.value)
        router.push(`/posts/${r.data.id}`)
      }
    }

    onMounted(load)
    return { form, onSubmit, isEdit }
  }
}
</script>

<style scoped>
form > div { margin-bottom:8px }
button { margin-top:8px }
</style>
