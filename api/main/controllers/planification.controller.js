const planification_model = require('../models/planification.model');
const visite_model = require('../models/visite.model');
const utilisateur_model = require('../models/utilisateur.model');
const partenaire_model = require('../models/partenaire.model');
const jwt_decode = require('jwt-decode');
const mysql = require('mysql');
const moment = require('moment');
const { validateAccess } = require('../../helpers/function.helper');
const fs = require("fs");
const path = require("path");
const excelJs = require("exceljs");

exports.tab_partenaires_planifies = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    const roles = ['DIR', 'DRG', 'PM', 'DSM', 'KAM', 'DEL'];
    if (!validateAccess(roles, bearer_content.role)) {
        return res.status(200).json({ message: "Sorry, you're not authorized to use this API" }).end();
    }

    let {
        date_planification
    } = { ...req.body }

    connection.query(planification_model.que_tab_partenaires_planifies, [
        date_planification,
        bearer_content.id_utilisateur
    ], (err, result) => {
        if (!err) {
            const response = {
                partenaires: result[result.length - 2],
                ...result[result.length - 1][0]
            };
            return res.status(200).json(response).end();

        } else {
            return res.status(500).json(err);
        }
    })
}

exports.tab_partenaires = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    const roles = ['DIR', 'DRG', 'PM', 'DSM', 'KAM', 'DEL'];
    if (!validateAccess(roles, bearer_content.role)) {
        return res.status(200).json({ message: "Sorry, you're not authorized to use this API" }).end();
    }

    let records_per_page = parseInt(req.params['records_per_page'], 10) || 1;
    let page_number = parseInt(req.params['page_number'], 10) || 0;
    let records_to_skip = page_number * records_per_page;
    let limit = records_to_skip + ',' + records_per_page;
    let {
        date_planification,
        // id_planification    ,
        type_partenaire,
        potentiel,
        code_specialite,
        code_region,
        code_ville,
        code_secteur,
        id_partenaire,
        nom_partenaire,
    } = { ...req.body }

    let nbr_total_partenaires = 0;
    connection.query(planification_model.que_nbr_tab_partenaires, [
        date_planification,
        // id_planification                    ,
        type_partenaire,
        code_region,
        code_ville,
        code_secteur,
        bearer_content.role,
        bearer_content.id_utilisateur,
        bearer_content.flag_medical,
        bearer_content.flag_pharmaceutique,
        id_partenaire,
        nom_partenaire,
    ], (err, result) => {
        if (!err) {
            nbr_total_partenaires = result[1][0].nbr_total_partenaires;
            let query = planification_model.que_tab_partenaires;

            if (potentiel) {
                potentiel = potentiel.join('\',\'');
                query += 'AND code_potentiel IN (\'' + potentiel + '\')';
            }
            if (code_specialite) {
                code_specialite = code_specialite.join('\',\'');
                query += 'AND code_specialite IN (\'' + code_specialite + '\')';
            }

            mysql.format(query, [
                date_planification,
                // id_planification                    ,
                type_partenaire,
                code_region,
                code_ville,
                code_secteur,
                bearer_content.role,
                bearer_content.id_utilisateur,
                bearer_content.flag_medical,
                bearer_content.flag_pharmaceutique,
                id_partenaire,
                nom_partenaire,
            ])
            connection.query(query + ' LIMIT ' + limit + ';', [
                date_planification,
                // id_planification                    ,
                type_partenaire,
                code_region,
                code_ville,
                code_secteur,
                bearer_content.role,
                bearer_content.id_utilisateur,
                bearer_content.flag_medical,
                bearer_content.flag_pharmaceutique,
                id_partenaire,
                nom_partenaire,
            ], (err, result) => {
                if (!err) {
                    const response = {
                        partenaires: result[result.length - 1],
                        nbr_total_partenaires,
                        date_jour: new Date()
                    }
                    return res.status(200).json(response).end();

                } else {
                    return res.status(500).json(err);
                }
            })
        } else {
            return res.status(500).json(err);
        }
    })

}

