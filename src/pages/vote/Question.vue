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
      <div v-if="loading || error || !$t">
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
        <div v-if="selection && this.selection.note">
          <table class="w-100">
            <tr>
              <th>{{ $t("votequestionlist.id") }}:</th>
              <td>{{ this.selection["id"] }}</td>
            </tr>
            <tr v-if="debug">
              <th>{{ $t("votequestionlist.round") }}:</th>
              <td>{{ this.selection.round }}</td>
            </tr>
            <tr v-if="this.selection && this.selection.note">
              <th>{{ $t("votequestionlist.maxround") }}:</th>
              <td>{{ this.max }}</td>
            </tr>
            <tr v-if="debug && this.params">
              <th>{{ $t("votequestionlist.current_round") }}:</th>
              <td>{{ this.params.firstRound }}</td>
            </tr>
            <tr>
              <th>{{ $t("votequestionlist.round_time") }}:</th>
              <td>
                {{ $filters.formatDateTime(this.selection["round-time"]) }}
              </td>
            </tr>
            <tr>
              <th>Estimated end time:</th>
              <td>
                <div>{{ $filters.formatDateTime(this.endTime) }}</div>
                <div>
                  <Countdown
                    class="text-start"
                    :deadlineISO="this.endTimeIso"
                  />
                </div>
              </td>
            </tr>
            <tr>
              <th>{{ $t("votequestionlist.sender") }}:</th>
              <td>{{ this.selection["sender"] }}</td>
            </tr>
            <tr v-if="this.selection.note">
              <th>{{ $t("votequestionlist.question_title") }}:</th>
              <td>{{ this.selection.note.t }}</td>
            </tr>
            <tr v-if="this.selection.note">
              <th>{{ $t("votequestionlist.question_text") }}:</th>
              <td>
                <pre>{{ this.selection.note.q }}</pre>
              </td>
            </tr>
            <tr>
              <th>{{ $t("votequestionlist.category") }}:</th>
              <td>{{ this.selection.note["category"] }}</td>
            </tr>
            <tr>
              <th>{{ $t("votequestionlist.url") }}:</th>
              <td>{{ this.selection.note["url"] }}</td>
            </tr>
            <tr
              v-if="
                this.selection && this.selection.note && this.selection.note.o
              "
            >
              <th>{{ $t("votequestionlist.options") }}:</th>
              <td>
                <div v-for="(o, index) in this.selection.note.o" :key="index">
                  <div class="row">
                    <div class="col-3">
                      <label :for="'R' + index">
                        {{ o }}
                      </label>
                    </div>
                    <div
                      class="col-9"
                      v-if="
                        !votingFinished ||
                        (selectedAnswer && selectedAnswer.latest)
                      "
                    >
                      <InputText
                        :id="'R' + index"
                        class="w1"
                        v-model.number="results[index]"
                        style="width: 14rem"
                        :disabled="votingFinished"
                      />
                      <Slider
                        class="w1"
                        v-model="results[index]"
                        style="width: 14rem"
                        :disabled="votingFinished"
                      />
                      <div class="m-2">
                        {{ $filters.formatPercent(results[index] / sum) }}
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <th></th>
              <td>
                <div v-if="votingFinished" class="alert alert-danger">
                  {{ $t("votequestionlist.voting_closed") }}
                </div>
                <div
                  v-if="selectedAnswer && selectedAnswer.latest"
                  class="alert alert-success"
                >
                  {{
                    $t("votequestionlist.latest_response", {
                      accountName: "",
                    })
                  }}
                </div>

                <div
                  class="alert"
                  :class="encryptVoteCast ? 'alert-success' : 'alert-danger'"
                  v-if="!votingFinished && this.selection.note.e"
                >
                  <div class="p-field-checkbox">
                    <Checkbox
                      id="encryptVoteCast"
                      name="encryptVoteCast"
                      :binary="true"
                      v-model="encryptVoteCast"
                    />
                    &nbsp;
                    <label for="encryptVoteCast">
                      {{ $t("votequestionlist.encryptVoteCast") }}</label
                    >
                  </div>
                </div>
                <div
                  v-if="
                    !votingFinished && this.selection.note.e && encryptVoteCast
                  "
                  class="my-2"
                >
                  <div v-if="false">
                    <label for="mnemonicsTest"
                      >Test decode using mnemonics</label
                    >
                    <input
                      id="mnemonicsTest"
                      class="form-control"
                      v-model="mnemonics"
                    />
                  </div>
                </div>

                <button
                  v-if="!votingFinished"
                  class="btn btn-primary bg-primary"
                  :disabled="
                    !canVote ||
                    processing ||
                    (selectedAnswer && selectedAnswer.latest)
                  "
                  @click="submitVote"
                >
                  {{
                    $t("votequestionlist.vote_button", {
                      accountName: "",
                    })
                  }}
                </button>
                <div
                  v-if="
                    votingFinished &&
                    selection &&
                    selection.note &&
                    selection.note.e
                  "
                  class="my-3"
                >
                  {{ $t("votequestionlist.mnemonics_required_to_get_results") }}
                  <Password
                    class="w-100 pr-2"
                    v-model="mnemonics"
                    :feedback="false"
                    toggleMask
                    inputClass="w-100 pr-2"
                  />
                </div>
                <button
                  v-if="votingFinished"
                  class="btn btn-primary bg-primary my-3"
                  @click="checkResults"
                >
                  <span
                    v-if="processingResults"
                    class="spinner-grow spinner-grow-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  {{ $t("votequestionlist.check_results") }}
                </button>
                <div
                  v-if="
                    Object.values(sbr).length > 0 &&
                    selection &&
                    selection.note &&
                    selection.note.o &&
                    Object.values(selection.note.o).length > 0
                  "
                >
                  <div v-if="Object.values(sbr).length > 0">
                    <h2>{{ $t("votequestionlist.sbr") }}</h2>
                    {{ $t("votequestionlist.sbr_sum") }}:
                    {{
                      $filters.formatCurrency(
                        sbrSum,
                        asset["unit-name"],
                        asset.decimals
                      )
                    }}
                    <div
                      v-for="(o, index) in this.selection.note.o"
                      :key="index"
                    >
                      <div class="row">
                        <div class="col-3">
                          <label :for="'R1-' + index">
                            {{ o }} ({{ index }})
                          </label>
                        </div>
                        <div class="col-9">
                          <InputText
                            :id="'R1-' + index"
                            class="w1"
                            v-model.number="sbr[index]"
                            style="width: 14rem"
                            :disabled="true"
                          />
                          <Slider
                            class="w1"
                            v-model="sbr[index]"
                            style="width: 14rem"
                            :disabled="true"
                          />
                          <div class="m-2">
                            {{ $filters.formatPercent(sbr[index] / 100) }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-if="Object.values(qbr).length > 0">
                    <h2>{{ $t("votequestionlist.qbr") }}</h2>
                    {{ $t("votequestionlist.qbr_sum") }}:
                    {{
                      $filters.formatCurrency(
                        qbrSum,
                        asset["unit-name"],
                        asset.decimals
                      )
                    }}
                    <div
                      v-for="(o, index) in this.selection.note.o"
                      :key="index"
                    >
                      <div class="row">
                        <div class="col-3">
                          <label :for="'R1-' + index">
                            {{ o }} ({{ index }})
                          </label>
                        </div>
                        <div class="col-9">
                          <InputText
                            :id="'R1-' + index"
                            class="w1"
                            v-model.number="qbr[index]"
                            style="width: 14rem"
                            :disabled="true"
                          />
                          <Slider
                            class="w1"
                            v-model="qbr[index]"
                            style="width: 14rem"
                            :disabled="true"
                          />
                          <div class="m-2">
                            {{ $filters.formatPercent(qbr[index] / 100) }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-if="Object.values(ssar).length > 0">
                    <h2>{{ $t("votequestionlist.ssar") }}</h2>
                    {{ $t("votequestionlist.ssar_sum") }}:
                    {{ ssarSum }}
                    <div
                      v-for="(o, index) in this.selection.note.o"
                      :key="index"
                    >
                      <div class="row">
                        <div class="col-3">
                          <label :for="'R1-' + index">
                            {{ o }} ({{ index }})
                          </label>
                        </div>
                        <div class="col-9">
                          <InputText
                            :id="'R1-' + index"
                            class="w1"
                            v-model.number="ssar[index]"
                            style="width: 14rem"
                            :disabled="true"
                          />
                          <Slider
                            class="w1"
                            v-model="ssar[index]"
                            style="width: 14rem"
                            :disabled="true"
                          />
                          <div class="m-2">
                            {{ $filters.formatPercent(ssar[index] / 100) }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-if="Object.values(qsar).length > 0">
                    <h2>{{ $t("votequestionlist.qsar") }}</h2>
                    {{ $t("votequestionlist.qsar_sum") }}:
                    {{ qsarSum }}
                    <div
                      v-for="(o, index) in this.selection.note.o"
                      :key="index"
                    >
                      <div class="row">
                        <div class="col-3">
                          <label :for="'R1-' + index">
                            {{ o }} ({{ index }})
                          </label>
                        </div>
                        <div class="col-9">
                          <InputText
                            :id="'R1-' + index"
                            class="w1"
                            v-model.number="qsar[index]"
                            style="width: 14rem"
                            :disabled="true"
                          />
                          <Slider
                            class="w1"
                            v-model="qsar[index]"
                            style="width: 14rem"
                            :disabled="true"
                          />
                          <div class="m-2">
                            {{ $filters.formatPercent(qsar[index] / 100) }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-if="Object.values(stlr).length > 0">
                    <h2>{{ $t("votequestionlist.stlr") }}</h2>
                    {{ $t("votequestionlist.stlr_sum") }}:
                    {{ stlrSum }}
                    <div
                      v-for="(o, index) in this.selection.note.o"
                      :key="index"
                    >
                      <div class="row">
                        <div class="col-3">
                          <label :for="'R1-' + index">
                            {{ o }} ({{ index }})
                          </label>
                        </div>
                        <div class="col-9">
                          <InputText
                            :id="'R1-' + index"
                            class="w1"
                            v-model.number="stlr[index]"
                            style="width: 14rem"
                            :disabled="true"
                          />
                          <Slider
                            class="w1"
                            v-model="stlr[index]"
                            style="width: 14rem"
                            :disabled="true"
                          />
                          <div class="m-2">
                            {{ $filters.formatPercent(stlr[index] / 100) }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-if="Object.values(qtlr).length > 0">
                    <h2>{{ $t("votequestionlist.qtlr") }}</h2>
                    {{ $t("votequestionlist.qtlr_sum") }}:
                    {{ qtlrSum }}
                    <div
                      v-for="(o, index) in this.selection.note.o"
                      :key="index"
                    >
                      <div class="row">
                        <div class="col-3">
                          <label :for="'R1-' + index">
                            {{ o }} ({{ index }})
                          </label>
                        </div>
                        <div class="col-9">
                          <InputText
                            :id="'R1-' + index"
                            class="w1"
                            v-model.number="qtlr[index]"
                            style="width: 14rem"
                            :disabled="true"
                          />
                          <Slider
                            class="w1"
                            v-model="qtlr[index]"
                            style="width: 14rem"
                            :disabled="true"
                          />
                          <div class="m-2">
                            {{ $filters.formatPercent(qtlr[index] / 100) }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div class="p-field-checkbox">
                      <Checkbox
                        id="publishMnemonics"
                        name="publishMnemonics"
                        :binary="true"
                        v-model="publishMnemonics"
                      />
                      &nbsp;
                      <label for="publishMnemonics">
                        {{ $t("voteask.publishMnemonics") }}</label
                      >
                    </div>
                    <button
                      class="btn btn-primary my-3"
                      @click="submitResult = true"
                    >
                      {{ $t("votequestionlist.submit_results") }}
                    </button>
                    <div v-if="resultNote">
                      <textarea
                        v-model="resultNote"
                        rows="5"
                        disabled
                        class="form-control"
                      />
                    </div>
                  </div>
                </div>
                <div v-if="!votingFinished">
                  <textarea
                    v-model="note"
                    class="form-control my-2"
                    rows="4"
                    :disabled="true"
                  >
                  </textarea>
                  <textarea
                    v-if="mnemonics"
                    v-model="noteDecoded"
                    class="form-control my-2"
                    rows="4"
                    :disabled="true"
                  >
                  </textarea>
                </div>
              </td>
            </tr>
          </table>

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
          <div v-if="!votingFinished">
            {{ $t("votequestionlist.vote_help") }}
          </div>
          <AnswersList
            v-if="selection && selection.id"
            :question="selection.id"
            v-model:selectedAnswer="selectedAnswer"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions } from "vuex";
import AnswersList from "./AnswersList";
import QRCode from "../../components/QRCode.vue";
import { Countdown } from "vue3-flip-countdown";
import nacl from "tweetnacl";
import ed2curve from "ed2curve";
import algosdk from "algosdk";
import Password from "primevue/password";

export default {
  components: {
    AnswersList,
    QRCode,
    Countdown,
    Password,
  },
  data() {
    return {
      debug: false,
      loading: false,
      questions: [],
      answers: [],
      results: {},
      selection: {},
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
      totalResults: {},

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
      asset: {},

      encryptVoteCast: true,
      publishMnemonics: false,
      mnemonics: "",
      useApiData: true,
    };
  },
  watch: {
    async loaded() {
      await this.initLoad();
    },
    async selection() {
      this.results = {};
      if (this.selection && this.selection.note && this.selection.note.o) {
        for (let index in this.selection.note.o) {
          this.results[index] = 0;
        }
      }
    },
    selectedAnswer() {
      if (
        this.selectedAnswer &&
        this.selectedAnswer.response &&
        this.selectedAnswer.response != "Encrypted"
      ) {
        console.log("this.selectedAnswer", this.selectedAnswer);
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
  props: {
    questionId: String,
  },
  computed: {
    loaded() {
      return this.$store.state.config.loaded;
    },
    endTime() {
      const elapsedBlocks = this.params.firstRound - this.selection.round;
      const currentTime = Math.floor(Date.now() / 1000);
      const elapsedTime = currentTime - this.selection["round-time"];
      const timePerBlock = elapsedTime / elapsedBlocks;
      const diffStartEndInBlocks = this.max - this.selection.round;
      /*
      console.log(
        "elapsedBlocks,currentTime,elapsedTime,timePerBlock,diffStartEndInBlocks",
        elapsedBlocks,
        currentTime,
        elapsedTime,
        timePerBlock,
        diffStartEndInBlocks
      );*/
      return Math.round(
        diffStartEndInBlocks * timePerBlock + this.selection["round-time"]
      );
    },
    endTimeIso() {
      return new Date(this.endTime * 1000).toISOString();
    },
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

      if (this.selection.note.e && this.encryptVoteCast) {
        // https://github.com/urtho/algosms-sdk/blob/main/src/crypto.ts
        const encMsg = JSON.stringify(json);

        // Add a random length pad of up to 16 bytes if one is missing

        // Let's use signing keys for encryption. AUDIT required here
        const recipientPublicSignKey = algosdk.decodeAddress(
          this.selection.note.e
        ).publicKey;
        // Convert recipient's public signing key to crypto key
        const rcptPubKey = ed2curve.convertPublicKey(recipientPublicSignKey);

        // Let's use random KP and send the public part over the wire
        const otKeyPair = nacl.box.keyPair();
        // Let's agree on static nonce as we have ephemeral keys anyway
        const nonce = nacl.randomBytes(nacl.box.nonceLength);

        const cipherText = nacl.box(
          Buffer.from(encMsg),
          nonce,
          rcptPubKey,
          otKeyPair.secretKey
        );

        const notePayload = {
          nonce: Buffer.from(nonce).toString("base64"),
          otPK: Buffer.from(otKeyPair.publicKey).toString("base64"),
          cT: Buffer.from(cipherText).toString("base64"),
        };

        return (
          "avote-vote-enc/v1/" +
          this.selection.id.substr(0, 10) +
          ":j" +
          JSON.stringify(notePayload)
        );
      } else {
        return (
          "avote-vote/v1/" +
          this.selection.id.substr(0, 10) +
          ":j" +
          JSON.stringify(json)
        );
      }
    },
    noteDecoded() {
      console.log("this.note", this.note);
      if (!this.note) return "";
      if (!this.decodeNote) return "";
      return this.decodeNote(this.note);
    },
    resultNote() {
      if (!this.selection) return "";
      if (!this.selection.note) return "";

      const json = {};
      json.q = this.selection.id;
      if (this.publishMnemonics) {
        json.e = this.mnemonics;
      }
      json.r = {};
      console.log("this.totalResults.sbr", this.totalResults);
      if (this.totalResults) {
        if (this.sbrSum > 0) json.r.sbr = this.totalResults.sbr;
        if (this.qbrSum > 0) json.r.qbr = this.totalResults.qbr;
        if (this.ssarSum > 0) json.r.ssar = this.totalResults.ssar;
        if (this.qsarSum > 0) json.r.qsar = this.totalResults.qsar;
        if (this.stlrSum > 0) json.r.stlr = this.totalResults.stlr;
        if (this.qtlrSum > 0) json.r.qtlr = this.totalResults.qtlr;
      }
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
      getTransaction: "indexer/getTransaction",
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
      getAsset: "indexer/getAsset",
      getSpaceVotes: "space/getSpaceVotes",
      getSpaceDelegations: "space/getSpaceDelegations",
      getSpaceTrustedListTxs: "space/getSpaceTrustedListTxs",
    }),
    async loadSelection() {
      const res = await this.getTransaction({ txid: this.questionId });
      this.selection = res.transaction;
      let note = "";
      if (this.isBase64(this.selection.note)) {
        note = atob(this.selection.note);
      }
      if (note.startsWith("avote-question/v1:j")) {
        note = note.replace("avote-question/v1:j", "");
        const noteJson = JSON.parse(note);
        console.log("noteJson", noteJson);
        this.selection.note = noteJson;
        this.selection.round = this.selection["confirmed-round"];
      }
      if (note.startsWith("avote-question/v2:j")) {
        note = note.replace("avote-question/v2:j", "");
        const noteJson = JSON.parse(note);
        console.log("noteJson", noteJson);
        noteJson.max =
          parseInt(this.selection["confirmed-round"]) +
          parseInt(noteJson.duration);
        this.selection.note = noteJson;
        this.selection.round = this.selection["confirmed-round"];
      }

      console.log("this.selection", this.selection);
    },

    async initLoad() {
      try {
        if (!this.loaded) return;
        this.loading = true;

        this.asset = await this.getAsset({ assetIndex: this.currentToken });
        console.log("this.asset", this.asset);

        this.params = await this.getTransactionParams();
        await this.loadSelection();

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
          // txs
          if (this.useApiData) {
            txs = await this.getSpaceVotes({
              note: search,
              assetId: this.currentToken,
            });
          } else {
            txs = await this.searchForTokenTransactionsWithNoteAndAmount({
              note: search,
              amount: 703,
              assetId: this.currentToken,
            });
          }
        } else {
          if (this.useApiData) {
            txs = await this.getSpaceVotes({
              note: search,
              assetId: 0,
            });
          } else {
            txs = await this.searchForTransactionsWithNoteAndAmount({
              note: search,
              amount: 703,
              min: this.params.firstRound - 300000,
            });
          }
        }

        if (txs && txs.transactions) {
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

        // get all answers ENCODED
        if (this.mnemonics) {
          const searchEnc =
            "avote-vote-enc/v1/" + this.selection.id.substring(0, 10);
          txs = null;
          if (this.isASAVote) {
            // txs

            if (this.useApiData) {
              txs = await this.getSpaceVotes({
                note: searchEnc,
                assetId: this.currentToken,
              });
            } else {
              txs = await this.searchForTokenTransactionsWithNoteAndAmount({
                note: searchEnc,
                amount: 703,
                assetId: this.currentToken,
              });
            }
          } else {
            if (this.useApiData) {
              txs = await this.getSpaceVotes({
                note: searchEnc,
                assetId: 0,
              });
            } else {
              txs = await this.searchForTransactionsWithNoteAndAmount({
                note: searchEnc,
                amount: 703,
                min: this.params.firstRound - 300000,
              });
            }
          }

          if (txs && txs.transactions) {
            for (let index in txs.transactions) {
              const tx = txs.transactions[index];
              if (!tx["sender"]) continue;
              let note = "";
              if (this.isBase64(tx.note)) {
                note = atob(tx.note);
              }
              console.log("dec note", note);
              const noteDec = this.decodeNote(note);

              let noteJson = {};
              try {
                noteJson = JSON.parse(noteDec);
              } catch (e) {
                console.log("error parsing", tx);
                continue;
              }
              console.log("noteJson", noteJson);

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
        }

        console.log("answersPerAccount", answersPerAccount);
        // calculate whole delegation tree
        const delegationPerAccount = {};
        const searchDeleg = "avote-delegation/v1";

        if (this.isASAVote) {
          if (this.useApiData) {
            txs = await this.getSpaceDelegations({
              assetId: this.currentToken,
            });
          } else {
            txs = await this.searchForTokenTransactionsWithNoteAndAmount({
              note: searchDeleg,
              amount: 701,
              assetId: this.currentToken,
            });
          }
        } else {
          if (this.useApiData) {
            txs = await this.getSpaceDelegations({
              assetId: 0,
            });
          } else {
            txs = await this.searchForTransactionsWithNoteAndAmount({
              note: searchDeleg,
              amount: 701,
            });
          }
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
      this.totalResults.sbr = coinResults;
      // round results
      for (let index in this.totalResults.sbr) {
        this.totalResults.sbr[index] =
          Math.round(this.totalResults.sbr[index] * 100000) / 100000;
      }
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

      this.totalResults.qbr = coinResults;
      this.qbr = {};
      this.qbrSum = 0;
      for (let index in coinResults) {
        this.qbrSum += Math.round(coinResults[index] * 10000) / 10000;
      }
      console.log("QBR coinResults", coinResults, this.qbrSum);
      for (let index in coinResults) {
        this.qbr[index] =
          Math.round((coinResults[index] / this.qbrSum) * 10000) / 100;
      }
      this.qbrSum = Math.round(this.qbrSum * 1000) / 1000;
      // round results
      for (let index in this.totalResults.qbr) {
        this.totalResults.qbr[index] =
          Math.round(this.totalResults.qbr[index] * 100000) / 100000;
      }
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
      this.totalResults.ssar = coinResults;
      for (let index in this.totalResults.ssar) {
        this.totalResults.ssar[index] =
          Math.round(this.totalResults.ssar[index] * 100000) / 100000;
      }
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
      this.totalResults.qsar = coinResults;
      for (let index in this.totalResults.qsar) {
        this.totalResults.qsar[index] =
          Math.round(this.totalResults.qsar[index] * 100000) / 100000;
      }
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
      this.totalResults.stlr = totalResults;
      for (let index in this.totalResults.stlr) {
        this.totalResults.stlr[index] =
          Math.round(this.totalResults.stlr[index] * 100000) / 100000;
      }
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
      this.totalResults.qtlr = totalResults;
      for (let index in this.totalResults.qtlr) {
        this.totalResults.qtlr[index] =
          Math.round(this.totalResults.qtlr[index] * 100000) / 100000;
      }
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
      let balance = 1;
      if (!normalizeBalanceTo1) {
        balance = await this.getAccountBalanceAtRound({
          account,
          round,
          assetId: this.currentToken,
        });
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
        if (this.useApiData) {
          txs = await this.getSpaceTrustedListTxs({
            assetId: this.currentToken,
          });
        } else {
          txs =
            await this.searchForTokenTransactionsWithNoteAndAmountAndAccount({
              note: searchTL,
              amount: 705,
              account: this.selection.sender,
              assetId: this.currentToken,
            });
        }
      } else {
        if (this.useApiData) {
          txs = await this.getSpaceTrustedListTxs({
            assetId: 0,
          });
        } else {
          txs = await this.searchForTransactionsWithNoteAndAmountAndAccount({
            note: searchTL,
            amount: 705,
            account: this.selection.sender,
          });
        }
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
    decodeNote(note) {
      try {
        let noteStr = `${note}`;
        if (!noteStr) return "";
        if (!noteStr.startsWith("avote-vote-enc/v1/")) return "";
        noteStr = noteStr.substring(30);

        const recipientAlgoAccount = algosdk.mnemonicToSecretKey(
          this.mnemonics
        );
        const rcptSecretKey = ed2curve.convertSecretKey(
          recipientAlgoAccount.sk
        );
        const notePayload = JSON.parse(noteStr);
        // Unseal the box
        const decryptedBuffer = nacl.box.open(
          Buffer.from(notePayload.cT, "base64"),
          Buffer.from(notePayload.nonce, "base64"),
          Buffer.from(notePayload.otPK, "base64"),
          rcptSecretKey
        );
        return Buffer.from(decryptedBuffer).toString("utf8");
      } catch (e) {
        console.error(`Error parsing note ${note}: ${e}`);
        return "";
      }
    },
  },
};
</script>
