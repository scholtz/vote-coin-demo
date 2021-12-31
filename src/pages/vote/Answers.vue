<template>
  <MainLayout>
    <VoteTopMenu />
    <VoteMenu current="answers" />
    <h1>Questions</h1>
    <QuestionList />
  </MainLayout>
</template>

<script>
import MainLayout from "../../layouts/Public.vue";
import VoteMenu from "../../components/VoteMenu.vue";
import VoteTopMenu from "../../components/VoteTopMenu.vue";
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