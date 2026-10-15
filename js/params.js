// Every tweakable parameter in one place. Each one carries a plausible range, an
// unreasonable outer range that the app still allows but flags, a tier and a
// reference, so nothing on screen is an unattributed number.

export const COOLING_ANCHORS = [
  { age: 4.5, t: 1800 }, { age: 4.45, t: 500 }, { age: 4.4, t: 200 },
  { age: 4.35, t: 110 }, { age: 4.3, t: 80 }, { age: 4.2, t: 60 }, { age: 4.0, t: 45 },
];

export const NEAR_OPTIONS = [
  { id: "water", label: "First evidence of liquid water, 4.40 Ga", age: 4.40,
    basis: "One detrital Jack Hills zircon. A single grain, so it is a point and not a range.",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6315770/" },
  { id: "magma", label: "End of the magma ocean, 4.40 Ga", age: 4.40,
    basis: "Sets the physical start of the envelope. Before this there is no liquid water surface.",
    url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6315770/" },
  { id: "moon", label: "Moon-forming impact, 4.36 Ga", age: 4.36,
    basis: "The surface was remelted and the ocean vaporised, so any earlier chemistry is erased.",
    url: null },
  { id: "habit", label: "Earliest continuous habitability, 4.34 Ga", age: 4.34,
    basis: "The conservative planetary start. The near end of the envelope is set by the planet rather than by biology.",
    url: "https://www.nature.com/articles/nature08015" },
];

export const FAR_OPTIONS = [
  { id: "moody", label: "LUCA at 4.2 Ga, Moody et al. 2024", age: 4.20,
    basis: "Central value of a molecular clock estimate whose reported range is 4.33 to 4.09 Ga. This is the working far end of the paper.",
    url: "https://www.nature.com/articles/s41559-024-02461-1" },
  { id: "moodyOld", label: "LUCA at the old end of the clock, 4.33 Ga", age: 4.33,
    basis: "The oldest end of the same reported range. Choosing it shrinks the budget to almost nothing.",
    url: "https://www.nature.com/articles/s41559-024-02461-1" },
  { id: "moodyYoung", label: "LUCA at the young end of the clock, 4.09 Ga", age: 4.09,
    basis: "The youngest end of the same reported range.",
    url: "https://www.nature.com/articles/s41559-024-02461-1" },
  { id: "jackhills", label: "Jack Hills zircon graphite, 4.1 Ga, contested", age: 4.10,
    basis: "A contested biosignature. Accepting it puts life before most clock estimates of LUCA.",
    url: null },
  { id: "conservative", label: "Conservative clock estimate, 3.8 Ga", age: 3.80,
    basis: "The older and more cautious clock date. It gives the 600 Myr alternative budget of the paper.",
    url: null },
  { id: "isua", label: "Isua graphite and inclusions, 3.7 Ga, contested", age: 3.70,
    basis: "The youngest far end considered here, and the one with a direct rock sample behind it rather than a clock.",
    url: "https://pubmed.ncbi.nlm.nih.gov/28738409/" },
];

// Which handoff stands in for each rung by default. The user can change any of
// these, because the choice of representative handoff is a judgement.
export const DEFAULT_RUNG_HANDOFF = {
  S0: "none", S1: "H2", S2: "H3", S3: "H12", S4: "H9", S5: "H11",
};

export const SPEC = {
  // temperature
  startTempC: { label: "Maximum tolerable surface temperature at the start", unit: "C",
    def: 110, lo: 40, hi: 250, uLo: 5, uHi: 1800, step: 5, tier: "C",
    hint: "Sets the near end of the envelope by reading back along the cooling curve. The curve itself is illustrative.",
    ref: "Cooling anchors are Tier C and editable on this page." },
  chemTempC: { label: "Temperature used for the chemistry", unit: "C",
    def: 70, lo: 4, hi: 120, uLo: -20, uHi: 400, step: 1, tier: "B",
    hint: "Feeds the Arrhenius correction on every handoff time. Set it independently of the envelope, or let the cooling curve supply it.",
    ref: null },
  eaTransfer: { label: "Activation energy, transfer", unit: "kJ per mol",
    def: 50, lo: 30, hi: 90, uLo: 5, uHi: 250, step: 1, tier: "C",
    hint: "Generic value for a catalysed reaction on a mineral surface. There is no single measured number for a category this broad.",
    ref: null },
  eaLoss: { label: "Activation energy, loss", unit: "kJ per mol",
    def: 63, lo: 40, hi: 90, uLo: 5, uHi: 250, step: 1, tier: "B",
    hint: "Derived from measured RNA phosphodiester hydrolysis at two temperatures, 4 yr at 25 C and 9 days at 100 C, which gives 62.8 kJ per mol.",
    ref: "https://bionumbers.hms.harvard.edu/bionumber.aspx?id=105354&ver=3" },

  // T1
  t1Scale: { label: "Scale factor on T1, setting availability", unit: "x",
    def: 1, lo: 0.1, hi: 10, uLo: 0.001, uHi: 1000, step: 0.1, tier: "B",
    hint: "Multiplies the workbook T1 range for every scenario at once. Use it to test how much the conclusion depends on the setting term.",
    ref: null },
  landUncertaintyFactor: { label: "Extra factor for scenarios needing subaerial land", unit: "x",
    def: 3, lo: 1, hi: 20, uLo: 1, uHi: 500, step: 0.5, tier: "C",
    hint: "How much longer you wait if the scenario needs land above sea level in the Hadean. How much land there was is genuinely contested, which is why this is a separate knob.",
    ref: null },

  // T2
  t2Scale: { label: "Scale factor on T2, chemistry", unit: "x",
    def: 1, lo: 0.1, hi: 10, uLo: 0.001, uHi: 1e6, step: 0.1, tier: "B",
    hint: "T2 is computed from the handoff table rather than assumed, so this factor exists only to stress test it. In every terrestrial scenario T2 stays negligible.",
    ref: null },

  // T3
  cycleName: { label: "Driving cycle", unit: "", def: "Day and night", tier: "A", kind: "select",
    hint: "The cycle that generates independent attempts. Its period is the denominator of the attempt rate.",
    ref: null },
  siteScale: { label: "Scale factor on the number of independent sites", unit: "x",
    def: 1, lo: 0.01, hi: 100, uLo: 1e-6, uHi: 1e9, step: 0.01, tier: "C",
    hint: "The site counts themselves are new to this model and are order of magnitude only. This factor lets you see how hard T3 depends on them.",
    ref: null },
  successesNeeded: { label: "Independent successes required", unit: "count",
    def: 1, lo: 1, hi: 100, uLo: 1, uHi: 1e6, step: 1, tier: "C",
    hint: "How many separate successful runs of the coincidence are needed before one of them takes hold. One is the most generous assumption.",
    ref: null },

  // T4
  generationTimeS: { label: "Generation time", unit: "s",
    def: 86400, lo: 3600, hi: 2592000, uLo: 600, uHi: 3.15e7, step: 3600, tier: "B",
    hint: "One day is a reasonable central value for a slow chemolithoautotroph. Modern sediment communities are much slower than laboratory cultures.",
    ref: null },
  popSize: { label: "Effective population size", unit: "count",
    def: 100000, lo: 1000, hi: 1e9, uLo: 10, uHi: 1e15, step: 1000, tier: "B",
    hint: "Neutral fixation takes of order the population size in generations, so this parameter sets the fixation time almost on its own.",
    ref: null },
  genFixFactor: { label: "Generations to fixation, as a multiple of population size", unit: "x",
    def: 4, lo: 1, hi: 20, uLo: 0.1, uHi: 1000, step: 0.5, tier: "B",
    hint: "Four times the effective population size is the standard result for a neutral allele. Selection makes it faster, drift in a structured population makes it slower.",
    ref: null },
  errorThresholdMyr: { label: "Time to cross the error threshold", unit: "Myr",
    def: 1, lo: 0.1, hi: 10, uLo: 0.001, uHi: 500, step: 0.1, tier: "B",
    hint: "Getting from a replicator that loses information each generation to one that keeps it. This and fixation are the two genuinely slow steps, and every scenario pays them.",
    ref: null },

  // T5, LUCA's ecosystem
  ecoSpecies: { label: "Kinds of organisms in LUCA's community (X species)", unit: "count",
    def: 5, lo: 2, hi: 50, uLo: 1, uHi: 10000, step: 1, tier: "C",
    hint: "Moody et al. 2024 read LUCA as an acetogen whose waste fed other metabolisms: methane makers, organic matter recyclers, CO2 and H2 recyclers. Five kinds is a small version of that community. More kinds take longer to appear.",
    ref: "https://www.nature.com/articles/s41559-024-02461-1" },
  ecoInteractions: { label: "Ecological interactions between them (Y links)", unit: "count",
    def: 6, lo: 1, hi: 200, uLo: 0, uHi: 1e6, step: 1, tier: "C",
    hint: "A link is one partner living on what another releases or removes: acetate, H2, CO2, organic matter. The model cannot use more links than there are pairs, X(X-1)/2. Filling almost every pair is very slow.",
    ref: "https://www.frontiersin.org/journals/ecology-and-evolution/articles/10.3389/fevo.2019.00153/full" },
  ecoDivRate: { label: "How fast one kind splits into two (lambda)", unit: "per lineage per Myr",
    def: 0.1, lo: 0.03, hi: 1, uLo: 0.001, uHi: 100, step: 0.01, tier: "C",
    hint: "Modern bacteria: extinction 0.03 to 0.05 per lineage per Myr, speciation only slightly higher (Louca et al. 2018). A young, empty world may have allowed faster splitting, so the default is set a little above the modern value. Time to reach X kinds is ln(X) / lambda.",
    ref: "https://pubmed.ncbi.nlm.nih.gov/30061564/" },
  ecoLinkRate: { label: "How fast a pair of kinds starts to interact (r)", unit: "per pair per Myr",
    def: 1, lo: 0.01, hi: 1000, uLo: 1e-5, uHi: 1e6, step: 0.01, tier: "C",
    hint: "In the laboratory, E. coli evolved cross-feeding within about 800 to 6,500 generations, which is years, not millions of years (Helling et al. 1987, Rozen and Lenski 2000). That is a fast upper end. The default of 1 per pair per Myr is a cautious Hadean guess.",
    ref: "https://pmc.ncbi.nlm.nih.gov/articles/PMC7728234/" },
  ecoExtraMyr: { label: "Extra evolution time on top (Z, added)", unit: "Myr",
    def: 0, lo: 0, hi: 100, uLo: 0, uHi: 2000, step: 0.1, tier: "C",
    hint: "Room for anything the two simple rules leave out, for example building a genome of about 2,657 proteins (Moody et al. 2024) beyond what T4 already covers. Zero by default so nothing is counted twice.",
    ref: "https://www.nature.com/articles/s41559-024-02461-1" },
  ecoDirectMyr: { label: "Ecosystem time, set directly", unit: "Myr",
    def: 10, lo: 0, hi: 200, uLo: 0, uHi: 4000, step: 0.1, tier: "C",
    hint: "Used only when the ecosystem time is set directly instead of being built from X and Y.",
    ref: null },

  // Mineral surfaces, S2 to S4. Phosphate is the model adsorbate.
  surfacePH: { label: "pH at the surface, when one surface is used for all", unit: "pH",
    def: 7, lo: 5.5, hi: 10, uLo: 2, uHi: 13, step: 0.1, tier: "B",
    hint: "A CO2-rich Hadean ocean sits near pH 6.5 to 7.5. Alkaline vent fluid reaches 9 to 11. Oxides and clay edges lose their positive charge as pH rises.",
    ref: null },
  surfaceLoading: { label: "Mineral per litre of water, when one surface is used for all", unit: "g per L",
    def: 10, lo: 0.01, hi: 1000, uLo: 1e-5, uHi: 3000, step: 0.01, tier: "C",
    hint: "How much surface each litre of water touches. A clear ocean has almost none, a mud or a chimney pore has hundreds of grams.",
    ref: null },
  phosphateUM: { label: "Dissolved phosphate", unit: "uM",
    def: 1, lo: 0.01, hi: 1000, uLo: 1e-5, uHi: 1e5, step: 0.01, tier: "C",
    hint: "Sets how full the surface gets. A full surface gathers no more and leaves no free sites for reaction. Modern seawater is about 2 uM. Closed-basin lakes can reach mM.",
    ref: "https://reinhard.gatech.edu/uploads/5/4/1/0/54106417/walton_natgeo_2023.pdf" },
  divalentMM: { label: "Mg2+ plus Ca2+", unit: "mM",
    def: 10, lo: 0.1, hi: 100, uLo: 0, uHi: 1000, step: 0.1, tier: "B",
    hint: "Divalent cations bridge a phosphate group to a negative surface. Without them DNA did not bind mica at all; with 10 mM Mg2+ it did. Modern seawater has about 53 mM Mg2+ and 10 mM Ca2+.",
    ref: "https://doi.org/10.1002/edn3.482" },
  bridgeK: { label: "Largest affinity a cation bridge can add", unit: "L per umol",
    def: 0.01, lo: 0.001, hi: 0.1, uLo: 1e-6, uHi: 10, step: 0.001, tier: "C",
    hint: "Applied only to the negative part of a surface. Set well below direct binding on goethite, because a bridged phosphate is held more loosely than an inner-sphere one.",
    ref: null },
  bridgeHalfMM: { label: "Cation level at which bridging is half complete", unit: "mM",
    def: 5, lo: 0.5, hi: 50, uLo: 0.01, uHi: 1000, step: 0.5, tier: "C",
    hint: "A judgement. The mica experiments show bridging is already strong at 10 mM Mg2+.",
    ref: null },
  protectionFactor: { label: "How much longer a bound molecule lasts", unit: "x",
    def: 100, lo: 3, hi: 10000, uLo: 1, uHi: 1e8, step: 1, tier: "C",
    hint: "Bound molecules expose fewer groups to water and enzymes. DNA bound to minerals survived 2 Myr where degradation models predicted nothing, but no single factor has been measured.",
    ref: "https://www.nature.com/articles/s41586-022-05453-y" },
  damageK: { label: "Affinity at which binding starts to damage", unit: "L per umol",
    def: 1, lo: 0.05, hi: 100, uLo: 1e-4, uHi: 1e6, step: 0.01, tier: "C",
    hint: "Very strong binding can strain and cleave the bound molecule, so protection falls away at high affinity. Freeman and co-workers saw DNA damage when the driving force for binding was strong.",
    ref: "https://doi.org/10.1002/edn3.482" },

  // S6a
  vesselLifetimeYr: { label: "Vessel lifetime", unit: "yr",
    def: 100000, lo: 1, hi: 1e7, uLo: 0.01, uHi: 1e9, step: 1, tier: "B",
    hint: "An impact-generated hydrothermal system runs for of order 100000 years. A pond may last a season.",
    ref: null },
  recycleTimeYr: { label: "Nutrient recycling time", unit: "yr",
    def: 10, lo: 0.01, hi: 10000, uLo: 1e-4, uHi: 1e6, step: 0.01, tier: "C",
    hint: "How long the community takes to turn its limiting nutrient over once. Modern microbial mats manage this in days to years.",
    ref: null },
  turnoversForEcosystem: { label: "Turnovers needed before it is an ecosystem", unit: "count",
    def: 1000, lo: 10, hi: 1e6, uLo: 1, uHi: 1e12, step: 10, tier: "C",
    hint: "New to this model and not measured anywhere. It is the number of recycling cycles needed before cross-feeding and functional differentiation can establish.",
    ref: null },

  // S6b
  burialTempC: { label: "Burial temperature", unit: "C",
    def: 60, lo: 0, hi: 600, uLo: -20, uHi: 900, step: 5, tier: "B",
    hint: "The average temperature the material sat at, not the peak. Above about 150 C the oil window closes. Isua peaked at 500 to 600 C.",
    ref: "https://www.whoi.edu/science/GG/geodynamics/2005/images2005/van%20Zuilen%20et%20al%202003.pdf" },
  rockAgeMyr: { label: "Age of the rock", unit: "Myr",
    def: 3700, lo: 1, hi: 4400, uLo: 0, uHi: 4600, step: 10, tier: "A",
    hint: "Isua is 3.7 to 3.8 Ga. The oldest Jack Hills zircons reach 4.4 Ga.",
    ref: "https://www.nature.com/articles/s43247-025-02215-2" },
  eaDegradation: { label: "Activation energy for degradation", unit: "kJ per mol",
    def: 63, lo: 40, hi: 120, uLo: 10, uHi: 300, step: 1, tier: "B",
    hint: "Raising this makes extrapolation to cold burial temperatures wildly optimistic, which is the single biggest weakness of any deep-time survival estimate. Watch what it does.",
    ref: "https://www.pnas.org/doi/10.1073/pnas.95.14.7933" },

  // The cycle as currency. Used only when the cycle has a second role.
  yieldPerCycle: { label: "Yield per cycle for the joining step", unit: "fraction per cycle",
    def: 0.00069, lo: 0.0001, hi: 0.7, uLo: 1e-8, uHi: 1, step: 0.0001, tier: "B",
    hint: "The share of building blocks joined into a product in one drying and rewetting. Eiby 2025: five one-hour cycles at 80 C and pH 2 to 3, with no catalyst, gave 0.1 to 1.2 per cent by mass, mostly dimers and at most four units. Divided over five cycles that is about 0.02 to 0.24 per cent per cycle; the default is the middle, 0.07 per cent.",
    ref: "Eiby 2025, PhD thesis, Globe Institute, University of Copenhagen" },
  lossPerCycle: { label: "Loss per cycle for the joining step", unit: "fraction per cycle",
    def: 0.001, lo: 0.00001, hi: 0.3, uLo: 1e-9, uHi: 1, step: 0.00001, tier: "C",
    hint: "The share of the product broken in one cycle, by hydrolysis on rewetting or loss of a base. Not yet measured. Eiby 2025 saw no base loss from AMP over five cycles, so the loss is likely small; 0.1 per cent per cycle is a judgement.",
    ref: null },
  bondsNeeded: { label: "Bonds needed per product", unit: "count",
    def: 1, lo: 1, hi: 28, uLo: 1, uHi: 300, step: 1, tier: "C",
    hint: "How many joinings one useful product needs, each paid for by the cycle. One bond is a dimer, as in most of Eiby's products; three is a tetramer, his longest. The shortest RNA known to copy RNA, a polymerase ribozyme of 29 units, needs 28.",
    ref: null },
};

export function defaultParams() {
  const p = {
    nearMode: "event", nearEventId: "water", nearManualGa: 4.40,
    farMode: "event", farEventId: "moody", farManualGa: 4.20,
    tempMode: "manual",
    coolingAnchors: COOLING_ANCHORS.map((a) => ({ ...a })),
    nearOptions: NEAR_OPTIONS, farOptions: FAR_OPTIONS,
    activeRungs: ["S1", "S2", "S3", "S4", "S5"],
    rungHandoff: { ...DEFAULT_RUNG_HANDOFF },
    allowUnreasonable: false,
    surfaceMode: "scenario",
    surfaceMineral: "smectite",
    surfaceRungs: { S2: true, S3: true, S4: true },
    scenarioSurface: {},
    ecoOn: true, ecoMode: "computed", ecoOverlap: true, restartNeedsT1: false,
    uiMode: "guided", chemPreset: "default",
    cycleRole: "clock", currencyCycles: "drying", yieldSource: "eiby",
  };
  for (const [k, s] of Object.entries(SPEC)) p[k] = s.def;
  return p;
}

export function isUnreasonable(key, value) {
  const s = SPEC[key];
  if (!s || s.kind === "select" || s.lo == null) return false;
  return value < s.lo || value > s.hi;
}
