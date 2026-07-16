<template>
  <div class="post-form">
    <div class="page-container">
      <div class="form-header">
        <h2>{{ isEdit ? '게시글 수정' : '게시글 작성' }}</h2>
      </div>

      <form class="form-card" @submit.prevent="onSubmit">
        <!-- category is handled automatically -->
        <div class="field">
          <label>제목</label>
          <input v-model="form.title" placeholder="제목을 입력하세요" required />
        </div>
        <div class="field">
          <label>본문</label>
          <textarea v-model="form.content" placeholder="내용을 입력하세요" required></textarea>
        </div>
        <div class="field">
          <label>작성자</label>
          <input v-model="form.author_nickname" placeholder="익명" />
        </div>
        <div class="field">
          <label>비밀번호</label>
          <input type="password" v-model="form.password" placeholder="수정/삭제 시 필요합니다" required />
        </div>

        <div class="actions">
          <router-link class="btn secondary" to="/posts">취소</router-link>
          <button type="submit" class="btn">저장</button>
        </div>
      </form>
    </div>
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
.post-form { background: transparent; }

/* 다른 페이지보다 좁게 -> 폼은 한 줄 길이가 너무 길면 오히려 읽기/입력이 불편함 */
.page-container {
  max-width: min(92vw, 720px);
  margin: 0 auto;
  padding: clamp(1rem, 2vw, 2rem) 1rem 3rem;
}

.form-header { margin-bottom: 1.25rem; }
.form-header h2 { margin: 0; font-size: 1.4rem; color: #1a1a1a; }

.form-card {
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 1.5rem;
  background: #fff;
}

.field { margin-bottom: 1.1rem; }
.field label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  color: #444;
}
.field input,
.field textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  box-sizing: border-box;
  transition: border-color 0.15s;
}
.field input:focus,
.field textarea:focus {
  outline: none;
  border-color: #0b5ed7;
}
.field textarea {
  min-height: 260px;
  resize: vertical;
  line-height: 1.6;
}

.actions {
  margin-top: 1.5rem;
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

@media (max-width: 640px) {
  .form-card { padding: 1.1rem; }
  .actions { flex-wrap: wrap; }
  .btn { flex: 1; min-width: 90px; }
}
</style>