const express = require("express");
const mainRouter = express.Router();
const codification = require("../main/controllers/codification.controller");
const filtre = require('../main/controllers/filtre.controller');
const partenaire = require('../main/controllers/partenaire.controller');
const planification = require('../main/controllers/planification.controller');
const visite = require('../main/controllers/visite.controller');
const utilisateur = require('../main/controllers/utilisateur.controller');
const business_case = require('../main/controllers/business_case.controller');
const produit = require('../main/controllers/produit.controller');
const document = require('../main/controllers/document.controller');
const authentification = require('../main/controllers/authentification.controller');
const dashboard = require('../main/controllers/dashboard.controller');
const passport = require('passport');
const agenda = require('../main/controllers/agenda.controller');
const rapport = require('../main/controllers/rapport.controller');

//Cheking if api is working route
mainRouter.get("/", (req, res) => res.json({ status: "The mainRouter\'s api is working correctly" }));

mainRouter.post("/authentification", authentification.authentification);
mainRouter.post("/token/validation", authentification.validation_token);
mainRouter.post("/deconnexion", authentification.deconnexion);

//Dashboard
mainRouter.post("/accueil", passport.authenticate("jwt", { session: false }), dashboard.get_statistiques);

//Codifications
mainRouter.post("/codification/param", passport.authenticate("jwt", { session: false }), codification.tab_codification_param);
mainRouter.post("/codification/add", passport.authenticate("jwt", { session: false }), codification.ajouter_codification);
mainRouter.post("/codification/upd", passport.authenticate("jwt", { session: false }), codification.modifier_codification);
mainRouter.post("/codification/desactiver", passport.authenticate("jwt", { session: false }), codification.desactiver_codification);
mainRouter.post("/codification/activer", passport.authenticate("jwt", { session: false }), codification.activer_codification);
mainRouter.get("/infos", passport.authenticate("jwt", { session: false }), codification.get_infos);
mainRouter.post("/parametrages/:records_per_page/:page_number", passport.authenticate("jwt", { session: false }), codification.tab_parametrages);
mainRouter.get("/codification/nbr_jours", passport.authenticate("jwt", { session: false }), codification.get_nbr_jours);
mainRouter.get("/codification/hours_range", passport.authenticate("jwt", { session: false }), codification.get_hours_range);
mainRouter.get("/codification/status_colors", passport.authenticate("jwt", { session: false }), codification.get_status_colors);
mainRouter.get("/codification/parametrages/app", passport.authenticate("jwt", { session: false }), codification.get_parametrages_app);

//Filtres
mainRouter.get("/tab/partenaires/:type?", passport.authenticate("jwt", { session: false }), filtre.tab_partenaires);
mainRouter.get("/tab/etablissements", passport.authenticate("jwt", { session: false }), filtre.tab_etablissements);
mainRouter.get("/tab/specialites", passport.authenticate("jwt", { session: false }), filtre.tab_specialites);
mainRouter.get("/tab/revis", passport.authenticate("jwt", { session: false }), filtre.tab_revis);
mainRouter.get("/tab/semaines/planification", passport.authenticate("jwt", { session: false }), filtre.tab_semaines_liste_planification);
mainRouter.get("/tab/semaines", passport.authenticate("jwt", { session: false }), filtre.tab_semaines_ajouter_planification);
mainRouter.get("/tab/utilisateurs/:code?", passport.authenticate("jwt", { session: false }), filtre.tab_utilisateurs);
mainRouter.get("/tab/gammes", passport.authenticate("jwt", { session: false }), filtre.tab_gammes);
mainRouter.get("/tab/types_evenement", passport.authenticate("jwt", { session: false }), filtre.tab_types_evenement);

