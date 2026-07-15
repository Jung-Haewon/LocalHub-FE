<template>
  <header class="header">
    <div class="container">
      <h3><router-link to="/">LocalHub</router-link></h3>
      <nav>
        <router-link to="/posts">게시판</router-link>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.header { background:#fff; border-bottom:1px solid #eee }
.container { display:flex; justify-content:space-between; align-items:center; padding:12px 16px }
nav a { margin-left:12px }
</style>
