<template>
  <div class="container-fluid" v-if="space">
    <h1>{{ space.unit }}</h1>
    <table class="w-100 my-5">
      <tr v-if="space.url">
        <td>Url</td>
        <td>
          <a :href="space.url" target="_blank">{{ space.url }}</a>
        </td>
      </tr>
      <tr v-if="space.asa">
        <td>ASA Id</td>
        <td>
          <a
            :href="`https://explorer.perawallet.app/asset/${space.asa}`"
            target="_blank"
            >{{ space.asa }}</a
          >
        </td>
      </tr>
      <tr v-if="space.unit">
        <td>Unit</td>
        <td>{{ space.unit }}</td>
      </tr>
      <tr v-if="space.decimals">
        <td>Decimals</td>
        <td>{{ space.decimals }}</td>
      </tr>
      <!--
      <tr>
        <td>Verification</td>
        <td>
          <span class="pe-2"
            ><input
              type="checkbox"
              :checked="space.isVerified"
              onclick="return false;"
          /></span>
          <span v-if="space.isVerified">Verified</span
          ><span v-else>Not Verified</span>
        </td>
      </tr>
      -->
    </table>
    <div class="text-center">
      <img :src="space.iconPath" class="w-75" />
    </div>
  </div>
</template>

<script>
import { mapActions } from "vuex";
export default {
  data() {
    return {
      verified: [],
    };
  },
  watch: {
    async loaded() {
      if (this.loaded) await this.init();
    },
  },
  computed: {
    env() {
      return this.$store.state.config.env;
    },
    currentToken() {
      return this.$store.state.vote.assetId;
    },
    voteTokens() {
      return this.$store.state.vote.voteTokens.filter(
        (vt) => vt.env == this.env
      );
    },
    loaded() {
      return this.$store.state.config.loaded;
    },
    space() {
      if (!this.$store.state.space || !this.$store.state.space.spaces)
        return undefined;
      return this.$store.state.space.spaces.find(
        (s) => s.asa == this.currentToken
      );
    },
  },
  mounted() {
    this.customToken = localStorage.getItem("voteToken");
    if (!this.customToken) {
      this.customToken = 452399768;
    }
    this.setToken({ assetId: this.customToken });
    if (!this.voteTokens.find((t) => t.assetId == this.customToken))
      this.showCustom = true;
  },
  methods: {
    ...mapActions({
      setToken: "vote/setToken",
      getSpaces: "space/getSpaces",
    }),
    async init() {
      this.spaces = await this.getSpaces();
    },
  },
};
</script>
