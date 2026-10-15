// Engine. Every number the app shows is produced here, so the chain from a
// parameter to a duration can be traced in one file.

export const R_GAS = 8.314; // J per mol per K
const TREF_K = 298.15; // 25 C, the temperature at which the tabulated tau values apply
const SEC_PER_YR = 3.15576e7;
const SEC_PER_MYR = SEC_PER_YR * 1e6;

export const secPerYr = SEC_PER_YR;
export const secPerMyr = SEC_PER_MYR;

export const geomean = (a, b) => Math.sqrt(a * b);
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/* ---------------- temperature ---------------- */

// tau(T) = tau(Tref) * exp( (Ea/R) * (1/T - 1/Tref) ).
// Cooling below Tref makes 1/T larger, so tau grows. Heating shrinks it.
export function arrhenius(tau, tempC, EaKJ) {
  const T = tempC + 273.15;
  if (T <= 0) return Infinity;
  return tau * Math.exp((EaKJ * 1000 / R_GAS) * (1 / T - 1 / TREF_K));
}

// Activation energy derived from two measured half-lives of the same reaction.
// Used in the app for RNA phosphodiester hydrolysis: 4 yr at 25 C, 9 days at 100 C.
export function eaFromTwoPoints(tau1, t1C, tau2, t2C) {
  const T1 = t1C + 273.15, T2 = t2C + 273.15;
  return (R_GAS * Math.log(tau1 / tau2)) / (1 / T1 - 1 / T2) / 1000; // kJ per mol
}

// Illustrative Hadean cooling curve. Tier C. Log-linear interpolation in
// temperature between editable anchor points, which are ages in Ga.
export function tempAtAge(anchors, ageGa) {
  const a = [...anchors].sort((x, y) => y.age - x.age); // oldest first
  if (ageGa >= a[0].age) return a[0].t;
  if (ageGa <= a[a.length - 1].age) return a[a.length - 1].t;
  for (let i = 0; i < a.length - 1; i++) {
    const p = a[i], q = a[i + 1];
    if (ageGa <= p.age && ageGa >= q.age) {
      const f = (p.age - ageGa) / (p.age - q.age);
      return Math.exp(Math.log(p.t) * (1 - f) + Math.log(q.t) * f);
    }
  }
  return a[a.length - 1].t;
}

// Oldest age at which the surface was already at or below a chosen temperature.
export function ageAtTemp(anchors, tempC) {
  const a = [...anchors].sort((x, y) => y.age - x.age);
  if (tempC >= a[0].t) return a[0].age;
  if (tempC <= a[a.length - 1].t) return a[a.length - 1].age;
  for (let i = 0; i < a.length - 1; i++) {
    const p = a[i], q = a[i + 1];
    if (tempC <= p.t && tempC >= q.t) {
      const f = (Math.log(p.t) - Math.log(tempC)) / (Math.log(p.t) - Math.log(q.t));
      return p.age - f * (p.age - q.age);
    }
  }
  return a[a.length - 1].age;
}

/* ---------------- envelope ---------------- */

export function computeEnvelope(p) {
  let nearGa, nearLabel, nearBasis;
  if (p.nearMode === "temperature") {
    nearGa = ageAtTemp(p.coolingAnchors, p.startTempC);
    nearLabel = "Surface at or below " + p.startTempC + " C";
    nearBasis = "Read off the cooling curve, which is Tier C and illustrative.";
  } else if (p.nearMode === "manual") {
    nearGa = p.nearManualGa;
    nearLabel = "Set by hand";
    nearBasis = "Typed in directly.";
  } else {
    const ev = p.nearOptions.find((o) => o.id === p.nearEventId) || p.nearOptions[0];
    nearGa = ev.age;
    nearLabel = ev.label;
    nearBasis = ev.basis;
  }
  let farGa, farLabel, farBasis;
  if (p.farMode === "manual") {
    farGa = p.farManualGa;
    farLabel = "Set by hand";
    farBasis = "Typed in directly.";
  } else {
    const ev = p.farOptions.find((o) => o.id === p.farEventId) || p.farOptions[0];
    farGa = ev.age;
    farLabel = ev.label;
    farBasis = ev.basis;
  }
  const budgetMyr = (nearGa - farGa) * 1000;
  const tempAtNear = tempAtAge(p.coolingAnchors, nearGa);
  return {
    nearGa, farGa, nearLabel, farLabel, nearBasis, farBasis,
    budgetMyr,
    valid: budgetMyr > 0,
    tempAtNear,
    workingTempC: p.tempMode === "curve" ? tempAtNear : p.chemTempC,
  };
}

