<template>
  <MainLayout>
    <div v-if="submit">
      <QRCode :note="note" :amount="701" :currentToken="currentToken" />
      <button class="btn btn-light" @click="submit = false">Edit</button>
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
        <VoteTopMenu />
        <VoteMenu current="delegate" />
        <h1>{{ $t("votedelegate.title") }}</h1>
        <p>
          {{ $t("votedelegate.intro1") }}
        </p>
        <p>
          {{ $t("votedelegate.intro2") }}
        </p>
        <p>
          {{ $t("votedelegate.intro3") }}
        </p>
        <p>
          {{ $t("votedelegate.intro4") }}
        </p>
        <hr />
        <h2>Your account</h2>
        <p>
          If you want to load your delegation from the blockchain, please enter
          here your account
        </p>
        <input class="form-control" v-model="account" />

        <hr />
        <h2>Delegate account for category</h2>
        <div class="row">
          <div class="col-6">
            <input
              class="form-control"
              v-model="newAcc"
              placeholder="Algorand address"
            />
          </div>
          <div class="col-4">
            <input
              class="form-control"
              v-model="newCategory"
              placeholder="Category - if not filled in, applies to category any"
            />
          </div>
          <div class="col-2">
            <button @click="addDelegation" class="btn btn-primary">
              Delegate
            </button>
          </div>
        </div>
        <hr />
        <div v-for="(delegation, category) in delegations" :key="category">
          <h2 v-if="category == 'any'">
            {{ $t("votedelegate.category_any") }}
          </h2>
          <h2 v-else>{{ category }}</h2>
          <div v-for="(weight, account) in delegation" :key="account">
            <div class="row">
              <div class="col-8">
                <label :for="'A' + category + account">
                  {{ account }}
                </label>
              </div>
              <div class="col-4">
                <InputText
                  :id="'A' + category + account"
                  class="w1"
                  v-model.number="delegation[account]"
                  style="width: 14rem"
                />
                <Slider
                  class="w1"
                  v-model="delegation[account]"
                  style="width: 14rem"
                />
                <div class="m-2">
                  {{
                    $filters.formatPercent(
                      delegation[account] / sum(delegation)
                    )
                  }}
                </div>
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col-2">
              <label :for="'add-' + category">{{
                $t("votedelegate.add_account")
              }}</label>
            </div>
          </div>
        </div>
        <hr />
        <div class="row">
          <div class="col-12">
            <p>
              {{ $t("votedelegate.submit_help") }}
            </p>
            <div class="my-2">
              <code>
                {{ note }}
              </code>
            </div>
            <button
              class="btn btn-primary my-2"
              @click="submitDelegation"
              :disabled="!note || processing"
            >
              Store delegation to the network
            </button>
          </div>
        </div>

        <p v-if="!tx && processing" class="alert alert-primary my-2">
          <span
            class="spinner-grow spinner-grow-sm"
            role="status"
            aria-hidden="true"
          ></span>
          {{ $t("pay.state_sending") }}
        </p>
        <p v-if="tx && !confirmedRound" class="alert alert-primary my-2">
          <span
            class="spinner-grow spinner-grow-sm"
            role="status"
            aria-hidden="true"
          ></span>
          {{ $t("pay.state_sent") }}: {{ tx }}.
          {{ $t("pay.state_waiting_confirm") }}
        </p>
        <p v-if="confirmedRound" class="alert alert-success my-2">
          {{ $t("pay.state_confirmed") }} <b>{{ confirmedRound }}</b
          >. {{ $t("pay.transaction") }}: {{ tx }}.
        </p>
        <p v-if="error" class="alert alert-danger my-2">
          {{ $t("pay.error") }}: {{ error }}
        </p>
      </div>
    </div>
  </MainLayout>
</template>

