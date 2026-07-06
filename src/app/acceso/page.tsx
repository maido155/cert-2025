import { Triangle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Palabra de paso · Certificación 2025",
};

export default async function AccesoPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="gate">
      <form className="gateCard" method="POST" action="/api/acceso">
        <span className="brandMark gateMark">
          <Triangle size={20} />
        </span>
        <h1>Certificación 2025</h1>
        <p>Este espacio guarda las prácticas y enseñanzas de la certificación. Escribe la palabra de paso que compartimos entre hermanos.</p>
        <input name="clave" type="password" placeholder="Palabra de paso" autoFocus required aria-label="Palabra de paso" />
        {error ? <p className="gateError">Esa no es la palabra. Respira e intenta de nuevo.</p> : null}
        <button className="primaryButton" type="submit">
          Entrar a la sala
        </button>
      </form>
    </main>
  );
}