/* ---------------- chemistry to probability ---------------- */

// Da = tau_loss / tau_transfer. p = Da / (1 + Da). This is the handoff criterion
// restated as a probability, not an extra assumption.
export function handoffState(h, tempC, eaTransfer, eaLoss) {
  const ttRef = geomean(h.tau_transfer_low_s, h.tau_transfer_high_s);
  const tlRef = geomean(h.tau_loss_low_s, h.tau_loss_high_s);
  const tt = arrhenius(ttRef, tempC, eaTransfer);
  const tl = arrhenius(tlRef, tempC, eaLoss);
  const da = tl / tt;
  const p = da / (1 + da);
  const l = Math.log10(da);
  let verdict = "marginal, on the diagonal", cls = "v-marginal";
  if (l >= 2) { verdict = "clear pass"; cls = "v-pass"; }
  else if (l >= 1) { verdict = "pass, narrow margin"; cls = "v-pass"; }
  else if (l <= -1) { verdict = "perish"; cls = "v-fail"; }
  return { tauTransferRef: ttRef, tauLossRef: tlRef, tauTransfer: tt, tauLoss: tl, da, p, logDa: l, verdict, verdictClass: cls };
}

// Same as handoffState, but with multipliers on the two times, applied after the
// temperature correction. Used by the mineral surface layer.
export function handoffStateScaled(h, tempC, eaTransfer, eaLoss, mTransfer = 1, mLoss = 1) {
  const base = handoffState(h, tempC, eaTransfer, eaLoss);
  if (mTransfer === 1 && mLoss === 1) return { ...base, mTransfer: 1, mLoss: 1, base };
  const tt = base.tauTransfer * mTransfer;
  const tl = base.tauLoss * mLoss;
  const da = tl / tt;
  const pp = da / (1 + da);
  const l = Math.log10(da);
  let verdict = "marginal, on the diagonal", cls = "v-marginal";
  if (l >= 2) { verdict = "clear pass"; cls = "v-pass"; }
  else if (l >= 1) { verdict = "pass, narrow margin"; cls = "v-pass"; }
  else if (l <= -1) { verdict = "perish"; cls = "v-fail"; }
  return { ...base, tauTransfer: tt, tauLoss: tl, da, p: pp, logDa: l, verdict, verdictClass: cls, mTransfer, mLoss, base };
}

/* ---------------- mineral surfaces, S2 to S4 ---------------- */

// Phosphate is the model adsorbate. All affinities in litres per micromole.
// Returns how strongly the surface holds, how much it protects and how much it
// gathers, plus the three rung multipliers. Every step is written out so the UI
// can show it.
export const SURFACE_RUNGS = ["S2", "S3", "S4"];

export function surfaceState(mineral, cond, p) {
  const none = !mineral || mineral.id === "none" || !(mineral.ssa_m2_g > 0);
  const pH = cond.pH, loading = cond.loading;
  const C = p.phosphateUM;
  if (none) {
    return { none: true, mineral, pH, loading, kDirect: 0, kBridge: 0, K: 0, negFrac: 0, theta: 0, qmax: 0, kd: 0, x: 0,
      fBound: 0, cf: 1, pfEff: 1, lossGain: 1, s4Gain: 1,
      mult: { S2: { t: 1, l: 1 }, S3: { t: 1, l: 1 }, S4: { t: 1, l: 1 } } };
  }
  const kDirect = mineral.k7_l_umol * Math.pow(10, mineral.ph_slope * (7 - pH));
  const negFrac = 1 / (1 + Math.pow(10, mineral.pzc - pH));
  const bridgeSat = p.divalentMM / (p.divalentMM + p.bridgeHalfMM);
  const kBridge = p.bridgeK * bridgeSat * negFrac;
  const K = kDirect + kBridge;
  const theta = (K * C) / (1 + K * C);
  const qmax = mineral.gmax_umol_m2 * mineral.ssa_m2_g; // umol per g
  const kd = (qmax * K) / (1 + K * C); // L per g
  const x = kd * loading;
  const fBound = x / (1 + x);
  const cf = 1 + x;
  const pfEff = 1 + (p.protectionFactor - 1) / (1 + K / p.damageK);
  const lossGain = (1 - fBound) + fBound * pfEff;
  const s4Gain = 1 + (cf - 1) * (1 - theta) * (1 - mineral.f_locked);
  return {
    none: false, mineral, pH, loading, kDirect, kBridge, bridgeSat, K, negFrac, theta, qmax, kd, x,
    fBound, cf, pfEff, lossGain, s4Gain,
    mult: {
      S2: { t: 1, l: lossGain },
      S3: { t: 1 / cf, l: lossGain },
      S4: { t: 1 / s4Gain, l: lossGain },
    },
  };
}

