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
        <router-link to="/posts">게시판</router-link>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.header { background:transparent }

/* 다른 페이지들과 동일한 max-width 패턴 -> 헤더와 본문 콘텐츠가 좌우로 정렬됨 */
.container {
  max-width: min(96vw, 1200px);
  margin: 0 auto;
  display:flex;
  justify-content:space-between;
  align-items:center;
  padding: 16px 1rem;
}

/* 아이콘 + 텍스트를 하나의 링크로 묶어서 클릭 영역 확보.
   color를 직접 지정해서 currentColor(아이콘)와 텍스트 색이 항상 일치하도록 함
   -> 전역 스타일에서 h3/a 어디에 색이 걸려있든 상관없이 여기서 확정 */
.brand {
  display:flex;
  align-items:center;
  gap:8px;
  text-decoration:none;
  color: var(--primary, #ff6b3d);
}
.brand-icon {
  width:22px;
  height:22px;
  flex-shrink:0;
}
.brand h3 { margin:0; color: inherit }

nav a { margin-left:12px; text-decoration:none; transition: opacity .15s }
nav a:hover { opacity:0.7 }
</style>