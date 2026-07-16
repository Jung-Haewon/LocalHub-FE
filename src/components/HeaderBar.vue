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
.header { background:transparent }
.container { display:flex; justify-content:space-between; align-items:center; padding:8px 0 }
nav a { margin-left:12px }
</style>
