<template>
  <div class="toast-root">
    <div v-for="t in toasts" :key="t.id" :class="['toast', t.type]">{{ t.message }}</div>
  </div>
</template>

<script>
import { ref } from 'vue'
const toasts = ref([])
let uid = 1
export function showToast(message, type = 'info', timeout = 3000) {
  const id = uid++
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    const idx = toasts.value.findIndex(x => x.id === id)
    if (idx !== -1) toasts.value.splice(idx, 1)
  }, timeout)
}
export default {
  setup() { return { toasts } }
}
</script>

<style scoped>
.toast-root { position: fixed; right: 16px; bottom: 16px; display:flex; flex-direction:column; gap:8px; z-index:2000 }
.toast { padding:8px 12px; border-radius:6px; color:#fff; box-shadow:0 4px 12px rgba(0,0,0,0.12) }
.toast.info { background:#333 }
.toast.success { background:#2f9e44 }
.toast.error { background:#d00000 }
</style>
