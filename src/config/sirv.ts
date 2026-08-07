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

const getToken = async (): Promise<string> => {
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
  currentToken = response.token;
  return currentToken;
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
