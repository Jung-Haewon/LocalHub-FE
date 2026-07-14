<template>
  <div class="chatbot-widget" :class="{open: isOpen}" @keydown.esc="close" tabindex="0">
    <button class="fab" @click="toggle" aria-label="Open chat">💬</button>

    <div v-if="isOpen" class="panel">
      <header>
        <strong>LocalHub Chat</strong>
        <button class="close" @click="close">✕</button>
      </header>
      <div class="messages">
        <div class="msg bot">안녕하세요 — 지역 정보를 도와드려요.</div>
      </div>
      <footer>
        <input v-model="input" @keyup.enter="send" placeholder="질문을 입력하세요" />
        <button @click="send">전송</button>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useEmit } from 'vue'
const isOpen = ref(false)
const input = ref('')

function toggle() {
  isOpen.value = !isOpen.value
}

function close() {
  isOpen.value = false
}

function send() {
  if (!input.value) return
  // For now, just echo locally — backend integration will be done by BE team
  input.value = ''
}

onMounted(() => {
  // accessibility focus
})
</script>

<style scoped>
.chatbot-widget { position:fixed; right:18px; bottom:18px; z-index:1200; }
.fab { width:56px; height:56px; border-radius:50%; background:var(--accent); color:var(--bg); border:none; box-shadow:0 6px 18px rgba(0,0,0,.6); cursor:pointer; font-size:22px }
.panel { width:320px; height:420px; background:var(--panel); border-radius:8px; box-shadow:0 10px 30px rgba(0,0,0,.6); display:flex; flex-direction:column; overflow:hidden; margin-bottom:8px; color:var(--text) }
.panel header { display:flex; justify-content:space-between; align-items:center; padding:10px 12px; background:transparent; border-bottom:1px solid var(--border) }
.messages { padding:12px; flex:1; overflow:auto }
.msg { padding:8px 10px; border-radius:6px; margin-bottom:8px; max-width:82% }
.msg.bot { background:#0f1620; color:var(--text) }
.panel footer { display:flex; gap:8px; padding:10px; border-top:1px solid var(--border) }
.panel input { flex:1; padding:8px 10px; border-radius:6px; border:1px solid var(--border); background:transparent; color:var(--text) }
.panel button { padding:8px 12px; border-radius:6px; border:1px solid var(--accent); background:transparent; color:var(--accent) }
</style>
