<template>
  <div>
    <h2>Data to submit in note field</h2>
    <code>{{ note }}</code>
    <h2>QR code</h2>
    <p>
      To be able to generate QR code, please specify your address. You will do
      the self transaction with specified note field.
    </p>
    <input class="form-control" v-model="account" v-if="!sendTo" />
    <div v-if="account">
      <a :href="qrcode2">
        <QRCodeVue3
          :width="600"
          :height="600"
          :value="qrcode"
          :qrOptions="{ errorCorrectionLevel: 'H' }"
        />
      </a>
      <h2>Qr code contents</h2>
      <code>{{ qrcode }}</code>
    </div>
  </div>
</template>

<script>
import QRCodeVue3 from "qrcode-vue3";

export default {
  components: {
    QRCodeVue3,
  },

  data() {
    return {
      account: "",
    };
  },

  props: {
    note: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currentToken: {
      type: String,
    },
    sendTo: { type: String },
  },

  computed: {
    qrcode2() {
      return this.qrcode.replace("algorand://", "web+algorand://");
    },
    qrcode() {
      let account = this.account;
      if (this.sendTo) account = this.sendTo;
      if (!account) return "";
      let ret = "algorand://" + account;
      ret += "?amount=" + this.amount;
      if (this.currentToken && parseInt(this.currentToken) > 0) {
        ret += "&asset=" + this.currentToken;
      }
      ret += "&network=" + this.$store.state.config.env;
      ret += "&xnote=" + this.note;
      return ret;
    },
  },

  watch: {
    account() {
      localStorage.setItem("account", this.account);
    },
  },

  async mounted() {
    this.account = localStorage.getItem("account");
  },
};
</script>