//Gestion des partenaires
mainRouter.post("/partenaires/:records_per_page/:page_number", passport.authenticate("jwt", { session: false }), partenaire.tab_partenaires);
mainRouter.post("/partenaire/add", passport.authenticate("jwt", { session: false }), partenaire.ajouter_partenaire);
mainRouter.post("/partenaire/upd", passport.authenticate("jwt", { session: false }), partenaire.modifier_partenaire);
mainRouter.post("/partenaire/valider/:id_partenaire", passport.authenticate("jwt", { session: false }), partenaire.valider_partenaire);
mainRouter.post("/partenaire/rejeter/:id_partenaire", passport.authenticate("jwt", { session: false }), partenaire.rejeter_partenaire);
mainRouter.get("/partenaire/:id_partenaire", passport.authenticate("jwt", { session: false }), partenaire.fiche_partenaire);
mainRouter.post("/partenaire/visites/:records_per_page/:page_number", passport.authenticate("jwt", { session: false }), partenaire.tab_partenaire_visites);
mainRouter.post("/partenaire/bc/:records_per_page/:page_number", passport.authenticate("jwt", { session: false }), partenaire.tab_partenaire_bc);
mainRouter.post("/partenaire/notes/:records_per_page/:page_number", passport.authenticate("jwt", { session: false }), partenaire.tab_partenaire_notes);
mainRouter.post("/partenaire/docs/:records_per_page/:page_number", passport.authenticate("jwt", { session: false }), partenaire.tab_partenaire_docs);
mainRouter.post("/partenaire/note/add", passport.authenticate("jwt", { session: false }), partenaire.ajouter_note);
mainRouter.post("/partenaire/doc/add", passport.authenticate("jwt", { session: false }), partenaire.ajouter_document);
mainRouter.post("/partenaire/note/delete/:id_note", passport.authenticate("jwt", { session: false }), partenaire.supprimer_note);
mainRouter.post("/partenaire/doc/delete/:id_document", passport.authenticate("jwt", { session: false }), partenaire.supprimer_document);
mainRouter.post("/partenaires/export", passport.authenticate("jwt", { session: false }), partenaire.export_partenaires);

//Gestion des utilisateurs
mainRouter.post("/utilisateurs/:records_per_page/:page_number", passport.authenticate("jwt", { session: false }), utilisateur.tab_utilisateurs);
mainRouter.post("/responsables", passport.authenticate("jwt", { session: false }), utilisateur.tab_responsables);
mainRouter.post("/utilisateur/add", passport.authenticate("jwt", { session: false }), utilisateur.ajouter_utilisateur);
mainRouter.post("/utilisateur/update", passport.authenticate("jwt", { session: false }), utilisateur.modifier_utilisateur);
mainRouter.post("/utilisateur/activer/:id_utilisateur", passport.authenticate("jwt", { session: false }), utilisateur.activer_utilisateur);
mainRouter.post("/utilisateur/desactiver/:id_utilisateur", passport.authenticate("jwt", { session: false }), utilisateur.desactiver_utilisateur);
mainRouter.post("/delegues/:records_per_page/:page_number", passport.authenticate("jwt", { session: false }), utilisateur.tab_delegues);
mainRouter.get("/utilisateur/historique/:id_utilisateur/:records_per_page/:page_number", passport.authenticate("jwt", { session: false }), utilisateur.tab_historique_utilisateur);
mainRouter.post("/delegues/export", passport.authenticate("jwt", { session: false }), utilisateur.export_delegues);

//Gestion des planifications
mainRouter.post("/planification/partenaires/planifies", passport.authenticate("jwt", { session: false }), planification.tab_partenaires_planifies);
mainRouter.post("/planification/partenaires/:records_per_page/:page_number", passport.authenticate("jwt", { session: false }), planification.tab_partenaires);
mainRouter.post("/planification/add", passport.authenticate("jwt", { session: false }), planification.ajouter_planification);
mainRouter.post("/add/visite/planifiee", passport.authenticate("jwt", { session: false }), planification.ajouter_visite_planifiee);
mainRouter.post("/delete/visite/planifiee", passport.authenticate("jwt", { session: false }), planification.annuler_visite);
mainRouter.post("/tab/planification/:records_per_page/:page_number", passport.authenticate("jwt", { session: false }), planification.tab_planifications);
mainRouter.post("/tab/rapports/:records_per_page/:page_number", passport.authenticate("jwt", { session: false }), planification.tab_rapports);
mainRouter.post("/rapport/add", passport.authenticate("jwt", { session: false }), planification.ajouter_rapport_planification);
mainRouter.get("/update/partenaires/planifies/:id_planification", passport.authenticate("jwt", { session: false }), planification.modifier_partenaires_planifies);
mainRouter.get("/planification/fiche/:id_planification", passport.authenticate("jwt", { session: false }), planification.fiche_planification);
mainRouter.post("/planifications/export", passport.authenticate("jwt", { session: false }), planification.export_planifications);
mainRouter.post("/rapports/export", passport.authenticate("jwt", { session: false }), planification.export_rapports);

