<template>
  <header class="header">
    <div class="container">
      <router-link to="/" class="brand">
        <svg class="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M12 21s-6-5.686-6-10a6 6 0 0 1 12 0c0 4.314-6 10-6 10z" />
          <circle cx="12" cy="11" r="2.2" />
        </svg>
        <h3>LocalHub</h3>
      </router-link>

      <nav>
        <div class="nav-item" ref="dropdownRef">
          <button
            type="button"
            class="nav-link dropdown-toggle"
            :class="{ 'is-active': isCategoryActive }"
            @click="toggleDropdown"
          >
            카테고리
            <svg class="chevron" :class="{ open: dropdownOpen }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <div class="dropdown-menu" v-show="dropdownOpen">
            <router-link
              v-for="c in quickCategories"
              :key="c.id"
              :to="{ name: 'Category', params: { id: c.id } }"
              class="dropdown-link"
              @click="closeDropdown"
            >{{ c.name }}</router-link>
          </div>
        </div>

        <router-link to="/posts" class="nav-link" :class="{ 'is-active': isPostsActive }">게시판</router-link>
      </nav>
    </div>
  </header>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'

export default {
  name: 'AppHeader',
  setup () {
    const route = useRoute()
    const dropdownOpen = ref(false)
    const dropdownRef = ref(null)

    // 홈 화면에서 쓰는 추천 카테고리 순서와 동일하게 고정 -> 매 페이지마다 /categories를 다시 fetch하지 않음
    const quickCategories = [
      { id: 'tourist_spot', name: '관광지' },
      { id: 'festival', name: '축제/공연/행사' },
      { id: 'accommodation', name: '숙박' },
      { id: 'shopping', name: '쇼핑' },
      { id: 'leports', name: '레포츠' },
      { id: 'culture', name: '문화시설' },
      { id: 'travel_course', name: '서울_여행코스' }
    ]

    const isCategoryActive = computed(() => route.name === 'Category')
    const isPostsActive = computed(() => typeof route.path === 'string' && route.path.startsWith('/posts'))

    const toggleDropdown = () => { dropdownOpen.value = !dropdownOpen.value }
    const closeDropdown = () => { dropdownOpen.value = false }

    const onDocClick = (e) => {
      if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
        dropdownOpen.value = false
      }
    }

    onMounted(() => document.addEventListener('click', onDocClick))
    onUnmounted(() => document.removeEventListener('click', onDocClick))

    return {
      dropdownOpen,
      dropdownRef,
      quickCategories,
      isCategoryActive,
      isPostsActive,
      toggleDropdown,
      closeDropdown
    }
  }
}
</script>

<style scoped>
.header { background:transparent }

.container {
  max-width: min(96vw, 1200px);
  margin: 0 auto;
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding: 16px 1rem;
}

.brand {
  display:flex;
  align-items:center;
  gap:8px;
  text-decoration:none;
  color: var(--primary, #ff6b3d);
}
.brand-icon { width:22px; height:22px; flex-shrink:0 }
.brand h3 { margin:0; color: inherit }

nav { display:flex; align-items:center; gap:20px }

.nav-item { position:relative }

.nav-link {
  background:none;
  border:none;
  padding:0;
  font:inherit;
  cursor:pointer;
  text-decoration:none;
  color: var(--primary, #ff6b3d);
  display:flex;
  align-items:center;
  gap:4px;
  transition: opacity .15s;
}
.nav-link:hover { opacity:0.7 }
.nav-link.is-active { font-weight:700 }

.chevron { width:14px; height:14px; transition: transform .15s }
.chevron.open { transform: rotate(180deg) }

.dropdown-menu {
  position:absolute;
  top:calc(100% + 8px);
  left:0;
  background:#fff;
  border:1px solid var(--border, #eee);
  border-radius:10px;
  box-shadow:0 8px 20px rgba(0,0,0,0.08);
  padding:6px;
  min-width:160px;
  display:flex;
  flex-direction:column;
  z-index:20;
}
.dropdown-link {
  padding:8px 10px;
  border-radius:6px;
  font-size:0.85rem;
  color: var(--text-main, #17212a);
  text-decoration:none;
  white-space:nowrap;
}
.dropdown-link:hover { background: var(--primary-light, #ffe6dc); color: var(--primary, #ff6b3d) }

@media (max-width: 640px) {
  .dropdown-menu { left:auto; right:0 }
}
</style>