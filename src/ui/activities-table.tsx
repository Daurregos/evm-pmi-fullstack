import type { ActivityRead } from "@/shared/contract";

import {
  formatAmount,
  formatCapturedPercentage,
  formatOptionalAmount,
} from "@/ui/format";
import { IndexBadge } from "@/ui/index-badge";

export interface ActivitiesTableProps {
  readonly activities: readonly ActivityRead[];
  readonly onEditActivity?: (activity: ActivityRead) => void;
  readonly onDeleteActivity?: (activity: ActivityRead) => void;
}

/**
 * RF-06: cada fila muestra los cinco datos capturados y los ocho indicadores
 * derivados. RF-02 añade editar y eliminar por fila, que aparecen solo cuando el
 * consumidor entrega los manejadores. La captura vive en el formulario: aquí no
 * hay ningún control de entrada.
 *
 * El nombre encabeza la fila, porque es lo que identifica a la actividad para
 * quien lee; el identificador queda en `data-row-id`, disponible para el
 * marcado sin ocupar una columna que no dice nada.
 *
 * Trece columnas no caben en una pantalla estrecha, así que la tabla desplaza
 * dentro de su propio contenedor en lugar de desplazar la página.
 */
export function ActivitiesTable({
  activities,
  onDeleteActivity,
  onEditActivity,
}: ActivitiesTableProps) {
  const editable = onEditActivity !== undefined || onDeleteActivity !== undefined;

  return (
    <div className="activities__scroll">
      <table className="activities">
        <caption className="activities__caption">
          Actividades del proyecto
        </caption>
        <thead>
          <tr>
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
            {editable ? <th scope="col">Acciones</th> : null}
          </tr>
        </thead>
        <tbody>
          {activities.map((activity) => (
            <tr data-row-id={activity.id} key={activity.id}>
              <th className="activities__name" data-field="name" scope="row">
                {activity.name}
              </th>
              <td className="activities__amount" data-field="bac">
                {formatAmount(activity.bac)}
              </td>
              <td className="activities__amount" data-field="plannedProgress">
                {formatCapturedPercentage(activity.plannedProgress)}
              </td>
              <td className="activities__amount" data-field="actualProgress">
                {formatCapturedPercentage(activity.actualProgress)}
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
              {editable ? (
                <td className="activities__actions" data-row-actions={activity.id}>
                  {onEditActivity === undefined ? null : (
                    <button
                      className="button button--row"
                      data-row-action="edit"
                      onClick={() => {
                        onEditActivity(activity);
                      }}
                      type="button"
                    >
                      Editar
                    </button>
                  )}
                  {onDeleteActivity === undefined ? null : (
                    <button
                      className="button button--row"
                      data-row-action="delete"
                      onClick={() => {
                        onDeleteActivity(activity);
                      }}
                      type="button"
                    >
                      Eliminar
                    </button>
                  )}
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
