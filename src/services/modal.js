import { createApp, h } from 'vue'
import PasswordModal from '../components/PasswordModal.vue'

export function showPasswordModal() {
  return new Promise((resolve) => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const app = createApp({
      render() { return h(PasswordModal, { resolve: (val) => { resolve(val); app.unmount(); container.remove() } }) }
    })
    app.mount(container)
  })
}
