"use client";

import type { ProjectListItem } from "@/shared/contract";

export interface ProjectSelectorProps {
  readonly projects: readonly ProjectListItem[];
  readonly selectedProjectId: number | null;
  readonly onSelectProject: (projectId: number) => void;
}

/**
 * RF-01: el dashboard analiza un proyecto a la vez, elegido entre los que
 * devuelve `GET /projects`.
 *
 * Sin selección —el estado en que RF-01 deja al dashboard tras eliminar el
 * proyecto seleccionado— el selector ofrece una opción vacía. Sin ella el
 * navegador mostraría el primer proyecto y el control contradiría a la vista.
 */
export function ProjectSelector({
  onSelectProject,
  projects,
  selectedProjectId,
}: ProjectSelectorProps) {
  const empty = projects.length === 0;

  return (
    <label className="selector">
      <span className="selector__label">Proyecto</span>
      <select
        className="selector__control"
        disabled={empty}
        onChange={(event) => {
          if (event.target.value === "") {
            return;
          }

          onSelectProject(Number(event.target.value));
        }}
        value={selectedProjectId === null ? "" : String(selectedProjectId)}
      >
        {empty ? (
          <option value="">No hay proyectos registrados</option>
        ) : (
          <>
            {selectedProjectId === null ? (
              <option value="">Elige un proyecto</option>
            ) : null}
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </>
        )}
      </select>
    </label>
  );
}
