import assert from "node:assert/strict";
import { test } from "node:test";

import HomePage from "../../src/app/page";
import { DashboardView } from "../../src/ui/dashboard-view";
import { Modal } from "../../src/ui/modal";
import { renderMarkup, visibleText } from "./render";

test("the home page mounts the dashboard in its initial loading state", () => {
  const markup = renderMarkup(<HomePage />);

  assert.match(markup, /Seguimiento de Valor Ganado/);
  assert.match(visibleText(markup), /Leyendo el proyecto…/);
});

test("the dashboard entry point can render directly", () => {
  const markup = renderMarkup(<DashboardView />);

  assert.match(markup, /data-action="create-project"/);
  assert.match(visibleText(markup), /Nuevo proyecto/);
});

test("the modal renders its title and content before browser effects run", () => {
  const markup = renderMarkup(
    <Modal onCancel={() => undefined} title="Editar actividad">
      <p>Formulario</p>
    </Modal>,
  );

  assert.match(markup, /<dialog class="modal">/);
  assert.match(visibleText(markup), /Editar actividad/);
  assert.match(visibleText(markup), /Formulario/);
});
