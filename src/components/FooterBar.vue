<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-main">
        <div class="footer-brand">
          <div class="brand-row">
            <svg class="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 21s-6-5.686-6-10a6 6 0 0 1 12 0c0 4.314-6 10-6 10z" />
              <circle cx="12" cy="11" r="2.2" />
            </svg>
            <span class="brand-name">LocalHub</span>
          </div>
          <p class="brand-desc">서울의 지역 정보를 한 곳에서 — 관광지, 숙박, 쇼핑부터 우리 동네 이야기까지.</p>
        </div>

        <div class="footer-col">
          <h4>바로가기</h4>
          <router-link to="/">홈</router-link>
          <router-link to="/posts">게시판</router-link>
          <router-link :to="{ name: 'Map' }">지도에서 보기</router-link>
        </div>

        <div class="footer-col">
          <h4>카테고리</h4>
          <router-link
            v-for="c in quickCategories"
            :key="c.id"
            :to="{ name: 'Category', params: { id: c.id } }"
          >{{ c.name }}</router-link>
        </div>

        <div class="footer-col">
          <h4>문의</h4>
          <a href="mailto:contact@localhub.example">contact@localhub.example</a>
          <a href="https://github.com/" target="_blank" rel="noopener">GitHub 저장소</a>
        </div>
      </div>

      <div class="footer-bottom">
        <span>© 2026 LocalHub. All rights reserved.</span>
        <span class="notice">본 프로젝트는 학습 목적으로 제작된 실습용 서비스입니다.</span>
      </div>
    </div>
  </footer>
</template>

<script>
export default {
  name: 'AppFooter',
  setup () {
    const quickCategories = [
      { id: 'tourist_spot', name: '관광지' },
      { id: 'festival', name: '축제/공연/행사' },
      { id: 'accommodation', name: '숙박' },
      { id: 'shopping', name: '쇼핑' },
      { id: 'leports', name: '레포츠' },
      { id: 'culture', name: '문화시설' },
      { id: 'travel_course', name: '여행코스' }
    ]
    return { quickCategories }
  }
}
</script>

<style scoped>
.footer {
  margin-top: auto;
  background: #fafafa;
  border-top: 1px solid #eee;
  color: #888;
}

.container {
  max-width: min(96vw, 1200px);
  margin: 0 auto;
  padding: 2.5rem 1rem 1.5rem;
}

.footer-main {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr 1fr;
  gap: 24px;
}

.footer-brand { padding-right: 12px; }
.brand-row { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
.brand-icon { width: 20px; height: 20px; color: var(--primary, #ff6b3d); }
.brand-name { font-weight: 700; font-size: 1rem; color: var(--text-main, #17212a); }
.brand-desc { font-size: 0.85rem; line-height: 1.6; margin: 0; color: #999; }

.footer-col { display: flex; flex-direction: column; gap: 8px; }
.footer-col h4 {
  margin: 0 0 4px;
  font-size: 0.85rem;
  color: var(--text-main, #17212a);
}
.footer-col a {
  font-size: 0.85rem;
  color: #888;
  text-decoration: none;
  transition: color .15s;
}
.footer-col a:hover { color: var(--primary, #ff6b3d); }

.footer-bottom {
  margin-top: 2rem;
  padding-top: 1.25rem;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 0.78rem;
  color: #aaa;
}

@media (max-width: 720px) {
  .footer-main { grid-template-columns: 1fr 1fr; }
  .footer-brand { grid-column: 1 / -1; padding-right: 0; margin-bottom: 8px; }
  .footer-bottom { flex-direction: column; }
}
</style>