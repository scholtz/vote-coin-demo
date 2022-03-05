<template>
  <div class="d-flex flex-column h-100">
    <slot name="header">
      <Navbar />
    </slot>
    <Toast />
    <div class="container-fluid d-flex flex-column flex-grow-1">
      <div class="row" v-if="token">
        <div class="col-3 d-none d-lg-block"><LeftMenu /></div>
        <div class="col col-lg-9">
          <slot></slot>
        </div>
      </div>
      <div class="row" v-else>
        <div class="col-12">
          <slot></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Toast from "primevue/toast";
import Navbar from "../components/Navbar.vue";
import LeftMenu from "../components/LeftMenu.vue";
import { mapActions } from "vuex";
export default {
  components: {
    Navbar,
    Toast,
    LeftMenu,
  },
  computed: {
    token() {
      return this.$route.params.token;
    },
  },
  created() {
    this.setVM({ _vm: this });
  },
  mounted() {
    this.setVM({ _vm: this });
  },
  methods: {
    ...mapActions({
      setVM: "toast/setVM",
    }),
  },
};
</script>