import algosdk from "algosdk";
const state = () => ({
  assets: [],
  balance: {},
});
/*
const asyncdelay = (delayInms) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(2);
    }, delayInms);
  });
};
*/
const mutations = {
  setAsset(state, assetInfo) {
    state.assets.push(assetInfo);
  },
  setBalance(state, { account, round, assetId, balance }) {
    if (state.balance[round] === undefined) {
      state.balance[round] = {};
    }
    if (state.balance[round][account] === undefined) {
      state.balance[round][account] = {};
    }
    state.balance[round][account][assetId] = balance;
  },
};
const actions = {
  async getTransaction({ dispatch }, { txid }) {
    try {
      console.log("this.state.config.indexer", this.state.config.indexer);
      const url = new URL(this.state.config.indexer);
      const indexerClient = new algosdk.Indexer(
        this.state.config.indexerToken,
        this.state.config.indexer,
        url.port
      );
      return await indexerClient.lookupTransactionByID(txid).do();
    } catch (error) {
      console.log("error", error, dispatch);
    }
  },
  async searchForTransactions({ dispatch }, { addr, note }) {
    try {
      const url = new URL(this.state.config.indexer);
      const indexerClient = new algosdk.Indexer(
        this.state.config.indexerToken,
        this.state.config.indexer,
        url.port
      );
      if (note) {
        console.log("searching for addr and note", addr, note);
        const enc = new TextEncoder();
        const noteenc = enc.encode(note);
        const searchForTransactions = await indexerClient
          .searchForTransactions()
          .address(addr)
          .notePrefix(noteenc)
          .do();
        return searchForTransactions;
      } else {
        const searchForTransactions = await indexerClient
          .searchForTransactions()
          .address(addr)
          .do();
        return searchForTransactions;
      }
    } catch (error) {
      console.log("error", error, dispatch);
    }
  },
  async searchForTransactionsWithAddrAndAsset({ dispatch }, { addr, asset }) {
    try {
      const url = new URL(this.state.config.indexer);
      const indexerClient = new algosdk.Indexer(
        this.state.config.indexerToken,
        this.state.config.indexer,
        url.port
      );
      console.log("searching for addr and asset", addr, asset);
      const searchForTransactions = await indexerClient
        .searchForTransactions()
        .address(addr)
        .assetID(asset)
        .do();
      return searchForTransactions;
    } catch (error) {
      console.log("error", error, dispatch);
    }
  },
  async searchForTransactionsWithNoteAndAmount(
    { dispatch },
    { note, amount, min }
  ) {
    try {
      const url = new URL(this.state.config.indexer);
      const indexerClient = new algosdk.Indexer(
        this.state.config.indexerToken,
        this.state.config.indexer,
        url.port
      );
      const enc = new TextEncoder();
      const noteenc = enc.encode(note);
      const searchForTransactions = await indexerClient
        .searchForTransactions()
        .currencyGreaterThan(amount - 1)
        .currencyLessThan(amount + 1)
        .minRound(Math.max(min, 0))
        .notePrefix(noteenc)
        .do();
      return searchForTransactions;
    } catch (error) {
      console.log("error", error, dispatch, note);
    }
  },
  async searchForTokenTransactionsWithNoteAndAmount(
    { dispatch },
    { note, amount, assetId }
  ) {
    try {
      const url = new URL(this.state.config.indexer);
      const indexerClient = new algosdk.Indexer(
        this.state.config.indexerToken,
        this.state.config.indexer,
        url.port
      );
      const enc = new TextEncoder();
      const noteenc = enc.encode(note);
      const searchForTransactions = await indexerClient
        .searchForTransactions()
        .assetID(assetId)
        .currencyGreaterThan(amount - 1)
        .currencyLessThan(amount + 1)
        .notePrefix(noteenc)
        .do();
      return searchForTransactions;
    } catch (error) {
      console.log("error", error, dispatch, note);
    }
  },
  async searchForTransactionsWithNoteAndAmountAndAccount(
    { dispatch },
    { note, amount, account }
  ) {
    try {
      const url = new URL(this.state.config.indexer);
      const indexerClient = new algosdk.Indexer(
        this.state.config.indexerToken,
        this.state.config.indexer,
        url.port
      );
      const enc = new TextEncoder();
      const noteenc = enc.encode(note);
      const searchForTransactions = await indexerClient
        .searchForTransactions()
        .currencyGreaterThan(amount - 1)
        .currencyLessThan(amount + 1)
        .notePrefix(noteenc)
        .address(account)
        .do();
      return searchForTransactions;
    } catch (error) {
      console.log("error", error, dispatch);
    }
  },
  async searchForTokenTransactionsWithNoteAndAmountAndAccount(
    { dispatch },
    { note, amount, account, assetId }
  ) {
    try {
      const url = new URL(this.state.config.indexer);
      const indexerClient = new algosdk.Indexer(
        this.state.config.indexerToken,
        this.state.config.indexer,
        url.port
      );
      const enc = new TextEncoder();
      const noteenc = enc.encode(note);
      const searchForTransactions = await indexerClient
        .searchForTransactions()
        .currencyGreaterThan(amount - 1)
        .currencyLessThan(amount + 1)
        .notePrefix(noteenc)
        .address(account)
        .assetID(assetId)
        .do();
      return searchForTransactions;
    } catch (error) {
      console.log("error", error, dispatch);
    }
  },
  async getAsset({ commit }, { assetIndex }) {
    try {
      try {
        const cache = localStorage.getItem(`Asset-${assetIndex}`);
        if (cache) {
          const cacheObj = JSON.parse(cache);
          if (cacheObj && cacheObj["asset-id"] == assetIndex) {
            commit("setAsset", cacheObj);
            return cacheObj;
          }
        }
      } catch (e) {
        console.log("error", e);
      }

      const url = new URL(this.state.config.indexer);
      const indexerClient = new algosdk.Indexer(
        this.state.config.indexerToken,
        this.state.config.indexer,
        url.port
      );
      const find = this.state.indexer.assets.find(
        (a) => a["asset-id"] == assetIndex
      );
      if (find) {
        return find;
      }
      const assetInfo = await indexerClient
        .searchForAssets()
        .index(assetIndex)
        .do();
      console.log("assetInfo", assetInfo);
      if (
        assetInfo &&
        assetInfo.assets &&
        assetInfo.assets.length > 0 &&
        assetInfo.assets[0].params
      ) {
        const assetInfoData = assetInfo.assets[0].params;
        assetInfoData["asset-id"] = assetIndex;
        commit("setAsset", assetInfoData);
        localStorage.setItem(
          `Asset-${assetIndex}`,
          JSON.stringify(assetInfoData)
        );
        return assetInfoData;
      }
    } catch (error) {
      console.log("error", error);
    }
  },
  async getAccountBalanceAtRound(
    { commit, dispatch },
    { account, round, assetId }
  ) {
    try {
      console.log(
        "this.state.indexer.balance is undefined",
        round,
        this.state.indexer.balance,
        this.state.indexer.balance[round] !== undefined
      );
      if (this.state.indexer.balance[round] !== undefined) {
        if (this.state.indexer.balance[round][account] !== undefined) {
          if (
            this.state.indexer.balance[round][account][assetId] !== undefined
          ) {
            return this.state.indexer.balance[round][account][assetId];
          }
        }
      }
      const url = new URL(this.state.config.indexer);
      const indexerClient = new algosdk.Indexer(
        this.state.config.indexerToken,
        this.state.config.indexer,
        url.port
      );
      const accountInfo = await indexerClient
        .lookupAccountByID(account)
        .round(round)
        .do();

      let balance = 0;
      if (!assetId || assetId <= 0) {
        balance = accountInfo.account.amount;
      } else {
        const item = accountInfo.account.assets.find(
          (a) =>
            a["asset-id"] == assetId &&
            a["deleted"] == false &&
            a["is-frozen"] == false
        );
        if (item) {
          balance = item.amount;
        }
      }

      if (accountInfo && accountInfo.account && balance > 0) {
        await commit("setBalance", { account, round, assetId, balance });
        return balance;
      }
    } catch (error) {
      console.log("error", error);
      const params = await dispatch(
        "algod/getTransactionParams",
        {},
        {
          root: true,
        }
      );
      console.log("params", params);
      return dispatch("getAccountBalanceAtRoundHardWay", {
        params,
        account,
        round,
        assetId,
      });
    }
  },
  /// Get latest account balance, fetch all transactions with specified asset and count the balance at the start
  async getAccountBalanceAtRoundHardWay(
    { commit },
    { params, account, round, assetId }
  ) {
    try {
      console.log(
        "getAccountBalanceAtRoundHardWay",
        round,
        this.state.indexer.balance,
        this.state.indexer.balance[round] !== undefined
      );
      if (this.state.indexer.balance[round] !== undefined) {
        if (this.state.indexer.balance[round][account] !== undefined) {
          if (
            this.state.indexer.balance[round][account][assetId] !== undefined
          ) {
            return this.state.indexer.balance[round][account][assetId];
          }
        }
      }
      const url = new URL(this.state.config.indexer);
      const indexerClient = new algosdk.Indexer(
        this.state.config.indexerToken,
        this.state.config.indexer,
        url.port
      );
      const currentRound = params.firstRound;
      const accountInfo = await indexerClient
        .lookupAccountByID(account)
        .round(currentRound)
        .do();

      let balance = 0;
      if (!assetId || assetId <= 0) {
        balance = accountInfo.account.amount;

        const iterLimit = 1000;
        let numtx = 1;
        let nexttoken = "";
        while (numtx > 0) {
          const assetTxs = await indexerClient
            .lookupAccountTransactions(account)
            .minRound(round)
            .limit(iterLimit)
            .maxRound(currentRound)
            .nextToken(nexttoken)
            .do();
          nexttoken = assetTxs["next-token"];
          numtx = assetTxs.transactions.length;

          if (assetTxs.transactions) {
            console.log(
              `processing ${assetTxs.transactions.length} tx rollback`,
              assetTxs
            );
            assetTxs.transactions.forEach((tx) => {
              if (tx.sender == account) {
                if (tx.fee) {
                  balance += tx.fee;
                }
              }
              const assetTx = tx["payment-transaction"];
              console.log(`processing`, tx, assetTx);

              if (assetTx) {
                if (assetTx.receiver !== tx.sender) {
                  // skip self txs
                  console.log("tx.amount", assetTx, assetTx.amount);
                  if (assetTx.amount) {
                    if (assetTx.receiver === account) {
                      balance -= assetTx.amount; // we are rolling backward in time, so this account as a sender had higher balance before this tx
                    } else {
                      balance += assetTx.amount;
                    }
                  }
                }
              }
            });
          }
        }
      } else {
        const item = accountInfo.account.assets.find(
          (a) =>
            a["asset-id"] == assetId &&
            a["deleted"] == false &&
            a["is-frozen"] == false
        );
        if (item) {
          balance = item.amount;
        }
        const iterLimit = 1000;
        let numtx = 1;
        let nexttoken = "";
        while (numtx > 0) {
          const assetTxs = await indexerClient
            .lookupAccountTransactions(account)
            .minRound(round)
            .assetID(assetId)
            .limit(iterLimit)
            .maxRound(currentRound)
            .nextToken(nexttoken)
            .do();
          nexttoken = assetTxs["next-token"];
          numtx = assetTxs.transactions.length;

          if (assetTxs.transactions) {
            console.log(
              `processing ${assetTxs.transactions.length} tx rollback`,
              assetTxs
            );
            assetTxs.transactions.forEach((tx) => {
              const assetTx = tx["asset-transfer-transaction"];
              console.log(`processing`, tx, assetTx);

              if (assetTx) {
                if (assetTx.receiver !== tx.sender) {
                  // skip self txs
                  console.log("tx.amount", assetTx, assetTx.amount);
                  if (assetTx.amount) {
                    if (assetTx.receiver === account) {
                      balance -= assetTx.amount; // we are rolling backward in time, so this account as a sender had higher balance before this tx
                    } else {
                      balance += assetTx.amount;
                    }
                  }
                }
              }
            });
          }
        }
      }
      console.log(
        `0x2156156 Account ${account} balance at round ${round} for asset ${assetId} was ${balance}`
      );
      if (balance > 0) {
        await commit("setBalance", { account, round, assetId, balance });
        return balance;
      }
    } catch (error) {
      console.log("getAccountBalanceAtRoundHardWay", error);
    }
  },
  async getAssetsByName({ commit }, { name }) {
    try {
      const url = new URL(this.state.config.indexer);
      const indexerClient = new algosdk.Indexer(
        this.state.config.indexerToken,
        this.state.config.indexer,
        url.port
      );
      const assetInfo = await indexerClient.searchForAssets().name(name).do();
      console.log("assetInfo", assetInfo);
      return assetInfo.assets;
    } catch (error) {
      console.log("error", error, commit);
    }
  },
};
export default {
  namespaced: true,
  state,
  mutations,
  actions,
};
