import fixture from "../../../contracts/evm/evm-fixture.json";

import { Decimal } from "@/domain/decimal";
import { activities, projects } from "@/infrastructure/database/schema";
import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

import type * as schema from "./schema";

type FixtureProject = {
  id: number;
  name: string;
  cutoffDate: string;
};

type FixtureActivity = {
  id: number;
  name: string;
  bac: Decimal.Value;
  plannedProgress: Decimal.Value;
  actualProgress: Decimal.Value;
  ac: Decimal.Value;
};

export async function seedFixture(
  db: NodePgDatabase<typeof schema>,
): Promise<void> {
  const referenceProject = fixture.readResponse.project as FixtureProject;
  const emptyProject = fixture.emptyProject.project as FixtureProject;
  const fixtureActivities = fixture.readResponse.activities as FixtureActivity[];

  await db.transaction(async (transaction) => {
    await transaction
      .insert(projects)
      .values([referenceProject, emptyProject])
      .onConflictDoUpdate({
        target: projects.id,
        set: {
          name: sql`excluded.name`,
          cutoffDate: sql`excluded.cutoff_date`,
        },
      });

    for (const activity of fixtureActivities) {
      const captured = {
        id: activity.id,
        projectId: referenceProject.id,
        name: activity.name,
        bac: new Decimal(activity.bac).toString(),
        plannedProgress: new Decimal(activity.plannedProgress).toString(),
        actualProgress: new Decimal(activity.actualProgress).toString(),
        ac: new Decimal(activity.ac).toString(),
      };

      await transaction
        .insert(activities)
        .values(captured)
        .onConflictDoUpdate({
          target: activities.id,
          set: {
            projectId: captured.projectId,
            name: captured.name,
            bac: captured.bac,
            plannedProgress: captured.plannedProgress,
            actualProgress: captured.actualProgress,
            ac: captured.ac,
          },
        });
    }

    await transaction.execute(sql`
      select setval(
        pg_get_serial_sequence('projects', 'id'),
        coalesce((select max(id) from projects), 1),
        exists(select 1 from projects)
      )
    `);
    await transaction.execute(sql`
      select setval(
        pg_get_serial_sequence('activities', 'id'),
        coalesce((select max(id) from activities), 1),
        exists(select 1 from activities)
      )
    `);
  });
}
