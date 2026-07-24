import { moisDeIso } from "./dates";

export const ETATS = {
  present: { cle: "present", libelle: "Présent", court: "P" },
  retard: { cle: "retard", libelle: "Retard", court: "R" },
  absent: { cle: "absent", libelle: "Absent", court: "A" },
};

export const ORDRE_ETATS = ["present", "retard", "absent"];

/** Journées enregistrées, triées, filtrées par un prédicat sur la date ISO */
export function joursEnregistres(presences, predicat = () => true) {
  return Object.keys(presences)
    .filter((iso) => Object.keys(presences[iso] || {}).length > 0)
    .filter(predicat)
    .sort();
}

/**
 * Statistiques d'un élève sur les journées retenues.
 * Le taux de présence compte les retards comme une présence physique,
 * ils sont comptabilisés à part.
 */
export function statsEleve(presences, jours, eleveId) {
  let presents = 0;
  let retards = 0;
  let absents = 0;

  for (const iso of jours) {
    const etat = presences[iso]?.[eleveId];
    if (etat === "present") presents++;
    else if (etat === "retard") retards++;
    else if (etat === "absent") absents++;
  }

  const saisis = presents + retards + absents;
  const taux = saisis === 0 ? null : ((presents + retards) / saisis) * 100;

  return { presents, retards, absents, saisis, taux };
}

/**
 * Classement des élèves sur une période.
 * Trié par taux décroissant, puis moins d'absences, puis moins de retards, puis nom.
 * Les ex æquo partagent le même rang.
 */
export function classement(eleves, presences, predicat) {
  const jours = joursEnregistres(presences, predicat);

  const lignes = eleves
    .map((eleve) => ({ eleve, ...statsEleve(presences, jours, eleve.id) }))
    .sort((a, b) => {
      if (a.saisis === 0 && b.saisis === 0) return compareNoms(a.eleve, b.eleve);
      if (a.saisis === 0) return 1;
      if (b.saisis === 0) return -1;
      if (b.taux !== a.taux) return b.taux - a.taux;
      if (a.absents !== b.absents) return a.absents - b.absents;
      if (a.retards !== b.retards) return a.retards - b.retards;
      return compareNoms(a.eleve, b.eleve);
    });

  let rangCourant = 0;
  let precedente = null;
  lignes.forEach((ligne, index) => {
    const cle = ligne.saisis === 0 ? "—" : `${ligne.taux}|${ligne.absents}|${ligne.retards}`;
    if (cle !== precedente) {
      rangCourant = index + 1;
      precedente = cle;
    }
    ligne.rang = ligne.saisis === 0 ? null : rangCourant;
  });

  return { jours, lignes };
}

/** Totaux de la classe sur une période */
export function totauxClasse(lignes) {
  const cumul = lignes.reduce(
    (acc, l) => ({
      presents: acc.presents + l.presents,
      retards: acc.retards + l.retards,
      absents: acc.absents + l.absents,
      saisis: acc.saisis + l.saisis,
    }),
    { presents: 0, retards: 0, absents: 0, saisis: 0 }
  );
  cumul.taux =
    cumul.saisis === 0 ? null : ((cumul.presents + cumul.retards) / cumul.saisis) * 100;
  return cumul;
}

/** Détail mois par mois pour un élève, sur une liste de mois "AAAA-MM" */
export function detailMensuel(presences, eleveId, mois) {
  return mois.map((am) => {
    const jours = joursEnregistres(presences, (iso) => moisDeIso(iso) === am);
    return { mois: am, ...statsEleve(presences, jours, eleveId) };
  });
}

export function formaterTaux(taux) {
  if (taux === null || taux === undefined) return "—";
  return `${taux.toFixed(1).replace(".", ",")} %`;
}

function compareNoms(a, b) {
  return `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, "fr");
}
