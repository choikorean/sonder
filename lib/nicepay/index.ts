import "server-only";

import { createHash, randomInt } from "crypto";

export type NicepayConfig = {
  mid: string;
  merchantKey: string;
  charset: "utf-8" | "euc-kr";
};

export function getNicepayConfig(): NicepayConfig {
  const mid = process.env.NICEPAY_MID;
  const merchantKey = process.env.NICEPAY_MERCHANT_KEY;

  if (!mid || !merchantKey) {
    throw new Error("NICEPAY_MID 또는 NICEPAY_MERCHANT_KEY가 설정되지 않았습니다.");
  }

  return {
    mid,
    merchantKey,
    charset: "utf-8",
  };
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function ediDate(now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    String(now.getFullYear()) +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds())
  );
}

/** NicePay TID: MID + svcCd(0116) + yyMMddHHmmss + random4 */
export function createTid(mid: string, now = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const time =
    pad(now.getFullYear() % 100) +
    pad(now.getMonth() + 1) +
    pad(now.getDate()) +
    pad(now.getHours()) +
    pad(now.getMinutes()) +
    pad(now.getSeconds());
  const random = String(randomInt(0, 10000)).padStart(4, "0");
  return `${mid}0116${time}${random}`;
}

export function createMoid(prefix: string): string {
  const stamp = Date.now().toString(36);
  const random = randomInt(1000, 9999);
  return `${prefix}_${stamp}_${random}`.slice(0, 64);
}

export function signAuthRequest(
  edi: string,
  mid: string,
  amt: string,
  merchantKey: string,
): string {
  return sha256Hex(`${edi}${mid}${amt}${merchantKey}`);
}

export function signAuthResponse(
  authToken: string,
  mid: string,
  amt: string,
  merchantKey: string,
): string {
  return sha256Hex(`${authToken}${mid}${amt}${merchantKey}`);
}

export function signBillkeyRegister(
  tid: string,
  mid: string,
  edi: string,
  merchantKey: string,
): string {
  return sha256Hex(`${tid}${mid}${edi}${merchantKey}`);
}

export function signBillingApprove(
  mid: string,
  edi: string,
  moid: string,
  amt: string,
  bid: string,
  merchantKey: string,
): string {
  return sha256Hex(`${mid}${edi}${moid}${amt}${bid}${merchantKey}`);
}

export function signBillkeyRemove(
  mid: string,
  edi: string,
  moid: string,
  bid: string,
  merchantKey: string,
): string {
  return sha256Hex(`${mid}${edi}${moid}${bid}${merchantKey}`);
}

export const NICEPAY_ENDPOINTS = {
  billkeyRegister:
    "https://webapi.nicepay.co.kr/webapi/billing/cardbill_regist.jsp",
  billingApprove:
    "https://webapi.nicepay.co.kr/webapi/billing/billing_approve.jsp",
  billkeyRemove:
    "https://webapi.nicepay.co.kr/webapi/billing/billkey_remove.jsp",
} as const;

export const NICEPAY_SDK_URL =
  "https://pg-web.nicepay.co.kr/v3/common/js/nicepay-pgweb.js";

export type NicepayKvResponse = Record<string, string>;

export async function postNicepayForm(
  url: string,
  body: Record<string, string>,
): Promise<NicepayKvResponse> {
  const params = new URLSearchParams(body);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const text = await res.text();
  return parseNicepayResponse(text);
}

function parseNicepayResponse(text: string): NicepayKvResponse {
  const trimmed = text.trim();
  if (!trimmed) return {};

  if (trimmed.startsWith("{")) {
    try {
      const json = JSON.parse(trimmed) as Record<string, unknown>;
      return Object.fromEntries(
        Object.entries(json).map(([k, v]) => [k, String(v ?? "")]),
      );
    } catch {
      return { raw: trimmed };
    }
  }

  const result: NicepayKvResponse = {};
  for (const part of trimmed.split("&")) {
    const [rawKey, rawValue = ""] = part.split("=");
    if (!rawKey) continue;
    result[decodeURIComponent(rawKey)] = decodeURIComponent(rawValue);
  }
  return result;
}

export type AuthCallbackPayload = {
  AuthResultCode: string;
  AuthResultMsg: string;
  AuthToken?: string;
  PayMethod?: string;
  MID?: string;
  Moid?: string;
  Amt?: string;
  Signature?: string;
  TxTid?: string;
  ReqReserved?: string;
  BillAuthYN?: string;
};

