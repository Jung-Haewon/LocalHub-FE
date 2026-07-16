<template>
  <div class="location-detail">
    <div class="detail-card">
      <div class="photo-wrap">
        <img v-if="item && item.first_image" :src="item.first_image" alt="img" @load="onImageLoad" />
        <div v-else class="no-photo">사진 없음</div>
        <div v-if="!item && loading" class="loading-overlay">로딩중...</div>
        <button class="back-btn" @click="goBack" aria-label="뒤로가기">
          <span class="back-arrow">&#8592;</span> 뒤로
        </button>
      </div>

      <div class="content">
        <h2 class="large-title">{{ item ? item.title : '' }}</h2>
        <p v-if="item && item.addr1" class="detail-addr">
          <span class="pin">&#128205;</span>{{ item.addr1 }}
        </p>

        <!--
          컨테이너를 계속 유지 (v-show)하고 지도 인스턴스도 재사용함.
          예전엔 이중 초기화 버그 때문에 v-if+key로 매번 새로 만들었지만,
          그 버그는 watcher를 하나로 합쳐서 근본적으로 고쳤기 때문에
          이제는 컨테이너/인스턴스를 재사용해서 이동 속도를 높임.
        -->
        <div
          v-show="hasCoords"
          id="detail-map"
          class="detail-map"
        ></div>

        <div class="nav-controls">
          <button class="nav-btn" :disabled="!prevId" @click="goToId(prevId)">&#8249; 이전</button>
          <span v-if="item && item.index && item.total" class="nav-position">{{ item.index }} / {{ item.total }}</span>
          <button class="nav-btn" :disabled="!nextId" @click="goToId(nextId)">다음 &#8250;</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../services/api'

