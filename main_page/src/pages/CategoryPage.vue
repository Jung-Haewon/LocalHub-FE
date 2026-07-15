<template>
  <div class="category-page">
    <h1>{{ categoryLabel }}</h1>
    <p>이 페이지는 `관광지/맛집/축제·행사`의 데이터 전용입니다. 백엔드에서 별도 DB로 제공됩니다.</p>

    <div class="items-grid">
      <div class="item" v-for="i in items" :key="i.id">
        <h4>{{ i.title }}</h4>
        <p>{{ i.summary }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const category = route.query.category || ''
const categoryLabel = category === 'tour' ? '관광지' : category === 'food' ? '맛집' : category === 'event' ? '축제·행사' : '카테고리'

const items = ref([])

onMounted(async () => {
  // BE에서 카테고리별 데이터를 가져오게 될 예정
  items.value = [
    { id: 1, title: `${categoryLabel} 샘플 1`, summary: '샘플 요약' },
    { id: 2, title: `${categoryLabel} 샘플 2`, summary: '샘플 요약' }
  ]
})
</script>

<style scoped>
.items-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:12px }
.item { padding:12px; border:1px solid var(--border); border-radius:6px; background:var(--panel); color:var(--text) }
</style>
