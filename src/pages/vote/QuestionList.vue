<template>
  <div>
    <div v-if="submit">
      <QRCode :note="note" :amount="703" :currentToken="currentToken" />
      <button class="btn btn-light" @click="submit = false">Edit</button>
    </div>
    <div v-else-if="submitResult">
      <QRCode
        :note="resultNote"
        :amount="0"
        :currentToken="currentToken"
        :sendTo="questioner"
      />
      <button class="btn btn-light" @click="submitResult = false">Edit</button>
    </div>

    <div v-else>
      <div v-if="loading || error">
        <div v-if="error" class="alert alert-danger">
          {{ error }}
        </div>
        <div v-else>
          <span
            class="spinner-grow spinner-grow-sm"
            role="status"
            aria-hidden="true"
          ></span>
          {{ $t("global.loading") }}
        </div>
      </div>
      <div v-else>
        <DataTable
          v-if="!selection"
          :value="questions"
          responsiveLayout="scroll"
          selectionMode="single"
          v-model:selection="selection"
          :paginator="true"
          :rows="20"
          sortField="round"
          :sortOrder="-1"
          removableSort
        >
          <template #empty>
            {{ $t("votequestionlist.no_questions") }}
          </template>
          <Column
            field="note.t"
            :header="$t('votequestionlist.question_title')"
            :sortable="true"
          ></Column>
          <Column
            field="round"
            :header="$t('votequestionlist.round')"
            :sortable="true"
          ></Column>
          <Column
            field="note.max"
            :header="$t('votequestionlist.maxround')"
            :sortable="true"
          ></Column>
          <Column
            field="round-time"
            :header="$t('votequestionlist.time')"
            :sortable="true"
          >
            <template #body="slotProps">
              <div v-if="slotProps.column.props.field in slotProps.data">
                {{
                  $filters.formatDateTime(
                    slotProps.data[slotProps.column.props.field]
                  )
                }}
              </div>
            </template>
          </Column>
          <Column
            field="note.category"
            :header="$t('votequestionlist.category')"
            :sortable="true"
          ></Column>
          <Column
            field="sender"
            :header="$t('votequestionlist.sender')"
            :sortable="true"
            styleClass="not-show-at-start"
          ></Column>
        </DataTable>
        <div v-if="selection">
          <button
            class="btn btn-xs btn-default btn-outline-primary float-end"
            @click="this.selection = null"
          >
            {{ $t("votequestionlist.list") }}
          </button>
          <Question :questionId="selection.id" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions } from "vuex";
