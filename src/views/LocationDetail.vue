<template>
  <div class="location-detail" v-if="item">
    <div class="photo-wrap">
      <img v-if="item.first_image" :src="item.first_image" alt="img" />
    </div>
    <div class="large-title">{{ item.title }}</div>
    <div v-if="item.addr1" class="detail-addr">상세주소: {{ item.addr1 }}</div>

    <div class="top-controls">
      <button class="btn" @click="goBack">뒤로가기</button>
      <div class="nav-buttons">
        <button class="btn" :disabled="!prevId" @click="goToId(prevId)">이전</button>
        <button class="btn" :disabled="!nextId" @click="goToId(nextId)">다음</button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../services/api'

export default {
  props: ['id'],
  setup (props) {
    const item = ref(null)
    const prevId = ref(null)
    const nextId = ref(null)
    const router = useRouter()
    const route = useRoute()

    const fetchItem = async () => {
      try {
        const params = {}
        // 전달 가능한 쿼리만 복사
        const allowed = ['category', 'q', 'lat', 'lon', 'radius', 'content_id']
        allowed.forEach(k => {
          if (route.query[k] !== undefined && route.query[k] !== null && route.query[k] !== '') {
            params[k] = route.query[k]
          }
        })
        const r = await api.get(`/locations/${props.id}`, { params })
        item.value = r.data || null
        prevId.value = (r.data && (r.data.prev_id ?? r.data.prevId)) || null
        nextId.value = (r.data && (r.data.next_id ?? r.data.nextId)) || null
      } catch (e) {
        item.value = null
        prevId.value = null
        nextId.value = null
      }
    }

    onMounted(fetchItem)
    watch(() => props.id, fetchItem)
    watch(() => route.query, fetchItem, { deep: true })

    const goBack = () => router.back()
    const goToId = (id) => {
      if (!id) return
      router.push({ name: 'LocationDetail', params: { id } })
    }

    return { item, prevId, nextId, goBack, goToId }
  }
}
</script>

<style scoped>
img { max-width:100%; height:auto }
.photo-wrap img { width:100%; height:auto; object-fit:cover }
.large-title { font-size:1.25rem; font-weight:700; margin-top:12px }
.detail-addr { font-size:0.95rem; color:#666; margin-top:6px }

.top-controls { display:flex; justify-content:space-between; align-items:center; margin-top:12px }
.nav-buttons { display:flex; gap:8px; }
.btn { padding:6px 10px; border-radius:6px; border:1px solid #ddd; background:#fff; cursor:pointer }
.btn:disabled { opacity:0.5; cursor:not-allowed }
</style>