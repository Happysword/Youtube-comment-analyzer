<template>
  <div>
    <v-container class="expand">
      <v-progress-circular
        :size="200"
        color="blue"
        indeterminate
      ></v-progress-circular>
    </v-container>
  </div>
</template>

<script>
export default {};
</script>

<style scoped>
.expand {
  height: 40vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
