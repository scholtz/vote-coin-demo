<template>
  <MainLayout>
    <VoteMenu current="overview" />
    <h1>{{ $t("voteoverview.title") }}</h1>
    <Question :questionId="questionId" />
  </MainLayout>
</template>

<script>
import MainLayout from "../../layouts/Public.vue";
import VoteMenu from "../../components/VoteMenu.vue";
import Question from "./Question";
import { mapActions } from "vuex";
export default {
  components: {
    MainLayout,
    VoteMenu,
    Question,
  },
  computed: {
    questionId() {
      return this.$route.params.questionId;
    },
  },
  async mounted() {
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