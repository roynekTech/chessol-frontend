import axios from "axios";
import { API_BASE_URL } from "./use-query-hooks";

export const $axios = axios.create({
  baseURL: API_BASE_URL,
});
