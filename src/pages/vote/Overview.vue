<template>
  <MainLayout>
    <VoteTopMenu />
    <VoteMenu current="overview" />
    <h1>{{ $t("voteoverview.title") }}</h1>
    <QuestionList />
  </MainLayout>
</template>

<script>
import MainLayout from "../../layouts/Public.vue";
import VoteTopMenu from "../../components/VoteTopMenu.vue";
import VoteMenu from "../../components/VoteMenu.vue";
import QuestionList from "./QuestionList";
import { mapActions } from "vuex";
export default {
  components: {
    MainLayout,
    VoteMenu,
    VoteTopMenu,
    QuestionList,
  },
  async mounted() {
    console.log("this.$route.params.token", this.$route.params.token);
    if (this.$route.params.token) {
      await this.setToken({ assetId: this.$route.params.token });
    }
    if (this.$route.params.env) {
      await this.setEnv({ env: this.$route.params.env });
    }
  },
  methods: {
    ...mapActions({
      setToken: "vote/setToken",
      setEnv: "config/setEnv",
    }),
  },
};
</script>