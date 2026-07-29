import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import { Decimal } from "../../src/domain/decimal";
import * as evm from "../../src/domain/evm";

type FixtureIndex = Readonly<{
  value: number | null;
  display: string | null;
  status: evm.IndexStatus;
  label: string;
}>;

type FixtureActivity = Readonly<{
  $id: string;
  $state: "COSTO_SIN_AVANCE";
  bac: number;
  pv: number;
  ev: number;
  ac: number;
  cv: number;
  sv: number;
  cpi: FixtureIndex;
  spi: FixtureIndex;
  eac: number | null;
  vac: number | null;
}>;

const fixture = JSON.parse(
  readFileSync(
    new URL("../../contracts/evm/evm-fixture.json", import.meta.url),
    "utf8",
  ),
) as { readResponse: { activities: FixtureActivity[] } };

test("exports the three pure domain operations", () => {
  assert.equal(typeof evm.deriveFromMagnitudes, "function");
  assert.equal(typeof evm.deriveActivity, "function");
  assert.equal(typeof evm.consolidateProject, "function");
});

test("derives all indicators and state for the fixture defined-zero case", () => {
  const activity = fixture.readResponse.activities.find(
    (candidate) => candidate.$id === "a3",
  );
  assert.ok(activity);

  const result = evm.deriveFromMagnitudes(
    new Decimal(activity.bac),
    new Decimal(activity.pv),
    new Decimal(activity.ev),
    new Decimal(activity.ac),
  );

  assert.equal(result.pv.toNumber(), activity.pv);
  assert.equal(result.ev.toNumber(), activity.ev);
  assert.equal(result.cv.toNumber(), activity.cv);
  assert.equal(result.sv.toNumber(), activity.sv);
  assert.deepEqual(
    { ...result.cpi, value: result.cpi.value?.toNumber() ?? null },
    activity.cpi,
  );
  assert.deepEqual(
    { ...result.spi, value: result.spi.value?.toNumber() ?? null },
    activity.spi,
  );
  assert.equal(result.eac?.toNumber() ?? null, activity.eac);
  assert.equal(result.vac?.toNumber() ?? null, activity.vac);
  assert.equal(
    result.state,
    {
      COSTO_SIN_AVANCE: "cost_without_progress",
    }[activity.$state],
  );
});
