<template>
  <div class="location-detail" v-if="item">
    <div class="detail-grid">
      <div class="left">
        <div class="photo-wrap">
          <img v-if="item.first_image" :src="item.first_image" alt="img" @load="onImageLoad" />
          <div v-else class="no-photo">사진 없음</div>
        </div>
      </div>

      <div class="right">
        <div class="large-title">{{ item.title }}</div>
        <div v-if="item.addr1" class="detail-addr">상세주소: {{ item.addr1 }}</div>

        <div id="detail-map" class="detail-map" v-if="hasCoords"></div>
        <div v-else class="no-map-note">지도 좌표가 없습니다.</div>

        <div class="top-controls">
          <button class="btn" @click="goBack">뒤로가기</button>
          <div class="nav-buttons">
            <button class="btn" :disabled="!prevId" @click="goToId(prevId)">이전</button>
            <button class="btn" :disabled="!nextId" @click="goToId(nextId)">다음</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, watch, nextTick } from 'vue'
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
    let mapInstance = null
    let mapLib = null // 'kakao' or 'leaflet'

    const hasCoords = ref(false)
    const loading = ref(false)

    // relayout helper to fix 0x0 map/container issues
    function tryRelayout () {
      try {
        if (!item.value) return
        const lat = parseFloat(item.value.mapy)
        const lng = parseFloat(item.value.mapx)
        if (mapLib === 'kakao' && mapInstance && window.kakao && window.kakao.maps) {
          if (typeof mapInstance.relayout === 'function') {
            mapInstance.relayout()
          }
          mapInstance.setCenter(new window.kakao.maps.LatLng(lat, lng))
        } else if (mapLib === 'leaflet' && mapInstance && window.L) {
          // Leaflet: recalc and keep current zoom
          try { mapInstance.invalidateSize() } catch (e) {}
          const z = (mapInstance.getZoom && typeof mapInstance.getZoom === 'function') ? mapInstance.getZoom() : 13
          mapInstance.setView([lat, lng], z)
        }
      } catch (e) {
        console.warn('map relayout failed', e)
      }
    }

    // image load handler: when left image resizes, ensure map recalculates
    const onImageLoad = () => {
      tryRelayout()
      setTimeout(tryRelayout, 300)
    }

    const fetchItem = async () => {
      loading.value = true
      // 먼저 기존 맵 인스턴스 제거(화면 깨짐 방지)
      clearMap()
      try {
        const params = {}
        const allowed = ['category','q','lat','lon','radius','content_id']
        allowed.forEach(k => { if (route.query[k]) params[k] = route.query[k] })
        const r = await api.get(`/locations/${props.id}`, { params })
        item.value = r.data || null
        prevId.value = (r.data && (r.data.prev_id ?? r.data.prevId)) || null
        nextId.value = (r.data && (r.data.next_id ?? r.data.nextId)) || null
        hasCoords.value = !!(item.value && item.value.mapx && item.value.mapy)
        await nextTick()
        if (hasCoords.value) {
          try { await initInlineMap(); tryRelayout(); setTimeout(tryRelayout, 300) } catch (err) { console.error('initInlineMap failed', err) }
        }
      } catch (err) {
        console.error('fetchItem error', err, err.response?.data)
        item.value = null
        hasCoords.value = false
        prevId.value = null
        nextId.value = null
      } finally {
        loading.value = false
      }
    }

    const clearMap = () => {
      try {
        if (mapLib === 'kakao' && mapInstance && window.kakao && window.kakao.maps) {
          const el = document.getElementById('detail-map')
          if (el) el.innerHTML = ''
        } else if (mapLib === 'leaflet' && mapInstance && window.L) {
          mapInstance.remove()
        }
      } catch (e) { /* ignore */ }
      mapInstance = null
      mapLib = null
    }

    async function initInlineMap () {
      clearMap()
      const lat = parseFloat(item.value.mapy)
      const lng = parseFloat(item.value.mapx)
      if (Number.isNaN(lat) || Number.isNaN(lng)) return

      // Try Kakao first
      if (window.kakao && window.kakao.maps) {
        mapLib = 'kakao'
        const container = document.getElementById('detail-map')
        const options = { center: new window.kakao.maps.LatLng(lat, lng), level: 4 }
        mapInstance = new window.kakao.maps.Map(container, options)
        const marker = new window.kakao.maps.Marker({ position: new window.kakao.maps.LatLng(lat, lng) })
        marker.setMap(mapInstance)
        const content = `<div style="padding:6px"><strong>${escapeHtml(item.value.title || '')}</strong><div style="font-size:12px;color:#666">${escapeHtml(item.value.addr1||'')}</div></div>`
        const infowindow = new window.kakao.maps.InfoWindow({ content })
        infowindow.open(mapInstance, marker)
        tryRelayout()
        setTimeout(tryRelayout, 300)
        return
      }

      // If Kakao not loaded, try to load it and init
      try {
        await loadKakaoScript()
        if (window.kakao && window.kakao.maps) {
          mapLib = 'kakao'
          const container = document.getElementById('detail-map')
          const options = { center: new window.kakao.maps.LatLng(lat, lng), level: 4 }
          mapInstance = new window.kakao.maps.Map(container, options)
          const marker = new window.kakao.maps.Marker({ position: new window.kakao.maps.LatLng(lat, lng) })
          marker.setMap(mapInstance)
          const content = `<div style="padding:6px"><strong>${escapeHtml(item.value.title || '')}</strong><div style="font-size:12px;color:#666">${escapeHtml(item.value.addr1||'')}</div></div>`
          const infowindow = new window.kakao.maps.InfoWindow({ content })
          infowindow.open(mapInstance, marker)
          tryRelayout()
          setTimeout(tryRelayout, 300)
          return
        }
      } catch (e) {
        // fallthrough to leaflet
      }

      // Leaflet fallback
      try {
        await loadLeaflet()
        if (window.L) {
          mapLib = 'leaflet'
          const container = document.getElementById('detail-map')
          container.innerHTML = ''
          mapInstance = window.L.map(container).setView([lat, lng], 13)
          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapInstance)
          const marker = window.L.marker([lat, lng]).addTo(mapInstance)
          marker.bindPopup(`<b>${escapeHtml(item.value.title || '')}</b><br>${escapeHtml(item.value.addr1||'')}`).openPopup()
          tryRelayout()
          setTimeout(tryRelayout, 300)
        }
      } catch (e) {
        // cannot load a map; leave the map div empty
      }
    }

    function loadKakaoScript () {
      return new Promise((resolve, reject) => {
        if (window.kakao && window.kakao.maps) return resolve()
        const key = '0fe4495f4e2a2a7101ed6995ed3e8b0f'
        const src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&libraries=services`
        if (document.querySelector(`script[src^="${src}"]`)) {
          const t = setInterval(() => {
            if (window.kakao && window.kakao.maps) { clearInterval(t); resolve() }
          }, 200)
          setTimeout(() => { clearInterval(t); reject(new Error('kakao load timeout')) }, 5000)
          return
        }
        const s = document.createElement('script')
        s.src = src
        s.onload = () => resolve()
        s.onerror = () => reject(new Error('kakao load error'))
        document.head.appendChild(s)
      })
    }

    function loadLeaflet () {
      return new Promise((resolve, reject) => {
        if (window.L) return resolve()
        if (!document.querySelector('link[data-leaflet-detail]')) {
          const lcss = document.createElement('link')
          lcss.rel = 'stylesheet'
          lcss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          lcss.setAttribute('data-leaflet-detail', 'true')
          document.head.appendChild(lcss)
        }
        if (document.querySelector('script[src*="unpkg.com/leaflet"]')) {
          const t = setInterval(() => {
            if (window.L) { clearInterval(t); resolve() }
          }, 200)
          setTimeout(() => { clearInterval(t); reject(new Error('leaflet load timeout')) }, 5000)
          return
        }
        const ls = document.createElement('script')
        ls.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        ls.onload = () => resolve()
        ls.onerror = () => reject(new Error('leaflet load error'))
        document.head.appendChild(ls)
      })
    }

    function escapeHtml (str) {
      if (!str) return ''
      return String(str).replace(/[&<>"']/g, function (s) {
        return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[s]
      })
    }

    onMounted(fetchItem)
    watch(() => props.id, fetchItem)
    watch(() => route.query, fetchItem, { deep: true })

    const goBack = () => router.back()
    const goToId = async (id) => {
      if (!id) return
      await router.push({ name: 'LocationDetail', params: { id }, query: route.query })
    }

    return { item, prevId, nextId, goBack, goToId, hasCoords, onImageLoad }
  }
}
</script>

<style scoped>
.detail-grid { display:flex; gap:16px; align-items:flex-start; flex-wrap:wrap; }
.left { flex: 1 1 320px; max-width: 480px; }
.right { flex: 1 1 320px; min-width: 320px; }
.photo-wrap img { width:100%; height:auto; object-fit:cover; border-radius:6px }
.no-photo { width:100%; height:240px; display:flex; align-items:center; justify-content:center; background:#f3f3f3; color:#888; border-radius:6px }
.large-title { font-size:1.25rem; font-weight:700; margin-top:0.5rem }
.detail-addr { font-size:0.95rem; color:#666; margin-top:6px }
.detail-map { width:100%; height:300px; margin-top:12px; border-radius:6px; overflow:hidden }
.no-map-note { margin-top:12px; color:#999 }
.top-controls { display:flex; justify-content:space-between; align-items:center; margin-top:12px }
.nav-buttons { display:flex; gap:8px; }
.btn { padding:6px 10px; border-radius:6px; border:1px solid #ddd; background:#fff; cursor:pointer }
.btn:disabled { opacity:0.5; cursor:not-allowed }
</style>