//Gestion des visites
mainRouter.post("/visites/:records_per_page/:page_number", passport.authenticate("jwt", { session: false }), visite.tab_visites);
mainRouter.post("/tab/gammes/produits", passport.authenticate("jwt", { session: false }), visite.tab_gamme_produits);
mainRouter.get("/tab/feedbacks", passport.authenticate("jwt", { session: false }), visite.tab_feedbacks);
mainRouter.post("/visite/add", passport.authenticate("jwt", { session: false }), visite.ajouter_visite);
mainRouter.get("/tab/accompagnants", passport.authenticate("jwt", { session: false }), visite.tab_accompagnants);
mainRouter.get("/visite/:id_visite", passport.authenticate("jwt", { session: false }), visite.fiche_visite);
mainRouter.get("/visite/partenaires/:id_visite", passport.authenticate("jwt", { session: false }), visite.visite_partenaires);
mainRouter.post("/visite/update", passport.authenticate("jwt", { session: false }), visite.modifier_visite);
mainRouter.post("/visites/export", passport.authenticate("jwt", { session: false }), visite.export_visites);

//Gestin des business_cases
mainRouter.post("/bc/:records_per_page/:page_number", passport.authenticate("jwt", { session: false }), business_case.tab_business_cases);
mainRouter.post("/without/upload/:code/:id/:extension_document", passport.authenticate("jwt", { session: false }), document.upload_document);
mainRouter.post("/bc/add", passport.authenticate("jwt", { session: false }), business_case.ajouter_business_case);
mainRouter.get("/bc/:id_business_case", passport.authenticate("jwt", { session: false }), business_case.fiche_business_case);
mainRouter.post("/bc/upd", passport.authenticate("jwt", { session: false }), business_case.modifier_business_case);
mainRouter.post("/valider/bc/:id_business_case", passport.authenticate("jwt", { session: false }), business_case.valider_business_case);
mainRouter.post("/rejeter/bc/:id_business_case", passport.authenticate("jwt", { session: false }), business_case.rejeter_business_case);
mainRouter.post("/realiser/bc/:id_business_case", passport.authenticate("jwt", { session: false }), business_case.realiser_business_case);
mainRouter.post("/bc/export", passport.authenticate("jwt", { session: false }), business_case.export_business_cases);


//Gestion des produits
mainRouter.post("/produits/:records_per_page/:page_number", passport.authenticate("jwt", { session: false }), produit.tab_produits);
mainRouter.post("/produit/add", passport.authenticate("jwt", { session: false }), produit.ajouter_produit);
mainRouter.post("/produit/upd", passport.authenticate("jwt", { session: false }), produit.modifier_produit);
mainRouter.get("/produit/:id_produit", passport.authenticate("jwt", { session: false }), produit.fiche_produit);
mainRouter.post("/produit/activer/:id_produit", passport.authenticate("jwt", { session: false }), produit.activer_produit);
mainRouter.post("/produit/desactiver/:id_produit", passport.authenticate("jwt", { session: false }), produit.desactiver_produit);

//Agenda
mainRouter.post("/agenda", passport.authenticate("jwt", { session: false }), agenda.get_agenda_perso_visites);
mainRouter.get("/agenda/visite/:id_visite", passport.authenticate("jwt", { session: false }), agenda.get_agenda_fiche_visite);
mainRouter.post("/agenda/equipe", passport.authenticate("jwt", { session: false }), agenda.get_agenda_equipe_visites);
mainRouter.post("/agenda/evenements", passport.authenticate("jwt", { session: false }), agenda.get_agenda_evenements);
mainRouter.post("/agenda/evenements/add", passport.authenticate("jwt", { session: false }), agenda.add_evenement);
mainRouter.get("/agenda/evenement/:id_evenement", passport.authenticate("jwt", { session: false }), agenda.get_agenda_fiche_evenement);
mainRouter.delete("/agenda/evenement/:id_evenement", passport.authenticate("jwt", { session: false }), agenda.delete_agenda_evenement);
mainRouter.post("/agenda/evenement/:id_evenement", passport.authenticate("jwt", { session: false }), agenda.edit_agenda_evenement);
mainRouter.post("/agenda/visites/supp", passport.authenticate("jwt", { session: false }), agenda.agenda_supp_visites);
mainRouter.post("/agenda/equipe/evenements", passport.authenticate("jwt", { session: false }), agenda.get_agenda_equipe_evenements);
mainRouter.post("/agenda/is_date_free", passport.authenticate("jwt", { session: false }), agenda.is_date_free);

mainRouter.post("/rapport/annuel", passport.authenticate("jwt", { session: false }), rapport.get_rapport_annuel);
mainRouter.post("/rapport/testannuel", passport.authenticate("jwt", { session: false }), rapport.test_annuel);
mainRouter.post("/rapport/subUsers", passport.authenticate("jwt", { session: false }), rapport.get_sub_users);
mainRouter.post("/rapport/anneeExiste", passport.authenticate("jwt", { session: false }), rapport.get_rapport_annee_existe);
mainRouter.post("/rapport/tauxCoverture", passport.authenticate("jwt", { session: false }), rapport.export_taux_coverture);
module.exports = mainRouter;