// Multipliers for one handoff on one rung. If the handoff already assumes a
// surface, apply the ratio chosen / reference, so the surface is not counted twice.
export function surfaceMultipliers(h, rungId, sChosen, model, cond, p) {
  if (!SURFACE_RUNGS.includes(rungId) || !p.surfaceRungs || !p.surfaceRungs[rungId]) return { t: 1, l: 1, ref: null, applied: false };
  const mc = sChosen.mult[rungId];
  if (h && h.surface_reference) {
    const refMin = (model.minerals || []).find((m) => m.id === h.surface_reference);
    const sRef = surfaceState(refMin, cond, p);
    const mr = sRef.mult[rungId];
    return { t: mc.t / mr.t, l: mc.l / mr.l, ref: refMin ? refMin.name : h.surface_reference, applied: true };
  }
  return { t: mc.t, l: mc.l, ref: null, applied: !sChosen.none };
}

// Which surface and conditions apply to a scenario under the current mode.
export function surfaceForScenario(sc, p, model) {
  const mins = model.minerals || [];
  if (p.surfaceMode === "off") return { mineral: mins.find((m) => m.id === "none"), cond: { pH: 7, loading: 0 }, off: true };
  if (p.surfaceMode === "one") {
    return { mineral: mins.find((m) => m.id === p.surfaceMineral) || mins[0], cond: { pH: p.surfacePH, loading: p.surfaceLoading } };
  }
  const o = (p.scenarioSurface && p.scenarioSurface[sc.id]) || {};
  const id = o.mineral || sc.surface_mineral || "none";
  return {
    mineral: mins.find((m) => m.id === id) || mins[0],
    cond: { pH: o.pH != null ? o.pH : (sc.surface_ph != null ? sc.surface_ph : 7), loading: o.loading != null ? o.loading : (sc.surface_loading_g_l != null ? sc.surface_loading_g_l : 1) },
  };
}

/* ---------------- the five terms ---------------- */

// T4. Class 3. Crossing the error threshold, then fixing a trait in a population.
export function computeT4(p) {
  const genPerYr = SEC_PER_YR / p.generationTimeS;
  const gensToFix = p.genFixFactor * p.popSize; // neutral fixation scales with N
  const fixYr = gensToFix / genPerYr;
  const errorYr = p.errorThresholdMyr * 1e6;
  return {
    fixMyr: fixYr / 1e6,
    errorMyr: p.errorThresholdMyr,
    totalMyr: fixYr / 1e6 + p.errorThresholdMyr,
    genPerYr, gensToFix,
  };
}