export function parseAuthCallback(
  data: Record<string, string>,
): AuthCallbackPayload {
  return {
    AuthResultCode: data.AuthResultCode ?? "",
    AuthResultMsg: data.AuthResultMsg ?? "",
    AuthToken: data.AuthToken,
    PayMethod: data.PayMethod,
    MID: data.MID,
    Moid: data.Moid,
    Amt: data.Amt,
    Signature: data.Signature,
    TxTid: data.TxTid,
    ReqReserved: data.ReqReserved,
    BillAuthYN: data.BillAuthYN,
  };
}

export type BillkeyRegisterResult = {
  ResultCode: string;
  ResultMsg: string;
  TID?: string;
  BID?: string;
  AuthDate?: string;
  CardCode?: string;
  CardName?: string;
  CardCl?: string;
  CardNo?: string;
};

export async function registerBillkey(params: {
  tid: string;
  authToken: string;
  mid: string;
  merchantKey: string;
  charset?: "utf-8" | "euc-kr";
}): Promise<BillkeyRegisterResult> {
  const edi = ediDate();
  const body: Record<string, string> = {
    TID: params.tid,
    AuthToken: params.authToken,
    MID: params.mid,
    EdiDate: edi,
    SignData: signBillkeyRegister(
      params.tid,
      params.mid,
      edi,
      params.merchantKey,
    ),
    CharSet: params.charset ?? "utf-8",
    EdiType: "JSON",
  };

  const res = await postNicepayForm(NICEPAY_ENDPOINTS.billkeyRegister, body);
  return {
    ResultCode: res.ResultCode ?? "",
    ResultMsg: res.ResultMsg ?? "",
    TID: res.TID,
    BID: res.BID,
    AuthDate: res.AuthDate,
    CardCode: res.CardCode,
    CardName: res.CardName,
    CardCl: res.CardCl,
    CardNo: res.CardNo,
  };
}

export type BillingApproveResult = {
  ResultCode: string;
  ResultMsg: string;
  TID?: string;
  Moid?: string;
  Amt?: string;
  AuthCode?: string;
  AuthDate?: string;
  CardNo?: string;
  CardName?: string;
};

export async function approveBilling(params: {
  bid: string;
  mid: string;
  merchantKey: string;
  moid: string;
  amt: number;
  goodsName: string;
  buyerEmail?: string;
  buyerName?: string;
  buyerTel?: string;
  charset?: "utf-8" | "euc-kr";
}): Promise<BillingApproveResult> {
  const edi = ediDate();
  const tid = createTid(params.mid);
  const amt = String(params.amt);
  const body: Record<string, string> = {
    BID: params.bid,
    MID: params.mid,
    TID: tid,
    EdiDate: edi,
    Moid: params.moid,
    Amt: amt,
    GoodsName: params.goodsName,
    SignData: signBillingApprove(
      params.mid,
      edi,
      params.moid,
      amt,
      params.bid,
      params.merchantKey,
    ),
    CardInterest: "0",
    CardQuota: "00",
    CharSet: params.charset ?? "utf-8",
    EdiType: "JSON",
  };

  if (params.buyerEmail) body.BuyerEmail = params.buyerEmail;
  if (params.buyerName) body.BuyerName = params.buyerName;
  if (params.buyerTel) body.BuyerTel = params.buyerTel;

  const res = await postNicepayForm(NICEPAY_ENDPOINTS.billingApprove, body);
  return {
    ResultCode: res.ResultCode ?? "",
    ResultMsg: res.ResultMsg ?? "",
    TID: res.TID ?? tid,
    Moid: res.Moid ?? params.moid,
    Amt: res.Amt ?? amt,
    AuthCode: res.AuthCode,
    AuthDate: res.AuthDate,
    CardNo: res.CardNo,
    CardName: res.CardName,
  };
}

export async function removeBillkey(params: {
  bid: string;
  mid: string;
  merchantKey: string;
  moid: string;
  amt: number;
  charset?: "utf-8" | "euc-kr";
}): Promise<{ ResultCode: string; ResultMsg: string }> {
  const edi = ediDate();
  const body: Record<string, string> = {
    BID: params.bid,
    MID: params.mid,
    EdiDate: edi,
    Moid: params.moid,
    Amt: String(params.amt),
    SignData: signBillkeyRemove(
      params.mid,
      edi,
      params.moid,
      params.bid,
      params.merchantKey,
    ),
    CharSet: params.charset ?? "utf-8",
    EdiType: "JSON",
  };

  const res = await postNicepayForm(NICEPAY_ENDPOINTS.billkeyRemove, body);
  return {
    ResultCode: res.ResultCode ?? "",
    ResultMsg: res.ResultMsg ?? "",
  };
}
