<template>
  <div class="chatbot">
    <button class="float-btn" @click="open = !open">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <rect x="3" y="3" width="18" height="14" rx="2" stroke="white" stroke-width="1.2" fill="none" />
        <circle cx="8" cy="9" r="1" fill="white" />
        <circle cx="16" cy="9" r="1" fill="white" />
        <path d="M7 14c1 1 3 1 5 1s4 0 5-1" stroke="white" stroke-width="1.2" fill="none" stroke-linecap="round" />
      </svg>
    </button>
    <div class="panel" v-if="open">
      <div class="messages">
        <div v-for="(m,i) in messages" :key="i" class="msg">{{ m }}</div>
      </div>
      <form @submit.prevent="send">
        <input v-model="text" placeholder="질문을 입력하세요" />
        <button type="submit">전송</button>
      </form>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import api from '../services/api'

export default {
  setup () {
    const open = ref(false)
    const text = ref('')
    const messages = ref([])

    const send = async () => {
      if (!text.value) return
      messages.value.push('나: ' + text.value)
      const r = await api.post('/chat', { message: text.value, session_id: null })
      messages.value.push('봇: ' + (r.data.reply || '응답 없음'))
      text.value = ''
    }

    return { open, text, messages, send }
  }
}
</script>

<style scoped>
.chatbot { position: fixed; right: 16px; bottom: 16px; z-index: 1000 }
.float-btn { background:#0078ff; color:#fff; border:none; padding:12px; border-radius:999px; display:flex; align-items:center; justify-content:center }
.panel { width:320px; height:420px; background:#fff; box-shadow:0 6px 18px rgba(0,0,0,0.12); margin-top:8px; display:flex; flex-direction:column }
.messages { flex:1; padding:8px; overflow:auto }
form { display:flex; gap:8px; padding:8px }
input { flex:1 }
</style>
