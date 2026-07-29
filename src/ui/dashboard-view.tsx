"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ProjectAnalysis, ProjectListItem } from "@/shared/contract";

import { Dashboard } from "@/ui/dashboard";
import { type DashboardSnapshot, loadDashboard } from "@/ui/dashboard-data";
import { fetchProjectAnalysis } from "@/ui/evm-api-client";
import { ProjectSelector } from "@/ui/project-selector";

type LoadState =
  | { readonly kind: "error"; readonly message: string }
  | { readonly kind: "loading" }
  | { readonly kind: "ready" };

function messageOf(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "No fue posible leer el proyecto.";
}

/**
 * Contenedor de la lectura. Enlaza estado de React con las funciones de carga y
 * no contiene lógica propia: ADR-001 deja el cálculo en el backend y ADR-007
 * reemplaza tabla, consolidado y gráfica desde una única lectura coherente.
 *
 * La escritura del estado ocurre en las devoluciones de llamada de la petición,
 * no en el cuerpo del efecto, y una petición obsoleta se descarta.
 */
export function DashboardView() {
  const [projects, setProjects] = useState<readonly ProjectListItem[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null,
  );
  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const pendingProjectId = useRef<number | null>(null);

  const applySnapshot = useCallback((snapshot: DashboardSnapshot) => {
    pendingProjectId.current = snapshot.selectedProjectId;
    setProjects(snapshot.projects);
    setSelectedProjectId(snapshot.selectedProjectId);
    setAnalysis(snapshot.analysis);
    setState({ kind: "ready" });
  }, []);

  const readProject = useCallback((projectId: number) => {
    pendingProjectId.current = projectId;
    setSelectedProjectId(projectId);
    setState({ kind: "loading" });

    fetchProjectAnalysis(projectId).then(
      (received) => {
        if (pendingProjectId.current !== projectId) {
          return;
        }

        setAnalysis(received);
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
      (snapshot) => {
        if (active) {
          applySnapshot(snapshot);
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

  const retry = useCallback(() => {
    if (selectedProjectId === null) {
      setState({ kind: "loading" });
      loadDashboard().then(applySnapshot, (error: unknown) => {
        setState({ kind: "error", message: messageOf(error) });
      });
      return;
    }

    readProject(selectedProjectId);
  }, [applySnapshot, readProject, selectedProjectId]);

  return (
    <main className="shell">
      <div className="shell__bar">
        <p className="shell__brand">Seguimiento de Valor Ganado</p>
        <ProjectSelector
          onSelectProject={readProject}
          projects={projects}
          selectedProjectId={selectedProjectId}
        />
      </div>

      {state.kind === "error" ? (
        <p className="notice notice--error" role="alert">
          <span>{state.message}</span>
          <button className="notice__action" onClick={retry} type="button">
            Reintentar la lectura
          </button>
        </p>
      ) : null}

      {state.kind === "loading" ? (
        <p className="notice">Leyendo el proyecto…</p>
      ) : null}

      {state.kind === "ready" && analysis !== null ? (
        <Dashboard analysis={analysis} />
      ) : null}

      {state.kind === "ready" && analysis === null ? (
        <p className="notice">
          No hay proyectos registrados todavía. Registra uno para analizarlo.
        </p>
      ) : null}
    </main>
  );
}
