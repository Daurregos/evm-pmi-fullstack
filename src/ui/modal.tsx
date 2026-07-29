"use client";

import { type ReactNode, useEffect, useRef } from "react";

export interface ModalProps {
  readonly title: string;
  readonly onCancel: () => void;
  readonly children: ReactNode;
}

/**
 * Diálogo nativo. Se monta solo cuando hay algo que editar y se abre con
 * `showModal`, de modo que el navegador aporta capa superior, retención del foco
 * y cierre con `Esc` sin que el cliente los reimplemente.
 *
 * El efecto es la única superficie de esta rebanada que el nivel de cliente no
 * ejercita, porque renderiza con `react-dom/server`. Por eso el componente no
 * contiene nada más que abrir y cerrar: todo lo verificable vive en los módulos
 * sin React.
 */
export function Modal({ children, onCancel, title }: ModalProps) {
  const reference = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = reference.current;

    dialog?.showModal();

    return () => {
      dialog?.close();
    };
  }, []);

  return (
    <dialog
      className="modal"
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      ref={reference}
    >
      <h2 className="modal__title">{title}</h2>
      {children}
    </dialog>
  );
}
