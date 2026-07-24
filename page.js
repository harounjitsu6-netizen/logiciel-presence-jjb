"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import SelecteurEtat from "@/components/SelecteurEtat";
import { useDonnees } from "@/lib/store";
import { estWeekend, isoAujourdhui, libelleDate } from "@/lib/dates";

export default function PageAppel() {
  const { pret, eleves, presences, definirEtat, definirTous, effacerJour, chargerExemple } =
    useDonnees();
  const [jour, setJour] = useState(isoAujourdhui);

  const saisie = presences[jour] || {};

  const totaux = useMemo(() => {
    const compte = { present: 0, retard: 0, absent: 0 };
    eleves.forEach((eleve) => {
      const etat = saisie[eleve.id];
      if (etat) compte[etat] += 1;
    });
    return { ...compte, restants: eleves.length - (compte.present + compte.retard + compte.absent) };
  }, [eleves, saisie]);

  const elevesTries = useMemo(
    () =>
      [...eleves].sort((a, b) =>
        `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, "fr")
      ),
    [eleves]
  );

  if (!pret) return <p className="note">Ouverture du cahier…</p>;

  if (eleves.length === 0) {
    return (
      <div className="carte vide">
        <span className="etiquette">Cahier vide</span>
        <h2>Commencez par inscrire vos élèves</h2>
        <p>
          Ajoutez-les un par un ou collez votre liste de classe d&apos;un seul coup. L&apos;appel
          et les statistiques suivront.
        </p>
        <div className="rangee" style={{ justifyContent: "center" }}>
          <Link href="/eleves" className="bouton bouton--primaire">
            Inscrire des élèves
          </Link>
          <button type="button" className="bouton" onClick={chargerExemple}>
            Charger une classe d&apos;essai
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="pile">
      <div className="entete-page">
        <div>
          <span className="etiquette">Appel du jour</span>
          <h1>{libelleDate(jour)}</h1>
          {estWeekend(jour) && (
            <p className="sous-titre">Cette date tombe un week-end.</p>
          )}
        </div>

        <div className="rangee">
          <label className="champ">
            <span>Date de l&apos;appel</span>
            <input
              type="date"
              value={jour}
              onChange={(evenement) => setJour(evenement.target.value)}
            />
          </label>
          <button
            type="button"
            className="bouton"
            onClick={() => setJour(isoAujourdhui())}
            disabled={jour === isoAujourdhui()}
            style={{ alignSelf: "flex-end" }}
          >
            Aujourd&apos;hui
          </button>
        </div>
      </div>

      <div className="compteurs">
        <div className="compteur" data-ton="present">
          <div className="compteur-valeur">{totaux.present}</div>
          <div className="compteur-libelle">Présents</div>
        </div>
        <div className="compteur" data-ton="retard">
          <div className="compteur-valeur">{totaux.retard}</div>
          <div className="compteur-libelle">Retards</div>
        </div>
        <div className="compteur" data-ton="absent">
          <div className="compteur-valeur">{totaux.absent}</div>
          <div className="compteur-libelle">Absents</div>
        </div>
        <div className="compteur">
          <div className="compteur-valeur">{totaux.restants}</div>
          <div className="compteur-libelle">Non saisis</div>
        </div>
      </div>

      <section className="carte">
        <div className="carte-entete">
          <h2>
            Classe · {eleves.length} élève{eleves.length > 1 ? "s" : ""}
          </h2>
          <div className="rangee">
            <button
              type="button"
              className="bouton bouton--petit bouton--primaire"
              onClick={() => definirTous(jour, "present")}
            >
              Tous présents
            </button>
            <button
              type="button"
              className="bouton bouton--petit bouton--danger"
              onClick={() => effacerJour(jour)}
              disabled={Object.keys(saisie).length === 0}
            >
              Effacer la journée
            </button>
          </div>
        </div>

        <div className="cahier">
          {elevesTries.map((eleve, index) => (
            <div key={eleve.id} className="ligne" data-etat={saisie[eleve.id]}>
              <div className="ligne-numero">{index + 1}</div>
              <div className="ligne-nom">
                <Link href={`/eleves/${eleve.id}`}>
                  <strong>{eleve.nom}</strong> {eleve.prenom}
                </Link>
                {eleve.classe && <span className="ligne-detail">{eleve.classe}</span>}
              </div>
              <SelecteurEtat
                valeur={saisie[eleve.id]}
                nomEleve={`${eleve.prenom} ${eleve.nom}`}
                onChange={(etat) => definirEtat(jour, eleve.id, etat)}
              />
            </div>
          ))}
        </div>
      </section>

      <p className="note">
        Astuce : marquez d&apos;abord « Tous présents », puis corrigez les quelques absents.
        Cliquer une seconde fois sur un état efface la saisie.
      </p>
    </div>
  );
}
