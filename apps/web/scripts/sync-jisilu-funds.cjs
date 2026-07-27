const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');
const { createRequire } = require('node:module');
const projectRequire = createRequire('/workspaces/fund/apps/web/package.json');
const CryptoJS = projectRequire('crypto-js');
projectRequire('dotenv').config({ path: '.env.development' });
projectRequire('ts-node/register/transpile-only');
projectRequire('tsconfig-paths/register');

const { getORM, forkEntityManager } = projectRequire('./src/utils/getOrm');
const { Fund } = projectRequire('./src/server/db/entities/fund');
const { FundDaily } = projectRequire('./src/server/db/entities/fundDaily');

class CookieJar {
  constructor() { this.cookies = new Map(); }
  add(setCookieHeaders) {
    const headers = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders].filter(Boolean);
    for (const header of headers) {
      for (const part of splitSetCookie(header)) {
        const pair = part.split(';')[0];
        const eq = pair.indexOf('=');
        if (eq > 0) this.cookies.set(pair.slice(0, eq), pair.slice(eq + 1));
      }
    }
  }
  header() { return [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; '); }
}
function splitSetCookie(header) {
  if (!header || typeof header !== 'string') return [];
  return header.split(/,(?=\s*[^;,=]+=[^;,]+)/g).map((item) => item.trim()).filter(Boolean);
}
function getSetCookies(res) {
  if (typeof res.headers.getSetCookie === 'function') return res.headers.getSetCookie();
  return res.headers.get('set-cookie');
}
function jslencode(text, aesKey) {
  const key = CryptoJS.enc.Utf8.parse(aesKey);
  const srcs = CryptoJS.enc.Utf8.parse(text);
  const encrypted = CryptoJS.AES.encrypt(srcs, key, {
    iv: CryptoJS.enc.Utf8.parse(''),
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7,
  });
  return encrypted.ciphertext.toString(CryptoJS.enc.Hex);
}
async function fetchWithJar(url, options, jar) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 fund-sync',
    'Referer': 'https://www.jisilu.cn/',
    ...(options?.headers || {}),
  };
  const cookie = jar.header();
  if (cookie) headers.Cookie = cookie;
  const res = await fetch(url, { ...options, headers });
  jar.add(getSetCookies(res));
  return res;
}
async function login(username, password) {
  const jar = new CookieJar();
  const loginPageRes = await fetchWithJar('https://www.jisilu.cn/account/login/', {}, jar);
  const loginPage = await loginPageRes.text();
  const key = /var key = '([^']+)'/.exec(loginPage)?.[1];
  if (!key) throw new Error('Cannot find Jisilu login key');
  const body = new URLSearchParams({
    return_url: '/',
    user_name: jslencode(username, key),
    password: jslencode(password, key),
    aes: '1',
    auto_login: '1',
  });
  const loginRes = await fetchWithJar('https://www.jisilu.cn/webapi/account/login_process/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
      'Origin': 'https://www.jisilu.cn',
      'Referer': 'https://www.jisilu.cn/account/login/',
    },
    body,
  }, jar);
  const loginJson = await loginRes.json();
  if (loginJson.code !== 200) throw new Error(`Jisilu login failed: ${loginJson.msg || loginRes.status}`);
  return jar;
}

