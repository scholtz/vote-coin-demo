<template>
  <div>
    <h2>Data to submit in note field</h2>
    <code>{{ note }}</code>
    <h2>QR code</h2>
    <p>
      To be able to generate QR code, please specify your address. You will do
      the self transaction with specified note field.
    </p>
    <div v-if="signing" class="alert alert-info">
      Check your wallet, and sign the transaction
    </div>
    <div v-if="sending" class="alert alert-info">Sending to the network</div>
    <div v-if="sent" class="alert alert-success">
      Sent to the network <span v-if="result">{{ result.txn }}</span>
    </div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <input class="form-control" v-model="account" v-if="!sendTo" />
    <!--
    <button
      v-if="!account || (!connector && !myAlgoWalletConnected)"
      class="btn my-2 "
      :class="account ? 'btn-light' : 'btn-primary'"
      @click="WalletConnectInit"
    >
      Load account with Wallet Connect 2
    </button>-->
    <button
      v-if="!account || (!connector && !myAlgoWalletConnected)"
      class="btn m-2"
      :class="account ? 'btn-light' : 'btn-primary'"
      @click="initMyAlgoConnect"
    >
      Load account from MyAlgo
    </button>

    <div v-if="account">
      <button
        v-if="connector"
        class="btn btn-primary my-2"
        @click="signAndSendPera"
      >
        Pay with Wallet Connect (Pera)
      </button>

      <button
        v-if="myAlgoWalletConnected"
        class="btn btn-primary my-2"
        @click="signAndSendMyAlgo"
      >
        Pay with MyAlgo Connect
      </button>

      <a
        :href="qrcode2"
        class="btn"
        :class="
          connector || myAlgoWalletConnected
            ? 'm-2 btn-light'
            : 'my-2 btn-primary'
        "
        >Pay using web+algorand:// protocol (AWallet)</a
      >

      <a
        :href="qrcode"
        class="btn m-2"
        :class="
          connector || myAlgoWalletConnected ? 'btn-light' : 'btn-primary'
        "
        >Pay using algorand:// protocol</a
      >
      <button
        v-if="connector"
        class="btn btn-light m-2"
        @click="disconnectPera"
      >
        Disconnect Wallet Connect
      </button>
      <div v-if="uri">
        <h2>Please scan QR code with Wallet Connect 2 compatible wallet</h2>
        <QRCodeVue3
          :width="600"
          :height="600"
          :value="uri"
          :qrOptions="{ errorCorrectionLevel: 'H' }"
        />
      </div>
      <div v-else>
        <QRCodeVue3
          :width="600"
          :height="600"
          :value="qrcode"
          :qrOptions="{ errorCorrectionLevel: 'H' }"
        />
        <h2>Qr code contents</h2>
        <code>{{ qrcode }}</code>
      </div>
    </div>
  </div>
</template>

<script>
import QRCodeVue3 from "qrcode-vue3";

import { mapActions } from "vuex";
import UniversalProvider from "universal-provider-with-algorand";
import algosdk from "algosdk";
import { formatJsonRpcRequest } from "@json-rpc-tools/utils";
import MyAlgoConnect from "@randlabs/myalgo-connect";
const myAlgoWallet = new MyAlgoConnect();

