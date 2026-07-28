import type { ActivityRecord } from "@/application/evm-repository";
import { Decimal } from "@/domain/decimal";
import type { activities } from "@/infrastructure/database/schema";

type ActivityRow = typeof activities.$inferSelect;

export function mapActivityRow(row: ActivityRow): ActivityRecord {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    bac: new Decimal(row.bac),
    plannedProgress: new Decimal(row.plannedProgress),
    actualProgress: new Decimal(row.actualProgress),
    ac: new Decimal(row.ac),
  };
}
