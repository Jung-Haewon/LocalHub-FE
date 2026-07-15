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
import { ref, onMounted, watch, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../services/api'

export default {
  props: ['id'],
  setup (props) {
    const item = ref(null)
    const list = ref([])
    const router = useRouter()
    const route = useRoute()

    const fetchItem = async () => {
      try {
        const r = await api.get(`/locations/${props.id}`)
        item.value = r.data
      } catch (e) {
        item.value = null
      }
    }

    const fetchList = async () => {
      try {
        const params = {}
        if (route.query.category) params.category = route.query.category
        const r = await api.get('/locations', { params })
        list.value = Array.isArray(r.data) ? r.data : []
      } catch (e) {
        list.value = []
      }
    }

    onMounted(async () => {
      await Promise.all([fetchItem(), fetchList()])
    })

    watch(() => props.id, async () => {
      await fetchItem()
    })

    const currentIndex = computed(() => {
      return list.value.findIndex(i => String(i.id) === String(props.id) || String(i.content_id) === String(props.id))
    })

    const prevId = computed(() => {
      const idx = currentIndex.value
      return idx > 0 ? (list.value[idx - 1].id || list.value[idx - 1].content_id) : null
    })

    const nextId = computed(() => {
      const idx = currentIndex.value
      return (idx >= 0 && idx < list.value.length - 1) ? (list.value[idx + 1].id || list.value[idx + 1].content_id) : null
    })

    const goBack = () => router.back()
    const goToId = (id) => {
      if (!id) return
      router.push({ name: 'LocationDetail', params: { id } })
    }

    return { item, goBack, prevId, nextId, goToId }
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