export default {
  components: {
    QRCodeVue3,
  },

  data() {
    return {
      account: "",
      connector: null,
      signing: false,
      sending: false,
      sent: false,
      error: "",
      suggestedParams: null,
      result: null,
      myAlgoWalletConnected: false,
      uri: "",
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
    isMobile() {
      const vendor = navigator.userAgent || navigator.vendor;

      return !!(
        /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino|android|ipad|playbook|silk/i.test(
          vendor
        ) ||
        /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw-(n|u)|c55\/|capi|ccwa|cdm-|cell|chtm|cldc|cmd-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc-s|devi|dica|dmob|do(c|p)o|ds(12|-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(-|_)|g1 u|g560|gene|gf-5|g-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd-(m|p|t)|hei-|hi(pt|ta)|hp( i|ip)|hs-c|ht(c(-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i-(20|go|ma)|i230|iac( |-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|-[a-w])|libw|lynx|m1-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|-([1-8]|c))|phil|pire|pl(ay|uc)|pn-2|po(ck|rt|se)|prox|psio|pt-g|qa-a|qc(07|12|21|32|60|-[2-7]|i-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h-|oo|p-)|sdk\/|se(c(-|0|1)|47|mc|nd|ri)|sgh-|shar|sie(-|m)|sk-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h-|v-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl-|tdg-|tel(i|m)|tim-|t-mo|to(pl|sh)|ts(70|m-|m3|m5)|tx-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas-|your|zeto|zte-/i.test(
          vendor.substr(0, 4)
        )
      );
    },
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
      if (this.account && this.account != null && this.account != "null") {
        localStorage.setItem("account", this.account);
      }
    },
  },

  async mounted() {
    this.account = localStorage.getItem("account");
    if (!this.account || this.account == "null") {
      this.account = "";
    }
    this.suggestedParams = await this.getTransactionParams();
  },
  methods: {
    ...mapActions({
      getTransactionParams: "algod/getTransactionParams",
      sendRawTransaction: "algod/sendRawTransaction",
    }),
    disconnectPera() {
      this.connector.killSession();
      this.connector = null;
    },
    async WalletConnectInit() {
      console.log("WalletConnectInit");
      // Create a connector
      this.connector = await UniversalProvider.init({
        logger: "info",
        projectId: "0bcb1b091b3d9dced34e10a580b32c9e",
        metadata: {
          name: "Vote Coin App",
          description: "Vote Coin App for onchain community management",
          url: "https://app.vote-coin.com/",
          icons: ["https://app.vote-coin.com/logo200.png"],
        },
      });

      this.connector.on("display_uri", (uri) => {
        console.log("display_uri", uri);
        this.uri = uri;
      });

      console.log("connector", this.connector);
      // Check if connection is already established
      if (!this.connector.connected) {
        // create new session
        this.connector.createSession();
      }
      if (this.connector.connected) {
        if (this.connector.accounts.length > 0) {
          const account = this.connector.accounts[0];
          console.log("signing:", account);
          this.account = account;
        }
      }
      // Subscribe to connection events
      this.connector.on("connect", async (error, payload) => {
        if (error) {
          throw error;
        }
        console.log("connect.payload", error, payload);
        // Get provided accounts
        const { accounts } = payload.params[0];
        const account = accounts[0];
        this.account = account;
      });

      this.connector.on("session_update", (error, payload) => {
        if (error) {
          throw error;
        }
        console.log("session_update.payload", error, payload);

        // Get updated accounts
        const { accounts } = payload.params[0];
        console.log("accounts", accounts);
      });

      this.connector.on("disconnect", (error, payload) => {
        console.log("disconnect.error,payload", error, payload);
        if (error) {
          throw error;
        }
      });
    },
    async initMyAlgoConnect() {
      try {
        const accounts = await myAlgoWallet.connect();
        console.log("accounts", accounts);
        const addresses = accounts.map((account) => account.address);
        const account = addresses[0];
        this.account = account;
        this.myAlgoWalletConnected = true;
      } catch (e) {
        this.error = e.message;
      }
    },
    async getTxToSign() {
      const note = Buffer.from("DiatomiX Web", "ascii");
      console.log("note", note);
      if (this.currentToken > 0) {
        const tosign = {
          from: this.account,
          to: this.account,
          amount: this.amount,
          note: new Uint8Array(Buffer.from(this.note, "utf8").buffer),
          assetIndex: parseInt(this.currentToken),
          suggestedParams: this.suggestedParams,
        };
        console.log("tosign", tosign);
        return algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject(
          tosign
        );
      } else {
        const tosign = {
          from: this.account,
          to: this.account,
          amount: this.amount,
          note: new Uint8Array(Buffer.from(this.note, "utf8").buffer),
          suggestedParams: this.suggestedParams,
        };
        console.log("tosign", tosign);
        return algosdk.makePaymentTxnWithSuggestedParamsFromObject(tosign);
      }
    },
    async signAndSendMyAlgo() {
      try {
        //myAlgoWallet.connect();
        const txn = await this.getTxToSign();
        const signedTxn = await myAlgoWallet.signTransaction(txn.toByte());
        this.result = await this.sendRawTransaction({
          signedTxn: signedTxn.blob,
        });
        console.log("result", this.result);
        this.sending = false;
        this.sent = true;
      } catch (e) {
        this.error = e.message;
      }
    },
    async signAndSendPera() {
      try {
        const txn = await this.getTxToSign();
        console.log("txn", txn);
        const txns = [txn];
        const txnsToSign = txns.map((txn) => {
          const encodedTxn = Buffer.from(
            algosdk.encodeUnsignedTransaction(txn)
          ).toString("base64");

          return {
            txn: encodedTxn,
            message: "DiatomiX Web",
          };
        });

        const requestParams = [txnsToSign];

        const request = formatJsonRpcRequest("algo_signTxn", requestParams);
        console.log("request", request);
        this.signing = true;
        const result = await this.connector.sendCustomRequest(request);
        this.signing = false;
        this.sending = true;
        const decodedResult = result.map((element) => {
          return element
            ? new Uint8Array(Buffer.from(element, "base64"))
            : null;
        });
        if (decodedResult.length > 0) {
          //const decoded = algosdk.decodeSignedTransaction(decodedResult[0]);
          this.result = await this.sendRawTransaction({
            signedTxn: decodedResult[0],
          });
          console.log("result", this.result);
          this.sending = false;
          this.sent = true;
        }
      } catch (e) {
        this.sending = false;
        this.sent = false;
        this.signing = false;
        this.error = e.message;
      }
    },
  },
};
</script>
