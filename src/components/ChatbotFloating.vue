<template>
  <div class="chatbot-widget" :class="{ open: isOpen }" @keydown.esc="close">
    <button class="fab" @click="toggle" :aria-expanded="isOpen" aria-label="Open chat">
      <span class="icon">💬</span>
    </button>

    <div v-show="isOpen" class="panel" ref="panel">
      <header class="panel-header">LocalHub Chat <button class="close" @click="close">✕</button></header>
      <div class="messages" ref="messagesContainer">
        <div v-for="(m,i) in messages" :key="i" :class="['msg', m.from]"
        >
          <template v-if="m.loading">
          <span class="typing">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </template>

            <template v-else>
              {{ m.text }}
            </template>
      </div>
      </div>
      <footer class="composer">
        <input v-model="input" @keyup.enter="send" placeholder="질문을 입력하세요" />
        <button
          @click="send"
          :disabled="loading"
        class="send-btn"
        >
          <SendHorizontal :size="18" />
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref , nextTick } from 'vue'
import { SendHorizontal } from 'lucide-vue-next'

const isOpen = ref(false)
const input = ref('')
const messages = ref([{ from: 'bot', text: '안녕하세요 — 지역 정보를 도와드려요.' }])
const loading = ref(false)
const messagesContainer = ref(null)

async function scrollToBottom() {
  await nextTick()

  if (messagesContainer.value) {
    messagesContainer.value.scrollTop =
      messagesContainer.value.scrollHeight
  }
}

function toggle() {
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}

async function send() {
  if (loading.value) return
  if (!input.value.trim()) return

  loading.value = true
  const userText = input.value
  messages.value.push({ from: 'user', text: userText })
  input.value = ''

  await scrollToBottom()

  messages.value.push({ from: 'bot', loading: true })

  await scrollToBottom()

  const loadingIndex = messages.value.length - 1

  try {
    // 백엔드로 POST 요청 전송
    const response = await fetch('http://127.0.0.1:8000/api/chat', { // 백엔드 주소 확인 필수!
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        history: messages.value,
        message: userText // 백엔드 ChatRequest 모델의 필드명과 일치해야 함
      })
    })

    if (!response.ok) throw new Error('API 응답 실패')

    const data = await response.json()
    // 백엔드 응답(reply)을 챗봇 메시지에 추가
    messages.value[loadingIndex] = {
      from: 'bot',
      text: data.reply
  }
    
    await scrollToBottom()

  } catch (error) {
    console.error('챗봇 에러:', error)
    messages.value[loadingIndex].text =
        "죄송합니다. 서버와 연결할 수 없습니다."
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.chatbot-widget { position: fixed; right: 18px; bottom: 18px; z-index: 1400; display:flex; align-items:flex-end; }
.fab { width:56px; height:56px; border-radius:50%; background:var(--accent); color:var(--bg); border:none; box-shadow:0 8px 20px rgba(0,0,0,.3); cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:20px; position: relative; left: -16px; transition: transform .18s ease; }
.chatbot-widget.open .fab { transform: scale(1.05); }
.panel { width:450px; height:650px; resize: both; background: white;; border-radius:10px; box-shadow:0 12px 40px rgba(0,0,0,.45); margin-right:12px; overflow:auto; display:flex; flex-direction:column; transform-origin:100% 100%; animation: fadeIn .12s ease; }
.panel-header { padding:10px 12px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); color:var(--text); font-weight:600 }
.messages { padding:12px; flex:1; overflow:auto }
.msg { padding:8px 10px; margin-bottom:8px; border-radius:8px; font-size: 16px; max-width:86%; }
.msg.user { background:#bcd3e0; color:var(--text); margin-left:auto }
.msg.bot { background:#becce0; color:var(--text) }
.composer { display:flex; gap:8px; padding:10px; border-top:1px solid var(--border); }
.composer input { flex:1; padding:8px; border-radius:6px; border:1px solid var(--border); font-size: 16px; background:transparent; color:var(--text) }
.composer button { padding:8px 12px; border-radius:6px; border:1px solid var(--accent); background:transparent; color:var(--accent); cursor:pointer }
.close { background:transparent;border:none;color:var(--muted);cursor:pointer }
.typing {
    display: inline-flex;
    gap: 4px;
    align-items: center;
}

.typing span {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: currentColor;
    animation: typing 1.2s infinite;
}

.typing span:nth-child(2) {
    animation-delay: .2s;
}

.typing span:nth-child(3) {
    animation-delay: .4s;
}

.send-btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    border: none;
    background: var(--accent);
    color: rgb(255, 255, 255);

    display: flex;
    align-items: center;
    justify-content: center;

    cursor: pointer;
    transition: .2s;
}

.send-btn:hover:not(:disabled) {
    transform: scale(1.08);
}

.send-btn:disabled {
    opacity: .5;
    cursor: not-allowed;
}

@keyframes typing {
    0%, 80%, 100% {
        transform: scale(.5);
        opacity: .3;
    }

    40% {
        transform: scale(1);
        opacity: .6;
    }
}
@keyframes fadeIn { from { opacity:0; transform: translateY(6px) scale(.98) } to { opacity:1; transform: translateY(0) scale(1) } }
</style>
