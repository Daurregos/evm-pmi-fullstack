import type { ActivityRead } from "@/shared/contract";

import {
  formatAmount,
  formatOptionalAmount,
  formatPercentage,
} from "@/ui/format";
import { IndexBadge } from "@/ui/index-badge";

export interface ActivitiesTableProps {
  readonly activities: readonly ActivityRead[];
}

/**
 * RF-06: cada fila muestra los cinco datos capturados y los ocho indicadores
 * derivados. La rebanada es de solo lectura: no hay controles de edición.
 *
 * Catorce columnas no caben en una pantalla estrecha, así que la tabla desplaza
 * dentro de su propio contenedor en lugar de desplazar la página.
 */
export function ActivitiesTable({ activities }: ActivitiesTableProps) {
  return (
    <div className="activities__scroll">
      <table className="activities">
        <caption className="activities__caption">
          Actividades del proyecto
        </caption>
        <thead>
          <tr>
            <th className="activities__id" scope="col">
              #
            </th>
            <th className="activities__name" scope="col">
              Actividad
            </th>
            <th scope="col">BAC</th>
            <th scope="col">Avance plan.</th>
            <th scope="col">Avance real</th>
            <th scope="col">AC</th>
            <th scope="col">PV</th>
            <th scope="col">EV</th>
            <th scope="col">CV</th>
            <th scope="col">SV</th>
            <th scope="col">CPI</th>
            <th scope="col">SPI</th>
            <th scope="col">EAC</th>
            <th scope="col">VAC</th>
          </tr>
        </thead>
        <tbody>
          {activities.map((activity) => (
            <tr data-row-id={activity.id} key={activity.id}>
              <th className="activities__id" scope="row">
                {activity.id}
              </th>
              <td className="activities__name" data-field="name">
                {activity.name}
              </td>
              <td className="activities__amount" data-field="bac">
                {formatAmount(activity.bac)}
              </td>
              <td className="activities__amount" data-field="plannedProgress">
                {formatPercentage(activity.plannedProgress)}
              </td>
              <td className="activities__amount" data-field="actualProgress">
                {formatPercentage(activity.actualProgress)}
              </td>
              <td className="activities__amount" data-field="ac">
                {formatAmount(activity.ac)}
              </td>
              <td className="activities__amount" data-field="pv">
                {formatAmount(activity.pv)}
              </td>
              <td className="activities__amount" data-field="ev">
                {formatAmount(activity.ev)}
              </td>
              <td className="activities__amount" data-field="cv">
                {formatAmount(activity.cv)}
              </td>
              <td className="activities__amount" data-field="sv">
                {formatAmount(activity.sv)}
              </td>
              <td className="activities__index" data-field="cpi">
                <IndexBadge index={activity.cpi} />
              </td>
              <td className="activities__index" data-field="spi">
                <IndexBadge index={activity.spi} />
              </td>
              <td className="activities__amount" data-field="eac">
                {formatOptionalAmount(activity.eac)}
              </td>
              <td className="activities__amount" data-field="vac">
                {formatOptionalAmount(activity.vac)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
