<template>
  <div class="modal-backdrop">
    <div class="modal">
      <h3>비밀번호 입력</h3>
      <input v-model="pwd" type="password" placeholder="비밀번호" />
      <div class="actions">
        <button @click="cancel">취소</button>
        <button @click="confirm">확인</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
export default {
  props: ['resolve'],
  setup(props) {
    const pwd = ref('')
    const confirm = () => { props.resolve(pwd.value); unmount() }
    const cancel = () => { props.resolve(null); unmount() }
    const unmount = () => { /* parent will remove */ }
    return { pwd, confirm, cancel }
  }
}
</script>

<style scoped>
.modal-backdrop { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.4); z-index:3000 }
.modal { background:#fff; padding:16px; border-radius:8px; width:320px }
.actions { display:flex; justify-content:flex-end; gap:8px; margin-top:8px }
</style>
