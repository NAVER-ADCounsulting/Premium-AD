// ============================================================
// 보장형 광고 믹스 구성 (mix.html)
//
// 단가 출처
//  - 시간대별 단가: data.js 의 timePricing 문자열을 그대로 파싱해서 씁니다.
//    ("24,000,000원" → 24000000 / "7,900,000~13,400,000" → [7900000, 13400000])
//  - 정액·CPM 단가: data.js 의 product.mix 블록에 적힌 숫자를 씁니다.
//
// 계산 규칙
//  - 게재 기간(시작일~종료일)에서 일수를 실제 달력으로 셉니다.
//    평일 단가 행은 기간 안의 평일 수, 휴일 단가 행은 주말 수만 적용됩니다.
//    (휴일 = 토·일. 공휴일 달력은 없으므로 반영되지 않습니다)
//  - 상품을 담으면 판매 단위에 맞춰 기간이 자동으로 잡힙니다.
//    주 단위 상품은 월요일로 맞춰 7일, 나머지는 1일에서 시작합니다.
//  - 시간대 상품: 단가 × 해당 일수 × 구좌  (소재 유형 할증이 있으면 단가에 반영)
//  - 정액 상품:   단가 × 수량 × 구좌
//                 일 단위 → 기간 일수 / 주 단위 → 올림한 주수
//                 시간·2시간 단위 → 기간 일수 × (하루 시간·블록 수)
//  - CPM 상품:    집행 예산 입력 → 노출 = 예산 / CPM × 1000
//                 할증 옵션이 있으면 CPM 에 합산 반영 (예산은 그대로, 노출이 줄어듦)
//  - 예상 클릭 = 예상 노출 × 벤치마크 CTR (mix.ctr)
//  - 노출량 미제공(imps: null) 항목은 노출·클릭 합계에서 제외하고 별도 표기
// ============================================================

