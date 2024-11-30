<script setup lang="ts">
import { useRouter } from "vue-router";
import { useWallet } from "@txnlab/use-wallet-vue";
import algosdk, { Transaction } from "algosdk";
import { useStore } from "vuex";
const props = defineProps({
  txn: Transaction,
});
const router = useRouter();

const { algodClient, activeWallet, activeAddress, transactionSigner } =
  useWallet();
const store = useStore();
const sign = async () => {
  try {
    console.log("props", props);
    console.log("txn", props.txn);
    if (!props.txn) return;
    const atc = new algosdk.AtomicTransactionComposer();
    atc.addTransaction({ txn: props.txn, signer: transactionSigner });
    await store.dispatch(
      "toast/openSuccess",
      "Please check your wallet and sign the tx"
    );
    const res = await atc.execute(algodClient.value, 4);

    if (res.txIDs.length > 0) {
      await store.dispatch(
        "toast/openSuccess",
        "Tx has been submitted to the blockchain."
      );
      //router.push(`/mainnet-v1.0/388592191/question/${res.txIDs[0]}`);
    } else {
      await store.dispatch(
        "toast/openError",
        "Submitted to the blockchain but the call did not returned tx"
      );
    }
  } catch (e: any) {
    await store.dispatch("toast/openError", e.message);
  }
};
</script>

<template>
  <button class="btn btn-primary my-2 me-2" @click="sign">
    Sign using {{ activeWallet?.metadata?.name }}
  </button>
</template>
