<template>
  <div class="map-page">
    <div id="kakao-map" style="width:100%;height:600px;"></div>
    <div class="map-debug">
      <button @click="addTestMarker">테스트 마커 추가</button>
    </div>
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
        // expose kakao map instance for debugging/test
        window._localhub_map_kakao = map

        // Marker clusterer
        const clusterer = new kakao.maps.MarkerClusterer({ map: map, averageCenter: true, minLevel: 7 })

        // Fetch locations from backend. Category is required by API; prefer route.query but fallback to URL
        const params = { page: 1, size: 1000 }
        const catFromRoute = route && route.query && route.query.category
        const catFromUrl = new URLSearchParams(window.location.search).get('category')
        const categoryVal = catFromRoute || catFromUrl
        if (categoryVal) params.category = categoryVal

        try {
          // Prefer GeoJSON endpoint for large datasets
          let usedGeo = false
          if (params.category) {
            try {
              const gres = await api.get('/locations/geojson', { params: { category: params.category } })
              const geo = gres.data
              if (geo && geo.type === 'FeatureCollection' && geo.features && geo.features.length > 0) {
                const markers = []
                geo.features.forEach(f => {
                  const coords = f.geometry && f.geometry.coordinates
                  if (!coords || coords.length < 2) return
                  const lng = parseFloat(coords[0])
                  const lat = parseFloat(coords[1])
                  if (Number.isNaN(lat) || Number.isNaN(lng)) return
                  const position = new kakao.maps.LatLng(lat, lng)
                  const marker = new kakao.maps.Marker({ position })
                  const props = f.properties || {}
                  const iwContent = `<div style="padding:6px 8px;max-width:220px"><strong>${escapeHtml(props.title||'')}</strong></div>`
                  const infowindow = new kakao.maps.InfoWindow({ content: iwContent })
                  kakao.maps.event.addListener(marker, 'mouseover', () => { infowindow.open(map, marker) })
                  kakao.maps.event.addListener(marker, 'mouseout', () => { infowindow.close() })
                  kakao.maps.event.addListener(marker, 'click', () => {
                    const targetId = props.id || props.content_id
                    router.push({ name: 'LocationDetail', params: { id: targetId } })
                  })
                  markers.push(marker)
                })
                if (markers.length) {
                  clusterer.addMarkers(markers)
                  map.setCenter(markers[0].getPosition())
                }
                usedGeo = true
              }
            } catch (err) {
              console.warn('GeoJSON endpoint error or not available', err)
            }
          }
          if (!usedGeo) {
            if (!params.category) {
              console.warn('No category specified; skipping /api/locations request to avoid 422')
            } else {
              const res = await api.get('/locations', { params })
              const items = res.data.items || []
              console.log('Loaded locations count:', items.length)
              const markers = []
              items.forEach(item => {
                const lat = parseFloat(item.mapy)
                const lng = parseFloat(item.mapx)
                console.log('Kakao item', item.id || item.content_id, 'mapx', item.mapx, 'mapy', item.mapy, 'parsed', lng, lat)
                if (Number.isNaN(lat) || Number.isNaN(lng)) {
                  console.warn('Invalid coords for item', item.id || item.content_id)
                  return
                }
                const position = new kakao.maps.LatLng(lat, lng)
                const marker = new kakao.maps.Marker({ position })
                const iwContent = `<div style="padding:6px 8px;max-width:220px"><strong>${escapeHtml(item.title||'')}</strong></div>`
                const infowindow = new kakao.maps.InfoWindow({ content: iwContent })
                kakao.maps.event.addListener(marker, 'mouseover', () => { infowindow.open(map, marker) })
                kakao.maps.event.addListener(marker, 'mouseout', () => { infowindow.close() })
                kakao.maps.event.addListener(marker, 'click', () => {
                  const targetId = item.id || item.content_id
                  router.push({ name: 'LocationDetail', params: { id: targetId } })
                })
                markers.push(marker)
              })
              if (markers.length > 0) {
                clusterer.addMarkers(markers)
                map.setCenter(markers[0].getPosition())
              } else {
                console.log('No valid markers from backend, showing demo')
              }
            }
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
            const lat = parseFloat(item.mapy)
            const lng = parseFloat(item.mapx)
            const position = new kakao.maps.LatLng(lat, lng)
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
          ls.onload = () => {
            // load markercluster CSS and JS
            if (!document.querySelector('link[data-leaflet-cluster]')) {
              const mcCss1 = document.createElement('link')
              mcCss1.rel = 'stylesheet'
              mcCss1.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css'
              mcCss1.setAttribute('data-leaflet-cluster', 'true')
              document.head.appendChild(mcCss1)
              const mcCss2 = document.createElement('link')
              mcCss2.rel = 'stylesheet'
              mcCss2.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css'
              mcCss2.setAttribute('data-leaflet-cluster', 'true')
              document.head.appendChild(mcCss2)
            }
            const mcs = document.createElement('script')
            mcs.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js'
            mcs.onload = initLeafletMap
            mcs.onerror = () => { console.error('Leaflet markercluster load failed') }
            document.head.appendChild(mcs)
          }
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
          // expose leaflet map instance for debugging/test
          window._localhub_map_leaflet = map
          window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap'
          }).addTo(map)

          const params = { page: 1, size: 1000 }
          const catFromRoute = route && route.query && route.query.category
          const catFromUrl = new URLSearchParams(window.location.search).get('category')
          const categoryVal = catFromRoute || catFromUrl
          if (categoryVal) params.category = categoryVal
          try {
            // Try GeoJSON endpoint first for efficient bulk rendering
            let usedGeo = false
            if (params.category) {
              try {
                const gres = await api.get('/locations/geojson', { params: { category: params.category } })
                const geo = gres.data
                if (geo && geo.type === 'FeatureCollection' && geo.features && geo.features.length > 0) {
                  // use marker cluster group
                  const group = window.L.markerClusterGroup()
                  window.L.geoJSON(geo, {
                    pointToLayer: function (feature, latlng) {
                      return window.L.marker(latlng)
                    },
                    onEachFeature: function (feature, layer) {
                      const p = feature.properties || {}
                      layer.bindPopup(`<b>${escapeHtml(p.title || p.name || '')}</b><br>${escapeHtml(p.addr1 || '')}`)
                      layer.bindTooltip(`${escapeHtml(p.title || p.name || '')}`, { direction: 'top', offset: [0, -8] })
                      layer.on('click', () => {
                        const targetId = p.id || p.content_id
                        router.push({ name: 'LocationDetail', params: { id: targetId } })
                      })
                    }
                  }).addTo(group)
                  map.addLayer(group)
                  if (geo.features.length) {
                    const coords = geo.features[0].geometry.coordinates
                    if (coords && coords.length >= 2) map.setView([coords[1], coords[0]], 12)
                  }
                  usedGeo = true
                }
              } catch (err) {
                console.warn('GeoJSON endpoint not available or failed', err)
              }
            }
            if (!usedGeo) {
              const res = await api.get('/locations', { params })
              const items = res.data.items || []
              console.log('Leaflet loaded locations count:', items.length)
              if (items.length > 0) {
                const group = window.L.markerClusterGroup()
                items.forEach(item => {
                  const lat = parseFloat(item.mapy)
                  const lng = parseFloat(item.mapx)
                  if (Number.isNaN(lat) || Number.isNaN(lng)) return
                  const marker = window.L.marker([lat, lng])
                  marker.bindPopup(`<b>${escapeHtml(item.title)}</b><br>${escapeHtml(item.addr1||'')}`)
                  marker.on('click', () => {
                    const targetId = item.id || item.content_id
                    router.push({ name: 'LocationDetail', params: { id: targetId } })
                  })
                  group.addLayer(marker)
                })
                map.addLayer(group)
                // center on first marker
                const first = items.find(it => it.mapy && it.mapx)
                if (first) map.setView([parseFloat(first.mapy), parseFloat(first.mapx)], 12)
              } else {
                // demo
                const demo = [
                  { id: 1, title: '광화문광장', addr1: '종로구 세종대로', mapx: 126.9769, mapy: 37.5720 },
                  { id: 2, title: '여의도 한강공원', addr1: '영등포구 여의도동', mapx: 126.9247, mapy: 37.5212 }
                ]
                demo.forEach(item => {
                  const m = window.L.marker([item.mapy, item.mapx]).addTo(map)
                  m.bindPopup(`<b>${escapeHtml(item.title)}</b><br>${escapeHtml(item.addr1||'')}`)
                })
              }
            }
          } catch (e) {
            console.error('initLeafletMap error', e)
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
    // debug helper to add a test marker to whichever map is active
    function addTestMarker () {
      try {
        if (window._localhub_map_kakao && window.kakao && window.kakao.maps) {
          const map = window._localhub_map_kakao
          const position = new kakao.maps.LatLng(37.5665, 126.9780)
          const marker = new kakao.maps.Marker({ position })
          marker.setMap(map)
          kakao.maps.event.addListener(marker, 'click', () => { alert('Kakao test marker clicked') })
        } else if (window._localhub_map_leaflet && window.L) {
          const map = window._localhub_map_leaflet
          const m = window.L.marker([37.5665, 126.9780]).addTo(map)
          m.bindPopup('테스트 마커').openPopup()
        } else {
          alert('지도 라이브러리가 로드되지 않았습니다.')
        }
      } catch (e) {
        console.error('addTestMarker error', e)
      }
    }

    return { addTestMarker }
  }
}
</script>

<style scoped>
.map-page { padding: 12px; }
</style>
