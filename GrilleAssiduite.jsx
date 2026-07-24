"use client";

import { ETATS } from "@/lib/stats";
import { libelleDate } from "@/lib/dates";

/**
 * Élément signature : le registre annuel. Une ligne par élève, une case par
 * journée saisie. Lecture immédiate des séries d'absences.
 */
export default function GrilleAssiduite({ eleves, presences, jours }) {
  if (jours.length === 0) return null;

  const colonnes = `max-content repeat(${jours.length}, 13px)`;

  return (
    <>
      <div className="grille-cadre">
        <div className="grille" style={{ gridTemplateColumns: colonnes }}>
          {eleves.map((eleve) => (
            <Ligne key={eleve.id} eleve={eleve} presences={presences} jours={jours} />
          ))}
        </div>
      </div>

      <div className="legende">
        <span>
          <i className="case" data-etat="present" /> {ETATS.present.libelle}
        </span>
        <span>
          <i className="case" data-etat="retard" /> {ETATS.retard.libelle}
        </span>
        <span>
          <i className="case" data-etat="absent" /> {ETATS.absent.libelle}
        </span>
        <span>
          <i className="case" /> Non saisi
        </span>
      </div>
    </>
  );
}

function Ligne({ eleve, presences, jours }) {
  return (
    <>
      <div className="grille-nom">
        {eleve.nom} {eleve.prenom}
      </div>
      {jours.map((iso) => {
        const etat = presences[iso]?.[eleve.id];
        const intitule = etat ? ETATS[etat].libelle : "Non saisi";
        return (
          <div
            key={iso}
            className="case"
            data-etat={etat}
            title={`${libelleDate(iso)} — ${intitule}`}
          />
        );
      })}
    </>
  );
}
