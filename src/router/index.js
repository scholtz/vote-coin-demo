import { createWebHistory, createRouter } from "vue-router";
import Privacy from "@/pages/Privacy.vue";
import NotFound from "@/pages/404.vue";
import Main from "@/pages/Main.vue";
import FAQ from "@/pages/FAQ.vue";
import Settings from "@/pages/Settings.vue";
import VoteAsk from "@/pages/vote/Ask.vue";
import VoteOverview from "@/pages/vote/Overview.vue";
import VoteMyQuestions from "@/pages/vote/MyQuestions.vue";
import VoteQuestionCover from "@/pages/vote/QuestionCover.vue";
import VoteDelegate from "@/pages/vote/Delegate.vue";
import VoteAnswers from "@/pages/vote/Answers.vue";
import TrustedList from "@/pages/vote/TrustedList.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Main,
  },
  {
    path: "/privacy-policy",
    name: "Privacy",
    component: Privacy,
  },
  {
    path: "/settings",
    name: "settings",
    component: Settings,
  },
  {
    path: "/faq",
    name: "FAQ",
    component: FAQ,
  },
  {
    path: "/:catchAll(.*)",
    component: NotFound,
  },
  {
    path: "/:env/:token/vote/ask",
    name: "VoteAsk",
    component: VoteAsk,
  },
  {
    path: "/:env/:token/vote/overview",
    name: "VoteOverview",
    component: VoteOverview,
  },
  {
    path: "/:env/:token/question/:questionId",
    name: "VoteQuestionCover",
    component: VoteQuestionCover,
  },
  {
    path: "/:env/:token/vote/my-questions",
    name: "my-questions",
    component: VoteMyQuestions,
  },
  {
    path: "/:env/:token/vote/delegate",
    name: "delegate",
    component: VoteDelegate,
  },
  {
    path: "/:env/:token/vote/answers",
    name: "answers",
    component: VoteAnswers,
  },
  {
    path: "/:env/:token/vote/tl",
    name: "tl",
    component: TrustedList,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
