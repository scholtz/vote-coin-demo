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
      searchForTransactionsWithNoteAndAmountAndAccount:
        "indexer/searchForTransactionsWithNoteAndAmountAndAccount",
      searchForTokenTransactionsWithNoteAndAmount:
        "indexer/searchForTokenTransactionsWithNoteAndAmount",
      searchForTokenTransactionsWithNoteAndAmountAndAccount:
        "indexer/searchForTokenTransactionsWithNoteAndAmountAndAccount",
      openSuccess: "toast/openSuccess",
      makePayment: "algod/makePayment",
      getTransactionParams: "algod/getTransactionParams",
      waitForConfirmation: "algod/waitForConfirmation",
      axiosGet: "axios/get",
      getAccountBalanceAtRound: "indexer/getAccountBalanceAtRound",
    }),
    async initLoad() {
      try {
        this.loading = true;
        this.params = await this.getTransactionParams();
        let txs = null;
        if (this.isASAVote) {
          txs = await this.searchForTokenTransactionsWithNoteAndAmount({
            note: "avote-question/",
            amount: 702,
            assetId: this.currentToken,
          });
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
    async submitVote(e) {
      e.preventDefault();
      try {
        this.submit = true;
      } catch (exc) {
        this.error = exc;
      }
    },
    async checkResults() {
      this.processingResults = true;
      try {
        // get all answers
        const answersPerAccount = {};
        const search = "avote-vote/v1/" + this.selection.id.substring(0, 10);
        let txs = false;
        if (this.isASAVote) {
          txs = await this.searchForTokenTransactionsWithNoteAndAmount({
            note: search,
            amount: 703,
            assetId: this.currentToken,
          });
        } else {
          txs = await this.searchForTransactionsWithNoteAndAmount({
            note: search,
            amount: 703,
            min: this.params.firstRound - 300000,
          });
        }

        if (txs.transactions) {
          for (let index in txs.transactions) {
            const tx = txs.transactions[index];
            if (!tx["sender"]) continue;
            let note = "";
            if (this.isBase64(tx.note)) {
              note = atob(tx.note);
            }
            const searchWithJ = search + ":j";
            if (!note.startsWith(searchWithJ)) {
              continue;
            }
            note = note.replace(searchWithJ, "");
            console.log("note", note);
            let noteJson = {};
            try {
              noteJson = JSON.parse(note);
            } catch (e) {
              console.log("error parsing", tx);
              continue;
            }

            if (tx["confirmed-round"] > this.max) continue; // do not count any late votes

            const answ = {
              round: tx["confirmed-round"],
              "round-time": tx["round-time"],
              sender: tx["sender"],
              id: tx["id"],
              response: noteJson.a,
            };

            if (answersPerAccount[answ.sender] === undefined) {
              answersPerAccount[answ.sender] = answ;
            } else {
              if (answersPerAccount[answ.sender].round < answ.round)
                answersPerAccount[answ.sender] = answ;
              if (
                answersPerAccount[answ.sender].round == answ.round &&
                answersPerAccount[answ.sender].id > answ.id
              ) {
                answersPerAccount[answ.sender] = answ;
              }
            }
          }
        } else {
          this.processingResults = false;
          console.log("no transactions found");
          return;
        }
        console.log("answersPerAccount", answersPerAccount);
        // calculate whole delegation tree
        const delegationPerAccount = {};
        const searchDeleg = "avote-delegation/v1";

        if (this.isASAVote) {
          txs = await this.searchForTokenTransactionsWithNoteAndAmount({
            note: searchDeleg,
            amount: 701,
            assetId: this.currentToken,
          });
        } else {
          txs = await this.searchForTransactionsWithNoteAndAmount({
            note: searchDeleg,
            amount: 701,
          });
        }

        if (txs && txs.transactions) {
          for (let index in txs.transactions) {
            const tx = txs.transactions[index];
            let note = "";
            if (this.isBase64(tx.note)) {
              note = atob(tx.note);
            }
            const searchDelegWithJ = searchDeleg + ":j";
            if (!note.startsWith(searchDelegWithJ)) {
              continue;
            }
            note = note.replace(searchDelegWithJ, "");
            let noteJson = {};
            try {
              noteJson = JSON.parse(note);
            } catch (e) {
              console.log("error parsing", tx);
              continue;
            }
            let deleg = {};
            if (noteJson.d[this.selection.note.category] !== undefined) {
              deleg = noteJson.d[this.selection.note.category];
            } else if (noteJson.d["any"] !== undefined) {
              deleg = noteJson.d["any"];
            }
            const answ = {
              round: tx["confirmed-round"],
              sender: tx["sender"],
              id: tx["id"],
              d: deleg,
            };

            if (delegationPerAccount[answ.sender] === undefined) {
              delegationPerAccount[answ.sender] = answ;
            } else {
              if (delegationPerAccount[answ.sender].round < answ.round)
                delegationPerAccount[answ.sender] = answ;
              if (
                delegationPerAccount[answ.sender].round == answ.round &&
                delegationPerAccount[answ.sender].id > answ.id
              ) {
                delegationPerAccount[answ.sender] = answ;
              }
            }
          }
        } else {
          console.log("no transactions found");
        }
        console.log("delegationPerAccount", delegationPerAccount);
        const delegationsToAccount = {};
        for (let accFrom in delegationPerAccount) {
          for (let accTo in delegationPerAccount[accFrom].d) {
            if (delegationsToAccount[accTo] === undefined) {
              delegationsToAccount[accTo] = {};
              delegationsToAccount[accTo][accFrom] = true;
            } else {
              delegationsToAccount[accTo][accFrom] = true;
            }
          }
        }
        console.log("delegationsToAccount", delegationsToAccount);
        // first calculation - trusted accounts

        const trusted = await this.getTrustedList();
        // calculate - 1 TL = 1 vote - simple weights
        await this.calculateSTLR(
          trusted,
          answersPerAccount,
          delegationPerAccount,
          delegationsToAccount
        );
        // calculate - 1 TL = 1 vote - quadratic weights
        await this.calculateQTLR(
          trusted,
          answersPerAccount,
          delegationPerAccount,
          delegationsToAccount
        );

        // calculate - 1 algo = 1 vote - simple weights
        await this.calculateSBR(
          answersPerAccount,
          delegationPerAccount,
          delegationsToAccount
        );

        // calculate - 1 algo = 1 vote - quadratic weights
        await this.calculateQBR(
          answersPerAccount,
          delegationPerAccount,
          delegationsToAccount
        );

        // calculate - 1 account = 1 vote - simple weights
        await this.calculateSSAR(
          answersPerAccount,
          delegationPerAccount,
          delegationsToAccount
        );

        // calculate - 1 account = 1 vote - quadratic weights
        await this.calculateQSAR(
          answersPerAccount,
          delegationPerAccount,
          delegationsToAccount
        );

        this.processingResults = false;
      } catch (e) {
        console.log("error:", e);
        this.processingResults = false;
      }
    },
    async calculateSBR(
      answersPerAccount,
      delegationPerAccount,
      delegationsToAccount
    ) {
      const coinResults = {};
      for (let index in this.selection.note.o) {
        coinResults[index] = 0;
      }
      const done = {};
      for (let account in answersPerAccount) {
        if (done[account] !== undefined) continue; // already processed
        let accResult = await this.getAccountResultCoinVote({
          account,
          delegationsToAccount,
          delegationPerAccount,
          answersPerAccount,
          weight: 1,
          voteAccount: account,
          round: this.max,
          depth: 1,
          quadratic: false, // quadratic = false
          normalizeBalanceTo1: false, // 1 coin = 1 vote
        });
        console.log("accResult", account, accResult);
        for (let index in this.selection.note.o) {
          coinResults[index] += accResult[index];
        }
        done[account] = true;
      }

      console.log("coinResults", coinResults);
      this.sbr = {};
      this.sbrSum = 0;
      for (let index in coinResults) {
        this.sbrSum += Math.round(coinResults[index] * 10000) / 10000;
      }
      for (let index in coinResults) {
        this.sbr[index] =
          Math.round((coinResults[index] / this.sbrSum) * 10000) / 100;
      }
      this.sbrSum = Math.round(this.sbrSum * 1000) / 1000;
    },

    async calculateQBR(
      answersPerAccount,
      delegationPerAccount,
      delegationsToAccount
    ) {
      const coinResults = {};
      for (let index in this.selection.note.o) {
        coinResults[index] = 0;
      }
      const done = {};
      for (let account in answersPerAccount) {
        if (done[account] !== undefined) continue; // already processed
        let accResult = await this.getAccountResultCoinVote({
          account,
          delegationsToAccount,
          delegationPerAccount,
          answersPerAccount,
          weight: 1,
          voteAccount: account,
          round: this.max,
          depth: 1,
          quadratic: true, // quadratic = true
          normalizeBalanceTo1: false, // 1 coin = 1 vote
        });
        console.log("accResult", account, accResult);
        for (let index in this.selection.note.o) {
          coinResults[index] += accResult[index];
        }
        done[account] = true;
      }

      console.log("coinResults", coinResults);
      this.qbr = {};
      this.qbrSum = 0;
      for (let index in coinResults) {
        this.qbrSum += Math.round(coinResults[index] * 10000) / 10000;
      }
      for (let index in coinResults) {
        this.qbr[index] =
          Math.round((coinResults[index] / this.qbrSum) * 10000) / 100;
      }
      this.qbrSum = Math.round(this.qbrSum * 1000) / 1000;
    },

    async calculateSSAR(
      answersPerAccount,
      delegationPerAccount,
      delegationsToAccount
    ) {
      const coinResults = {};
      for (let index in this.selection.note.o) {
        coinResults[index] = 0;
      }
      const done = {};
      for (let account in answersPerAccount) {
        if (done[account] !== undefined) continue; // already processed
        let accResult = await this.getAccountResultCoinVote({
          account,
          delegationsToAccount,
          delegationPerAccount,
          answersPerAccount,
          weight: 1,
          voteAccount: account,
          round: this.max,
          depth: 1,
          quadratic: false, // quadratic = false
          normalizeBalanceTo1: true, // 1 account = 1 vote
          debug: true,
        });
        console.log("calculateSSAR", account, accResult, answersPerAccount);
        for (let index in this.selection.note.o) {
          coinResults[index] += accResult[index];
        }
        done[account] = true;
      }

      this.ssar = {};
      this.ssarSum = 0;
      for (let index in coinResults) {
        this.ssarSum += Math.round(coinResults[index] * 10000) / 10000;
      }
      for (let index in coinResults) {
        this.ssar[index] =
          Math.round((coinResults[index] / this.ssarSum) * 10000) / 100;
      }
      this.ssarSum = Math.round(this.ssarSum * 1000) / 1000;
    },

    async calculateQSAR(
      answersPerAccount,
      delegationPerAccount,
      delegationsToAccount
    ) {
      const coinResults = {};
      for (let index in this.selection.note.o) {
        coinResults[index] = 0;
      }
      const done = {};
      for (let account in answersPerAccount) {
        if (done[account] !== undefined) continue; // already processed
        let accResult = await this.getAccountResultCoinVote({
          account,
          delegationsToAccount,
          delegationPerAccount,
          answersPerAccount,
          weight: 1,
          voteAccount: account,
          round: this.max,
          depth: 1,
          quadratic: true, // quadratic = true
          normalizeBalanceTo1: true, // 1 account = 1 vote
        });
        console.log("accResult", account, accResult);
        for (let index in this.selection.note.o) {
          coinResults[index] += accResult[index];
        }
        done[account] = true;
      }

      console.log("coinResults", coinResults);
      this.qsar = {};
      this.qsarSum = 0;
      for (let index in coinResults) {
        this.qsarSum += Math.round(coinResults[index] * 10000) / 10000;
      }
      for (let index in coinResults) {
        this.qsar[index] =
          Math.round((coinResults[index] / this.qsarSum) * 10000) / 100;
      }
      this.qsarSum = Math.round(this.qsarSum * 1000) / 1000;
    },

    async calculateSTLR(
      trusted,
      answersPerAccount,
      delegationPerAccount,
      delegationsToAccount
    ) {
      console.log("trusted", trusted);
      const totalResults = {};
      for (let index in this.selection.note.o) {
        totalResults[index] = 0;
      }
      let done = {};
      for (let account in answersPerAccount) {
        if (done[account] !== undefined) continue; // already processed
        let accResult = this.getAccountResult(
          account,
          delegationsToAccount,
          delegationPerAccount,
          answersPerAccount,
          trusted,
          1,
          account,
          1,
          false
        );
        console.log("accResult", account, accResult);
        for (let index in this.selection.note.o) {
          totalResults[index] += accResult[index];
        }
        done[account] = true;
      }

      console.log("totalResults", totalResults);
      this.stlr = {};
      this.stlrSum = 0;
      for (let index in totalResults) {
        this.stlrSum += Math.round(totalResults[index] * 10000) / 10000;
      }
      for (let index in totalResults) {
        this.stlr[index] =
          Math.round((totalResults[index] / this.stlrSum) * 10000) / 100;
      }
      this.stlrSum = Math.round(this.stlrSum * 1000) / 1000;
    },

    async calculateQTLR(
      trusted,
      answersPerAccount,
      delegationPerAccount,
      delegationsToAccount
    ) {
      console.log("trusted", trusted);
      const totalResults = {};
      for (let index in this.selection.note.o) {
        totalResults[index] = 0;
      }
      let done = {};
      for (let account in answersPerAccount) {
        if (done[account] !== undefined) continue; // already processed
        let accResult = this.getAccountResult(
          account,
          delegationsToAccount,
          delegationPerAccount,
          answersPerAccount,
          trusted,
          1,
          account,
          1,
          true
        );
        console.log("accResult", account, accResult);
        for (let index in this.selection.note.o) {
          totalResults[index] += accResult[index];
        }
        done[account] = true;
      }

      console.log("totalResults", totalResults);
      this.qtlr = {};
      this.qtlrSum = 0;
      for (let index in totalResults) {
        this.qtlrSum += Math.round(totalResults[index] * 10000) / 10000;
      }
      for (let index in totalResults) {
        this.qtlr[index] =
          Math.round((totalResults[index] / this.qtlrSum) * 10000) / 100;
      }
      this.qtlrSum = Math.round(this.qtlrSum * 1000) / 1000;
    },
    getAccountResult(
      account,
      delegationsToAccount,
      delegationPerAccount,
      answersPerAccount,
      trusted,
      weight,
      voteAccount,
      depth,
      quadratic
    ) {
      const r = {};
      for (let index in this.selection.note.o) {
        r[index] = 0;
      }
      let failed = false;
      // count the real vote .. if the account is on the list
      if (quadratic) {
        if (trusted[account] !== undefined) {
          let sum = 0;
          for (let index in this.selection.note.o) {
            sum +=
              answersPerAccount[voteAccount].response[index] *
              answersPerAccount[voteAccount].response[index];
            if (answersPerAccount[voteAccount].response[index] < 0) {
              failed = true;
            }
          }
          if (sum > 0 && !failed) {
            for (let index in this.selection.note.o) {
              r[index] =
                ((answersPerAccount[voteAccount].response[index] *
                  answersPerAccount[voteAccount].response[index]) /
                  sum) *
                weight;
            }
          }
        }
      } else {
        if (trusted[account] !== undefined) {
          let sum = 0;
          for (let index in this.selection.note.o) {
            sum += answersPerAccount[voteAccount].response[index];
            if (answersPerAccount[voteAccount].response[index] < 0) {
              failed = true;
            }
          }
          if (sum > 0 && !failed) {
            for (let index in this.selection.note.o) {
              r[index] =
                (answersPerAccount[voteAccount].response[index] / sum) * weight;
            }
          }
        }
      }
      // check delegations
      if (delegationsToAccount[account] !== undefined) {
        for (let delegFrom in delegationsToAccount[account]) {
          if (answersPerAccount[delegFrom] !== undefined) continue; //the delegated from account voted by it self
          if (delegFrom == account) continue; //self delegation
          let sum = 0;
          console.log(
            "delegationPerAccount[delegFrom] 1",
            delegationPerAccount[delegFrom]
          );
          for (let acc in delegationPerAccount[delegFrom].d) {
            sum += parseInt(delegationPerAccount[delegFrom].d[acc]);
          }
          if (sum == 0) continue;
          let w = (weight * delegationPerAccount[delegFrom].d[account]) / sum;
          console.log("w", w);
          if (isNaN(w)) continue;
          if (w < 0.0001) continue;
          if (depth > 100) continue;
          const delegatedPowerFromOther = this.getAccountResult(
            delegFrom,
            delegationsToAccount,
            delegationPerAccount,
            answersPerAccount,
            trusted,
            w,
            voteAccount,
            depth + 1,
            quadratic
          );
          console.log("delegation", sum, account, delegFrom, w, weight, sum);
          for (let index in this.selection.note.o) {
            r[index] += delegatedPowerFromOther[index];
          }
        }
      }
      return r;
    },
    async getAccountResultCoinVote({
      account,
      delegationsToAccount,
      delegationPerAccount,
      answersPerAccount,
      weight,
      voteAccount,
      round,
      depth,
      quadratic,
      normalizeBalanceTo1,
      debug,
    }) {
      const r = {};
      for (let index in this.selection.note.o) {
        r[index] = 0;
      }
      let failed = false;
      // count the real vote .. if the account is on the list
      let sum = 0;
      let balance = await this.getAccountBalanceAtRound({
        account,
        round,
        assetId: this.currentToken,
      });
      if (normalizeBalanceTo1) {
        if (balance > 0) {
          balance = 1;
        }
      }
      if (debug) {
        console.log("getAccountResultCoinVote", balance);
      }
      if (quadratic) {
        for (let index in this.selection.note.o) {
          sum +=
            answersPerAccount[voteAccount].response[index] *
            answersPerAccount[voteAccount].response[index];
          if (answersPerAccount[voteAccount].response[index] < 0) {
            failed = true;
          }
        }
        if (sum > 0 && !failed) {
          for (let index in this.selection.note.o) {
            r[index] =
              ((answersPerAccount[voteAccount].response[index] *
                answersPerAccount[voteAccount].response[index]) /
                sum) *
              weight *
              balance;
          }
        }
      } else {
        for (let index in this.selection.note.o) {
          sum += answersPerAccount[voteAccount].response[index];
          if (answersPerAccount[voteAccount].response[index] < 0) {
            failed = true;
          }
        }
        if (sum > 0 && !failed) {
          for (let index in this.selection.note.o) {
            r[index] =
              (answersPerAccount[voteAccount].response[index] / sum) *
              weight *
              balance;
          }
        }
      }
      // check delegations
      if (delegationsToAccount[account] !== undefined) {
        if (debug) {
          console.log(
            "delegationsToAccount[account]",
            account,
            delegationsToAccount[account]
          );
        }
        for (let delegFrom in delegationsToAccount[account]) {
          if (debug) {
            console.log("delegFrom", delegFrom);
          }
          if (answersPerAccount[delegFrom] !== undefined) continue; //the delegated from account voted by it self
          if (delegFrom == account) continue; //self delegation
          let sum = 0;
          if (debug) {
            console.log(
              "delegationPerAccount[delegFrom] 2 ",
              delegationPerAccount[delegFrom]
            );
          }
          for (let acc in delegationPerAccount[delegFrom].d) {
            sum += parseInt(delegationPerAccount[delegFrom].d[acc]);
          }
          if (debug) {
            console.log("sum", sum);
          }
          if (sum == 0) continue;
          let w = (weight * delegationPerAccount[delegFrom].d[account]) / sum;
          if (isNaN(w)) continue;
          if (debug) {
            console.log("w", w);
          }
          if (w < 0.0001) continue;
          if (depth > 100) continue;
          const delegatedPowerFromOther = await this.getAccountResultCoinVote({
            account: delegFrom,
            delegationsToAccount,
            delegationPerAccount,
            answersPerAccount,
            weight: w,
            voteAccount,
            round,
            depth: depth + 1,
            quadratic,
            normalizeBalanceTo1,
            debug,
          });
          if (debug) {
            console.log(
              "delegation",
              round,
              sum,
              account,
              delegFrom,
              w,
              weight,
              sum
            );
          }
          for (let index in this.selection.note.o) {
            r[index] += delegatedPowerFromOther[index];
          }
        }
      }
      return r;
    },
    async getTrustedList() {
      const ret = {};
      /*
                const accounts = await this.axiosGet({ url: "/trusted.json" });
        for (let index in accounts) {
          trusted[accounts[index]] = true;
        }*/
      const searchTL = "avote-tl/v1";
      let txs = null;
      if (this.isASAVote) {
        txs = await this.searchForTokenTransactionsWithNoteAndAmountAndAccount({
          note: searchTL,
          amount: 705,
          account: this.selection.sender,
          assetId: this.currentToken,
        });
      } else {
        txs = await this.searchForTransactionsWithNoteAndAmountAndAccount({
          note: searchTL,
          amount: 705,
          account: this.selection.sender,
        });
      }

      if (txs && txs.transactions) {
        for (let index in txs.transactions) {
          const tx = txs.transactions[index];
          if (tx["sender"] != this.selection.sender) continue;
          if (tx["confirmed-block"] > this.max) continue;

          let note = "";
          if (this.isBase64(tx.note)) {
            note = atob(tx.note);
          }
          const searchTLWithJ = searchTL + ":j";
          if (!note.startsWith(searchTLWithJ)) {
            continue;
          }
          note = note.replace(searchTLWithJ, "");
          let noteJson = {};
          try {
            noteJson = JSON.parse(note);
          } catch (e) {
            console.log("error parsing", tx);
            continue;
          }

          if (noteJson.a) {
            for (let index in noteJson.a) {
              ret[noteJson.a[index]] = true;
            }
          }
          if (noteJson.r) {
            for (let index in noteJson.r) {
              if (ret[noteJson.r[index]] !== undefined) {
                delete ret[noteJson.r[index]];
              }
            }
          }
        }
      } else {
        console.log("no transactions found");
      }
      return ret;
    },
  },
};
</script>
