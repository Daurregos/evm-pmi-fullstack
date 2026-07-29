import type { ProjectRead, ProjectWrite } from "@/shared/contract";

/**
 * Estado del formulario de proyecto. Sigue las mismas reglas que el de
 * actividad: cadenas crudas, conversión al confirmar y ninguna validación de
 * negocio en el cliente. ADR-009 asigna al backend el recorte de espacios
 * laterales del nombre, así que aquí no se recorta nada.
 */

export type ProjectFormField = "cutoffDate" | "name";

export const PROJECT_FORM_FIELDS: readonly ProjectFormField[] = [
  "name",
  "cutoffDate",
];

export type ProjectFormValues = Readonly<Record<ProjectFormField, string>>;

export function blankProjectForm(): ProjectFormValues {
  return { cutoffDate: "", name: "" };
}

export function projectFormOf(project: ProjectRead): ProjectFormValues {
  return { cutoffDate: project.cutoffDate, name: project.name };
}

export function withProjectValue(
  values: ProjectFormValues,
  field: ProjectFormField,
  raw: string,
): ProjectFormValues {
  return { ...values, [field]: raw };
}

/** ADR-006a: `PUT` reemplaza los dos campos editables, no solo el modificado. */
export function projectWriteOf(values: ProjectFormValues): ProjectWrite {
  return {
    cutoffDate: values.cutoffDate === "" ? null : values.cutoffDate,
    name: values.name === "" ? null : values.name,
  };
}
