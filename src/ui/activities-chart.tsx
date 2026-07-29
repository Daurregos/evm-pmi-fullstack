"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ActivityRead } from "@/shared/contract";

export interface ActivitiesChartProps {
  readonly activities: readonly ActivityRead[];
}

/**
 * RF-09: PV, EV y AC por actividad. Los valores llegan calculados y la gráfica
 * los consume tal cual; el eje se rotula con el identificador que la tabla
 * repite en su primera columna, porque los nombres completos no caben.
 */
export function ActivitiesChart({ activities }: ActivitiesChartProps) {
  return (
    <section aria-label="PV, EV y AC por actividad" className="chart">
      <h2 className="chart__title">PV, EV y AC por actividad</h2>
      <BarChart data={[...activities]} height={320} width={880}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="id" name="Actividad" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="pv" fill="#5b7fa6" name="PV" />
        <Bar dataKey="ev" fill="#3f8f5f" name="EV" />
        <Bar dataKey="ac" fill="#b0603f" name="AC" />
      </BarChart>
      <p className="chart__hint">
        El número del eje corresponde a la primera columna de la tabla.
      </p>
    </section>
  );
}
