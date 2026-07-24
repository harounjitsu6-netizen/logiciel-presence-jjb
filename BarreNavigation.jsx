"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ONGLETS = [
  { href: "/", libelle: "Appel du jour" },
  { href: "/eleves", libelle: "Élèves" },
  { href: "/statistiques", libelle: "Statistiques" },
];

export default function BarreNavigation() {
  const chemin = usePathname();

  const estActif = (href) =>
    href === "/" ? chemin === "/" : chemin.startsWith(href);

  return (
    <header className="barre">
      <div className="barre-contenu">
        <Link href="/" className="marque">
          <span className="marque-signe" aria-hidden="true">
            A
          </span>
          <span>Cahier d&apos;appel</span>
        </Link>

        <nav className="onglets" aria-label="Navigation principale">
          {ONGLETS.map((onglet) => (
            <Link
              key={onglet.href}
              href={onglet.href}
              className="onglet"
              aria-current={estActif(onglet.href) ? "page" : undefined}
            >
              {onglet.libelle}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
