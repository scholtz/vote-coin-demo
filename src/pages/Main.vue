<template>
  <PublicLayout>
    <div class="container-fluid">
      <div class="row">
        <div class="col-9">
          <div class="input-group mb-3">
            <input
              class="form-control"
              v-model="searchText"
              @keyup="searchClick"
            />
            <button
              class="btn btn-outline-secondary"
              type="button"
              id="button-addon2"
              @click="searchClick"
            >
              Search
            </button>
          </div>
        </div>
        <div class="col-3 text-end">
          {{
            Object.values(this.spaces).length +
            Object.values(this.visibleSpaces).length
          }}
          spaces
        </div>
      </div>

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
          v-for="space in visibleSpaces"
          :key="space.asa"
          class="col"
          :ref="`Space${space.asa}`"
        >
          <MainScreenItem :asa="space.asa" />
        </div>
      </div>
    </div>
  </PublicLayout>
</template>

<script>
import PublicLayout from "../layouts/Public.vue";
import { mapActions } from "vuex";
import MainScreenItem from "../components/MainScreenItem.vue";
import slugify from "slugify";
export default {
  components: {
    PublicLayout,
    MainScreenItem,
  },
  data() {
    return {
      visibleSpaces: [],
      spaces: [],
      loading: false,
      searchText: "",
    };
  },
  watch: {
    async loaded() {
      this.getSpaces();
    },
    async storeSpacesLength() {
      if (this.loaded) await this.init();
    },
  },
  computed: {
    loaded() {
      return this.$store.state.config.loaded;
    },
    storeSpacesLength() {
      if (
        !this.loaded ||
        !this.$store.state.space ||
        !this.$store.state.space.spaces
      )
        return 0;
      return this.$store.state.space.spaces.length;
    },
  },

  async mounted() {
    if (this.loaded) await this.init();
  },
  created() {
    window.addEventListener("scroll", this.handleScroll);
  },
  unmounted() {
    window.removeEventListener("scroll", this.handleScroll);
  },
  methods: {
    ...mapActions({
      getSpaces: "space/getSpaces",
      openError: "toast/openError",
      openSuccess: "toast/openSuccess",
    }),
    searchClick(e) {
      e.preventDefault();

      let filteredSpaces = [...this.$store.state.space.spaces];
      const slugSettings = { lower: true, strict: true };
      const slug = slugify(this.searchText, slugSettings);
      if (slug == "") {
        this.visibleSpaces = [];
        this.init();
        return;
      }
      console.log(slug);
      filteredSpaces = filteredSpaces.filter(
        (s) =>
          slugify("" + s.asa).indexOf(slug) >= 0 ||
          slugify(s.name, slugSettings).indexOf(slug) >= 0 ||
          slugify(s.unit, slugSettings).indexOf(slug) >= 0
      );
      console.log("filteredSpaces", filteredSpaces);
      this.spaces = filteredSpaces;
      this.visibleSpaces = [];
      this.fetchData();
    },
    async init() {
      this.spaces = [...this.$store.state.space.spaces];
      this.fetchData();
    },
    pullSpace() {
      const spaceSlice = this.spaces.slice(0, 1);
      const space = spaceSlice[0];
      this.spaces = this.spaces.filter((e) => e.asa !== space.asa);
      return space;
    },
    fetchData() {
      this.loading = true;
      for (var i = 0; i < 6; i++) {
        if (this.spaces.length > 0) {
          this.visibleSpaces.push(this.pullSpace());
        }
      }
      if (this.spaces.length > 0) {
        const that = this;
        setTimeout(() => {
          that.checkLastSpace();
        }, 100);
      }
      this.loading = false;
    },
    checkLastSpace() {
      const last = this.visibleSpaces.at(-1);
      const ref = this.$refs[`Space${last.asa}`].at(0);
      if (ref && this.isScrolledIntoView(ref)) {
        this.fetchData();
      }
    },
    isScrolledIntoView(el) {
      var rect = el.getBoundingClientRect();
      var elemTop = rect.top;
      var elemBottom = rect.bottom;

      // Only completely visible elements return true:
      var isVisible = elemTop >= 0 && elemBottom <= window.innerHeight + 50;
      // Partially visible elements return true:
      //isVisible = elemTop < window.innerHeight && elemBottom >= 0;
      return isVisible;
    },
    handleScroll() {
      this.checkLastSpace();
      // Any code to be executed when the window is scrolled
    },
  },
};
</script>