const KAKAO_APP_KEY = '0fe4495f4e2a2a7101ed6995ed3e8b0f'

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
    let resizeObserver = null // 핵심 수정 2: ResizeObserver로 대체

    const hasCoords = ref(false)
    const loading = ref(false)

    // ---------------------------------------------------------------------
    // 지도 relayout (수동 트리거가 필요한 경우, 예: 이미지 로드 후 레이아웃 변화)
    // ---------------------------------------------------------------------
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
          try { mapInstance.invalidateSize() } catch (e) {}
          const z = (mapInstance.getZoom && typeof mapInstance.getZoom === 'function') ? mapInstance.getZoom() : 13
          mapInstance.setView([lat, lng], z)
        }
      } catch (e) {
        console.warn('map relayout failed', e)
      }
    }

    // 이미지 로드 시점에 좌우 레이아웃이 바뀌므로 relayout 트리거
    // (ResizeObserver가 container 크기 변화는 잡아주지만, 이미지 로드 직후
    //  한 번은 명시적으로 center를 다시 잡아주는 게 안전)
    const onImageLoad = () => {
      tryRelayout()
    }

    // ---------------------------------------------------------------------
    // ResizeObserver: container 크기가 바뀌는 모든 순간(v-if로 새로 나타남,
    // 이미지 로드로 레이아웃 밀림 등)에 자동으로 invalidateSize/relayout 호출
    // 기존의 setTimeout 재시도 로직(doResizeAttempts)을 대체
    // ---------------------------------------------------------------------
    function observeMapContainer (container) {
      disconnectObserver()
      resizeObserver = new ResizeObserver(() => {
        if (!mapInstance) return
        if (mapLib === 'leaflet' && mapInstance.invalidateSize) {
          mapInstance.invalidateSize()
        } else if (mapLib === 'kakao' && mapInstance.relayout) {
          mapInstance.relayout()
        }
      })
      resizeObserver.observe(container)
    }

    function disconnectObserver () {
      if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
      }
    }

    // ---------------------------------------------------------------------
    // 데이터 fetch
    // ---------------------------------------------------------------------
    // fetchToken: 두 watcher가 겹쳐 fetchItem이 중복 호출되거나
    // 버튼을 빠르게 연타할 때, 오래된(stale) 응답이 화면을 덮어쓰는 것을 방지
    let fetchToken = 0

    const fetchItem = async () => {
      const myToken = ++fetchToken

      loading.value = true
      item.value = null       // 이전 데이터 즉시 비우기 -> 로딩 오버레이 즉시 표시, 잔상 방지
      hasCoords.value = false // 좌표 없는 동안은 지도 잠깐 숨김 (v-show, 인스턴스는 유지)

      try {
        const params = {}
        const allowed = ['category', 'q', 'lat', 'lon', 'radius', 'content_id']
        allowed.forEach(k => {
          if (route.query[k] !== undefined && route.query[k] !== null && route.query[k] !== '') {
            params[k] = route.query[k]
          }
        })
        const r = await api.get(`/locations/${props.id}`, { params })

        if (myToken !== fetchToken) return // 이 응답은 이미 stale -> 무시

        item.value = r.data || null
        prevId.value = (r.data && (r.data.prev_id ?? r.data.prevId)) || null
        nextId.value = (r.data && (r.data.next_id ?? r.data.nextId)) || null
        hasCoords.value = !!(item.value && item.value.mapx && item.value.mapy)

        await nextTick() // v-show라도 최초 mount 직후엔 DOM 반영 대기가 안전

        if (myToken !== fetchToken) return // await 도중 또 다른 요청이 시작됐다면 여기서도 중단

        if (hasCoords.value) {
          try {
            await initInlineMap()
          } catch (err) {
            console.error('initInlineMap failed', err)
          }
        }
      } catch (err) {
        if (myToken !== fetchToken) return
        console.error('fetchItem error', err, err.response?.data)
        item.value = null
        hasCoords.value = false
        prevId.value = null
        nextId.value = null
      } finally {
        if (myToken === fetchToken) loading.value = false
      }
    }

    // ---------------------------------------------------------------------
    // 지도 정리 (컴포넌트 unmount 시에만 호출 -> 완전히 파괴)
    // ---------------------------------------------------------------------
    const clearMap = () => {
      disconnectObserver()
      try {
        if (mapLib === 'leaflet' && mapInstance) {
          mapInstance.remove()
        }
        // kakao는 별도 destroy API가 없음 -> 컴포넌트 자체가 unmount되면서 정리됨
      } catch (e) { /* ignore */ }
      mapInstance = null
      mapLib = null
      currentMarker = null
      currentInfowindow = null
    }

    let currentMarker = null
    let currentInfowindow = null // kakao info window (leaflet은 marker.bindPopup 사용)

    function buildPopupHtml () {
      return `<div style="padding:6px"><strong>${escapeHtml(item.value.title || '')}</strong><div style="font-size:12px;color:#666">${escapeHtml(item.value.addr1 || '')}</div></div>`
    }

    // ---------------------------------------------------------------------
    // 지도 초기화 / 갱신
    // 핵심: 매 이동마다 지도를 새로 만들지 않고, 이미 인스턴스가 있으면
    // 위치(center/marker)만 갱신함 -> 타일 재요청/인스턴스 재생성 비용 제거
    // ---------------------------------------------------------------------
    async function initInlineMap () {
      const lat = parseFloat(item.value.mapy)
      const lng = parseFloat(item.value.mapx)
      if (Number.isNaN(lat) || Number.isNaN(lng)) return

      const container = document.getElementById('detail-map')
      if (!container) return

      // 이미 지도 인스턴스가 있으면 위치만 갱신 (훨씬 빠름, 타일 재요청 없음)
      if (mapInstance) {
        updateMapPosition(lat, lng)
        return
      }

      // 최초 1회만 지도 생성
      try {
        if (!(window.kakao && window.kakao.maps)) {
          await loadKakaoScript()
        }
        if (window.kakao && window.kakao.maps) {
          createKakaoMap(container, lat, lng)
          return
        }
      } catch (e) {
        // Kakao 로드 실패 -> Leaflet 폴백
      }

      try {
        if (!window.L) {
          await loadLeaflet()
        }
        if (window.L) {
          createLeafletMap(container, lat, lng)
        }
      } catch (e) {
        console.warn('map load failed (kakao & leaflet both unavailable)', e)
      }
    }

    function updateMapPosition (lat, lng) {
      try {
        if (mapLib === 'kakao' && window.kakao && window.kakao.maps) {
          const pos = new window.kakao.maps.LatLng(lat, lng)
          mapInstance.setCenter(pos)
          if (currentMarker) currentMarker.setPosition(pos)
          if (currentInfowindow && currentMarker) {
            currentInfowindow.setContent(buildPopupHtml())
            currentInfowindow.open(mapInstance, currentMarker)
          }
          if (typeof mapInstance.relayout === 'function') mapInstance.relayout()
        } else if (mapLib === 'leaflet' && window.L) {
          const z = (mapInstance.getZoom && typeof mapInstance.getZoom === 'function') ? mapInstance.getZoom() : 13
          mapInstance.setView([lat, lng], z)
          if (currentMarker) {
            currentMarker.setLatLng([lat, lng])
            currentMarker.bindPopup(buildPopupHtml()).openPopup()
          }
          mapInstance.invalidateSize()
        }
      } catch (e) {
        console.warn('map position update failed', e)
      }
    }

    // 중복 제거: Kakao 지도 생성 로직을 한 곳으로 통합
    function createKakaoMap (container, lat, lng) {
      mapLib = 'kakao'
      const options = { center: new window.kakao.maps.LatLng(lat, lng), level: 4 }
      mapInstance = new window.kakao.maps.Map(container, options)
      currentMarker = new window.kakao.maps.Marker({ position: new window.kakao.maps.LatLng(lat, lng) })
      currentMarker.setMap(mapInstance)
      currentInfowindow = new window.kakao.maps.InfoWindow({ content: buildPopupHtml() })
      currentInfowindow.open(mapInstance, currentMarker)
      observeMapContainer(container)
      tryRelayout()
    }

    function createLeafletMap (container, lat, lng) {
      mapLib = 'leaflet'
      mapInstance = window.L.map(container).setView([lat, lng], 13)
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapInstance)
      currentMarker = window.L.marker([lat, lng]).addTo(mapInstance)
      currentMarker.bindPopup(buildPopupHtml()).openPopup()
      observeMapContainer(container)
      tryRelayout()
    }

    // ---------------------------------------------------------------------
    // 외부 스크립트 로더
    // ---------------------------------------------------------------------
    function loadKakaoScript () {
      return new Promise((resolve, reject) => {
        if (window.kakao && window.kakao.maps) return resolve()
        const src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_APP_KEY}&libraries=services`
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
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[s]
      })
    }

    onMounted(fetchItem)
    onUnmounted(() => {
      clearMap()
    })

    // 핵심 수정: props.id와 route.query를 각각 watch하면 하나의 내비게이션에
    // fetchItem이 두 번(레이스 컨디션) 호출되어 Leaflet의
    // "Map container is already initialized" 에러가 발생함.
    // 하나의 문자열 키로 합쳐서 내비게이션당 딱 1번만 트리거되게 함.
    watch(
      () => `${props.id}::${JSON.stringify(route.query)}`,
      fetchItem
    )

    const goBack = () => router.back()
    const goToId = async (id) => {
      if (!id) return
      await router.push({ name: 'LocationDetail', params: { id }, query: route.query })
    }

    return { item, prevId, nextId, goBack, goToId, hasCoords, onImageLoad, loading }
  }
}
</script>

<style scoped>
.location-detail {
  max-width: min(94vw, 1040px);
  margin: 0 auto;
  padding: clamp(1rem, 2vw, 2rem) 1rem;
}

.detail-card {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e5e5e5;
  overflow: hidden;
}

/* 상단 사진 영역 (모바일: 카드 상단 전체 폭) */
.photo-wrap {
  position: relative;
  width: 100%;
  height: clamp(200px, 32vw, 320px);
  background: #f3f3f3;
  flex-shrink: 0;
}
.photo-wrap img { width: 100%; height: 100%; object-fit: cover; display: block; }
.no-photo {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: #999; font-size: 0.9rem;
}
.loading-overlay {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.85);
  font-weight: 600; color: #555;
}
.back-btn {
  position: absolute; top: 12px; left: 12px;
  display: flex; align-items: center; gap: 4px;
  padding: 6px 12px;
  background: rgba(255,255,255,0.92);
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 0.85rem;
  cursor: pointer;
}
.back-btn:hover { background: #fff; }
.back-arrow { font-size: 0.95rem; }

/* 본문 영역 */
.content {
  padding: clamp(1rem, 2.5vw, 1.75rem);
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}
.large-title {
  margin: 0 0 4px;
  font-size: clamp(1.15rem, 1.6vw, 1.4rem);
  font-weight: 500;
  color: #1a1a1a;
}
.detail-addr {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0 0 1rem;
  font-size: 0.85rem;
  color: #777;
}
.pin { font-size: 0.85rem; }

.detail-map {
  width: 100%;
  flex: 1;
  min-height: 220px;
  border-radius: 8px;
  border: 1px solid #e5e5e5;
  overflow: hidden;
  margin-bottom: 1rem;
}

/* 하단 네비게이션 */
.nav-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #eee;
  padding-top: 1rem;
  margin-top: auto;
}
.nav-btn {
  padding: 8px 14px;
  border-radius: 8px;
  border: 1px solid #ddd;
  background: #fff;
  font-size: 0.85rem;
  cursor: pointer;
}
.nav-btn:hover:not(:disabled) { background: #f7f7f7; }
.nav-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.nav-position { font-size: 0.75rem; color: #999; }

/* 데스크탑: 사진(좌) + 콘텐츠(우) 좌우 배치로 전환해 넓은 화면 여백 활용 */
@media (min-width: 768px) {
  .detail-card {
    display: flex;
    align-items: stretch;
  }
  .photo-wrap {
    width: 42%;
    height: auto;
  }
  .content {
    width: 58%;
  }
  .detail-map {
    min-height: 260px;
  }
}

@media (min-width: 1100px) {
  .photo-wrap { width: 38%; }
  .content { width: 62%; }
}
</style>