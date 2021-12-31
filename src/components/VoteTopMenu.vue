<template>
  <div class="container-fluid">
    <div v-if="current == 'governance'">
      <h1>Algorand foundation governance</h1>
      <p>
        You can find here set of tools to allow algorand governance management.
        Disclaimer: this is not an official algorand foundation website. This is
        community project that seeks to help better manage governance. Always
        check transactions which it creates.
      </p>
    </div>
    <div v-if="current == 'ams01'">
      <h1>Knowledge based pure democracy voting system</h1>
      <p>
        Knowledge based pure democracy voting system based on Algorand Message
        Standard 1 (<a
          href="https://scholtz.github.io/AMS/AMS-0001/AMS-0001.html"
          target="_blang"
          rel="noreferrer"
          >AMS-0001</a
        >) is set of note field schemas and rules for vote calculation. AWallet
        has implemented this standard as the demo for usage on mainnet, testnet
        or sandbox.
        <a href="https://www.vote-coin.com" target="_blang" rel="noreferrer"
          >Vote Coin</a
        >
        is governance token for this specification and provides auditing
        services.
      </p>
      <a
        class="btn m-2"
        :class="
          this.currentToken == token.assetId ? 'btn-primary' : 'btn-light'
        "
        v-for="token in voteTokens"
        :key="token.assetId"
        @click="
          setToken({ assetId: token.assetId });
          $router.push(
            `/${$store.state.config.env}/${token.assetId}/vote/overview`
          );
        "
        >{{ token.name }}</a
      >
      <a
        class="btn m-2"
        :class="this.showCustom ? 'btn-primary' : 'btn-light'"
        @click="this.showCustom = true"
        >Custom token</a
      >

      <input
        v-if="showCustom"
        v-model="customToken"
        class="form-control m-2"
        @change="setToken({ assetId: this.customToken })"
      />
    </div>
  </div>
</template>

<script>
import { mapActions } from "vuex";
export default {
  data() {
    return { current: "ams01", showCustom: false, customToken: 0 };
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
  },
  mounted() {
    this.customToken = localStorage.getItem("voteToken");
    this.setToken({ assetId: this.customToken });
    if (!this.voteTokens.find((t) => t.assetId == this.customToken))
      this.showCustom = true;
  },
  methods: {
    ...mapActions({
      setToken: "vote/setToken",
    }),
  },
};
</script>