// A whole scenario. Returns every intermediate so the UI can show the chain.
export function auditScenario(sc, p, model) {
  const temp = p.effectiveTempC;

  // T1. Setting availability. Scenario range, geometric mean, times the land factor.
  const landFactor = sc.requires_subaerial_land ? p.landUncertaintyFactor : 1;
  const t1 = geomean(sc.t1_low, sc.t1_high) * landFactor * p.t1Scale;

  // The driving cycle, needed first because it can also pay for a step.
  const cycle = model.cycles.find((c) => c.name === p.cycleName);
  const tCycleS = cycle ? geomean(cycle.hadean_period_s_low, cycle.hadean_period_s_high) : 43200;

  // T2. Chemistry. Sum of temperature-corrected transfer times over the chosen rungs.
  const rungs = [];
  let t2Sec = 0, pJoint = 1;
  const surf = model.minerals ? surfaceForScenario(sc, p, model) : null;
  const sState = surf && !surf.off ? surfaceState(surf.mineral, surf.cond, p) : null;
  for (const rid of p.activeRungs) {
    const hid = p.rungHandoff[rid];
    const rung = model.rungs.find((r) => r.id === rid);
    if (!hid || hid === "none") {
      rungs.push({ rung: rid, rungName: rung ? rung.name : rid, handoff: null, p: 1, da: Infinity, tauTransfer: 0, verdict: "no rate gate", verdictClass: "v-pass" });
      continue;
    }
    const h = model.handoffs.find((x) => x.id === hid);
    if (!h) continue;
    const sm = sState ? surfaceMultipliers(h, rid, sState, model, surf.cond, p) : { t: 1, l: 1, ref: null, applied: false };
    const st = handoffStateScaled(h, temp, p.eaTransfer, p.eaLoss, sm.t, sm.l);
    const cur = cycleCurrency(h, st, cycle, tCycleS, p);
    if (cur.on) {
      t2Sec += cur.tauTransfer * cur.bonds;
      pJoint *= cur.p;
      rungs.push({ rung: rid, rungName: rung ? rung.name : rid, handoff: h, ...st,
        tauTransfer: cur.tauTransfer, tauLoss: cur.tauLoss, da: cur.da, logDa: Math.log10(cur.da), p: cur.p,
        verdict: cur.verdict, verdictClass: cur.verdictClass, surface: sm, pNoSurface: st.base.p, currency: cur, pClock: st.p });
      continue;
    }
    t2Sec += st.tauTransfer;
    pJoint *= st.p;
    rungs.push({ rung: rid, rungName: rung ? rung.name : rid, handoff: h, ...st, surface: sm, pNoSurface: st.base.p, currency: cur, pClock: st.p });
  }
  const t2 = (t2Sec / SEC_PER_MYR) * p.t2Scale;

  // T3. Coincidence waiting time.
  //   T3 = n_successes * T_cycle / (p_joint * N_sites)
  const nSites = geomean(sc.n_parallel_sites_low, sc.n_parallel_sites_high) * p.siteScale;
  const attemptsPerS = (pJoint * nSites) / tCycleS;
  const t3Sec = p.successesNeeded / attemptsPerS;
  const t3 = t3Sec / SEC_PER_MYR;

  // T4. The Class 3 floor. Same for every scenario, by design.
  const t4obj = computeT4(p);
  const t4 = t4obj.totalMyr;

  // T5. Building LUCA's ecosystem. Same for every scenario, like T4.
  const t5obj = computeT5(p);
  const t5 = t5obj.totalMyr;

  const total = t1 + t2 + t3 + t4 + t5;
  const terms = { T1: t1, T2: t2, T3: t3, T4: t4, T5: t5 };
  let dominant = "T1";
  for (const k of ["T2", "T3", "T4", "T5"]) if (terms[k] > terms[dominant]) dominant = k;

  return {
    scenario: sc, t1, t2, t3, t4, t5, t5detail: t5obj, total, terms, dominant,
    landFactor, nSites, tCycleS, cycleName: cycle ? cycle.name : "unknown",
    pJoint, attemptsPerS, rungs, t4detail: t4obj, tempC: temp,
    currencyOn: rungs.some((x) => x.currency && x.currency.on),
    surface: surf, surfaceState: sState,
    workbookLow: sc.plotted_low_myr, workbookHigh: sc.plotted_high_myr,
  };
}


/* ---------------- the cycle as currency ---------------- */

