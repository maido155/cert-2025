"use client";

import { UserRound } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  initial?: string;
  onSave: (name: string) => void;
  onClose: () => void;
};

export default function EditorNameModal({ initial = "", onSave, onClose }: Props) {
  const [name, setName] = useState(initial);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function submit() {
    const clean = name.trim();
    if (!clean) return;
    onSave(clean);
  }

  return (
    <div className="modalBackdrop" onMouseDown={(event) => event.currentTarget === event.target && onClose()}>
      <section className="nameCard" role="dialog" aria-modal="true" aria-labelledby="name-modal-title">
        <span className="brandMark gateMark">
          <UserRound size={20} />
        </span>
        <h2 id="name-modal-title">¿Con qué nombre firmas?</h2>
        <p>Tus cambios quedan guardados en la biblioteca compartida. Escribe tu nombre para que los hermanos sepan quién cuidó cada práctica.</p>
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && submit()}
          placeholder="Tu nombre"
          autoFocus
          aria-label="Tu nombre"
        />
        <button className="primaryButton" onClick={submit} type="button">
          Guardar mi nombre
        </button>
      </section>
    </div>
  );
}
