<template>
  <router-view />
</template>

<script>
import { mapActions } from "vuex";
import { Buffer } from "buffer";
// @ts-ignore
window.Buffer = Buffer;

// fix old wallet connect library
// @ts-ignore
window.global ||= window;
// fix new wallet connect library
// @ts-ignore
window.process = {
  env: {},
};
export default {
  name: "App",
  async created() {
    await this.getConfig();
  },
  methods: {
    ...mapActions({
      getConfig: "config/getConfig",
    }),
  },
};
</script>

<style>
th,
td {
  vertical-align: top;
}
</style>