// Second role of a cycle. As a clock it only sets how often a place gets a try (T3).
// As a currency it also pays for a step: each drying joins a share y of the
// building blocks, and each cycle breaks a share d of what was made.
//   time to form one bond   tau_f = T_cycle / y
//   time it survives        1 / tau_s = 1 / tau_chem + d / T_cycle
//   Da = tau_s / tau_f, chance per bond = Da / (1 + Da), chance per product = that ^ bonds
// When the chemical loss is slow, Da is close to y / d and does not depend on the
// cycle length. A long cycle only hurts when the product also breaks down in water
// between dryings. In a long series of cycles the yield levels off at y / (y + d),
// which is the same chance per bond: the plateau of a yield-against-cycles curve
// measures it directly.
export const CURRENCY_SOURCES = {
  eiby: { label: "Eiby 2025, no catalyst", y: 0.00069, lo: 0.0002, hi: 0.0024, stars: 2,
    note: "Five one-hour cycles at 80 C, pH 2 to 3, AMP, dAMP and UMP with no added catalyst: 0.1 to 1.2 per cent by mass, at most four units. Per cycle 0.02 to 0.24 per cent." },
  rajamani: { label: "With lipids, Rajamani 2008", y: 0.0086, lo: 0.0086, hi: 0.0086, stars: 2,
    note: "Up to seven one-hour cycles at 90 C with phospholipid: up to 6 per cent by mass, 25 to 100 units, as summarised by Eiby 2025. Per cycle about 0.9 per cent at most." },
  caimi: { label: "Activated, Caimi 2025", y: 0.065, lo: 0.02, hi: 0.65, stars: 2,
    note: "Activated 2',3'-cyclic nucleotides, pH 9 to 12, room temperature, 1 to 10 one-day cycles: about 20 to 65 per cent, up to 10 units, as summarised by Eiby 2025. Per cycle about 2 to 65 per cent; the default takes 6.5. These nucleotides already carry their own energy, which is a separate supply question." },
};

export function cycleCurrency(h, st, cycle, tCycleS, p) {
  const eligible = !!(h && h.cycle_currency);
  const dries = !!(cycle && cycle.dries);
  const wanted = p.cycleRole === "currency";
  const on = eligible && wanted && (dries || p.currencyCycles === "all");
  const why = !eligible ? "this step is not paid for by the cycle"
    : !wanted ? "the cycle is used as a clock only"
    : !dries && p.currencyCycles !== "all" ? "this cycle does not dry, so it does not pay for joining"
    : "paid for by the cycle";
  if (!on) return { on: false, eligible, dries, why };
  const y = clamp(p.yieldPerCycle, 1e-12, 1);
  const d = clamp(p.lossPerCycle, 0, 1);
  const bonds = Math.max(1, Math.round(p.bondsNeeded));
  const tauTransfer = tCycleS / y;
  const tauChem = st.tauLoss;
  const tauLoss = 1 / (1 / tauChem + d / tCycleS);
  const da = tauLoss / tauTransfer;
  const pBond = da / (1 + da);
  const pp = Math.pow(pBond, bonds);
  const plateau = y / (y + d + tCycleS / tauChem);
  const l = Math.log10(da);
  let verdict = "marginal, on the diagonal", cls = "v-marginal";
  if (l >= 2) { verdict = "clear pass"; cls = "v-pass"; }
  else if (l >= 1) { verdict = "pass, narrow margin"; cls = "v-pass"; }
  else if (l <= -1) { verdict = "perish"; cls = "v-fail"; }
  const chemShare = (tCycleS / tauChem) / (tCycleS / tauChem + d); // how much of the loss is chemistry between dryings
  return { on: true, eligible, dries, why, y, d, bonds, tCycleS, tauTransfer, tauChem, tauLoss, da, pBond, p: pp, plateau,
    chemShare, verdict, verdictClass: cls };
}

/* ---------------- T5, LUCA's ecosystem ---------------- */

// LUCA did not live alone (Moody et al. 2024). Before the first evidence of LUCA
// there had to be X kinds of organisms (species) linked by Y interactions.
//   Diversification: one lineage splits into X at rate lambda per lineage per Myr.
//     For pure splitting (a Yule process) the expected time is ln(X) / lambda.
//   Interactions: X species give X(X-1)/2 possible pairs. Each pair that does not
//     yet interact starts to interact at rate r per Myr. To reach Y links, a
//     fraction C = Y / pairs must be linked, which takes -ln(1 - C) / r.
//     This grows very fast as C nears 1: the last links are the slowest.
//   The two can run at the same time (overlap, take the longer) or one after the other.
//   An extra evolution time can be added on top, or the whole term set directly.
export function computeT5(p) {
  const on = p.ecoOn !== false;
  const X = Math.max(1, Math.round(p.ecoSpecies));
  const pairs = X * (X - 1) / 2;
  const Yasked = Math.max(0, Math.round(p.ecoInteractions));
  const Y = Math.min(Yasked, pairs);
  const C = pairs > 0 ? Y / pairs : 0;
  const tDiv = X > 1 ? Math.log(X) / p.ecoDivRate : 0;
  const Ccap = Math.min(C, 0.999999);
  const tInt = C > 0 ? -Math.log(1 - Ccap) / p.ecoLinkRate : 0;
  const overlap = p.ecoOverlap !== false;
  const built = overlap ? Math.max(tDiv, tInt) : tDiv + tInt;
  const direct = p.ecoMode === "direct";
  let totalMyr = direct ? p.ecoDirectMyr : built + p.ecoExtraMyr;
  if (!on) totalMyr = 0;
  return { on, X, Y, Yasked, pairs, C, tDiv, tInt, overlap, direct, extra: p.ecoExtraMyr,
    totalMyr, capped: Yasked > pairs, nearFull: C > 0.9 };
}

