import {
  Decimal,
  formatForPresentation,
  roundForPresentation,
} from "./decimal";

const LOW = new Decimal("0.99");
const HIGH = new Decimal("1.01");

export type IndexStatus =
  | "favorable"
  | "neutral"
  | "unfavorable"
  | "not_evaluable";

export type ActivityState =
  | "not_started"
  | "planned_without_progress"
  | "progress_without_cost"
  | "cost_without_progress"
  | "progress_with_cost";

export type IndexResult = Readonly<{
  value: Decimal | null;
  display: string | null;
  status: IndexStatus;
  label: string;
}>;

export type EvmResult = Readonly<{
  pv: Decimal;
  ev: Decimal;
  cv: Decimal;
  sv: Decimal;
  cpi: IndexResult;
  spi: IndexResult;
  eac: Decimal | null;
  vac: Decimal | null;
  state: ActivityState;
}>;

export type ActivityInput = Readonly<{
  bac: Decimal;
  plannedProgress: Decimal;
  actualProgress: Decimal;
  ac: Decimal;
}>;

export type ProjectResult = Readonly<
  Omit<EvmResult, "state"> & {
    bac: Decimal;
    ac: Decimal;
    progress: Decimal | null;
    activitiesWithEvAndZeroAc: number;
  }
>;

type IndexKind = "cpi" | "spi";
type DefinedIndexStatus = Exclude<IndexStatus, "not_evaluable">;

const labels: Readonly<
  Record<IndexKind, Readonly<Record<DefinedIndexStatus, string>>>
> = {
  cpi: {
    unfavorable: "sobre presupuesto",
    neutral: "en presupuesto",
    favorable: "eficiente en costos",
  },
  spi: {
    unfavorable: "atrasado",
    neutral: "en cronograma",
    favorable: "adelantado",
  },
};

function activityState(pv: Decimal, ev: Decimal, ac: Decimal): ActivityState {
  if (ev.gt(0)) {
    return ac.eq(0) ? "progress_without_cost" : "progress_with_cost";
  }
  if (ac.gt(0)) return "cost_without_progress";
  if (pv.gt(0)) return "planned_without_progress";
  return "not_started";
}

function classify(value: Decimal): DefinedIndexStatus {
  if (value.lt(LOW)) return "unfavorable";
  if (value.gt(HIGH)) return "favorable";
  return "neutral";
}

function indexResult(kind: IndexKind, value: Decimal | null): IndexResult {
  if (value === null) {
    return {
      value: null,
      display: null,
      status: "not_evaluable",
      label: "no evaluable",
    };
  }

  const status = classify(value);
  const rounded = roundForPresentation(value);
  const baseDisplay = formatForPresentation(value);
  const display =
    status === "unfavorable" && rounded.eq(LOW)
      ? `<${baseDisplay}`
      : status === "favorable" && rounded.eq(HIGH)
        ? `>${baseDisplay}`
        : baseDisplay;

  return { value, display, status, label: labels[kind][status] };
}

export function deriveFromMagnitudes(
  bac: Decimal,
  pv: Decimal,
  ev: Decimal,
  ac: Decimal,
): EvmResult {
  const cpiValue = ac.eq(0) ? null : ev.div(ac);
  const spiValue = pv.eq(0) ? null : ev.div(pv);
  const eac =
    cpiValue === null || cpiValue.eq(0) ? null : bac.div(cpiValue);

  return {
    pv,
    ev,
    cv: ev.minus(ac),
    sv: ev.minus(pv),
    cpi: indexResult("cpi", cpiValue),
    spi: indexResult("spi", spiValue),
    eac,
    vac: eac === null ? null : bac.minus(eac),
    state: activityState(pv, ev, ac),
  };
}

export function deriveActivity(input: ActivityInput): EvmResult {
  const pv = input.bac.times(input.plannedProgress);
  const ev = input.bac.times(input.actualProgress);
  return deriveFromMagnitudes(input.bac, pv, ev, input.ac);
}

export function consolidateProject(
  activities: readonly ActivityInput[],
): ProjectResult {
  let bac = new Decimal(0);
  let pv = new Decimal(0);
  let ev = new Decimal(0);
  let ac = new Decimal(0);
  let activitiesWithEvAndZeroAc = 0;

  for (const activity of activities) {
    const derived = deriveActivity(activity);
    bac = bac.plus(activity.bac);
    pv = pv.plus(derived.pv);
    ev = ev.plus(derived.ev);
    ac = ac.plus(activity.ac);
    if (derived.ev.gt(0) && activity.ac.eq(0)) {
      activitiesWithEvAndZeroAc += 1;
    }
  }

  const { state: _state, ...derived } = deriveFromMagnitudes(bac, pv, ev, ac);
  return {
    bac,
    ac,
    ...derived,
    progress: bac.eq(0) ? null : ev.div(bac).times(100),
    activitiesWithEvAndZeroAc,
  };
}
