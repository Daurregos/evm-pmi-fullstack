"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ActivityRead } from "@/shared/contract";

import { ActivityForm } from "@/ui/activity-form";
import {
  ACTIVITY_FORM_FIELDS,
  type ActivityFormField,
  type ActivityFormValues,
  activityFormOf,
  blankActivityForm,
  withActivityValue,
} from "@/ui/activity-form-state";
import { Dashboard } from "@/ui/dashboard";
import {
  type DashboardSnapshot,
  loadDashboard,
  withPatch,
} from "@/ui/dashboard-data";
import {
  createActivityPlan,
  createProjectPlan,
  deleteActivityPlan,
  deleteProjectPlan,
  replaceActivityPlan,
  replaceProjectPlan,
} from "@/ui/dashboard-mutations";
import { fetchProjectAnalysis } from "@/ui/evm-api-client";
import { type FormFeedback, NO_FEEDBACK, feedbackOf } from "@/ui/form-feedback";
import { Modal } from "@/ui/modal";
import {
  type MutationPlan,
  type StaleView,
  applyMutation,
  retryRefresh,
} from "@/ui/mutation-flow";
import { ProjectForm } from "@/ui/project-form";
import {
  PROJECT_FORM_FIELDS,
  type ProjectFormField,
  type ProjectFormValues,
  blankProjectForm,
  projectFormOf,
  withProjectValue,
} from "@/ui/project-form-state";
import { ProjectSelector } from "@/ui/project-selector";

type LoadState =
  | { readonly kind: "error"; readonly message: string }
  | { readonly kind: "loading" }
  | { readonly kind: "ready" };

/** Editor abierto. `null` en el identificador significa creación. */
type Editor =
  | { readonly kind: "none" }
  | {
      readonly kind: "activity";
      readonly activityId: number | null;
      readonly values: ActivityFormValues;
      readonly feedback: FormFeedback;
      readonly saving: boolean;
    }
  | {
      readonly kind: "project";
      readonly projectId: number | null;
      readonly values: ProjectFormValues;
      readonly feedback: FormFeedback;
      readonly saving: boolean;
    };

const EMPTY_SNAPSHOT: DashboardSnapshot = {
  analysis: null,
  projects: [],
  selectedProjectId: null,
};

const STALE_MESSAGE =
  "El cambio quedó guardado, pero no fue posible releer el proyecto: la vista está desactualizada.";

function messageOf(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "No fue posible leer el proyecto.";
}

/**
 * Contenedor del dashboard. Enlaza estado de React con los módulos de carga,
 * captura y mutación, y no contiene lógica propia: ADR-001 deja el cálculo en el
 * backend y ADR-007 reemplaza tabla, consolidado y gráfica desde una única
 * lectura coherente, que aquí se aplica en un solo `setState`.
 *
 * La digitación solo guarda la cadena digitada. La petición nace al confirmar,
 * conforme a RF-03.
 */