(() => {
  "use strict";

  let LANG = I18N.getLang();
  const ui = () => I18N.UI[LANG];
  const mx = () => I18N.UI[LANG].mix;
  const tr = v => I18N.tr(v, LANG);

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }
  const brk = s => esc(tr(s || "")).replace(/\n/g, "<br>");

  // ----- 숫자 파싱 -----
  const toNum = s => {
    const m = String(s ?? "").replace(/,/g, "").match(/\d+/);
    return m ? +m[0] : 0;
  };
  const toRange = s => {
    if (s == null) return null;
    const n = String(s).replace(/,/g, "").match(/\d+/g);
    return n ? [+n[0], +(n[1] ?? n[0])] : null;
  };

  // ----- 표기 -----
  const nf = n => Math.round(n).toLocaleString("en-US");
  const money = n => LANG === "ko" ? `${nf(n)}원` : `KRW ${nf(n)}`;

  // 요약용 축약 금액 (한국어만 억/만 단위)
  function moneyShort(n) {
    if (LANG !== "ko") return `KRW ${nf(n)}`;
    const eok = Math.floor(n / 100000000);
    const man = Math.floor((n % 100000000) / 10000);
    if (eok && man) return `${nf(eok)}억 ${nf(man)}만원`;
    if (eok) return `${nf(eok)}억원`;
    if (man) return `${nf(man)}만원`;
    return `${nf(n)}원`;
  }

  // 합계가 0이면 "0회 노출"로 읽히지 않도록 "-" 로 표기합니다
  const rangeText = r => {
    if (!r || (Math.round(r[0]) === 0 && Math.round(r[1]) === 0)) return "-";
    return Math.round(r[0]) === Math.round(r[1]) ? nf(r[0]) : `${nf(r[0])}~${nf(r[1])}`;
  };
  const plainName = p => tr(p.name).replace(/\n/g, " ");

  // ----- 날짜 -----
  const pad = n => String(n).padStart(2, "0");
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => ymd(new Date());
  function parseDate(s) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s || ""))) return null;
    const d = new Date(s + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
  }
  const addDays = (s, n) => {
    const d = parseDate(s);
    if (!d) return s;
    d.setDate(d.getDate() + n);
    return ymd(d);
  };
  const diffDays = (a, b) => {
    const s = parseDate(a), e = parseDate(b);
    return (s && e) ? Math.round((e - s) / 86400000) : 0;
  };
  // 기간 안의 전체/평일/휴일 일수 (휴일 = 토·일)
  function dayCounts(start, end) {
    const s = parseDate(start), e = parseDate(end);
    if (!s || !e || e < s) return { total: 0, weekday: 0, holiday: 0, bad: true };
    let total = 0, holiday = 0;
    const cur = new Date(s);
    while (cur <= e && total < 400) {
      const w = cur.getDay();
      if (w === 0 || w === 6) holiday++;
      total++;
      cur.setDate(cur.getDate() + 1);
    }
    return { total, holiday, weekday: total - holiday, bad: false };
  }
  // group 이 정확히 "평일"/"휴일" 일 때만 쪼갭니다 ("평일·휴일 공통"은 전 기간)
  const daysForGroup = (dc, group) =>
    group === "평일" ? dc.weekday : group === "휴일" ? dc.holiday : dc.total;

  // ----- 상품 색인 -----
  const PRODUCTS = {};                 // pid -> { p, c }
  const ADDONS = {};                   // 붙는 대상 pid -> 애드온 상품
  const SCOPE = { "naver-mo": "mo", "naver-pc": "pc" };
  AD_DATA.categories.forEach(c => (c.products || []).forEach(p => {
    PRODUCTS[p.id] = { p, c };
    if (p.mix && p.mix.kind === "addon") ADDONS[p.mix.attachTo] = p;
  }));
  const scopeOf = catId => SCOPE[catId] || "svc";
  // 표에서 직접 고를 수 있는 상품 (애드온은 스페셜DA 행에 붙으므로 제외)
  const SELECTABLE = AD_DATA.categories
    .filter(c => c.products && c.products.length)
    .map(c => ({ cat: c, products: c.products.filter(p => p.mix && p.mix.kind !== "addon") }))
    .filter(g => g.products.length);

  const slotKey = t => `${t.group}|${t.slot}`;
  const slotOf = (pid, key) => {
    const e = PRODUCTS[pid];
    if (!e || !key) return null;
    return (e.p.timePricing || []).find(t => slotKey(t) === key) || null;
  };
  const maxQtyOf = (p, t) => (t && t.maxQty) || (p.mix && p.mix.maxQty) || 1;
  const isGenderSlot = (p, t) => !!(t && p.mix && (p.mix.genderSlots || []).includes(t.slot));
  const creativeOf = (m, row) =>
    (m.creativeTypes || []).find(c => c.id === row.creative) || (m.creativeTypes || [])[0] || null;
  const kindOf = pid => (PRODUCTS[pid] && PRODUCTS[pid].p.mix && PRODUCTS[pid].p.mix.kind) || "";

  // ----- 판매 단위 -----
  const isWeekly = m => !!(m && m.kind === "flat" && m.unit === "week");
  const spanOf = m => isWeekly(m) ? 7 : 1;
  // 믹스 표에 붙는 단위 배지
  function unitBadge(m) {
    const u = mx().unitBadge;
    if (!m) return "";
    if (m.kind === "timeslot") return u.slot;
    if (m.kind === "cpm") return u.cpm;
    return u[m.unit] || m.unit;
  }
  // 상품 특성에 맞춰 게재 기간을 잡아줍니다 (주 단위는 월요일 시작 7일)
  function applySpan(row) {
    const e = PRODUCTS[row.pid];
    const m = e && e.p.mix;
    if (!m) return;
    if (isWeekly(m)) {
      const d = parseDate(row.start) || new Date();
      d.setDate(d.getDate() - ((d.getDay() + 6) % 7));   // 월요일로 당김
      row.start = ymd(d);
      row.end = addDays(row.start, 6);
    } else {
      row.end = addDays(row.start, spanOf(m) - 1);
    }
  }

  // ----- 상태 -----
  // 행: { uid, pid, slot, tierId, start, end, qty, perDay, timeNote, spend, addon, sur, gender, creative }
  let MIX = [];
  let USE_PROMO = false;
  let uidSeq = 1;
  // 방금 담은 행 — 표에서 잠깐 반짝여 어디에 들어갔는지 보여줍니다
  const JUST_ADDED = new Set();

  function newRow(over) {
    const r = Object.assign({
      uid: uidSeq++, pid: "", slot: "", tierId: "",
      start: today(), end: today(),
      qty: 1, perDay: 1, timeNote: "", spend: 0, addon: false, sur: {},
      gender: "both", creative: ""
    }, over || {});
    if (!r.sur || typeof r.sur !== "object") r.sur = {};
    return r;
  }

  const genderText = g => g === "m" ? mx().genderM : g === "f" ? mx().genderF : mx().genderBoth;

  // CPM 할증 합계 — 요율을 그대로 더합니다 (10% + 20% = 30%, 곱셈 누적 아님)
  function surchargeRate(m, row) {
    let sum = 0;
    for (const s of (m.surcharges || [])) {
      const v = row.sur ? row.sur[s.id] : null;
      if (s.per) sum += s.rate * Math.max(0, Math.min(s.max || 9, Math.floor(+v || 0)));
      else if (v) sum += s.rate;
    }
    return sum;
  }

  const STORE = "ad-mix-v3";
  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify({ mix: MIX, promo: USE_PROMO }));
    } catch (e) { /* 저장 불가 환경은 무시 */ }
  }
  function restore() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem(STORE) || "null"); } catch (e) { return; }
    if (!raw || !Array.isArray(raw.mix)) return;
    USE_PROMO = !!raw.promo;
    MIX = raw.mix.map(r => {
      const row = newRow(r);
      if (row.pid && !PRODUCTS[row.pid]) return null;
      const m = row.pid ? PRODUCTS[row.pid].p.mix : null;
      if (m && m.kind === "timeslot" && row.slot && !slotOf(row.pid, row.slot)) row.slot = "";
      if (m && m.kind === "flat") {
        const tiers = m.tiers || [];
        if (row.tierId && !tiers.some(t => t.id === row.tierId)) row.tierId = "";
      }
      if (m && (m.creativeTypes || []).length && !m.creativeTypes.some(c => c.id === row.creative)) {
        row.creative = m.creativeTypes[0].id;
      }
      return row;
    }).filter(Boolean);
    uidSeq = MIX.reduce((m, r) => Math.max(m, r.uid || 0), 0) + 1;
  }

  const slotInMix = (pid, key) => MIX.some(r => r.pid === pid && r.slot === key);
  const flatInMix = (pid, tierId) => MIX.some(r => r.pid === pid && r.tierId === tierId);
  const cpmInMix = pid => MIX.some(r => r.pid === pid && kindOf(pid) === "cpm");
  const hasBaseFor = addonPid =>
    MIX.some(r => r.pid === PRODUCTS[addonPid].p.mix.attachTo && r.slot);

  // ============================================================
  // 한 행 계산
  // ============================================================
  function calcRow(row) {
    const out = {
      row, ok: false, cat: null, product: null,
      optionText: "", periodText: "", unitLabel: "", qtyText: "",
      unitPrice: 0, listUnitPrice: 0, total: 0, saved: 0, potential: 0,
      imps: null, clicks: null, notes: [], warn: "", promoApplied: false,
      addonProduct: null, addonTotal: 0, days: null, surcharge: 0
    };
    const e = PRODUCTS[row.pid];
    if (!e || !e.p.mix) return out;

    const p = e.p, m = p.mix, u = mx();
    out.cat = e.c;
    out.product = p;
    out.notes = (m.notes || []).slice();

    const dc = dayCounts(row.start, row.end);
    out.days = dc;
    if (dc.bad) { out.warn = u.badPeriod; return out; }

    let impsMin = 0, impsMax = 0, clkMin = 0, clkMax = 0;
    let hasImps = false, hasClicks = false;
    const addPart = (r, ctr, mult) => {
      if (!r) return;
      hasImps = true;
      impsMin += r[0] * mult;
      impsMax += r[1] * mult;
      if (ctr) {
        hasClicks = true;
        clkMin += r[0] * mult * ctr[0];
        clkMax += r[1] * mult * ctr[1];
      }
    };
    const qty = Math.max(1, +row.qty || 1);

    if (m.kind === "timeslot") {
      const t = slotOf(row.pid, row.slot);
      if (!t) return out;
      const n = daysForGroup(dc, t.group);
      const isGender = isGenderSlot(p, t);
      const cap = isGender ? (row.gender === "both" ? 2 : 1) : Math.min(maxQtyOf(p, t), qty);
      const ct = creativeOf(m, row);
      const rate = ct ? ct.rate : 0;

      out.isGender = isGender;
      out.creativeType = ct;
      out.surcharge = rate;
      out.optionText = [
        isGender ? genderText(row.gender) : "",
        ct && (ct.rate || ct.promo) ? tr(ct.label) : ""
      ].filter(Boolean).join(" · ");
      out.periodText = `${tr(t.group)} · ${tr(t.slot)}`;
      out.unitLabel = tr(t.unit);
      out.listUnitPrice = toNum(t.price);
      out.unitPrice = Math.round(out.listUnitPrice * (1 + rate));
      out.qtyText = u.dayN(n);
      out.units = n;
      out.total = out.unitPrice * n * cap;
      out.qty = cap;
      addPart(toRange(t.imps), m.ctr, n * cap);
      if (t.note) out.notes.unshift(t.note);
      if (n === 0) out.warn = u.noSuchDay(tr(t.group));

      const ad = ADDONS[row.pid];
      if (row.addon && ad) {
        const am = ad.mix;
        out.addonProduct = ad;
        out.addonTotal = (isGender ? am.addGender : am.add) * n * cap;
        out.total += out.addonTotal;
        addPart(am.imps, am.ctr, n * cap);
      }

    } else if (m.kind === "flat") {
      const tier = (m.tiers || []).find(t => t.id === row.tierId) ||
        ((m.tiers || []).length === 1 ? m.tiers[0] : null);
      if (!tier) return out;
      let n;
      if (m.unit === "week") { n = Math.max(1, Math.ceil(dc.total / 7)); out.qtyText = u.weekN(n); }
      else if (m.unit === "hour") { n = dc.total * Math.max(1, +row.perDay || 1); out.qtyText = u.hourN(n); }
      else if (m.unit === "2h") { n = dc.total * Math.max(1, +row.perDay || 1); out.qtyText = u.blockN(n); }
      else { n = dc.total; out.qtyText = u.dayN(n); }

      out.optionText = tier.label ? tr(tier.label) : "";
      out.periodText = row.timeNote || "";
      out.unitLabel = u.units[m.unit] || m.unit;
      out.listUnitPrice = tier.price;
      out.unitPrice = (USE_PROMO && tier.promo) ? tier.promo : tier.price;
      out.promoApplied = !!(USE_PROMO && tier.promo);
      out.units = n;
      out.total = out.unitPrice * n * qty;
      out.qty = qty;
      // 프로모션 절감액 (적용 중이면 saved, 꺼져 있으면 potential)
      if (tier.promo) {
        const gap = (tier.price - tier.promo) * n * qty;
        if (USE_PROMO) out.saved = gap; else out.potential = gap;
      }
      addPart(tier.imps, m.ctr, n * qty);
      if (!tier.imps) out.warn = u.noImps;
      if (isWeekly(m) && (dc.total % 7 !== 0 || (parseDate(row.start) || {}).getDay?.() !== 1)) {
        out.warn = out.warn || u.weekWarn;
      }

    } else if (m.kind === "cpm") {
      const base = (USE_PROMO && m.promo) ? m.promo : m.cpm;
      const sur = surchargeRate(m, row);
      const cpm = Math.round(base * (1 + sur));
      const spend = Math.max(0, +row.spend || 0);
      out.unitLabel = "CPM";
      out.listUnitPrice = Math.round(m.cpm * (1 + sur));
      out.unitPrice = cpm;
      out.surcharge = sur;
      out.promoApplied = !!(USE_PROMO && m.promo);
      out.total = spend;
      out.qty = 1;
      out.units = 1;
      out.qtyText = money(spend);
      const imp = cpm > 0 ? spend / cpm * 1000 : 0;
      addPart([imp, imp], m.ctr, 1);
      if (m.minSpend && spend < m.minSpend) out.warn = u.minSpend(money(m.minSpend));

    } else {
      return out;
    }

    out.imps = hasImps ? [impsMin, impsMax] : null;
    out.clicks = hasClicks ? [clkMin, clkMax] : null;
    out.ok = true;
    return out;
  }

  function totals() {
    const rows = MIX.map(calcRow);
    const t = {
      total: 0, impsMin: 0, impsMax: 0, clkMin: 0, clkMax: 0,
      noImps: 0, impsSpend: 0, filled: 0, saved: 0, potential: 0
    };
    rows.forEach(r => {
      if (!r.ok) return;
      t.filled++;
      t.total += r.total;
      t.saved += r.saved;
      t.potential += r.potential;
      if (r.imps) {
        t.impsMin += r.imps[0];
        t.impsMax += r.imps[1];
        t.impsSpend += r.total;
      } else {
        t.noImps++;
      }
      if (r.clicks) { t.clkMin += r.clicks[0]; t.clkMax += r.clicks[1]; }
    });
    const mid = (t.impsMin + t.impsMax) / 2;
    t.cpm = mid > 0 ? t.impsSpend / mid * 1000 : 0;
    return { rows, t };
  }

  // ============================================================
  // 예산 역산 추천
  // ============================================================
  function suggest(budget, start, days, scope, goal) {
    const end = addDays(start, Math.max(1, days) - 1);
    const dc = dayCounts(start, end);
    const cands = [];
    for (const cat of AD_DATA.categories) {
      if (!cat.products) continue;
      const sc = scopeOf(cat.id);
      if (scope !== "all" && sc !== scope) continue;
      for (const p of cat.products) {
        const m = p.mix;
        if (!m) continue;
        if (m.kind === "timeslot") {
          for (const t of (p.timePricing || [])) {
            const price = toNum(t.price), r = toRange(t.imps);
            const n = daysForGroup(dc, t.group);
            if (!price || !r || !n) continue;
            cands.push({
              kind: "timeslot", pid: p.id, cat: sc, slot: slotKey(t), units: n,
              unitPrice: price, imps: r, ctr: m.ctr, maxQty: maxQtyOf(p, t)
            });
          }
        } else if (m.kind === "flat") {
          const n = m.unit === "week" ? Math.max(1, Math.ceil(dc.total / 7)) : dc.total;
          for (const tier of m.tiers) {
            const price = (USE_PROMO && tier.promo) ? tier.promo : tier.price;
            if (!price || !tier.imps || !n) continue;
            cands.push({
              kind: "flat", pid: p.id, cat: sc, tierId: tier.id, units: n,
              unitPrice: price, imps: tier.imps, ctr: m.ctr, maxQty: 1
            });
          }
        } else if (m.kind === "cpm") {
          const cpm = (USE_PROMO && m.promo) ? m.promo : m.cpm;
          if (cpm > 0) cands.push({ kind: "cpm", pid: p.id, cat: sc, cpm, minSpend: m.minSpend || 0, ctr: m.ctr });
        }
      }
    }

    const key = c => c.kind === "timeslot" ? `${c.pid}|${c.slot}` : `${c.pid}|${c.tierId || ""}`;
    const midOf = r => (r[0] + r[1]) / 2;
    const score = c => {
      const imps = midOf(c.imps);
      const clicks = c.ctr ? imps * (c.ctr[0] + c.ctr[1]) / 2 : 0;
      return (goal === "clicks" ? clicks : imps) / c.unitPrice;
    };

    const units = cands.filter(c => c.kind !== "cpm").sort((a, b) => score(b) - score(a));
    const taken = {}, byKey = {}, spentByPid = {}, tierTaken = {};
    let left = budget, picked = 0;

    const costOf = c => c.unitPrice * c.units;
    const eligible = (c, pool, pidCap) => {
      const k = key(c);
      if ((taken[k] || 0) >= c.maxQty) return false;
      // 정액 상품의 tier 는 택일 옵션이므로 상품당 하나만 담습니다
      if (c.kind === "flat" && tierTaken[c.pid]) return false;
      const cost = costOf(c);
      if (cost <= 0 || cost > pool || cost > left) return false;
      if (picked > 0 && (spentByPid[c.pid] || 0) + cost > pidCap) return false;
      return true;
    };
    const take = c => {
      const k = key(c), cost = costOf(c);
      taken[k] = (taken[k] || 0) + 1;
      byKey[k] = c;
      if (c.kind === "flat") tierTaken[c.pid] = true;
      spentByPid[c.pid] = (spentByPid[c.pid] || 0) + cost;
      left -= cost;
      picked++;
      return cost;
    };

    let guard = 0;
    if (goal === "balance") {
      const cats = [...new Set(units.map(c => c.cat))];
      const share = cats.length ? budget / cats.length : budget;
      for (const cat of cats) {
        let pool = Math.min(share, left);
        while (guard++ < 5000) {
          const c = units.find(x => x.cat === cat && eligible(x, pool, share * 0.7));
          if (!c) break;
          pool -= take(c);
        }
      }
    } else {
      while (guard++ < 5000) {
        const c = units.find(x => eligible(x, left, budget * 0.6));
        if (!c) break;
        take(c);
      }
    }

    const next = [];
    Object.keys(byKey).forEach(k => {
      const c = byKey[k];
      const row = newRow(c.kind === "timeslot"
        ? { pid: c.pid, slot: c.slot, start, end, qty: taken[k] }
        : { pid: c.pid, tierId: c.tierId, start, end, qty: 1 });
      const m = PRODUCTS[c.pid].p.mix;
      if ((m.creativeTypes || []).length) row.creative = m.creativeTypes[0].id;
      next.push(row);
    });

    const cpms = cands.filter(c => c.kind === "cpm");
    const fill = Math.floor(left / 10000) * 10000;
    if (cpms.length && fill > 0) {
      const best = cpms
        .map(c => {
          const per = 1000 / c.cpm;
          const ctrMid = c.ctr ? (c.ctr[0] + c.ctr[1]) / 2 : 0;
          return { c, s: goal === "clicks" ? per * ctrMid : per };
        })
        .sort((a, b) => b.s - a.s)[0].c;
      if (fill >= (best.minSpend || 0)) {
        next.push(newRow({ pid: best.pid, start, end, spend: fill }));
        left -= fill;
      }
    }

    return { items: next, left, weekdays: dc.weekday, holidays: dc.holiday };
  }

  // ============================================================
  // 렌더링 — 상품 선택 (표)
  // ============================================================
  function priceCellHtml(p) {
    const m = p.mix;
    if (m.kind === "flat") {
      return m.tiers.map(t => {
        const label = t.label ? `${esc(tr(t.label))} ` : "";
        if (t.promo) {
          const save = t.price - t.promo;
          return `<span class="pk-price">${label}<s>${esc(money(t.price))}</s>
            <strong>${esc(money(t.promo))}</strong>
            <span class="pk-save">−${esc(money(save))}</span></span>`;
        }
        return `<span class="pk-price">${label}<strong>${esc(money(t.price))}</strong></span>`;
      }).join("");
    }
    if (m.kind === "cpm") {
      if (m.promo && m.promo !== m.cpm) {
        return `<span class="pk-price">CPM <s>${esc(nf(m.cpm))}</s>
          <strong>${esc(nf(m.promo))}</strong>
          <span class="pk-save">−${Math.round((1 - m.promo / m.cpm) * 100)}%</span></span>`;
      }
      return `<span class="pk-price"><strong>CPM ${esc(nf(m.cpm))}</strong></span>`;
    }
    return `<span class="pk-price">${brk(p.price)}</span>`;
  }

  // 담기 버튼 — 담기 전/후가 한눈에 구분되도록 아이콘과 라벨을 함께 바꿉니다
  const addBtn = (attrs, label, on) =>
    `<button class="pc-add${on ? " on" : ""}" ${attrs}>
      <span class="pc-ico">${on ? "✓" : "＋"}</span><span>${esc(label)}</span>
    </button>`;

  function actionCellHtml(p) {
    const m = p.mix, u = mx();
    if (m.kind === "timeslot") {
      const n = MIX.filter(r => r.pid === p.id && r.slot).length;
      return `<button class="pc-add pk-toggle${n ? " on" : ""}" data-toggle="${esc(p.id)}">
        <span class="pc-ico">${n ? "✓" : "＋"}</span>
        <span>${esc(n ? u.addedN(n) : u.addSlots)}</span>
        <span class="pk-caret">▾</span>
      </button>`;
    }
    if (m.kind === "addon") {
      const base = PRODUCTS[m.attachTo] ? plainName(PRODUCTS[m.attachTo].p) : m.attachTo;
      return `<span class="pk-hint${hasBaseFor(p.id) ? " ready" : ""}">${esc(u.addonHint(base))}</span>`;
    }
    if (m.kind === "flat") {
      return `<span class="pk-btns">${m.tiers.map(t => {
        const on = flatInMix(p.id, t.id);
        const label = on ? u.added : (t.label ? tr(t.label) : u.add);
        return addBtn(`data-flat="${esc(p.id)}" data-tier="${esc(t.id)}"`, label, on);
      }).join("")}</span>`;
    }
    if (m.kind === "cpm") {
      const on = cpmInMix(p.id);
      return `<span class="pk-btns">
        ${addBtn(`data-cpm="${esc(p.id)}"`, on ? u.added : u.add, on)}
        <input class="pc-spend" type="number" min="0" step="1000000" placeholder="${esc(u.spendLabel)}" data-spend-for="${esc(p.id)}" />
      </span>`;
    }
    return "";
  }

  // 상품이 믹스에 들어가 있는지 (행 강조용)
  const inMix = p => {
    const m = p.mix;
    if (!m) return false;
    if (m.kind === "timeslot") return MIX.some(r => r.pid === p.id && r.slot);
    if (m.kind === "flat") return MIX.some(r => r.pid === p.id && r.tierId);
    if (m.kind === "cpm") return MIX.some(r => r.pid === p.id);
    return false;
  };

  function slotListHtml(p) {
    let html = "", lastGroup = null;
    for (const t of p.timePricing) {
      if (t.group !== lastGroup) {
        html += `<div class="sl-group">${esc(tr(t.group))}</div>`;
        lastGroup = t.group;
      }
      const on = slotInMix(p.id, slotKey(t));
      html += `
        <label class="sl-row${on ? " on" : ""}">
          <input type="checkbox" data-slot="${esc(p.id)}" data-key="${esc(slotKey(t))}"${on ? " checked" : ""} />
          <span class="sl-time">${esc(tr(t.slot))}</span>
          <span class="sl-unit">${esc(tr(t.unit))}</span>
          <span class="sl-price">${esc(money(toNum(t.price)))}</span>
          <span class="sl-imps">${esc(rangeText(toRange(t.imps)))}</span>
        </label>`;
    }
    return `<div class="sl-list">${html}</div>`;
  }

  function renderPicker() {
    const u = mx();
    const open = new Set([...document.querySelectorAll(".pk-slots.open")].map(el => el.dataset.slotsFor));
    let rowsHtml = "";
    for (const cat of AD_DATA.categories) {
      if (!cat.products || !cat.products.length) continue;
      rowsHtml += `<tr class="pk-cat-row"><td colspan="6">${esc(tr(cat.label))}</td></tr>`;
      for (const p of cat.products) {
        const m = p.mix;
        if (!m) continue;
        const notes = (m.notes || []).map(n => `<span class="pk-note">${esc(tr(n))}</span>`).join("");
        rowsHtml += `
          <tr class="pk-prod${inMix(p) ? " in-mix" : ""}" data-pid="${esc(p.id)}">
            <td class="pk-c-act">${actionCellHtml(p)}</td>
            <td class="pk-c-name">${esc(plainName(p))}${notes}</td>
            <td class="pk-c-unit"><span class="pk-unit">${esc(tr(p.saleType))}</span>
              ${isWeekly(m) ? `<span class="pk-note">${esc(u.weekOnly)}</span>` : ""}</td>
            <td class="pk-c-price">${priceCellHtml(p)}</td>
            <td class="pk-c-imps">${brk(p.impressions)}</td>
            <td class="pk-c-ctr">${brk(p.ctr)}</td>
          </tr>`;
        if (m.kind === "timeslot") {
          const isOpen = open.has(p.id) || MIX.some(r => r.pid === p.id && r.slot);
          rowsHtml += `<tr class="pk-slots${isOpen ? " open" : ""}" data-slots-for="${esc(p.id)}">
            <td colspan="6">${slotListHtml(p)}</td></tr>`;
        }
      }
    }
    document.getElementById("pk-head").innerHTML =
      `<tr>${u.pkCols.map(c => `<th>${esc(c)}</th>`).join("")}</tr>`;
    document.getElementById("pk-body").innerHTML = rowsHtml;
  }

  // ============================================================
  // 렌더링 — 믹스 표
  // ============================================================
  function productSelect(row) {
    const opts = SELECTABLE.map(g =>
      `<optgroup label="${esc(tr(g.cat.label))}">` +
      g.products.map(p =>
        `<option value="${esc(p.id)}"${p.id === row.pid ? " selected" : ""}>${esc(plainName(p))}</option>`).join("") +
      `</optgroup>`).join("");
    return `<select class="mt-sel mt-prod" data-uid="${row.uid}" data-field="pid">
      <option value=""${row.pid ? "" : " selected"}>${esc(mx().pickProduct)}</option>${opts}</select>`;
  }

  // 옵션 열 — 상품의 "무엇을" (성별 / 소재 유형 / 정액 옵션 / CPM 할증)
  function optionCell(row) {
    const u = mx();
    const e = PRODUCTS[row.pid];
    if (!e) return `<span class="mt-na">-</span>`;
    const m = e.p.mix;
    let html = "";

    if (m.kind === "timeslot") {
      const t = slotOf(row.pid, row.slot);
      if (isGenderSlot(e.p, t)) {
        html += `<select class="mt-sel" data-uid="${row.uid}" data-field="gender">
          ${[["both", u.genderBoth], ["m", u.genderM], ["f", u.genderF]].map(([v, l]) =>
            `<option value="${v}"${row.gender === v ? " selected" : ""}>${esc(l)}</option>`).join("")}
        </select>`;
      }
      if ((m.creativeTypes || []).length) {
        html += `<select class="mt-sel" data-uid="${row.uid}" data-field="creative">
          ${m.creativeTypes.map(c =>
            `<option value="${esc(c.id)}"${row.creative === c.id ? " selected" : ""}>${esc(tr(c.label))}${
              c.rate ? ` +${Math.round(c.rate * 100)}%` : (c.promo ? ` 0% ★` : "")}</option>`).join("")}
        </select>`;
      }
      return html || `<span class="mt-na">-</span>`;
    }

    if (m.kind === "cpm" && (m.surcharges || []).length) {
      return m.surcharges.map(s => s.per
        ? `<label class="mt-chk">${esc(tr(s.label))}
             <input class="mt-num" type="number" min="0" max="${s.max || 9}" value="${(row.sur && row.sur[s.id]) || 0}"
               data-uid="${row.uid}" data-field="sur:${esc(s.id)}" />
             <span class="mt-up">×${Math.round(s.rate * 100)}%</span>
           </label>`
        : `<label class="mt-chk">
             <input type="checkbox"${(row.sur && row.sur[s.id]) ? " checked" : ""}
               data-uid="${row.uid}" data-field="sur:${esc(s.id)}" />
             ${esc(tr(s.label))} <span class="mt-up">+${Math.round(s.rate * 100)}%</span>
           </label>`
      ).join("");
    }

    if (m.kind === "flat" && (m.tiers || []).length > 1) {
      const opts = m.tiers.map(t =>
        `<option value="${esc(t.id)}"${t.id === row.tierId ? " selected" : ""}>${esc(tr(t.label || ""))} · ${esc(money((USE_PROMO && t.promo) ? t.promo : t.price))}</option>`).join("");
      return `<select class="mt-sel" data-uid="${row.uid}" data-field="tierId">
        <option value=""${row.tierId ? "" : " selected"}>${esc(u.pickOption)}</option>${opts}</select>`;
    }
    return `<span class="mt-na">-</span>`;
  }

  // 게재 기간 · 시간대 열 — 상품의 "언제" (판매 단위가 드러나게)
  function periodCell(row, r) {
    const u = mx();
    const e = PRODUCTS[row.pid];
    const m = e && e.p.mix;
    const badge = m ? `<span class="mt-unit">${esc(unitBadge(m))}</span>` : "";
    let html = `${badge}
      <span class="mt-dates">
        <input type="date" value="${esc(row.start)}" data-uid="${row.uid}" data-field="start" aria-label="${esc(u.csvCols[3])}" />
        <span class="mt-tilde">~</span>
        <input type="date" value="${esc(row.end)}" data-uid="${row.uid}" data-field="end" aria-label="${esc(u.csvCols[4])}" />
      </span>`;

    if (m && m.kind === "timeslot") {
      const opts = (e.p.timePricing || []).map(t => {
        const k = slotKey(t);
        return `<option value="${esc(k)}"${k === row.slot ? " selected" : ""}>${esc(tr(t.group))} · ${esc(tr(t.slot))} · ${esc(money(toNum(t.price)))}</option>`;
      }).join("");
      html += `<select class="mt-sel" data-uid="${row.uid}" data-field="slot">
        <option value=""${row.slot ? "" : " selected"}>${esc(u.pickOption)}</option>${opts}</select>`;
    }
    if (m && m.kind === "flat" && (m.unit === "hour" || m.unit === "2h")) {
      html += `<span class="mt-inline">
        <input class="mt-num" type="number" min="1" max="24" value="${row.perDay}" data-uid="${row.uid}" data-field="perDay" />
        <span class="mt-sub-i">${esc(m.unit === "hour" ? u.perDayHour : u.perDayBlock)}</span>
      </span>
      <input class="mt-time" type="text" value="${esc(row.timeNote)}" placeholder="${esc(u.timeHint)}"
        data-uid="${row.uid}" data-field="timeNote" />`;
    }
    html += `<span class="mt-sub">${esc(periodSub(r))}</span>`;
    return html;
  }

  function periodSub(r) {
    const u = mx();
    const d = r.days;
    if (!d || d.bad) return "";
    const bits = [u.dayN(d.total)];
    if (d.holiday) bits.push(`${tr("휴일")} ${d.holiday}`);
    return bits.join(" · ");
  }

  function qtyCell(row, r) {
    const e = PRODUCTS[row.pid];
    if (!e) return `<span class="mt-na">-</span>`;
    if (e.p.mix.kind === "cpm") {
      return `<input class="mt-num mt-num-wide" type="number" min="0" step="1000000" value="${row.spend}"
        data-uid="${row.uid}" data-field="spend" />`;
    }
    return `<span class="mt-qty">${esc(r.qtyText || "-")}</span>`;
  }

  function slotsCell(row, r) {
    const e = PRODUCTS[row.pid];
    if (!e) return `<span class="mt-na">-</span>`;
    const m = e.p.mix;
    if (m.kind === "cpm") return `<span class="mt-na">-</span>`;
    const t = m.kind === "timeslot" ? slotOf(row.pid, row.slot) : null;
    if (isGenderSlot(e.p, t)) return `<span class="mt-qty">${r.qty || 1}</span>`;
    const max = m.kind === "timeslot" ? maxQtyOf(e.p, t) : 9;
    if (max <= 1) return `<span class="mt-qty">1</span>`;
    return `<input class="mt-num" type="number" min="1" max="${max}" value="${Math.min(max, row.qty)}"
      data-uid="${row.uid}" data-field="qty" />`;
  }

  function rateCellHtml(r) {
    if (!r.ok) return `<span class="mt-na">-</span>`;
    const showList = r.listUnitPrice && r.listUnitPrice !== r.unitPrice && r.promoApplied;
    return `${showList ? `<s class="mt-list">${esc(money(r.listUnitPrice))}</s>` : ""}
      ${esc(money(r.unitPrice))}
      <span class="mt-sub">/ ${esc(r.unitLabel)}${r.surcharge ? ` · <span class="mt-up">+${Math.round(r.surcharge * 100)}%</span>` : ""}</span>`;
  }

  function clkCellHtml(r) {
    const noteBits = [
      ...r.notes.map(n => tr(n)),
      r.addonTotal ? `${plainName(r.addonProduct)} +${money(r.addonTotal)}` : "",
      r.saved ? `${mx().saveLabel} −${money(r.saved)}` : ""
    ].filter(Boolean);
    return (r.ok ? esc(rangeText(r.clicks)) : `<span class="mt-na">-</span>`)
      + (noteBits.length ? `<span class="mt-sub">${esc(noteBits.join(" / "))}</span>` : "")
      + (r.warn ? `<span class="mt-sub mt-warn">${esc(r.warn)}</span>` : "");
  }

  function mixRowHtml(r) {
    const row = r.row, u = mx();
    const ad = ADDONS[row.pid];
    const addonBtn = (ad && row.slot)
      ? `<button class="mt-addon${row.addon ? " on" : ""}" data-uid="${row.uid}" data-field="addon">
           ${esc(row.addon ? u.addonOnLabel(plainName(ad)) : u.addonAdd(plainName(ad)))}
         </button>`
      : "";
    const cls = [r.ok ? "" : "mt-blank", JUST_ADDED.has(row.uid) ? "mt-added" : ""].filter(Boolean);
    return `
      <tr data-uid="${row.uid}"${cls.length ? ` class="${cls.join(" ")}"` : ""}>
        <td class="mt-c-prod">
          ${productSelect(row)}
          ${r.promoApplied ? `<span class="mi-promo">${esc(u.promoTag)}</span>` : ""}
          ${addonBtn}
        </td>
        <td class="mt-c-opt">${optionCell(row)}</td>
        <td class="mt-c-date">${periodCell(row, r)}</td>
        <td class="mt-c-qty">${qtyCell(row, r)}</td>
        <td class="mt-c-slots">${slotsCell(row, r)}</td>
        <td class="mt-c-rate">${rateCellHtml(r)}</td>
        <td class="mt-c-amt">${r.ok ? `<strong>${esc(money(r.total))}</strong>` : `<span class="mt-na">-</span>`}</td>
        <td class="mt-c-imps">${r.ok ? esc(rangeText(r.imps)) : `<span class="mt-na">-</span>`}
          ${r.ok && !r.imps ? `<span class="mt-sub mt-na">${esc(u.noImps)}</span>` : ""}</td>
        <td class="mt-c-clk">${clkCellHtml(r)}</td>
        <td class="mt-c-del">
          <button class="mi-del" data-del="${row.uid}" aria-label="${esc(u.remove)}" title="${esc(u.remove)}">&times;</button>
        </td>
      </tr>`;
  }

  function footHtml(t) {
    const u = mx();
    if (!t.filled) return "";
    return `<tr>
      <td colspan="6">${esc(u.csvTotal)}</td>
      <td class="mt-c-amt"><strong>${esc(money(t.total))}</strong></td>
      <td class="mt-c-imps">${esc(rangeText([t.impsMin, t.impsMax]))}</td>
      <td class="mt-c-clk">${esc(rangeText([t.clkMin, t.clkMax]))}</td>
      <td></td></tr>`;
  }

  function statsHtml(t) {
    const u = mx();
    return `
      <div class="mp-stat mp-stat-hero">
        <dt>${esc(u.sumBudget)}</dt><dd>${esc(moneyShort(t.total))}</dd>
      </div>
      <div class="mp-stat"><dt>${esc(u.sumImps)}</dt><dd>${esc(rangeText([t.impsMin, t.impsMax]))}</dd></div>
      <div class="mp-stat"><dt>${esc(u.sumClicks)}</dt><dd>${esc(rangeText([t.clkMin, t.clkMax]))}</dd></div>
      ${t.saved
        ? `<div class="mp-stat mp-stat-save"><dt>${esc(u.saveLabel)}</dt><dd>−${esc(moneyShort(t.saved))}</dd></div>`
        : `<div class="mp-stat"><dt>${esc(u.sumCpm)}</dt><dd>${t.cpm ? esc(money(t.cpm)) : "-"}</dd></div>`}`;
  }

  // 프로모션이 있는데 토글이 꺼져 있으면 얼마를 아낄 수 있는지 알려줍니다
  function renderPromoHint(t) {
    const el = document.getElementById("promo-hint");
    const show = !USE_PROMO && t.potential > 0;
    el.hidden = !show;
    if (show) {
      el.innerHTML = `<span>${esc(mx().promoAvail(money(t.potential)))}</span>
        <button class="lc-btn" id="promo-apply">${esc(mx().promoApply)}</button>`;
    }
  }

  function renderTable() {
    const u = mx();
    const { rows, t } = totals();

    document.getElementById("mix-head").innerHTML =
      `<tr>${u.cols.map(c => `<th>${esc(c)}</th>`).join("")}<th></th></tr>`;
    document.getElementById("mix-body").innerHTML = rows.length
      ? rows.map(mixRowHtml).join("")
      : `<tr><td colspan="10" class="mt-empty">${esc(u.emptyMix)}</td></tr>`;
    document.getElementById("mix-foot").innerHTML = footHtml(t);

    document.getElementById("sum-count").textContent = u.itemCount(t.filled);
    document.getElementById("sum-stats").innerHTML = statsHtml(t);

    const warn = document.getElementById("sum-warn");
    warn.hidden = !t.noImps;
    if (t.noImps) warn.textContent = u.noImpsWarn(t.noImps);

    renderPromoHint(t);
    document.getElementById("csv-btn").disabled = !t.filled;
    document.getElementById("clear-btn").disabled = !MIX.length;
    JUST_ADDED.clear();     // 반짝임은 한 번만
  }

  // ============================================================
  // 예산 역산 폼
  // ============================================================
  const AUTO = { budget: 200000000, start: "", days: 7, scope: "all", goal: "imps" };
  const readAuto = () => {
    const g = id => document.getElementById(id);
    if (!g("auto-budget")) return;
    AUTO.budget = Math.max(0, +g("auto-budget").value || 0);
    AUTO.start = g("auto-start").value || today();
    AUTO.days = Math.max(1, +g("auto-days").value || 1);
    AUTO.scope = g("auto-scope").value;
    AUTO.goal = g("auto-goal").value;
  };

  function renderAuto() {
    const u = mx();
    readAuto();
    if (!AUTO.start) AUTO.start = today();
    const sel = (v, cur) => v === cur ? " selected" : "";
    document.getElementById("auto-title").textContent = u.autoTitle;
    document.getElementById("auto-body").innerHTML = `
      <div class="auto-grid">
        <label>${esc(u.autoBudget)}
          <input type="number" id="auto-budget" min="0" step="10000000" value="${AUTO.budget}" />
        </label>
        <label>${esc(u.autoStart)}
          <input type="date" id="auto-start" value="${esc(AUTO.start)}" />
        </label>
        <label>${esc(u.autoDays)}
          <input type="number" id="auto-days" min="1" max="365" value="${AUTO.days}" />
        </label>
        <label>${esc(u.autoScope)}
          <select id="auto-scope">
            <option value="all"${sel("all", AUTO.scope)}>${esc(u.scopeAll)}</option>
            <option value="mo"${sel("mo", AUTO.scope)}>${esc(u.scopeMo)}</option>
            <option value="pc"${sel("pc", AUTO.scope)}>${esc(u.scopePc)}</option>
            <option value="svc"${sel("svc", AUTO.scope)}>${esc(u.scopeSvc)}</option>
          </select>
        </label>
        <label>${esc(u.autoGoal)}
          <select id="auto-goal">
            <option value="imps"${sel("imps", AUTO.goal)}>${esc(u.goalImps)}</option>
            <option value="clicks"${sel("clicks", AUTO.goal)}>${esc(u.goalClicks)}</option>
            <option value="balance"${sel("balance", AUTO.goal)}>${esc(u.goalBalance)}</option>
          </select>
        </label>
      </div>
      <div class="auto-foot">
        <button class="lc-btn" id="auto-run">${esc(u.autoRun)}</button>
        <span class="auto-warn">${esc(u.autoWarn)}</span>
      </div>
      <p class="auto-result" id="auto-result"></p>`;
  }

  function runAuto() {
    const u = mx();
    readAuto();
    const res = suggest(AUTO.budget, AUTO.start, AUTO.days, AUTO.scope, AUTO.goal);
    const out = document.getElementById("auto-result");
    if (!res.items.length) {
      out.textContent = u.autoNone;
      return;
    }
    MIX = res.items;
    out.textContent = u.autoDone(res.items.length, money(res.left))
      + (res.holidays ? " · " + u.autoSplit(res.weekdays, res.holidays) : "");
    save();
    renderPicker();
    renderTable();
  }

  // ============================================================
  // CSV
  // ============================================================
  function toCsv() {
    const u = mx();
    const { rows, t } = totals();
    const q = v => typeof v === "number" ? String(Math.round(v)) : `"${String(v ?? "").replace(/"/g, '""')}"`;
    const line = arr => arr.map(q).join(",");

    const out = [
      line([u.docTitle, `${u.csvNote} ${AD_DATA.updatedAt}`, ui().vatNote, u.holidayNote]),
      "",
      line(u.csvCols)
    ];
    rows.filter(r => r.ok).forEach(r => out.push(line([
      tr(r.cat.label),
      plainName(r.product) + (r.addonProduct && r.addonTotal ? ` (+${plainName(r.addonProduct)})` : ""),
      [r.optionText, r.periodText].filter(Boolean).join(" / "),
      r.row.start,
      r.row.end,
      r.unitLabel,
      r.qty,
      r.units,
      r.unitPrice,
      r.total,
      r.imps ? r.imps[0] : "",
      r.imps ? r.imps[1] : "",
      r.clicks ? r.clicks[0] : "",
      r.clicks ? r.clicks[1] : "",
      [
        ...r.notes.map(n => tr(n)),
        r.saved ? `${u.saveLabel} -${money(r.saved)}` : "",
        r.warn
      ].filter(Boolean).join(" / ")
    ])));
    out.push("");
    out.push(line([u.csvTotal, "", "", "", "", "", "", "", "", t.total, t.impsMin, t.impsMax, t.clkMin, t.clkMax,
      t.saved ? `${u.saveLabel} -${money(t.saved)}` : ""]));
    // Excel이 UTF-8로 열 수 있도록 BOM(U+FEFF)을 붙입니다
    const BOM = String.fromCharCode(0xFEFF);
    return BOM + out.join("\r\n");
  }

  function downloadCsv() {
    const blob = new Blob([toCsv()], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mx().csvFile}_${AD_DATA.updatedAt}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  // ============================================================
  // 전체 렌더링 / 이벤트
  // ============================================================
  function renderAll() {
    const u = ui(), m = u.mix;
    document.title = m.docTitle;
    document.getElementById("tab-nav").innerHTML =
      `<a href="index.html">${esc(m.tabGuide)}</a><a class="active" href="mix.html">${esc(m.tabMix)}</a>`;
    document.getElementById("mix-badge").textContent = m.badge;
    document.getElementById("mix-title").innerHTML = m.titleHtml;
    document.getElementById("mix-lead").textContent = m.lead;
    document.getElementById("pick-title").textContent = m.pick;
    document.getElementById("promo-label").textContent = m.promoToggle;
    document.getElementById("promo-toggle").checked = USE_PROMO;
    document.getElementById("sum-title").textContent = m.sumTitle;
    document.getElementById("add-row").textContent = m.addRow;
    document.getElementById("csv-btn").textContent = m.csvBtn;
    document.getElementById("clear-btn").textContent = m.clearAll;
    document.getElementById("mix-note").textContent = m.holidayNote;
    document.getElementById("page-footer").innerHTML = u.footerHtml;

    document.getElementById("lang-label").textContent = I18N.LANG_LABELS[LANG];
    document.getElementById("lang-menu").innerHTML = Object.entries(I18N.LANG_LABELS)
      .map(([code, label]) => `<button data-lang="${code}" class="${code === LANG ? "active" : ""}">${label}</button>`)
      .join("");

    renderAuto();
    renderPicker();
    renderTable();
  }

  restore();
  renderAll();
  I18N.setLang(LANG);

  // ----- 언어 선택 -----
  const langBtn = document.getElementById("lang-btn");
  const langMenu = document.getElementById("lang-menu");
  langBtn.addEventListener("click", e => {
    e.stopPropagation();
    const open = langMenu.classList.toggle("open");
    langBtn.setAttribute("aria-expanded", String(open));
  });
  langMenu.addEventListener("click", e => {
    const btn = e.target.closest("button[data-lang]");
    if (!btn) return;
    LANG = btn.dataset.lang;
    I18N.setLang(LANG);
    langMenu.classList.remove("open");
    langBtn.setAttribute("aria-expanded", "false");
    renderAll();
  });

  // ----- 상품 선택 표 -----
  const picker = document.getElementById("pk-body");

  // 새 행은 첫 행의 기간을 이어받습니다.
  // (직전 행 기준으로 하면 주 단위 상품의 월요일 스냅이 뒤 행까지 밀고 갑니다)
  const basePeriod = () => {
    const first = MIX[0];
    return first ? { start: first.start, end: first.end } : {};
  };
  // 상품을 담을 때 판매 단위에 맞춰 기간·기본 옵션을 채웁니다
  function makeRow(over) {
    const first = MIX[0];
    const row = newRow(Object.assign({}, basePeriod(), over));
    const m = PRODUCTS[row.pid] && PRODUCTS[row.pid].p.mix;
    if (m && (m.creativeTypes || []).length && !row.creative) row.creative = m.creativeTypes[0].id;
    // 주 단위 상품은 항상 월~일로 맞추고, 그 외에는 첫 행일 때만 상품 기본 기간을 씁니다
    if (isWeekly(m) || !first) applySpan(row);
    JUST_ADDED.add(row.uid);
    return row;
  }

  picker.addEventListener("change", e => {
    const cb = e.target.closest("input[data-slot]");
    if (!cb) return;
    const pid = cb.dataset.slot, key = cb.dataset.key;
    if (cb.checked) MIX.push(makeRow({ pid, slot: key }));
    else MIX = MIX.filter(r => !(r.pid === pid && r.slot === key));
    cb.closest(".sl-row").classList.toggle("on", cb.checked);
    save();
    syncBadges();
    renderTable();
  });

  picker.addEventListener("click", e => {
    const toggle = e.target.closest("button[data-toggle]");
    if (toggle) {
      const el = picker.querySelector(`.pk-slots[data-slots-for="${toggle.dataset.toggle}"]`);
      if (el) el.classList.toggle("open");
      return;
    }
    const flat = e.target.closest("button[data-flat]");
    if (flat) {
      const pid = flat.dataset.flat, tierId = flat.dataset.tier;
      if (flatInMix(pid, tierId)) MIX = MIX.filter(r => !(r.pid === pid && r.tierId === tierId));
      else MIX.push(makeRow({ pid, tierId }));
      save();
      renderPicker();
      renderTable();
      return;
    }
    const cpm = e.target.closest("button[data-cpm]");
    if (cpm) {
      const pid = cpm.dataset.cpm;
      if (cpmInMix(pid)) {
        MIX = MIX.filter(r => r.pid !== pid);
      } else {
        const input = picker.querySelector(`input[data-spend-for="${pid}"]`);
        const m = PRODUCTS[pid].p.mix;
        const spend = Math.max(0, +(input && input.value) || 0) || m.minSpend || 10000000;
        MIX.push(makeRow({ pid, spend }));
      }
      save();
      renderPicker();
      renderTable();
    }
  });

  // 담김 상태 표시만 갱신 (시간대 목록 펼침 상태를 유지하기 위해 다시 그리지 않습니다)
  function syncBadges() {
    const u = mx();
    picker.querySelectorAll(".pk-prod[data-pid]").forEach(el => {
      const pid = el.dataset.pid;
      const e = PRODUCTS[pid];
      if (e) el.classList.toggle("in-mix", inMix(e.p));
      if (kindOf(pid) !== "timeslot") return;
      const n = MIX.filter(r => r.pid === pid && r.slot).length;
      const btn = el.querySelector("button[data-toggle]");
      if (!btn) return;
      btn.classList.toggle("on", n > 0);
      btn.querySelector(".pc-ico").textContent = n ? "✓" : "＋";
      btn.querySelectorAll("span")[1].textContent = n ? u.addedN(n) : u.addSlots;
    });
    picker.querySelectorAll(".pk-hint").forEach(el => {
      const pid = el.closest(".pk-prod").dataset.pid;
      if (kindOf(pid) === "addon") el.classList.toggle("ready", hasBaseFor(pid));
    });
  }

  // ----- 믹스 표 -----
  const body = document.getElementById("mix-body");
  const rowOf = el => MIX.find(r => r.uid === +el.dataset.uid);

  body.addEventListener("input", e => {
    const f = e.target.closest("[data-field]");
    if (!f || f.tagName === "SELECT") return;
    const row = rowOf(f);
    if (!row) return;
    const field = f.dataset.field;
    if (field.startsWith("sur:")) {
      row.sur = row.sur || {};
      row.sur[field.slice(4)] = f.type === "checkbox" ? f.checked : Math.max(0, +f.value || 0);
    }
    else if (field === "timeNote") row.timeNote = f.value;
    else if (field === "start") {
      // 시작일을 옮기면 기간 길이를 유지한 채 종료일도 함께 이동합니다.
      // 표를 다시 그리면 입력 중 포커스를 잃으므로 종료일 입력값만 직접 고칩니다.
      const span = diffDays(row.start, row.end);
      row.start = f.value;
      if (parseDate(row.start)) {
        row.end = addDays(row.start, Math.max(0, span));
        const endInput = f.closest("td").querySelector('input[data-field="end"]');
        if (endInput) endInput.value = row.end;
      }
    }
    else if (field === "end") row.end = f.value;
    else if (field === "spend") row.spend = Math.max(0, +f.value || 0);
    else if (field === "qty") row.qty = Math.max(1, +f.value || 1);
    else if (field === "perDay") row.perDay = Math.max(1, +f.value || 1);
    save();
    refreshRow(row);
  });

  body.addEventListener("change", e => {
    const chk = e.target.closest('input[type="checkbox"][data-field]');
    if (chk) {
      const row = rowOf(chk);
      if (!row) return;
      row.sur = row.sur || {};
      row.sur[chk.dataset.field.slice(4)] = chk.checked;
      save();
      refreshRow(row);
      return;
    }
    const sel = e.target.closest("select[data-field]");
    if (!sel) return;
    const row = rowOf(sel);
    if (!row) return;
    const field = sel.dataset.field;
    if (field === "pid") {
      row.pid = sel.value;
      row.slot = ""; row.tierId = ""; row.addon = false; row.qty = 1;
      row.gender = "both"; row.creative = "";
      const m = row.pid && PRODUCTS[row.pid].p.mix;
      if (m && m.kind === "flat" && (m.tiers || []).length === 1) row.tierId = m.tiers[0].id;
      if (m && m.kind === "cpm" && !row.spend) row.spend = m.minSpend || 10000000;
      if (m && (m.creativeTypes || []).length) row.creative = m.creativeTypes[0].id;
      // 주 단위 상품만 기간을 재설정합니다 (월~일 고정). 나머지는 잡아둔 기간을 유지합니다.
      if (isWeekly(m)) applySpan(row);
    } else if (field === "slot") {
      row.slot = sel.value;
    } else if (field === "tierId") {
      row.tierId = sel.value;
    } else if (field === "gender" || field === "creative") {
      row[field] = sel.value;
      save();
      refreshRow(row);
      return;
    }
    save();
    renderPicker();
    renderTable();
  });

  body.addEventListener("click", e => {
    const del = e.target.closest("button[data-del]");
    if (del) {
      MIX = MIX.filter(r => r.uid !== +del.dataset.del);
      save();
      renderPicker();
      renderTable();
      return;
    }
    const ad = e.target.closest('button[data-field="addon"]');
    if (ad) {
      const row = rowOf(ad);
      if (!row) return;
      row.addon = !row.addon;
      save();
      renderTable();
    }
  });

  // 입력 중 포커스를 잃지 않도록 해당 행의 파생 셀과 합계만 다시 씁니다
  function refreshRow(row) {
    const tr0 = body.querySelector(`tr[data-uid="${row.uid}"]`);
    const r = calcRow(row);
    if (tr0) {
      const set = (sel, html) => { const el = tr0.querySelector(sel); if (el) el.innerHTML = html; };
      const u = mx();
      set(".mt-c-rate", rateCellHtml(r));
      set(".mt-c-amt", r.ok ? `<strong>${esc(money(r.total))}</strong>` : `<span class="mt-na">-</span>`);
      set(".mt-c-imps", r.ok
        ? `${esc(rangeText(r.imps))}${!r.imps ? `<span class="mt-sub mt-na">${esc(u.noImps)}</span>` : ""}`
        : `<span class="mt-na">-</span>`);
      set(".mt-c-clk", clkCellHtml(r));
      const dsub = tr0.querySelector(".mt-c-date .mt-sub");
      if (dsub) dsub.textContent = periodSub(r);
      const qplain = tr0.querySelector(".mt-c-qty .mt-qty");
      if (qplain) qplain.textContent = r.qtyText || "-";
      const splain = tr0.querySelector(".mt-c-slots .mt-qty");
      if (splain) splain.textContent = r.ok ? r.qty : 1;
      tr0.classList.toggle("mt-blank", !r.ok);
    }
    refreshTotals();
  }

  function refreshTotals() {
    const u = mx();
    const { t } = totals();
    document.getElementById("sum-count").textContent = u.itemCount(t.filled);
    document.getElementById("sum-stats").innerHTML = statsHtml(t);
    const warn = document.getElementById("sum-warn");
    warn.hidden = !t.noImps;
    if (t.noImps) warn.textContent = u.noImpsWarn(t.noImps);
    document.getElementById("mix-foot").innerHTML = footHtml(t);
    renderPromoHint(t);
    document.getElementById("csv-btn").disabled = !t.filled;
    document.getElementById("clear-btn").disabled = !MIX.length;
  }

  // ----- 액션 -----
  document.getElementById("add-row").addEventListener("click", () => {
    MIX.push(newRow(basePeriod()));
    save();
    renderTable();
    const last = body.querySelector("tr:last-child .mt-prod");
    if (last) last.focus();
  });

  document.getElementById("promo-toggle").addEventListener("change", e => {
    USE_PROMO = e.target.checked;
    save();
    renderPicker();
    renderTable();
  });

  document.getElementById("promo-hint").addEventListener("click", e => {
    if (!e.target.closest("#promo-apply")) return;
    USE_PROMO = true;
    document.getElementById("promo-toggle").checked = true;
    save();
    renderPicker();
    renderTable();
  });

  document.getElementById("csv-btn").addEventListener("click", downloadCsv);

  document.getElementById("clear-btn").addEventListener("click", () => {
    if (!MIX.length) return;
    if (!confirm(mx().clearConfirm)) return;
    MIX = [];
    save();
    renderPicker();
    renderTable();
  });

  document.getElementById("auto-body").addEventListener("click", e => {
    if (e.target.closest("#auto-run")) runAuto();
  });

  document.addEventListener("click", e => {
    if (!e.target.closest(".lang-switch")) {
      langMenu.classList.remove("open");
      langBtn.setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      langMenu.classList.remove("open");
      langBtn.setAttribute("aria-expanded", "false");
    }
  });
})();