/* ---------------- remaining time, restarts and the chance to fit ---------------- */

// Regularised lower incomplete gamma P(a, x). Series below a+1, continued fraction above.
function lgamma(z) {
  const g = 7, c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lgamma(1 - z);
  z -= 1; let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}
function gammaP(a, x) {
  if (x <= 0) return 0;
  if (a > 2e4) { // normal approximation, fine for many required successes
    const z = (x - a) / Math.sqrt(a);
    return 0.5 * (1 + erf(z / Math.SQRT2));
  }
  const lg = lgamma(a);
  if (x < a + 1) {
    let sum = 1 / a, del = sum, ap = a;
    for (let n = 0; n < 10000; n++) { ap += 1; del *= x / ap; sum += del; if (Math.abs(del) < Math.abs(sum) * 1e-14) break; }
    return Math.min(1, sum * Math.exp(-x + a * Math.log(x) - lg));
  }
  let b = x + 1 - a, c = 1e300, d = 1 / b, h = d;
  for (let i = 1; i < 10000; i++) {
    const an = -i * (i - a); b += 2;
    d = an * d + b; if (Math.abs(d) < 1e-300) d = 1e-300;
    c = b + an / c; if (Math.abs(c) < 1e-300) c = 1e-300;
    d = 1 / d; const del = d * c; h *= del; if (Math.abs(del - 1) < 1e-14) break;
  }
  return Math.max(0, 1 - Math.exp(-x + a * Math.log(x) - lg) * h);
}
function erf(x) {
  const s = Math.sign(x); x = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * x);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}

// What the window leaves over, and how many times the whole run could have
// happened, one after another, inside the window.
//   remaining = budget - total
//   one full try = T2 + T3 + T4 + T5 (the setting stays, so T1 is paid once)
//   if a restart has to wait for the setting again, one try = T1 + T2 + T3 + T4 + T5
//   tries that fit = floor(time open for tries / one try); tries that stopped = tries - 1
// The chance to fit treats only T3 as random: waiting for n successes is a gamma
// distribution with mean T3. Everything else is taken at its central value.
export function timeLeft(r, budgetMyr, p) {
  const needT1 = !!p.restartNeedsT1;
  const run = needT1 ? r.total : r.total - r.t1;
  const open = needT1 ? budgetMyr : budgetMyr - r.t1;
  const remaining = budgetMyr - r.total;
  const tries = run > 0 && open > 0 ? Math.floor(open / run) : 0;
  const stopped = Math.max(0, tries - 1);
  const fixed = r.t1 + r.t2 + r.t4 + r.t5;
  const forT3 = budgetMyr - fixed;
  const n = Math.max(1, p.successesNeeded);
  let pFit = 0;
  if (forT3 > 0 && r.t3 > 0) pFit = gammaP(n, n * forT3 / r.t3);
  else if (forT3 > 0) pFit = 1;
  return { remaining, run, open, tries, stopped, pFit, fixed, forT3, needT1,
    shareUsed: budgetMyr > 0 ? r.total / budgetMyr : Infinity };
}

// Run every scenario under every driving cycle. Used by the cycle map.
export function cycleSweep(model, p, auditFn = auditScenario) {
  return model.scenarios.map((sc) => model.cycles.map((c) => auditFn(sc, { ...p, cycleName: c.name }, model)));
}

export function verdictAgainstBudget(totalMyr, budgetMyr) {
  if (!(budgetMyr > 0)) return { text: "no budget, the envelope is inverted", cls: "v-fail" };
  if (totalMyr <= budgetMyr) return { text: "fits", cls: "v-pass" };
  if (totalMyr <= budgetMyr * 3) return { text: "fits only at the fast end", cls: "v-marginal" };
  return { text: "needs a longer budget", cls: "v-fail" };
}

