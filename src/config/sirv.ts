import axios from "axios";
import { SirvConfig, TokenResponse } from "../types/index.js";

// Same working pattern used in the portfolio backend — kept identical on purpose.
const sirvConfig: SirvConfig = {
  clientId: process.env.SIRV_CLIENT_ID || "",
  clientSecret: process.env.SIRV_CLIENT_SECRET || "",
  baseUrl: "api.sirv.com",
  uploadPath: "/v2/files/upload",
  tokenPath: "/v2/token",
  domain: process.env.SIRV_DOMAIN || "",
};

let currentToken: string | null = null;
let tokenExpiresAt = 0;
let pendingToken: Promise<string> | null = null;

// Sirv's own default if it ever omits expiresIn.
const FALLBACK_TOKEN_TTL = 1200;
// Renew a minute early so a token can't expire mid-upload.
const EXPIRY_MARGIN = 60;

const makeRequest = async (options: any, payload: any): Promise<string> => {
  try {
    const { method, hostname, path, headers } = options;
    const url = `https://${hostname}${path}`;
    const response = await axios({
      method,
      url,
      headers,
      data: payload,
      responseType: "arraybuffer",
    });
    return response.data instanceof Buffer ? response.data.toString() : response.data;
  } catch (error: any) {
    if (error.response) {
      throw new Error(`Request failed with status ${error.response.status}: ${error.response.data}`);
    }
    throw error;
  }
};

const fetchToken = async (): Promise<string> => {
  if (!process.env.SIRV_CLIENT_ID || !process.env.SIRV_CLIENT_SECRET) {
    throw new Error("Missing required Sirv environment variables (SIRV_CLIENT_ID, SIRV_CLIENT_SECRET)");
  }

  const options = {
    method: "POST",
    hostname: sirvConfig.baseUrl,
    path: sirvConfig.tokenPath,
    headers: { "content-type": "application/json" },
  };

  const payload = {
    clientId: process.env.SIRV_CLIENT_ID,
    clientSecret: process.env.SIRV_CLIENT_SECRET,
  };

  const body = await makeRequest(options, payload);
  const response: TokenResponse = JSON.parse(body);
  const ttl = Number(response.expiresIn) || FALLBACK_TOKEN_TTL;

  currentToken = response.token;
  tokenExpiresAt = Date.now() + (ttl - EXPIRY_MARGIN) * 1000;
  return currentToken;
};

const getToken = async (): Promise<string> => {
  if (currentToken && Date.now() < tokenExpiresAt) return currentToken;

  // Uploading several images runs them through Promise.all, so without sharing the
  // request in flight every one of them would ask for a token of its own.
  pendingToken ??= fetchToken().finally(() => {
    pendingToken = null;
  });

  return pendingToken;
};

/** Uploads a buffer to Sirv under /al-baraka/<filename> and returns the public URL. */
export const uploadToSirv = async (buffer: Buffer, filename: string): Promise<string> => {
  if (!process.env.SIRV_DOMAIN) {
    throw new Error("Missing required Sirv environment variable (SIRV_DOMAIN)");
  }

  const token = await getToken();
  const safeName = `${Date.now()}-${filename}`.replace(/\s+/g, "-");

  const options = {
    method: "POST",
    hostname: sirvConfig.baseUrl,
    path: `${sirvConfig.uploadPath}?filename=${encodeURIComponent(`/al-baraka/${safeName}`)}`,
    headers: {
      "content-type": "application/octet-stream",
      authorization: `Bearer ${token}`,
      "content-length": buffer.length,
    },
  };

  await makeRequest(options, buffer);
  return `https://${process.env.SIRV_DOMAIN}/al-baraka/${safeName}`;
};
