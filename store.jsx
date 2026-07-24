"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isoDe } from "./dates";

const CLE = "cahier-appel:v1";
const VIDE = { version: 1, eleves: [], presences: {} };

const Contexte = createContext(null);

function identifiant() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return `e${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function nettoyer(brut) {
  if (!brut || typeof brut !== "object") return { ...VIDE };
  return {
    version: 1,
    eleves: Array.isArray(brut.eleves)
      ? brut.eleves.map((e) => ({
          id: e.id || identifiant(),
          nom: String(e.nom || "").trim(),
          prenom: String(e.prenom || "").trim(),
          classe: String(e.classe || "").trim(),
        }))
      : [],
    presences: brut.presences && typeof brut.presences === "object" ? brut.presences : {},
  };
}

export function FournisseurDonnees({ children }) {
  const [donnees, setDonnees] = useState(VIDE);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    try {
      const brut = window.localStorage.getItem(CLE);
      if (brut) setDonnees(nettoyer(JSON.parse(brut)));
    } catch (erreur) {
      console.warn("Sauvegarde illisible, on repart d'un cahier vide.", erreur);
    }
    setPret(true);
  }, []);

  useEffect(() => {
    if (!pret) return;
    try {
      window.localStorage.setItem(CLE, JSON.stringify(donnees));
    } catch (erreur) {
      console.warn("Enregistrement impossible.", erreur);
    }
  }, [donnees, pret]);

  const ajouterEleve = useCallback((nom, prenom, classe = "") => {
    const eleve = {
      id: identifiant(),
      nom: nom.trim(),
      prenom: prenom.trim(),
      classe: classe.trim(),
    };
    if (!eleve.nom && !eleve.prenom) return null;
    setDonnees((d) => ({ ...d, eleves: [...d.eleves, eleve] }));
    return eleve;
  }, []);

  /** Une ligne = un élève. Formats acceptés : "Dupont Marie", "Dupont, Marie", "Marie Dupont" */
  const ajouterListe = useCallback((texte, classe = "") => {
    const nouveaux = texte
      .split("\n")
      .map((ligne) => ligne.trim())
      .filter(Boolean)
      .map((ligne) => {
        let nom = ligne;
        let prenom = "";
        if (ligne.includes(",")) {
          const [a, b = ""] = ligne.split(",");
          nom = a.trim();
          prenom = b.trim();
        } else {
          const mots = ligne.split(/\s+/);
          if (mots.length > 1) {
            nom = mots[0];
            prenom = mots.slice(1).join(" ");
          }
        }
        return { id: identifiant(), nom, prenom, classe: classe.trim() };
      });
    if (nouveaux.length === 0) return 0;
    setDonnees((d) => ({ ...d, eleves: [...d.eleves, ...nouveaux] }));
    return nouveaux.length;
  }, []);

  const modifierEleve = useCallback((id, champs) => {
    setDonnees((d) => ({
      ...d,
      eleves: d.eleves.map((e) => (e.id === id ? { ...e, ...champs } : e)),
    }));
  }, []);

  const supprimerEleve = useCallback((id) => {
    setDonnees((d) => {
      const presences = {};
      for (const [iso, jour] of Object.entries(d.presences)) {
        const copie = { ...jour };
        delete copie[id];
        if (Object.keys(copie).length > 0) presences[iso] = copie;
      }
      return { ...d, eleves: d.eleves.filter((e) => e.id !== id), presences };
    });
  }, []);

  /** etat : "present" | "retard" | "absent" | null (efface la saisie) */
  const definirEtat = useCallback((iso, eleveId, etat) => {
    setDonnees((d) => {
      const jour = { ...(d.presences[iso] || {}) };
      if (etat === null) delete jour[eleveId];
      else jour[eleveId] = etat;
      const presences = { ...d.presences };
      if (Object.keys(jour).length === 0) delete presences[iso];
      else presences[iso] = jour;
      return { ...d, presences };
    });
  }, []);

  const definirTous = useCallback((iso, etat) => {
    setDonnees((d) => {
      const jour = {};
      d.eleves.forEach((e) => {
        jour[e.id] = etat;
      });
      return { ...d, presences: { ...d.presences, [iso]: jour } };
    });
  }, []);

  const effacerJour = useCallback((iso) => {
    setDonnees((d) => {
      const presences = { ...d.presences };
      delete presences[iso];
      return { ...d, presences };
    });
  }, []);

  const remplacerDonnees = useCallback((brut) => {
    setDonnees(nettoyer(brut));
  }, []);

  const toutEffacer = useCallback(() => setDonnees({ ...VIDE, presences: {} }), []);

  const chargerExemple = useCallback(() => setDonnees(exemple()), []);

  const valeur = useMemo(
    () => ({
      donnees,
      pret,
      eleves: donnees.eleves,
      presences: donnees.presences,
      ajouterEleve,
      ajouterListe,
      modifierEleve,
      supprimerEleve,
      definirEtat,
      definirTous,
      effacerJour,
      remplacerDonnees,
      toutEffacer,
      chargerExemple,
    }),
    [
      donnees,
      pret,
      ajouterEleve,
      ajouterListe,
      modifierEleve,
      supprimerEleve,
      definirEtat,
      definirTous,
      effacerJour,
      remplacerDonnees,
      toutEffacer,
      chargerExemple,
    ]
  );

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useDonnees() {
  const contexte = useContext(Contexte);
  if (!contexte) throw new Error("useDonnees doit être utilisé dans <FournisseurDonnees>");
  return contexte;
}

/** Jeu d'essai : 12 élèves et 40 jours de classe tirés au sort */
function exemple() {
  const noms = [
    ["Bahri", "Yasmine"],
    ["Bernard", "Lucas"],
    ["Chevalier", "Alice"],
    ["Diallo", "Moussa"],
    ["Faure", "Camille"],
    ["Gomes", "Tiago"],
    ["Kaczmarek", "Éva"],
    ["Lambert", "Noah"],
    ["Mercier", "Jade"],
    ["Nguyen", "Linh"],
    ["Roussel", "Adam"],
    ["Traoré", "Aya"],
  ];

  const eleves = noms.map(([nom, prenom]) => ({
    id: identifiant(),
    nom,
    prenom,
    classe: "4e B",
  }));

  // Fiabilité propre à chaque élève, pour un classement lisible
  const fiabilite = eleves.map((_, i) => 0.99 - i * 0.028);

  const presences = {};
  const curseur = new Date();
  let restants = 40;
  while (restants > 0) {
    const jour = curseur.getDay();
    if (jour !== 0 && jour !== 3 && jour !== 6) {
      const iso = isoDe(curseur);
      const saisie = {};
      eleves.forEach((eleve, i) => {
        const tirage = Math.random();
        if (tirage > fiabilite[i]) saisie[eleve.id] = "absent";
        else if (tirage > fiabilite[i] - 0.05) saisie[eleve.id] = "retard";
        else saisie[eleve.id] = "present";
      });
      presences[iso] = saisie;
      restants--;
    }
    curseur.setDate(curseur.getDate() - 1);
  }

  return { version: 1, eleves, presences };
}