const clean = (v) => v === null || v === undefined ? '' : String(v).replace(/\u00a0/g, ' ').trim();
const emptyToUndefined = (v) => { const s = clean(v); return !s || s === '-' || s === '--' ? undefined : s; };
const parsePercent = (v) => { const s = clean(v); if (!s || s === '-' || s === '--') return undefined; const m = s.match(/-?\d+(?:\.\d+)?/); return m ? Number(m[0]) : undefined; };
const parseNumber = (v) => { const s = clean(v); if (!s || s === '-' || s === '--') return undefined; const n = Number(s.replace(/,/g, '').replace('%', '')); return Number.isFinite(n) ? n : undefined; };
const parseDate = (v) => { const s = emptyToUndefined(v); if (!s) return undefined; const date = new Date(s); return Number.isFinite(date.getTime()) ? date : undefined; };
const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const normalizeStatus = (apply, redeem, combined) => {
  const c = emptyToUndefined(combined);
  if (c) return c;
  const a = emptyToUndefined(apply);
  const r = emptyToUndefined(redeem);
  if (a && r) return `${a} / ${r}`;
  return a ?? r;
};
const normalizeLine = (line) => clean(line)
  .replace(/[＜﹤]/g, '<')
  .replace(/[＞﹥]/g, '>')
  .replace(/≤/g, '<=')
  .replace(/≥/g, '>=')
  .replace(/＝/g, '=')
  .replace(/（含）|\(含\)|含/g, '');
const parseLastNumber = (text) => {
  const matches = [...clean(text).matchAll(/-?\d+(?:\.\d+)?\s*%?/g)];
  if (!matches.length) return undefined;
  const value = Number(matches.at(-1)[0].replace('%', '').trim());
  return Number.isFinite(value) ? value : undefined;
};
const isAfter7DayRedeemLine = (line) => {
  const s = normalizeLine(line).replace(/\s/g, '');
  if (!s) return false;
  if (/^(0|1|2|3|4|5|6)[日天]?[-~至]|[<＜]7[日天]|7[日天]?(以内|以下|内)|小于7[日天]|少于7[日天]|不满7[日天]|不足7[日天]|0-6/.test(s)) return false;
  return /(^|[^0-9])7[日天]?(<=|<|-|~|至)|>=7[日天]?|7[日天]?(及以上|以上)|超过7[日天]|大于等于7[日天]|不少于7[日天]/.test(s);
};
const parseRedemptionAfter7 = (tips, fallback) => {
  for (const line of clean(tips).split(/\r?\n/)) {
    if (!isAfter7DayRedeemLine(line)) continue;
    const value = parseLastNumber(line);
    if (value !== undefined) return value;
  }
  return parsePercent(fallback);
};
function getCode(cell) {
  return clean(cell.fund_id || cell.fundA_id || cell.fundA_code || cell.fund_code || cell.qdii_id || cell.id || cell.symbol);
}
function getName(cell) {
  return clean(cell.fund_nm || cell.fundA_nm || cell.fund_name || cell.qdii_nm || cell.name);
}
function getIndexName(cell) {
  return emptyToUndefined(cell.index_nm || cell.index_name || cell.ref_index_nm || cell.idx_nm || cell.index_fund_nm);
}
function getIndexIncrease(cell) {
  return parsePercent(cell.index_increase_rt ?? cell.index_increase ?? cell.ref_index_increase_rt ?? cell.idx_increase_rt);
}
function calculatePremiumRate(value, base, denominator) {
  const numericValue = parseNumber(value);
  const numericBase = parseNumber(base);
  const numericDenominator = parseNumber(denominator);
  if (numericValue === undefined || numericBase === undefined || numericDenominator === undefined || numericDenominator <= 0) return undefined;
  return Math.round(((numericValue - numericBase) / numericDenominator) * 10000) / 100;
}
function calculateChangeRate(value, previousValue) {
  const numericValue = parseNumber(value);
  const numericPreviousValue = parseNumber(previousValue);
  if (numericValue === undefined || numericPreviousValue === undefined || numericPreviousValue <= 0) return undefined;
  return Math.round(((numericValue - numericPreviousValue) / numericPreviousValue) * 10000) / 100;
}
function markFixedOpenFundLowValue(fund) {
  const text = `${fund.name}${fund.fundType || ''}${fund.category || ''}`;
  if (/定开|定期开放/.test(text)) fund.lowValue = true;
}