import QRCode from "../../components/QRCode.vue";
import Question from "./Question";
export default {
  components: {
    QRCode,
    Question,
  },
  data() {
    return {
      loading: false,
      selection: null,
      questions: [],
      answers: [],
      results: {},

      sbr: {},
      sbrSum: 0,
      qbr: {},
      qbrSum: 0,
      ssar: {},
      ssarSum: 0,
      qsar: {},
      qsarSum: 0,
      stlr: {},
      stlrSum: 0,
      qtlr: {},
      qtlrSum: 0,

      value2: 3,
      params: null,
      tx: null,
      processing: false,
      confirmedRound: null,
      error: "",
      selectedAnswer: {},
      processingResults: false,
      submit: false,
      submitResult: false,
      useApiData: true,
    };
  },
  watch: {
    async selection() {
      this.results = {};
      if (this.selection && this.selection.note && this.selection.note.o) {
        for (let index in this.selection.note.o) {
          this.results[index] = 0;
        }
      }
    },
    selectedAnswer() {
      if (this.selectedAnswer && this.selectedAnswer.response) {
        this.results = JSON.parse(JSON.stringify(this.selectedAnswer.response));
      }
    },
    sum() {
      if (this.selectedAnswer && this.selectedAnswer.latest) {
        let s = 0;
        for (let index in this.selectedAnswer.response) {
          s += this.selectedAnswer.response[index];
        }
        if (this.sum != s) {
          this.selectedAnswer.latest = false;
        }
      }
    },
    votingFinished() {
      console.log("votingFinished", this.votingFinished);
    },
    currentToken() {
      this.initLoad();
    },
  },
  computed: {
    max() {
      if (!this.selection || !this.selection.note) return 0;
      let max = this.selection.note.max;
      if (this.selection.note.duration) {
        return (
          parseInt(this.selection.round) +
          parseInt(this.selection.note.duration)
        );
      }
      return max;
    },
    votingFinished() {
      return (
        this.params &&
        this.params.firstRound &&
        this.selection &&
        this.selection.note &&
        this.params.firstRound > this.max
      );
    },
    sum() {
      let s = 0;
      for (let index in this.results) {
        s += this.results[index];
      }
      return s;
    },
    canVote() {
      return (
        !this.votingFinished &&
        this.params &&
        this.params.firstRound &&
        this.selection &&
        this.selection.note &&
        this.sum > 0
      );
    },
    note() {
      if (!this.selection) return "";
      if (!this.selection.note) return "";

      const json = {};
      json.q = this.selection.id;
      json.a = this.results;
      return (
        "avote-vote/v1/" +
        this.selection.id.substr(0, 10) +
        ":j" +
        JSON.stringify(json)
      );
    },
    resultNote() {
      if (!this.selection) return "";
      if (!this.selection.note) return "";

      const json = {};
      json.q = this.selection.id;
      json.r = {};
      if (this.sbrSum > 0) json.r.sbr = this.sbr;
      if (this.qbrSum > 0) json.r.qbr = this.qbr;
      if (this.ssarSum > 0) json.r.ssar = this.ssar;
      if (this.qsarSum > 0) json.r.qsar = this.qsar;
      if (this.stlrSum > 0) json.r.stlr = this.stlr;
      if (this.qtlrSum > 0) json.r.qtlr = this.qtlr;
      return (
        "avote-result/v1/" +
        this.selection.id.substr(0, 10) +
        ":j" +
        JSON.stringify(json)
      );
    },
    isASAVote() {
      if (!this.currentToken) return false;
      return parseInt(this.currentToken) > 0;
    },
    currentToken() {
      return this.$store.state.vote.assetId;
    },
    questioner() {
      if (!this.selection) return "";
      return this.selection["sender"];
    },
  },

  async mounted() {
    await this.initLoad();
  },
  methods: {
    ...mapActions({
      searchForTransactionsWithNoteAndAmount:
        "indexer/searchForTransactionsWithNoteAndAmount",
      searchForTokenTransactionsWithNoteAndAmount:
        "indexer/searchForTokenTransactionsWithNoteAndAmount",
      openSuccess: "toast/openSuccess",
      makePayment: "algod/makePayment",
      getTransactionParams: "algod/getTransactionParams",
      waitForConfirmation: "algod/waitForConfirmation",
      axiosGet: "axios/get",
      getAccountBalanceAtRound: "indexer/getAccountBalanceAtRound",
      getSpaceQuestions: "space/getSpaceQuestions",
    }),
    async initLoad() {
      try {
        this.loading = true;
        this.params = await this.getTransactionParams();
        let txs = null;
        if (this.isASAVote) {
          if (this.useApiData) {
            txs = await this.getSpaceQuestions({
              assetId: this.currentToken,
            });
            console.log("txs", txs);
          } else {
            txs = await this.searchForTokenTransactionsWithNoteAndAmount({
              note: "avote-question/",
              amount: 702,
              assetId: this.currentToken,
            });
          }
        } else {
          txs = await this.searchForTransactionsWithNoteAndAmount({
            note: "avote-question/",
            amount: 702,
            min: this.params.firstRound - 300000,
          });
        }
        this.questions = [];
        if (txs && txs.transactions) {
          for (let index in txs.transactions) {
            const tx = txs.transactions[index];
            if (!tx["sender"]) continue;
            if (tx["confirmedRound"])
              tx["confirmed-round"] = tx["confirmedRound"];
            if (tx["roundTime"]) tx["round-time"] = tx["roundTime"];
            let note = "";
            if (this.isBase64(tx.note)) {
              note = atob(tx.note);
            }
            if (note.startsWith("avote-question/v1:j")) {
              note = note.replace("avote-question/v1:j", "");
              const noteJson = JSON.parse(note);
              console.log("noteJson", noteJson);

              this.questions.push({
                round: tx["confirmed-round"],
                "confirmed-round": tx["confirmed-round"],
                "round-time": tx["round-time"],
                sender: tx["sender"],
                id: tx["id"],
                note: noteJson,
              });
            }
            if (note.startsWith("avote-question/v2:j")) {
              note = note.replace("avote-question/v2:j", "");
              const noteJson = JSON.parse(note);
              console.log("noteJson", noteJson);
              noteJson.max =
                parseInt(tx["confirmed-round"]) + parseInt(noteJson.duration);
              this.questions.push({
                round: tx["confirmed-round"],

                "confirmed-round": tx["confirmed-round"],
                "round-time": tx["round-time"],
                sender: tx["sender"],
                id: tx["id"],
                note: noteJson,
              });
            }
          }
        } else {
          this.error = "Error while loading data from the blockchain";
          console.log("no transactions found");
        }
        console.log("txs", txs, this.questions);
        this.loading = false;
      } catch (e) {
        console.log("e", e);
        this.loading = false;
        this.error = e;
      }
    },
    isBase64(str) {
      if (!str) return false;
      if (str.trim() === "") {
        return false;
      }
      try {
        return btoa(atob(str)) == str;
      } catch (err) {
        return false;
      }
    },
  },
};
</script>