exports.ajouter_planification = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    const roles = ['DIR', 'DRG', 'PM', 'DSM', 'KAM', 'DEL'];
    if (!validateAccess(roles, bearer_content.role)) {
        return res.status(200).json({ message: "Sorry, you're not authorized to use this API" }).end();
    }

    let {
        date_debut_planification,
        date_fin_planification
    } = { ...req.body }

    connection.query(planification_model.que_ajout_planification, [
        date_debut_planification,
        date_fin_planification,
        bearer_content.id_utilisateur
    ], (err, result) => {
        if (!err) {
            let id_planification = result[result.length - 1][0].id_planification;
            let date_debut = moment(new Date(date_debut_planification)).format("DD-MM-YYYY");
            let date_fin = moment(new Date(date_fin_planification)).format("DD-MM-YYYY");

            let query_historique = mysql.format(utilisateur_model.que_add_historique_utilisateur, [
                bearer_content.id_utilisateur,
                "Ajout d'une nouvelle planification : Semaine du " + date_debut + " au " + date_fin
            ]);

            connection.query(query_historique, (err, result) => {
                if (!err) {
                    return res.status(200).json({ id_planification }).end();
                }
                else {
                    return res.status(500).json(err);
                }
            })
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.ajouter_visite_planifiee = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    const roles = ['DIR', 'DRG', 'PM', 'DSM', 'KAM', 'DEL'];
    if (!validateAccess(roles, bearer_content.role)) {
        return res.status(200).json({ message: "Sorry, you're not authorized to use this API" }).end();
    }

    let {
        id_partenaire,
        date_visite,
        heure_fin_visite
    } = { ...req.body }
    let query_infos = mysql.format(partenaire_model.que_get_infos_partenaire, [id_partenaire]);

    connection.query(planification_model.que_ajout_visite_planifiee + query_infos, [
        id_partenaire,
        date_visite,
        bearer_content.id_utilisateur,
        bearer_content.role,
        bearer_content.flag_medical,
        bearer_content.flag_pharmaceutique,
        heure_fin_visite
    ], (err, result) => {
        if (!err) {

            if (result[5][0]?.done) {
                if (result[5][0].done == 'ko') {
                    return res.status(500).send({ message: "Sorry, you're not authorized to use this API" });
                }
            }

            if (result[3][0].notFree == 'false') {
                let id_visite = result[4][0].id_visite
                let nom_partenaire = result[7][0].nom_partenaire;
                let query_historique = mysql.format(utilisateur_model.que_add_historique_utilisateur, [
                    bearer_content.id_utilisateur,
                    "Ajout d'une nouvelle visite planifiée chez le partenaire : " + nom_partenaire
                ]);

                connection.query(query_historique, (err, result) => {
                    if (!err) {
                        return res.status(200).json({ id_visite }).end();
                    }
                    else {
                        return res.status(500).json(err);
                    }
                })
            }
            else if (result[3][0].notFree == 'true') {
                return res.status(409).send(
                    {
                        ok: false,
                    }
                );
            }
        } else {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(200).json({ duplicate: true });
            }
            return res.status(500).json(err);
        }
    })
}

exports.annuler_visite = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    const roles = ['DIR', 'DRG', 'PM', 'DSM', 'KAM', 'DEL'];
    if (!validateAccess(roles, bearer_content.role)) {
        return res.status(200).json({ message: "Sorry, you're not authorized to use this API" }).end();
    }

    let { id_visite } = { ...req.body }

    connection.query(planification_model.que_annuler_visite, [bearer_content.id_utilisateur, id_visite], (err, result) => {
        if (!err) {
            let nom_partenaire = result[result.length - 1][0].nom_partenaire;
            if (nom_partenaire) {
                let query_historique = mysql.format(utilisateur_model.que_add_historique_utilisateur, [
                    bearer_content.id_utilisateur,
                    "Annulation d'une visite planifiée chez le partenaire : " + nom_partenaire
                ]);

                connection.query(query_historique, (err, result) => {
                    if (!err) {
                        return res.status(200).json({ msg: "done" }).end();
                    }
                    else {
                        return res.status(500).json(err);
                    }
                })
            } else {
                return res.status(200).json({ msg: "done" }).end();
            }
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.tab_planifications = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    let records_per_page = parseInt(req.params['records_per_page'], 10) || 1;
    let page_number = parseInt(req.params['page_number'], 10) || 0;
    let records_to_skip = page_number * records_per_page;
    let limit = records_to_skip + ',' + records_per_page;

    let {
        date_deb_semaine,
        date_fin_semaine,
        id_utilisateur,
        order_by,
        type_tri
    } = { ...req.body }

    let query = planification_model.que_tab_planifications;

    if (order_by != null) {
        if (order_by == 'date_deb_semaine')
            query += ' ORDER BY tpl.date_deb_planification ' + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC') + ', tpl.id_planification DESC';

        else if (order_by == 'nom_utilisateur')
            query += ' ORDER BY nom_utilisateur ' + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC');

        else
            query += ' ORDER BY tpl.date_deb_planification DESC, id_planification DESC';
    }
    else {
        query += ' ORDER BY tpl.date_deb_planification DESC, id_planification DESC';
    }

    let count_query = mysql.format(planification_model.que_nbr_tab_planifications, [
        bearer_content.id_utilisateur,
        bearer_content.role,
        bearer_content.flag_medical,
        bearer_content.flag_pharmaceutique,
        date_deb_semaine,
        date_fin_semaine,
        id_utilisateur
    ])

    connection.query(query + ' LIMIT ' + limit + ';' + count_query, [
        bearer_content.id_utilisateur,
        bearer_content.role,
        bearer_content.flag_medical,
        bearer_content.flag_pharmaceutique,
        date_deb_semaine,
        date_fin_semaine,
        id_utilisateur
    ], (err, result) => {
        if (!err) {
            let liste_planifications = result[result.length - 3];
            liste_planifications.forEach(planification => {
                if (new Date((new Date()).getTime()).setHours(0, 0, 0, 0) <= new Date(new Date((planification.date_fin_planification)).getTime()).setHours(0, 0, 0, 0)) {
                    planification['flag_disponible'] = 'O';
                }
                else {
                    planification['flag_disponible'] = 'N';
                }
            })
            const response = {
                planifications: liste_planifications,
                nbr_total_planifications: result[result.length - 1][0].nbr_total_planifications
            }
            return res.status(200).json(response).end();
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.tab_rapports = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    let records_per_page = parseInt(req.params['records_per_page'], 10) || 1;
    let page_number = parseInt(req.params['page_number'], 10) || 0;
    let records_to_skip = page_number * records_per_page;
    let limit = records_to_skip + ',' + records_per_page;

    let {
        id_planification,
        date_jour,
        order_by,
        type_tri
    } = { ...req.body }

    let query = planification_model.que_tab_rapports;

    if (order_by != null) {
        if (order_by == 'nom_partenaire')
            query += ' ORDER BY nom_partenaire ' + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC');

        else
            query += ' ORDER BY tpv.date_visite ' + (type_tri != null && type_tri == 'DESC' ? type_tri : 'ASC');
    }
    else {
        query += ' ORDER BY tpv.date_visite';
    }

    let count_query = mysql.format(planification_model.que_nbr_tab_rapports, [
        bearer_content.id_utilisateur,
        bearer_content.role,
        id_planification,
        date_jour
    ])

    count_query += mysql.format(planification_model.que_get_semaine_planification, [id_planification]);

    connection.query(query + ' LIMIT ' + limit + '; SELECT \'O\' AS flag_disponible; ELSE SELECT \'N\' AS flag_disponible; END IF;' + count_query, [
        bearer_content.id_utilisateur,
        bearer_content.role,
        id_planification,
        date_jour
    ], (err, result) => {
        if (!err) {
            if (result[result.length - 7][0].flag_disponible == 'N') {
                return res.status(200).json({ flag_disponible: 'N' }).end();
            }
            const response = {
                rapports: result[result.length - 8],
                nbr_total_rapports: result[result.length - 3][0].nbr_total_rapports,
                date_deb_planification: result[result.length - 1][0].date_deb_planification,
                date_fin_planification: result[result.length - 1][0].date_fin_planification,
                num_semaine: result[result.length - 1][0].num_semaine
            }
            return res.status(200).json(response).end();
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.ajouter_rapport_planification = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    const roles = ['DIR', 'DRG', 'PM', 'DSM', 'KAM', 'DEL'];
    if (!validateAccess(roles, bearer_content.role)) {
        return res.status(200).json({ message: "Sorry, you're not authorized to use this API" }).end();
    }

    let {
        id_visite,
        id_planification,
        code_statut_visite,
        code_potentiel,
        flag_accompagnee,
        id_accompagnant,
        date_replanification,
        commentaire,
        partenaires,
        produits,
        date_visite,
        heure_fin_visite,
        type_visite,
        code_type_visite
    } = { ...req.body }

    let query_infos = mysql.format(partenaire_model.que_get_infos_partenaire, [partenaires[0][0]]);
    bulk_query = 'SELECT 1;'
    if (code_type_visite != 'PLAN' || code_statut_visite != 'REPL') {
        bulk_query = mysql.format(visite_model.que_delete_visite_partenaire, [id_visite]);
    }

    connection.query(planification_model.que_ajouter_rapport_planification + bulk_query + query_infos, [
        bearer_content.id_utilisateur,
        bearer_content.role,
        id_visite,
        id_planification,
        partenaires[0][0],
        code_statut_visite,
        code_potentiel,
        flag_accompagnee,
        id_accompagnant,
        date_replanification,
        commentaire,
        date_visite,
        heure_fin_visite,
        type_visite
    ], (err, result) => {
        // console.log(result, date_visite, heure_fin_visite)
        if (!err) {
            if (result[result.length - 3][0].notFree != 'true') {

                let id_new_visite = result[result.length - 3][0].id_visite;
                let date_visite = result[result.length - 3][0].date_visite;
                let nom_partenaire = result[result.length - 1][0].nom_partenaire;

                if (!id_new_visite) {
                    return res.status(200).json({ duplicate: true, error: 'This partner is already planned for the selected week' });
                }

                let date = moment(new Date(date_visite)).format("DD-MM-YYYY");


                let query_historique = mysql.format(utilisateur_model.que_add_historique_utilisateur, [
                    bearer_content.id_utilisateur,
                    (code_statut_visite != 'REPL' ? "Ajout d'un nouveau rapport à la visite planifiée le : " : "Replanification de la visite du : ")
                    + date + " chez le partenaire : " + nom_partenaire
                ]);


                connection.query(query_historique, (err, result) => {
                    if (!err) {
                        partenaires.forEach((partenaire, i) => {
                            try {
                                partenaire.unshift(id_new_visite);
                                partenaire.push(i + 1)
                            }
                            catch (err) {
                                return res.status(400).json({ error: "data sent is bad in partenaires." });
                            }
                        });
                        connection.query(visite_model.que_add_partenaire_visite, [partenaires], (err) => {
                            if (err) {
                                return res.status(500).json(err).end();
                            } else {
                                return res.status(200).json({ id_visite: id_new_visite }).end();
                            }
                        })

                        if (produits && produits.length > 0 && code_statut_visite == 'REAL') {
                            produits.forEach(produit => {
                                try {
                                    produit.unshift(id_new_visite);
                                }
                                catch (err) {
                                    return res.status(400).json({ error: "data sent is bad in produit." });
                                }
                            });
                            connection.query(visite_model.que_add_visite_produit, [produits], (err) => {
                                if (err) {
                                    return res.status(500).json(err).end();
                                } else {
                                    return res.status(200).json({ id_new_visite }).end();
                                }
                            });
                        }
                        else {
                            return res.status(200).json({ id_new_visite }).end();
                        }
                    }
                    else {
                        return res.status(500).json(err);
                    }
                })

            }
            else if (result[result.length - 4][0].notFree == 'true') {
                return res.status(409).send(
                    {
                        ok: false,
                    }
                );
            }

        } else {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(200).json({ duplicate: true, error: 'This partner is already planned for the selected week' });
            }
            return res.status(500).json(err);
        }
    })
}

exports.modifier_partenaires_planifies = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    const roles = ['DIR', 'DRG', 'PM', 'DSM', 'KAM', 'DEL'];
    if (!validateAccess(roles, bearer_content.role)) {
        return res.status(200).json({ message: "Sorry, you're not authorized to use this API" }).end();
    }

    let { id_planification } = { ...req.params }

    connection.query(planification_model.que_modifier_partenaires_planifies, [
        bearer_content.id_utilisateur,
        id_planification
    ], (err, result) => {
        if (!err) {
            const response = {
                partenaires: result[result.length - 4],
                ...result[result.length - 3][0],
                ...result[result.length - 2][0],
                ...result[result.length - 1][0]
            };
            if (response.flag_disponible == 'N') {
                return res.status(200).json({ flag_disponible: response.flag_disponible }).end();
            }
            return res.status(200).json(response).end();

        } else {
            return res.status(500).json(err);
        }
    })
}

exports.fiche_planification = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    const roles = ['ADMI', 'DIR', 'DRG', 'PM', 'DSM', 'KAM', 'DEL'];
    if (!validateAccess(roles, bearer_content.role)) {
        return res.status(200).json({ message: "Sorry, you're not authorized to use this API" }).end();
    }

    let { id_planification } = { ...req.params }

    connection.query(planification_model.que_fiche_planification, [
        bearer_content.id_utilisateur,
        bearer_content.role,
        bearer_content.flag_medical,
        bearer_content.flag_pharmaceutique,
        id_planification
    ], (err, result) => {
        if (!err) {
            const response = {
                partenaires: result[result.length - 3],
                ...result[result.length - 2][0],
                ...result[result.length - 1][0]
            };
            return res.status(200).json(response).end();

        } else {
            return res.status(500).json(err);
        }
    })
}

Date.prototype.getWeek = function () {
    let target = new Date(this.valueOf());
    let dayNr = (this.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    let firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() != 4) {
        target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
    }
    return 1 + Math.ceil((firstThursday - target) / 604800000);
}

exports.export_planifications = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    if (bearer_content.flag_export != 'O' || bearer_content.export_planifications != 'O') {
        return res.status(403).json({ message: "Not Authorized" });
    }

    let {
        date_deb_semaine,
        date_fin_semaine,
        id_utilisateur,
        order_by,
        type_tri
    } = { ...req.body }

    let query = planification_model.que_export_planifications;

    if (order_by != null) {
        if (order_by == 'date_deb_semaine')
            query += ' ORDER BY tpl.date_deb_planification ' + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC') + ', tpl.id_planification DESC';

        else if (order_by == 'nom_utilisateur')
            query += ' ORDER BY nom_utilisateur ' + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC');

        else
            query += ' ORDER BY tpl.date_deb_planification DESC, id_planification DESC';
    }
    else {
        query += ' ORDER BY tpl.date_deb_planification DESC, id_planification DESC';
    }


    connection.query(query + ';', [
        bearer_content.id_utilisateur,
        bearer_content.role,
        bearer_content.flag_medical,
        bearer_content.flag_pharmaceutique,
        date_deb_semaine,
        date_fin_semaine,
        id_utilisateur
    ], async (err, result) => {
        if (!err) {
            let planifications = result[result.length - 1];
            planifications.forEach(planification => {
                if (new Date((new Date()).getTime()).setHours(0, 0, 0, 0) <= new Date(new Date((planification.date_fin_planification)).getTime()).setHours(0, 0, 0, 0)) {
                    planification['flag_disponible'] = 'O';
                }
                else {
                    planification['flag_disponible'] = 'N';
                }
            })

            try {
                var dir = './temp_exports';
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir);
                }

                const workbook = new excelJs.Workbook();  // Create a new workbook  
                const worksheet = workbook.addWorksheet("Planifications"); // New Worksheet  
                // Column for data in excel. key must match data key
                worksheet.columns = [
                    { header: "Semaine", key: "semaine", width: 30 },
                    { header: "Visiteur", key: "nom_utilisateur", width: 20 },
                    { header: "Total planifié", key: "total_planifies", width: 20 },
                    { header: "Total en attente", key: "total_en_attente", width: 20 },
                    { header: "Total absent", key: "total_absent", width: 20 },
                    { header: "Total replanifié", key: "total_replanifies", width: 20 },
                    { header: "Total réalisé", key: "total_realises", width: 20 },
                ];
                // Looping through data
                planifications.forEach((planification) => {
                    worksheet.addRow(planification); // Add data in worksheet  
                });
                // Making first line in excel height = 20
                worksheet.getRow(1).height = 20;
                // Making first line in excel bold and change color
                worksheet.getRow(1).eachCell((cell) => {
                    cell.font = {
                        bold: true,
                        color: { argb: '00ffffff' }
                    };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: '00aa182d' },
                    };
                });
                try {
                    const path = `${dir}/${Date.now()}.xlsx`;
                    const data = await workbook.xlsx.writeFile(path)
                        .then(() => {
                            res.download(path, "Planifications.xlsx", (err) => {
                                if (!err) {
                                    fs.unlink(path, () => { });
                                }
                                else {
                                    return res.status(500).json({ message: "export download error" });
                                }
                            });
                        });
                } catch (err) {
                    res.status(500).json({
                        message: "export error",
                    });
                }


            } catch (error) {
                console.log(error)
                return res.status(500).json(error);

            }

        } else {
            return res.status(500).json(err);
        }
    })
}

exports.export_rapports = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    if (bearer_content.flag_export != 'O' || bearer_content.export_rapports_planification != 'O') {
        return res.status(403).json({ message: "Not Authorized" });
    }

    let {
        id_planification,
        date_jour,
        order_by,
        type_tri
    } = { ...req.body }

    let query = planification_model.que_export_rapports;

    if (order_by != null) {
        if (order_by == 'nom_partenaire')
            query += ' ORDER BY nom_partenaire ' + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC');

        else
            query += ' ORDER BY tpv.date_visite ' + (type_tri != null && type_tri == 'DESC' ? type_tri : 'ASC');
    }
    else {
        query += ' ORDER BY tpv.date_visite';
    }


    connection.query(query + ';', [
        bearer_content.id_utilisateur,
        bearer_content.role,
        id_planification,
        date_jour
    ], async (err, result) => {
        if (!err) {
            let rapports = result[result.length - 1]
            try {
                var dir = './temp_exports';
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir);
                }

                const workbook = new excelJs.Workbook();  // Create a new workbook  
                const worksheet = workbook.addWorksheet("Rapports Planification"); // New Worksheet  
                // Column for data in excel. key must match data key
                worksheet.columns = [
                    { header: "Type Compte", key: "type_partenaire", width: 20 },
                    { header: "Nom Compte", key: "nom_partenaire", width: 20 },
                    { header: "Spécialité", key: "specialite", width: 20 },
                    { header: "Potentiel", key: "code_potentiel", width: 20 },
                    { header: "Ville Compte", key: "ville_partenaire", width: 20 },
                    { header: "Secteur Compte", key: "secteur_partenaire", width: 20 },
                    { header: "Date planification", key: "date_visite", width: 20 },
                    { header: "Status", key: "Status", width: 10 },
                ];
                // Looping through data
                rapports.forEach((rapport) => {
                    worksheet.addRow(rapport); // Add data in worksheet  
                });
                // Making first line in excel height = 20
                worksheet.getRow(1).height = 20;
                // Making first line in excel bold and change color
                worksheet.getRow(1).eachCell((cell) => {
                    cell.font = {
                        bold: true,
                        color: { argb: '00ffffff' }
                    };
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: '00aa182d' },
                    };
                });
                try {
                    const path = `${dir}/${Date.now()}.xlsx`;
                    const data = await workbook.xlsx.writeFile(path)
                        .then(() => {
                            res.download(path, "Rapports.xlsx", (err) => {
                                if (!err) {
                                    fs.unlink(path, () => { });
                                }
                                else {
                                    return res.status(500).json({ message: "export download error" });
                                }
                            });
                        });
                } catch (err) {
                    res.status(500).json({
                        message: "export error",
                    });
                }


            } catch (error) {
                console.log(error)
                return res.status(500).json(error);

            }

        } else {
            return res.status(500).json(err);
        }
    })
}