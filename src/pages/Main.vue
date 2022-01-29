<template>
  <PublicLayout>
    <div class="container-fluid">
      <div
        class="
          row
          row-cols-xxl-12
          row-cols-xl-12
          row-cols-lg-6
          row-cols-md-2
          row-cols-sm-1
          row-cols-1
          gx-5
          gy-5
        "
      >
        <div
          v-for="space in $store.state.space.spaces"
          :key="space.asa"
          class="col"
        >
          <div
            class="card p-4"
            @click="
              $router.push(
                `/${$store.state.config.env}/${space.asa}/vote/overview`
              )
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
                  title="Evetns"
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
        </div>
      </div>
    </div>
  </PublicLayout>
</template>

<script>
import PublicLayout from "../layouts/Public.vue";
import { mapActions } from "vuex";
import { RouterLink } from "vue-router";
export default {
  components: {
    PublicLayout,
    RouterLink,
  },
  data() {
    return {
      spaces: [],
    };
  },
  watch: {
    async loaded() {
      if (this.loaded) await this.init();
    },
  },
  computed: {
    loaded() {
      return this.$store.state.config.loaded;
    },
  },
  async created() {},
  async mounted() {
    if (this.loaded) await this.init();
  },
  methods: {
    ...mapActions({
      getSpaces: "space/getSpaces",
      openError: "toast/openError",
      openSuccess: "toast/openSuccess",
    }),
    async init() {
      this.spaces = await this.getSpaces();
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