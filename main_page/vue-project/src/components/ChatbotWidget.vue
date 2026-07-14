<template>
  <div class="chatbot-widget">
    <button class="fab" @click="openWindow" aria-label="Open chat">Chat</button>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

function openWindow() {
  const w = 480
  const h = 720
  const left = Math.max(0, (screen.width - w) / 2)
  const top = Math.max(0, (screen.height - h) / 2)
  window.open('/chatbot.html', 'LocalHub Chat', `width=${w},height=${h},left=${left},top=${top},resizable=yes,scrollbars=yes`)
}

onMounted(() => {})
</script>

<style scoped>
.chatbot-widget { position: fixed; right: 18px; bottom: 18px; z-index: 1200; }
.fab { width: 56px; height: 56px; border-radius: 50%; background: var(--accent); color: var(--bg); border: none; box-shadow: 0 6px 18px rgba(0,0,0,.6); cursor: pointer; font-size: 22px; }
</style>
