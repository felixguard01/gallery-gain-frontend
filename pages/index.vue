<template>
  <div>
    <h1 class="loading" v-if="loading">Loading...</h1>
  </div>
</template>

<script>
export default {
  data() {
    return {
      loading: true
    };
  },

  mounted() {
    setTimeout(() => {
      this.loading = false;
      this.$router.push('/login'); // เรียก push หลังจาก setTimeout
    }, 2000);
  }
};
</script>

<style scoped>
.loading {
  font-size: 2rem;
  text-align: center;
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background-color: #29b6f6;
}
</style>
