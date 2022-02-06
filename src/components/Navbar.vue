<template>
  <nav class="navbar navbar-expand-lg navbar-light bg-white">
    <div class="container-fluid">
      <a class="navbar-brand mx-3" href="/" v-if="$store.state.config.LOGO"
        ><img
          :src="$store.state.config.LOGO"
          height="50"
          :alt="$t('navbar.logo')"
        />
        VoteCoin
      </a>
      <a class="navbar-brand" href="/" v-else>{{ $t("navbar.logo") }}</a>

      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarSupportedContent"
        aria-controls="navbarSupportedContent"
        aria-expanded="false"
        :aria-label="$t('navbar.toggle_nav')"
      >
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
          <li class="nav-item active mr-2">
            <a
              class="nav-link"
              href="https://discord.gg/mPW36G6xqn"
              target="_blank"
              ><i class="pi pi-discord" title="The Vote Coin Discord"></i>
            </a>
          </li>
          <li class="nav-item active mr-2">
            <a
              class="nav-link"
              href="https://twitter.com/TheVoteCoin"
              target="_blank"
              ><i class="pi pi-twitter" title="The Vote Coin Twitter"></i>
            </a>
          </li>
          <li class="nav-item active mr-2">
            <a
              class="nav-link"
              href="https://www.facebook.com/TheVoteCoin/"
              target="_blank"
              ><i class="pi pi-facebook" title="The Vote Coin Facebook"></i>
            </a>
          </li>
          <li class="nav-item active mr-2">
            <a
              class="nav-link"
              href="https://www.vote-coin.com/specifications/introduction"
              target="_blank"
              ><i class="pi pi-table" title="The Vote Coin Specifications"></i>
            </a>
          </li>
          <li class="nav-item active mr-2">
            <a
              class="nav-link"
              href="https://app.tinyman.org/#/swap?asset_in=31566704&amp;asset_out=452399768"
              target="_blank"
              ><i class="pi pi-shopping-cart" title="The Vote Coin Discord"></i>
            </a>
          </li>
          <li class="nav-item active">
            <VLink class="nav-link" href="/faq"
              ><i class="pi pi-question-circle" :title="$t('navbar.faq')"></i
            ></VLink>
          </li>
          <li class="nav-item active">
            <VLink class="nav-link" href="/privacy-policy"
              ><i class="pi pi-id-card" :title="$t('navbar.privacy_policy')"></i
            ></VLink>
          </li>
          <li class="nav-item active mr-2">
            <VLink class="nav-link" href="/settings"
              ><i class="pi pi-cog" :title="$t('navbar.settings')"></i>
            </VLink>
          </li>
          <Dropdown
            v-model="$i18n.locale"
            :options="$store.state.config.languages"
            @change="languageUpdated"
            style="min-width: 100px"
          >
            <template #value="slotProps">
              <div v-if="slotProps.value" class="border-dark">
                <img
                  :alt="slotProps.value"
                  class="border-dark"
                  :src="'/flags/3x2/' + slotProps.value + '.svg'"
                  height="15"
                />
                <span class="m-1">{{ slotProps.value }}</span>
              </div>
              <span v-else>
                {{ slotProps.placeholder }}
              </span>
            </template>
            <template #option="slotProps">
              <div class="border-dark">
                <img
                  :alt="slotProps.option"
                  :src="'/flags/3x2/' + slotProps.option + '.svg'"
                  height="15"
                />
                <span class="m-1">{{ slotProps.option }}</span>
              </div>
            </template>
          </Dropdown>
        </ul>
      </div>
    </div>
  </nav>
  <div style="border-top: 1px solid gray" class="mb-2"></div>
</template>
<script>
import VLink from "../components/VLink.vue";

export default {
  components: {
    VLink,
  },
  data() {
    return {};
  },
  methods: {
    languageUpdated() {
      localStorage.setItem("lang", this.$i18n.locale);
    },
  },
};
</script>