/* ---------------- S6, preservation ---------------- */

export function ecosystemGate(p) {
  const turnovers = (p.vesselLifetimeYr / p.recycleTimeYr);
  const ratio = turnovers / p.turnoversForEcosystem;
  let verdict = "a population, not an ecosystem", cls = "v-fail";
  if (ratio >= 10) { verdict = "an ecosystem with room to spare", cls = "v-pass"; }
  else if (ratio >= 1) { verdict = "just an ecosystem", cls = "v-marginal"; }
  return { turnovers, ratio, verdict, verdictClass: cls };
}

// Does a molecule class survive burial for the age of the rock.
export function preservationGate(mc, p) {
  const known = mc.half_life_value != null && mc.half_life_temp_c != null;
  let tauMyr = null, ratio = null;
  if (known) {
    const halfYr = mc.half_life_unit && mc.half_life_unit.startsWith("Myr")
      ? mc.half_life_value * 1e6 : mc.half_life_value;
    const tauRefS = halfYr * SEC_PER_YR;
    // Step 1: re-reference the measured half-life from its reported temperature to 25 C.
    // Step 2: push it from 25 C out to the burial temperature.
    const tauAt25 = tauRefS / Math.exp(
      (p.eaDegradation * 1000 / R_GAS) * (1 / (mc.half_life_temp_c + 273.15) - 1 / TREF_K)
    );
    const tauBurial = arrhenius(tauAt25, p.burialTempC, p.eaDegradation);
    tauMyr = tauBurial / SEC_PER_MYR;
    ratio = tauMyr / p.rockAgeMyr;
  }
  // The thermal ceiling is a separate and harder gate than slow chemistry.
  const overOilWindow = p.burialTempC > 150;
  const overGreenschist = p.burialTempC > 400;
  let verdict, cls;
  if (mc.verdict.startsWith("preserved") && !overGreenschist) { verdict = "passes S6b"; cls = "v-pass"; }
  else if (mc.verdict.startsWith("preserved") && overGreenschist) { verdict = "isotopic signal only"; cls = "v-marginal"; }
  else if (ratio != null && ratio >= 1) { verdict = "passes on the half-life, but see the note"; cls = "v-marginal"; }
  else { verdict = "fails S6b"; cls = "v-fail"; }
  return { tauMyr, ratio, verdict, verdictClass: cls, overOilWindow, overGreenschist };
}

/* ---------------- formatting ---------------- */

export function fmtSci(v, dp = 2) {
  if (v === Infinity) return "infinity";
  if (v === 0) return "0";
  if (v == null || Number.isNaN(v)) return "n.a.";
  const a = Math.abs(v);
  if (a >= 1e-3 && a < 1e5) {
    if (a >= 100) return v.toFixed(0);
    if (a >= 10) return v.toFixed(1);
    if (a >= 1) return v.toFixed(2);
    return v.toPrecision(2);
  }
  const e = Math.floor(Math.log10(a));
  const m = v / Math.pow(10, e);
  return m.toFixed(dp) + " x 10^" + e;
}

export function fmtMyr(v) {
  if (v == null || Number.isNaN(v)) return "n.a.";
  if (v === Infinity) return "infinity";
  if (v >= 1000) return fmtSci(v);
  if (v >= 10) return v.toFixed(0);
  if (v >= 1) return v.toFixed(2);
  if (v >= 1e-3) return v.toPrecision(2);
  return fmtSci(v);
}

export function fmtDuration(sec) {
  if (sec === Infinity) return "infinity";
  if (sec < 1e-3) return fmtSci(sec) + " s";
  if (sec < 120) return fmtSci(sec) + " s";
  if (sec < 7200) return (sec / 60).toFixed(1) + " min";
  if (sec < 2 * 86400) return (sec / 3600).toFixed(1) + " h";
  if (sec < 2 * SEC_PER_YR) return (sec / 86400).toFixed(1) + " days";
  const yr = sec / SEC_PER_YR;
  if (yr < 1e6) return fmtSci(yr) + " yr";
  return fmtSci(yr / 1e6) + " Myr";
}