async function syncFundDaily(em, fund) {
  if (fund.nav === undefined || !fund.navDate) return;
  const date = startOfDay(fund.navDate instanceof Date ? fund.navDate : new Date(fund.navDate));
  if (!Number.isFinite(date.getTime())) return;
  let daily = await em.findOne(FundDaily, { fund, date });
  if (!daily) {
    daily = new FundDaily({ fund, date });
    em.persist(daily);
  }
  const previousDaily = await em.findOne(
    FundDaily,
    { fund, date: { $lt: date }, nav: { $ne: null } },
    { orderBy: { date: 'desc' } },
  );
  const calculatedNavChangePercent = calculateChangeRate(fund.nav, previousDaily?.nav);
  daily.nav = fund.nav;
  daily.navChangePercent = calculatedNavChangePercent ?? fund.navChangePercent;
  if (calculatedNavChangePercent !== undefined) fund.navChangePercent = calculatedNavChangePercent;
  daily.navPremiumRate = calculatePremiumRate(daily.closePrice, fund.nav, fund.nav);
  daily.premiumErrorRate = calculatePremiumRate(daily.estimatedNav, fund.nav, fund.nav);
}

function applyCellToFund(fund, cell, fundType) {
  const name = getName(cell);
  if (name) fund.name = name;
  fund.fundType = fundType;
  const category = getIndexName(cell);
  if (category !== undefined) fund.category = category;
  const indexChangePercent = getIndexIncrease(cell);
  if (indexChangePercent !== undefined) fund.indexChangePercent = indexChangePercent;
  const purchaseFee = parsePercent(cell.apply_fee ?? cell.apply_fee_rate ?? cell.purchase_fee);
  if (purchaseFee !== undefined) fund.purchaseFee = purchaseFee;
  const redemptionFeeRule = emptyToUndefined(cell.redeem_fee_tips ?? cell.redeem_tips);
  if (redemptionFeeRule !== undefined) fund.redemptionFeeRule = redemptionFeeRule;
  const redemptionFee7d = parseRedemptionAfter7(cell.redeem_fee_tips ?? cell.redeem_tips, cell.redeem_fee ?? cell.redeem_fee_rate);
  if (redemptionFee7d !== undefined) fund.redemptionFee7d = redemptionFee7d;
  const custodianFee = parsePercent(cell.t_fee ?? cell.custodian_fee ?? cell.trustee_fee);
  if (custodianFee !== undefined) fund.custodianFee = custodianFee;
  const applyStatus = emptyToUndefined(cell.apply_status);
  if (applyStatus !== undefined) fund.applyStatus = applyStatus;
  const redeemStatus = emptyToUndefined(cell.redeem_status);
  if (redeemStatus !== undefined) fund.redeemStatus = redeemStatus;
  const status = normalizeStatus(cell.apply_status, cell.redeem_status, cell.apply_redeem_status);
  if (status !== undefined) fund.purchaseStatus = status;
  const nav = parseNumber(cell.fund_nav ?? cell.nav ?? cell.fund_net_value);
  if (nav !== undefined) fund.nav = nav;
  const navChangePercent = parsePercent(cell.nav_incr_rt ?? cell.nav_increase_rt ?? cell.nav_increase ?? cell.fund_nav_incr_rt);
  if (navChangePercent !== undefined) fund.navChangePercent = navChangePercent;
  const navDate = parseDate(cell.nav_dt ?? cell.nav_date);
  if (navDate !== undefined) fund.navDate = navDate;
  const company = emptyToUndefined(cell.issuer_nm || cell.company || cell.fund_company || cell.fund_company_nm);
  if (company !== undefined) fund.company = company;
  markFixedOpenFundLowValue(fund);
}
async function fetchRows(jar, baseUrl, maxPages = 20) {
  const rowsByCode = new Map();
  for (let page = 1; page <= maxPages; page++) {
    const url = new URL(baseUrl);
    url.searchParams.set('page', String(page));
    await delay(5000);
    const res = await fetchWithJar(url.toString(), {
      headers: {
        'Accept': 'application/json,text/javascript,*/*;q=0.01',
        'X-Requested-With': 'XMLHttpRequest',
      },
    }, jar);
    if (!res.ok) throw new Error(`Jisilu data HTTP ${res.status}: ${url}`);
    const payload = await res.json();
    const rows = Array.isArray(payload.rows) ? payload.rows : [];
    let newCount = 0;
    for (const row of rows) {
      const cell = row.cell || row;
      const code = getCode(cell);
      if (!code || rowsByCode.has(code)) continue;
      rowsByCode.set(code, { id: row.id || code, cell });
      newCount++;
    }
    if (!rows.length || newCount === 0) break;
    const rp = Number(url.searchParams.get('rp') || 0);
    if (rp > 0 && rows.length < rp) break;
  }
  return [...rowsByCode.values()];
}