export function DashboardView() {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot>(EMPTY_SNAPSHOT);
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [editor, setEditor] = useState<Editor>({ kind: "none" });
  const [stale, setStale] = useState<StaleView | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const pendingProjectId = useRef<number | null>(null);

  const applySnapshot = useCallback((received: DashboardSnapshot) => {
    pendingProjectId.current = received.selectedProjectId;
    setSnapshot(received);
    setState({ kind: "ready" });
  }, []);

  const readProject = useCallback((projectId: number) => {
    pendingProjectId.current = projectId;
    setSnapshot((current) => ({ ...current, selectedProjectId: projectId }));
    setState({ kind: "loading" });
    setStale(null);
    setProblem(null);

    fetchProjectAnalysis(projectId).then(
      (received) => {
        if (pendingProjectId.current !== projectId) {
          return;
        }

        setSnapshot((current) => ({ ...current, analysis: received }));
        setState({ kind: "ready" });
      },
      (error: unknown) => {
        if (pendingProjectId.current !== projectId) {
          return;
        }

        setState({ kind: "error", message: messageOf(error) });
      },
    );
  }, []);

  useEffect(() => {
    let active = true;

    loadDashboard().then(
      (received) => {
        if (active) {
          applySnapshot(received);
        }
      },
      (error: unknown) => {
        if (active) {
          setState({ kind: "error", message: messageOf(error) });
        }
      },
    );

    return () => {
      active = false;
    };
  }, [applySnapshot]);

  const retryRead = useCallback(() => {
    if (snapshot.selectedProjectId === null) {
      setState({ kind: "loading" });
      loadDashboard().then(applySnapshot, (error: unknown) => {
        setState({ kind: "error", message: messageOf(error) });
      });
      return;
    }

    readProject(snapshot.selectedProjectId);
  }, [applySnapshot, readProject, snapshot.selectedProjectId]);

  /**
   * Ejecuta el plan y traduce su resultado. Un rechazo devuelve el fallo a quien
   * lo pueda ubicar; un refresco fallido deja la vista desactualizada con su
   * lectura pendiente, nunca la escritura.
   */
  const runPlan = useCallback(
    async (plan: MutationPlan, onRejected: (failure: unknown) => void) => {
      const outcome = await applyMutation(plan);

      if (outcome.kind === "rejected") {
        onRejected(outcome.failure);
        return;
      }

      setEditor({ kind: "none" });

      if (outcome.kind === "stale") {
        setStale(outcome);
        setProblem(null);
        return;
      }

      setSnapshot((current) => withPatch(current, outcome.patch));

      if (outcome.patch.selectedProjectId !== undefined) {
        pendingProjectId.current = outcome.patch.selectedProjectId;
      }

      setStale(null);
      setProblem(null);
      setState({ kind: "ready" });
    },
    [],
  );

  const retryStaleRead = useCallback(() => {
    if (stale === null) {
      return;
    }

    void retryRefresh(stale).then((outcome) => {
      if (outcome.kind === "stale") {
        setStale(outcome);
        return;
      }

      setSnapshot((current) => withPatch(current, outcome.patch));
      setStale(null);
    });
  }, [stale]);

  const submitEditor = useCallback(() => {
    if (editor.kind === "none") {
      return;
    }

    if (editor.kind === "project") {
      const plan =
        editor.projectId === null
          ? createProjectPlan(editor.values)
          : replaceProjectPlan(editor.projectId, editor.values);

      setEditor({ ...editor, saving: true });
      void runPlan(plan, (failure) => {
        setEditor({
          ...editor,
          feedback: feedbackOf(failure, PROJECT_FORM_FIELDS),
          saving: false,
        });
      });
      return;
    }

    const projectId = snapshot.selectedProjectId;

    if (projectId === null) {
      return;
    }

    const plan =
      editor.activityId === null
        ? createActivityPlan(projectId, editor.values)
        : replaceActivityPlan(projectId, editor.activityId, editor.values);

    setEditor({ ...editor, saving: true });
    void runPlan(plan, (failure) => {
      setEditor({
        ...editor,
        feedback: feedbackOf(failure, ACTIVITY_FORM_FIELDS),
        saving: false,
      });
    });
  }, [editor, runPlan, snapshot.selectedProjectId]);

  const reportRejection = useCallback((failure: unknown) => {
    setProblem(feedbackOf(failure, []).notice);
  }, []);

  const removeActivity = useCallback(
    (activity: ActivityRead) => {
      const projectId = snapshot.selectedProjectId;

      if (
        projectId === null ||
        !window.confirm(`¿Eliminar la actividad «${activity.name}»?`)
      ) {
        return;
      }

      void runPlan(
        deleteActivityPlan(projectId, activity.id),
        reportRejection,
      );
    },
    [reportRejection, runPlan, snapshot.selectedProjectId],
  );

  const removeProject = useCallback(() => {
    const projectId = snapshot.selectedProjectId;

    if (
      projectId === null ||
      !window.confirm(
        "¿Eliminar el proyecto y todas sus actividades? El dashboard quedará sin proyecto seleccionado.",
      )
    ) {
      return;
    }

    void runPlan(
      deleteProjectPlan(projectId, snapshot.selectedProjectId),
      reportRejection,
    );
  }, [reportRejection, runPlan, snapshot.selectedProjectId]);

  const editorTitle =
    editor.kind === "project"
      ? editor.projectId === null
        ? "Nuevo proyecto"
        : "Editar proyecto"
      : editor.kind === "activity" && editor.activityId === null
        ? "Nueva actividad"
        : "Editar actividad";

  return (
    <main className="shell">
      <div className="shell__bar">
        <p className="shell__brand">Seguimiento de Valor Ganado</p>
        <div className="shell__tools">
          <ProjectSelector
            onSelectProject={readProject}
            projects={snapshot.projects}
            selectedProjectId={snapshot.selectedProjectId}
          />
          <button
            className="button button--primary"
            data-action="create-project"
            onClick={() => {
              setEditor({
                feedback: NO_FEEDBACK,
                kind: "project",
                projectId: null,
                saving: false,
                values: blankProjectForm(),
              });
            }}
            type="button"
          >
            Nuevo proyecto
          </button>
        </div>
      </div>

      {state.kind === "error" ? (
        <p className="notice notice--error" role="alert">
          <span>{state.message}</span>
          <button className="notice__action" onClick={retryRead} type="button">
            Reintentar la lectura
          </button>
        </p>
      ) : null}

      {stale === null ? null : (
        <p className="notice notice--stale" data-stale-view="true" role="alert">
          <span>{STALE_MESSAGE}</span>
          <button
            className="notice__action"
            onClick={retryStaleRead}
            type="button"
          >
            Releer el proyecto
          </button>
        </p>
      )}

      {problem === null ? null : (
        <p className="notice notice--error" role="alert">
          <span>{problem}</span>
        </p>
      )}

      {state.kind === "loading" ? (
        <p className="notice">Leyendo el proyecto…</p>
      ) : null}

      {state.kind === "ready" && snapshot.analysis !== null ? (
        <Dashboard
          analysis={snapshot.analysis}
          onCreateActivity={() => {
            setEditor({
              activityId: null,
              feedback: NO_FEEDBACK,
              kind: "activity",
              saving: false,
              values: blankActivityForm(),
            });
          }}
          onDeleteActivity={removeActivity}
          onDeleteProject={removeProject}
          onEditActivity={(activity) => {
            setEditor({
              activityId: activity.id,
              feedback: NO_FEEDBACK,
              kind: "activity",
              saving: false,
              values: activityFormOf(activity),
            });
          }}
          onEditProject={() => {
            if (snapshot.analysis === null) {
              return;
            }

            setEditor({
              feedback: NO_FEEDBACK,
              kind: "project",
              projectId: snapshot.analysis.project.id,
              saving: false,
              values: projectFormOf(snapshot.analysis.project),
            });
          }}
        />
      ) : null}

      {state.kind === "ready" && snapshot.analysis === null ? (
        <p className="notice">
          {snapshot.projects.length === 0
            ? "No hay proyectos registrados todavía. Registra uno para analizarlo."
            : "Ningún proyecto seleccionado. Elige uno en el selector para analizarlo."}
        </p>
      ) : null}

      {editor.kind === "none" ? null : (
        <Modal
          onCancel={() => {
            setEditor({ kind: "none" });
          }}
          title={editorTitle}
        >
          {editor.kind === "activity" ? (
            <ActivityForm
              feedback={editor.feedback}
              onCancel={() => {
                setEditor({ kind: "none" });
              }}
              onChange={(field: ActivityFormField, raw: string) => {
                setEditor({
                  ...editor,
                  values: withActivityValue(editor.values, field, raw),
                });
              }}
              onSubmit={submitEditor}
              saving={editor.saving}
              values={editor.values}
            />
          ) : (
            <ProjectForm
              feedback={editor.feedback}
              onCancel={() => {
                setEditor({ kind: "none" });
              }}
              onChange={(field: ProjectFormField, raw: string) => {
                setEditor({
                  ...editor,
                  values: withProjectValue(editor.values, field, raw),
                });
              }}
              onSubmit={submitEditor}
              saving={editor.saving}
              values={editor.values}
            />
          )}
        </Modal>
      )}
    </main>
  );
}