<script>
import MainLayout from "../../layouts/Public.vue";
import VoteTopMenu from "../../components/VoteTopMenu.vue";
import VoteMenu from "../../components/VoteMenu.vue";
import QRCode from "../../components/QRCode.vue";
import { mapActions } from "vuex";
export default {
  components: {
    MainLayout,
    VoteMenu,
    VoteTopMenu,
    QRCode,
  },
  data() {
    return {
      loading: false,
      delegations: { any: {} },
      newCategory: "",
      params: null,
      tx: null,
      processing: false,
      confirmedRound: null,
      error: "",
      submit: false,
      account: "",
      newAcc: "",
    };
  },
  computed: {
    note() {
      const json = {};
      const d = {};
      for (const category in this.delegations) {
        const delegation = this.delegations[category];
        for (const account in delegation) {
          if (delegation[account] > 0) {
            if (d[category] === undefined) d[category] = {};
            d[category][account] = delegation[account];
          }
        }
      }
      json.d = d;
      return "avote-delegation/v1:j" + JSON.stringify(json);
    },
    isASAVote() {
      if (!this.currentToken) return false;
      return parseInt(this.currentToken) > 0;
    },
    currentToken() {
      return this.$store.state.vote.assetId;
    },
  },
  watch: {
    currentToken() {
      this.loadMyDelegation();
    },
    account() {
      localStorage.setItem("account", this.account);
      this.loadMyDelegation();
    },
  },
  async mounted() {
    await this.loadMyDelegation();
    if (this.$route.params.token) {
      await this.setToken({ assetId: this.$route.params.token });
    }
    if (this.$route.params.env) {
      await this.setEnv({ env: this.$route.params.env });
    }
    this.account = localStorage.getItem("account");
  },
  methods: {
    ...mapActions({
      openSuccess: "toast/openSuccess",
      makePayment: "algod/makePayment",
      getTransactionParams: "algod/getTransactionParams",
      waitForConfirmation: "algod/waitForConfirmation",
      searchForTransactionsWithNoteAndAmountAndAccount:
        "indexer/searchForTransactionsWithNoteAndAmountAndAccount",
      searchForTokenTransactionsWithNoteAndAmountAndAccount:
        "indexer/searchForTokenTransactionsWithNoteAndAmountAndAccount",
      setToken: "vote/setToken",
      setEnv: "config/setEnv",
    }),
    async loadMyDelegation() {
      const search = "avote-delegation/v1";
      this.loading = true;
      let txs = null;
      if (this.isASAVote) {
        txs = await this.searchForTokenTransactionsWithNoteAndAmountAndAccount({
          note: search,
          amount: 701,
          account: "",
          assetId: this.currentToken,
        });
      } else {
        txs = await this.searchForTransactionsWithNoteAndAmountAndAccount({
          note: search,
          amount: 701,
          account: "",
        });
      }
      this.loading = false;
      let latest = null;
      if (txs && txs.transactions) {
        for (let index in txs.transactions) {
          const tx = txs.transactions[index];
          if (tx["sender"] != "x") continue;
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
          console.log("noteJson", noteJson);
          const answ = {
            round: tx["confirmed-round"],
            d: noteJson.d,
          };
          if (!latest) latest = answ;
          if (latest.round < answ.round) latest = answ;
        }
      } else {
        this.error = "Error while loading data from the blockchain";
        console.log("no transactions found");
      }
      console.log("latest", latest);
      if (latest) {
        this.delegations = latest.d;
      }
      console.log("txs", txs, this.questions);
    },
    sum(delegation) {
      if (!delegation) return 0;
      let ret = 0;
      for (let index in delegation) {
        ret += delegation[index];
      }
      return ret;
    },
    addDelegation() {
      let cat = "any";
      if (this.newCategory) cat = this.newCategory;
      if (this.delegations[cat] == undefined) {
        this.delegations[cat] = {};
      }
      this.delegations[cat][this.newAcc] = 100;
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
    async submitDelegation(e) {
      e.preventDefault();
      try {
        this.submit = true;
      } catch (exc) {
        this.error = exc;
      }
    },
  },
};
</script>