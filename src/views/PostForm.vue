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
import { showToast } from '../components/Toast.vue'

export default {
  setup () {
    const route = useRoute()
    const router = useRouter()
    const isEdit = route.name === 'PostEdit'
    const DEFAULT_CATEGORY = 'community'
    const form = ref({ category: DEFAULT_CATEGORY, title: '', content: '', author_nickname: '', password: '' })

    const load = async () => {
      if (isEdit) {
        const id = route.params.id
        const r = await api.get(`/posts/${id}`)
        // keep server category but don't show UI
        Object.assign(form.value, r.data)
      } else {
        // ensure default category for new posts
        form.value.category = DEFAULT_CATEGORY
      }
    }

    const validate = () => {
      if (!form.value.category) return '카테고리를 선택하세요.'
      if (!form.value.title || form.value.title.trim().length < 1) return '제목을 입력하세요.'
      if (!form.value.content || form.value.content.trim().length < 1) return '본문을 입력하세요.'
      if (!form.value.password || form.value.password.trim().length < 1) return '비밀번호를 입력하세요.'
      return null
    }

    const onSubmit = async () => {
      const err = validate()
      if (err) { showToast(err, 'error'); return }
      try {
        if (isEdit) {
          // include category when updating to avoid removal
          await api.put(`/posts/${route.params.id}`, { title: form.value.title, content: form.value.content, password: form.value.password, category: form.value.category })
          showToast('게시글이 수정되었습니다.', 'success')
          router.push(`/posts/${route.params.id}`)
        } else {
          // ensure category present
          if (!form.value.category) form.value.category = DEFAULT_CATEGORY
          const r = await api.post('/posts', form.value)
          showToast('게시글이 작성되었습니다.', 'success')
          router.push(`/posts/${r.data.id}`)
        }
      } catch (e) {
        showToast(e.response?.data?.detail || e.message || '요청 중 오류가 발생했습니다.', 'error')
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
