<template>
  <div class="location-detail" v-if="item">
    <div class="photo-wrap">
      <img v-if="item.first_image" :src="item.first_image" alt="img" />
    </div>
    <div class="large-title">{{ item.title }}</div>
    <div v-if="item.addr1" class="detail-addr">상세주소: {{ item.addr1 }}</div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import api from '../services/api'

export default {
  props: ['id'],
  setup (props) {
    const item = ref(null)
    const fetch = async () => {
      try {
        const r = await api.get(`/locations/${props.id}`)
        item.value = r.data
      } catch (e) {
        item.value = null
      }
    }

    onMounted(fetch)
    return { item }
  }
}
</script>

<style scoped>
img { max-width:100%; height:auto }
.photo-wrap img { width:100%; height:auto; object-fit:cover }
.large-title { font-size:1.25rem; font-weight:700; margin-top:12px }
.detail-addr { font-size:0.95rem; color:#666; margin-top:6px }
</style>