async function main() {
  const rl = readline.createInterface({ input, output, terminal: false });
  const line = await rl.question('');
  rl.close();
  const { username, password } = JSON.parse(line);
  const jar = await login(username, password);
  const datasets = [
    {
      label: 'index_lof',
      url: 'https://www.jisilu.cn/data/lof/index_lof_list/?___jsl=LST___t=1779889489815&rp=25&page=1',
      fundType: 'A股指数基金',
    },
    {
      label: 'stock_lof',
      url: 'https://www.jisilu.cn/data/lof/stock_lof_list/?___jsl=LST___t=1779890453221&only_owned=&rp=25&page=1',
      fundType: '股票型基金',
    },
    {
      label: 'qdii_E',
      url: 'https://www.jisilu.cn/data/qdii/qdii_list/E?___jsl=LST___t=1779890548262&only_lof=y&only_etf=y&rp=22&page=1',
      fundType: '欧美指数QDII',
    },
    {
      label: 'qdii_A',
      url: 'https://www.jisilu.cn/data/qdii/qdii_list/A?___jsl=LST___t=1779890691731&only_lof=y&only_etf=y&rp=22&page=1',
      fundType: '亚洲指数QDII',
    },
    {
      label: 'qdii_C',
      url: 'https://www.jisilu.cn/data/qdii/qdii_list/C?___jsl=LST___t=1779890746865&rp=22&page=1',
      fundType: '商品QDII',
      excludeCodes: new Set(['161815']),
    },
  ];

  const em = await forkEntityManager();
  const summary = [];
  for (const dataset of datasets) {
    const rows = await fetchRows(jar, dataset.url);
    const filtered = rows.filter((row) => !dataset.excludeCodes?.has(getCode(row.cell)));
    const codes = filtered.map((row) => getCode(row.cell)).filter(Boolean);
    const existing = await em.find(Fund, { code: { $in: codes } });
    const byCode = new Map(existing.map((fund) => [fund.code, fund]));
    let inserted = 0;
    let updated = 0;
    for (const row of filtered) {
      const cell = row.cell;
      const code = getCode(cell);
      if (!code) continue;
      let fund = byCode.get(code);
      if (!fund) {
        fund = new Fund({ code, name: getName(cell) || code });
        em.persist(fund);
        byCode.set(code, fund);
        inserted++;
      }
      applyCellToFund(fund, cell, dataset.fundType);
      await syncFundDaily(em, fund);
      updated++;
    }
    summary.push({ label: dataset.label, fetched: rows.length, updated, inserted, excluded: rows.length - filtered.length, first: rows[0]?.id, last: rows.at(-1)?.id });
  }
  await em.flush();
  const orm = await getORM();
  await orm.close(true);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch(async (error) => {
  console.error(error.stack || error.message || error);
  try {
    const orm = await getORM();
    await orm.close(true);
  } catch (closeError) {
    console.error(closeError.stack || closeError.message || closeError);
  }
  process.exit(1);
});
