<script setup lang="ts">
import { useWallet } from "@txnlab/use-wallet-vue";

const { wallets, activeWallet, activeAccount } = useWallet();
</script>

<template>
  <div v-if="!activeAccount?.address">
    <h2>Select your account at any of the following AVM wallets</h2>
    <ul>
      <div v-for="wallet in wallets" :key="wallet.id">
        <button class="btn btn-primary my-2" @click="wallet.connect()">
          {{ wallet.metadata.name }}
        </button>
      </div>
    </ul>

    <div v-if="activeAccount?.address">
      <h2>Active Account</h2>
      <p>{{ activeAccount?.address }}</p>
    </div>
  </div>
  <div v-if="activeWallet">
    <h2>Active Wallet</h2>
    <p>{{ activeWallet.metadata.name }}</p>
    <button class="btn btn-primary my-2" @click="activeWallet.disconnect()">
      Disconnect
    </button>
  </div>
</template>
