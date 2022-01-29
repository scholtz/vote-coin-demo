import { createStore } from "vuex";
import algod from "./algod";
import axios from "./axios";
import config from "./config";
import indexer from "./indexer";
import toast from "./toast";
import space from "./space";
import vote from "./vote";

const debugStrict = process.env.NODE_ENV !== "production";

export default createStore({
  modules: {
    algod,
    axios,
    config,
    indexer,
    toast,
    space,
    vote,
  },
  strict: debugStrict,
});
