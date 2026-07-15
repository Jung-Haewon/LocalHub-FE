<template>
  <div class="map-page">
    <div id="kakao-map" style="width:100%;height:600px;"></div>
  </div>
</template>

<script>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../services/api'

export default {
  name: 'MapView',
  setup () {
    const route = useRoute()

    const router = useRouter()

    onMounted(() => {
      // Load Kakao Maps script dynamically
        if (!window.kakao) {
        const s = document.createElement('script')
        s.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=0fe4495f4e2a2a7101ed6995ed3e8b0f&libraries=services,clusterer`;
        s.onload = initMap
        s.onerror = () => { loadLeaflet() }
        document.head.appendChild(s)
      } else {
        initMap()
      }

      async function initMap () {
        const kakao = window.kakao
        const container = document.getElementById('kakao-map')
        const options = { center: new kakao.maps.LatLng(37.5665, 126.9780), level: 8 }
        const map = new kakao.maps.Map(container, options)

        // Marker clusterer
        const clusterer = new kakao.maps.MarkerClusterer({ map: map, averageCenter: true, minLevel: 7 })

        // Fetch locations from backend. If route.query.category present, pass it.
        const params = { page: 1, size: 1000 }
        if (route.query.category) params.category = route.query.category

        try {
          const res = await api.get('/locations', { params })
          const items = res.data.items || []
          const markers = []

          items.forEach(item => {
            const lat = item.mapy
            const lng = item.mapx
            if (!lat || !lng) return
            const position = new kakao.maps.LatLng(lat, lng)
            const marker = new kakao.maps.Marker({ position })

            const content = `<div style="padding:8px;max-width:220px"><strong style="display:block;margin-bottom:6px">${escapeHtml(item.title)}</strong><div style=\"font-size:12px;color:#666;\">${escapeHtml(item.addr1||'')}</div><a href=\"/locations/${item.id}\" style=\"display:inline-block;margin-top:8px;color:#0b69ff;\">상세보기</a></div>`

            // navigate to location detail on marker click using SPA router
            kakao.maps.event.addListener(marker, 'click', () => {
              const targetId = item.id || item.content_id
              router.push({ name: 'LocationDetail', params: { id: targetId } })
            })

            markers.push(marker)
          })

          clusterer.addMarkers(markers)
          // center map to first marker if available
          if (markers.length > 0) {
            const pos = markers[0].getPosition()
            map.setCenter(pos)
          }
        } catch (e) {
          console.error('Failed to load locations, using demo markers', e)
          // fallback demo markers (Seoul sample)
          const demo = [
            { id: 1, title: '광화문광장', addr1: '종로구 세종대로', mapx: 126.9769, mapy: 37.5720, first_image: null },
            { id: 2, title: '여의도 한강공원', addr1: '영등포구 여의도동', mapx: 126.9247, mapy: 37.5212, first_image: null },
            { id: 3, title: '남산서울타워', addr1: '중구 남산공원', mapx: 126.9882, mapy: 37.5512, first_image: null }
          ]
          const markers = []
          demo.forEach(item => {
            const position = new kakao.maps.LatLng(item.mapy, item.mapx)
            const marker = new kakao.maps.Marker({ position })
            const content = `<div style="padding:8px;max-width:220px"><strong style="display:block;margin-bottom:6px">${escapeHtml(item.title)}</strong><div style=\"font-size:12px;color:#666;\">${escapeHtml(item.addr1||'')}</div></div>`
            const infowindow = new kakao.maps.InfoWindow({ content })
            kakao.maps.event.addListener(marker, 'click', () => { infowindow.open(map, marker) })
            markers.push(marker)
          })
          clusterer.addMarkers(markers)
        }
      }

      function loadLeaflet () {
        // load CSS
        if (!document.querySelector('link[data-leaflet]')) {
          const lcss = document.createElement('link')
          lcss.rel = 'stylesheet'
          lcss.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
          lcss.setAttribute('data-leaflet', 'true')
          document.head.appendChild(lcss)
        }
        // load JS
        if (!window.L) {
          const ls = document.createElement('script')
          ls.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
          ls.onload = initLeafletMap
          ls.onerror = () => { console.error('Leaflet load failed') }
          document.head.appendChild(ls)
        } else {
          initLeafletMap()
        }
      }

      async function initLeafletMap () {
        try {
          const container = document.getElementById('kakao-map')
          container.innerHTML = ''
          const map = window.L.map(container).setView([37.5665, 126.9780], 12)
          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
          }).addTo(map)

          const params = { page: 1, size: 1000 }
          if (route.query.category) params.category = route.query.category
          try {
            const res = await api.get('/locations', { params })
            const items = res.data.items || []
            const markers = []
            items.forEach(item => {
              const lat = item.mapy
              const lng = item.mapx
              if (!lat || !lng) return
              const m = window.L.marker([lat, lng]).addTo(map)
              m.bindPopup(`<b>${escapeHtml(item.title)}</b><br>${escapeHtml(item.addr1||'')}`)
              m.on('click', () => {
                const targetId = item.id || item.content_id
                router.push({ name: 'LocationDetail', params: { id: targetId } })
              })
              markers.push(m)
            })
            if (markers.length) map.setView(markers[0].getLatLng(), 12)
          } catch (e) {
            const demo = [
              { id: 1, title: '광화문광장', addr1: '종로구 세종대로', mapx: 126.9769, mapy: 37.5720 },
              { id: 2, title: '여의도 한강공원', addr1: '영등포구 여의도동', mapx: 126.9247, mapy: 37.5212 }
            ]
            demo.forEach(item => {
              const m = window.L.marker([item.mapy, item.mapx]).addTo(map)
              m.bindPopup(`<b>${escapeHtml(item.title)}</b><br>${escapeHtml(item.addr1||'')}`)
            })
          }
        } catch (err) {
          console.error('initLeafletMap error', err)
        }
      }

      function escapeHtml (str) {
        if (!str) return ''
        return String(str).replace(/[&<>"']/g, function (s) {
          return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[s]
        })
      }
    })
    return {}
  }
}
</script>

<style scoped>
.map-page { padding: 12px; }
</style>
