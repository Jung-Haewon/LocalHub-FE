<template>
  <div id="app">
    <HeaderBar />
    <router-view />
    <FooterBar />
    <ChatbotFloating />
  </div>
</template>

<script>
import HeaderBar from './components/HeaderBar.vue'
import FooterBar from './components/FooterBar.vue'
import ChatbotFloating from './components/ChatbotFloating.vue'

export default {
  components: { HeaderBar, FooterBar, ChatbotFloating }
}
</script>

<style>
body { margin: 0; font-family: Inter, system-ui, Arial; }
#app { min-height: 100vh; display: flex; flex-direction: column; }
router-view { flex: 1; }
</style>
