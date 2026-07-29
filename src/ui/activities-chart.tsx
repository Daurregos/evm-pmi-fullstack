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

/** Caracteres que caben en el ancho reservado al eje de categorías. */
const MAX_LABEL_LENGTH = 44;

/**
 * Nombre con el que el eje rotula una actividad. Uno demasiado largo se recorta
 * con puntos suspensivos para no ensanchar el eje; la tabla y el tooltip lo
 * muestran completo.
 */
export function axisLabel(name: string): string {
  return name.length <= MAX_LABEL_LENGTH
    ? name
    : `${name.slice(0, MAX_LABEL_LENGTH)}…`;
}

/**
 * RF-09: PV, EV y AC por actividad. Los valores llegan calculados y la gráfica
 * los consume tal cual.
 *
 * Las barras corren en horizontal para que el eje de categorías rotule cada
 * actividad con su nombre —uno de los cinco datos capturados— en lugar del
 * identificador, que obligaba a cruzar la gráfica con la tabla para saber de
 * qué actividad hablaba cada barra.
 */
export function ActivitiesChart({ activities }: ActivitiesChartProps) {
  return (
    <section aria-label="PV, EV y AC por actividad" className="chart">
      <h2 className="chart__title">PV, EV y AC por actividad</h2>
      <BarChart
        data={[...activities]}
        height={520}
        layout="vertical"
        margin={{ bottom: 8, left: 8, right: 24, top: 8 }}
        width={880}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis
          dataKey="name"
          tickFormatter={axisLabel}
          type="category"
          width={300}
        />
        <Tooltip />
        <Legend />
        {/* Sin animación: las barras deben estar pintadas en el primer
            fotograma, y así el marcado del servidor y el del navegador
            coinciden. */}
        <Bar dataKey="pv" fill="#5b7fa6" isAnimationActive={false} name="PV" />
        <Bar dataKey="ev" fill="#3f8f5f" isAnimationActive={false} name="EV" />
        <Bar dataKey="ac" fill="#b0603f" isAnimationActive={false} name="AC" />
      </BarChart>
      <p className="chart__hint">
        Un nombre largo se recorta en el eje; la tabla lo muestra completo.
      </p>
    </section>
  );
}
