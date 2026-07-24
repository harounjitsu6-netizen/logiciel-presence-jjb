# Cahier d'appel

Application de suivi des présences pour une classe : on inscrit les élèves, on fait
l'appel en quelques secondes, et l'application produit le classement d'assiduité
**par mois** et **par année scolaire**.

- Trois états par élève et par jour : **présent**, **retard**, **absent**
- Bouton « Tous présents » puis correction des quelques absents
- Classement avec rang, taux de présence, nombre de présences, retards et absences
- Registre visuel : une case par journée et par élève, pour repérer les séries d'absences
- Fiche individuelle avec le détail mois par mois
- Export CSV du classement (ouvrable directement dans Excel) et sauvegarde JSON

## Où sont stockées les données

Dans le **stockage local du navigateur** (`localStorage`). Aucun serveur, aucune base de
données, aucun compte à créer : le projet se déploie tel quel. En contrepartie, les
données sont propres à un navigateur et à un appareil — d'où les boutons *Exporter la
sauvegarde* et *Restaurer un fichier* dans l'onglet **Élèves**.

Pour partager les données entre plusieurs enseignants ou plusieurs appareils, il faut
brancher une base : voir la section « Passer à une base de données ».

## Démarrer en local

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000

## Déployer sur Vercel

Le projet est un Next.js standard, sans variable d'environnement ni configuration
particulière. Vercel le détecte automatiquement.

**Méthode 1 — depuis un dépôt Git**

1. Créer un dépôt et y pousser ce dossier
   ```bash
   git init && git add . && git commit -m "Cahier d'appel"
   git remote add origin <url-de-votre-depot>
   git push -u origin main
   ```
2. Sur vercel.com : *Add New… → Project*, importer le dépôt, puis *Deploy*.
   Framework détecté : Next.js. Build : `next build`. Rien d'autre à renseigner.

**Méthode 2 — depuis le terminal**

```bash
npm i -g vercel
vercel        # aperçu
vercel --prod # mise en production
```

## Structure du projet

```
.
├── app/
│   ├── layout.js              Structure HTML, polices, fournisseur de données
│   ├── globals.css            Tout le style (aucun framework CSS)
│   ├── page.js                Appel du jour
│   ├── eleves/page.js         Liste de classe, import, sauvegardes
│   ├── eleves/[id]/page.js    Fiche élève, détail mois par mois
│   └── statistiques/page.js   Classement mensuel et annuel + registre
├── components/
│   ├── BarreNavigation.jsx
│   ├── SelecteurEtat.jsx      Bouton segmenté présent / retard / absent
│   ├── TableauClassement.jsx
│   └── GrilleAssiduite.jsx    Une case par journée
├── lib/
│   ├── store.jsx              Contexte React + persistance localStorage
│   ├── stats.js               Calcul des taux et du classement
│   ├── dates.js               Dates en français, année scolaire
│   └── fichiers.js            Export CSV et sauvegarde JSON
├── next.config.mjs
└── package.json
```

## Règles de calcul

- **Taux de présence** = (présences + retards) ÷ journées saisies.
  Un retard compte comme une présence physique ; les retards sont comptés à part.
- Seules les journées où au moins un élève a été saisi entrent dans le calcul.
- Un élève inscrit en cours d'année n'est pénalisé que sur les journées où il a été saisi.
- **Année scolaire** = du 1er septembre au 31 août.
  Pour utiliser l'année civile, modifier `anneeScolaireDeIso` dans `lib/dates.js`.
- **Départage des ex æquo** : taux le plus élevé, puis moins d'absences, puis moins de
  retards, puis ordre alphabétique. Les vrais ex æquo partagent le même rang.

## Format des données

```json
{
  "version": 1,
  "eleves": [{ "id": "…", "nom": "Chevalier", "prenom": "Alice", "classe": "4e B" }],
  "presences": {
    "2026-01-12": { "id-de-l-eleve": "present" }
  }
}
```

Les états possibles sont `present`, `retard` et `absent`.

## Personnaliser

- **Couleurs et polices** : les variables sont en haut de `app/globals.css` (`:root`).
- **Ajouter un état** (par exemple « absence justifiée ») : ajouter l'entrée dans `ETATS`
  et `ORDRE_ETATS` dans `lib/stats.js`, une couleur dans `globals.css`, et décider dans
  `statsEleve` s'il compte dans le taux.

## Passer à une base de données

Toute la persistance est isolée dans `lib/store.jsx`. Pour partager les données :

1. Créer une base (Vercel Postgres, Supabase, Neon…).
2. Ajouter des routes dans `app/api/` qui lisent et écrivent les élèves et les présences.
3. Dans `lib/store.jsx`, remplacer les deux `useEffect` qui touchent `localStorage` par
   un `fetch` vers ces routes. Les composants n'ont pas besoin d'être modifiés.

Prévoir aussi une authentification : sans elle, l'URL publique donnerait accès aux
données nominatives des élèves.
