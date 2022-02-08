<template>
  <div
    v-if="space"
    class="card p-4"
    @click="
      $router.push(`/${$store.state.config.env}/${space.asa}/vote/overview`)
    "
  >
    <img
      class="card-img"
      style="max-width: 100px; margin: 0 auto"
      :src="space.iconPath"
      :alt="space.unit"
    />
    <h2 class="text-center mt-4"></h2>
    <RouterLink
      :to="`/${$store.state.config.env}/${space.asa}/vote/overview`"
      class="btn btn-light rounded-pill border border-primary"
      >Join {{ space.name }}</RouterLink
    >
    <div class="mt-3 row sm-text">
      <div class="col">
        <span
          class="
            rounded-pill
            bg-white
            px-2
            py-1
            border border-secondary
            text-nowrap
          "
          title="Events"
        >
          <i class="pi pi-bell sm-text" />
          {{ space.events }}
        </span>
      </div>
      <div class="col text-center">
        <span
          class="
            rounded-pill
            bg-white
            px-2
            py-1
            border border-secondary
            text-nowrap
          "
          title="Votings"
        >
          <i class="pi pi-book sm-text" />
          {{ space.questions }}
        </span>
      </div>
      <div class="col text-end">
        <span
          class="
            rounded-pill
            bg-white
            px-2
            py-1
            border border-secondary
            text-nowrap
          "
          title="Delegations"
        >
          <i class="pi pi-arrow-circle-right sm-text" />
          {{ space.delegations }}
        </span>
      </div>
    </div>
  </div>
</template>
<script>
import { RouterLink } from "vue-router";

export default {
  components: {
    RouterLink,
  },
  props: {
    asa: Number,
  },
  computed: {
    space() {
      return this.$store.state.space.spaces.find((s) => s.asa == this.asa);
    },
  },
};
</script>
<style scoped>
.sm-text {
  font-size: 0.8em;
  color: #999;
}
</style>