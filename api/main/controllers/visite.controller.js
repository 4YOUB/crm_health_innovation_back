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
const e = require('express');
const { Worker } = require('worker_threads')
exports.tab_visites = (req, res) => {
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
        type_partenaire,
        code_specialite,
        code_potentiel,
        date_debut_visite,
        date_fin_visite,
        code_statut_visite,
        code_region,
        nom_partenaire,
        id_utilisateur,
        order_by,
        type_tri
    } = { ...req.body }

    let query = visite_model.que_tab_visites;
    let count_query = visite_model.que_nbr_tab_visites;

    if (code_potentiel) {
        code_potentiel = code_potentiel.join('\',\'');
        query += 'AND code_potentiel IN (\'' + code_potentiel + '\')';
        count_query += 'AND code_potentiel IN (\'' + code_potentiel + '\')';
    }
    if (code_specialite) {
        code_specialite = code_specialite.join('\',\'');
        query += 'AND code_specialite IN (\'' + code_specialite + '\')';
        count_query += 'AND code_specialite IN (\'' + code_specialite + '\')';
    }


    if (order_by != null) {
        if (order_by == 'nom_partenaire')
            query += ' ORDER BY nom_partenaire ' + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC') + ', tpv.date_visite DESC, tpv.id_visite DESC';

        else if (order_by == 'date_visite')
            query += ' ORDER BY tpv.date_visite ' + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC') + ', tpv.id_visite DESC';

        else if (order_by == 'nom_utilisateur')
            query += ' ORDER BY nom_utilisateur ' + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC') + ', tpv.date_visite DESC, tpv.id_visite DESC';

        else
            query += ' ORDER BY tpv.date_visite DESC, tpv.id_visite DESC';
    }
    else {
        query += ' ORDER BY tpv.date_visite DESC, tpv.id_visite DESC';
    }

    count_query = mysql.format(count_query, [
        bearer_content.id_utilisateur,
        bearer_content.role,
        bearer_content.flag_medical,
        bearer_content.flag_pharmaceutique,
        type_partenaire,
        date_debut_visite,
        date_fin_visite,
        code_statut_visite,
        code_region,
        nom_partenaire,
        id_utilisateur
    ])
    connection.query(query + ' LIMIT ' + limit + ';' + count_query, [
        bearer_content.id_utilisateur,
        bearer_content.role,
        bearer_content.flag_medical,
        bearer_content.flag_pharmaceutique,
        type_partenaire,
        date_debut_visite,
        date_fin_visite,
        code_statut_visite,
        code_region,
        nom_partenaire,
        id_utilisateur
    ], (err, result) => {
        if (!err) {
            // const visites = []
            // currentIndex = -1
            // result[result.length - 3].forEach((visite, i) => {
            //     if (visites.findIndex(vi => vi.id_visite == visite.id_visite) == -1) {
            //         currentIndex++
            //         visites.push({
            //             accompagnant: visite.accompagnant,
            //             date_replanification: visite.date_replanification,
            //             code_statut_visite: visite.code_statut_visite,
            //             code_type_visite: visite.code_type_visite,
            //             date_visite: visite.date_visite,
            //             flag_accompagnee: visite.flag_accompagnee,
            //             heure_fin_visite: visite.heure_fin_visite,
            //             id_utilisateur: visite.id_utilisateur,
            //             id_visite: visite.id_visite,
            //             nbr_echantillon: visite.nbr_echantillon,
            //             type_visite: visite.type_visite,
            //             nom_utilisateur: visite.nom_utilisateur,
            //             nbr_produit: visite.nbr_produit,
            //             partenaires: []
            //         })
            //     }
            //     visites[currentIndex].partenaires.push({
            //         code_potentiel: visite.code_potentiel,
            //         code_specialite: visite.code_specialite,
            //         code_type_partenaire: visite.code_type_partenaire,
            //         nom_partenaire: visite.nom_partenaire,
            //         specialite: visite.specialite,
            //         type_partenaire: visite.type_partenaire
            //     })
            // })
            // console.log(1)
            // if (visites.length < 10 && !req.body.functionCall) {
            //     console.log(2)
            //     req.params['records_per_page'] = 10 - visites.length
            //     req.params['page_number'] = req.params['page_number'] + 1
            //     req.body.functionCall = true
            //     f = this.tab_visites(req, res)
            // }
            // console.log(3)
            const response = {
                visites: result[result.length - 3],
                nbr_total_visites: result[result.length - 1][0].nbr_total_visites
            }
            // if (req.body.functionCall) {
            //     console.log(4)
            //     return visites
            // }
            return res.status(200).json(response).end();

        } else {
            return res.status(500).json(err);
        }
    })
}

exports.visite_partenaires = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    My_query = mysql.format(visite_model.que_visite_partenaires, [req.params.id_visite])

    connection.query(My_query, (err, result) => {
        if (!err) {
            return res.status(200).json(result[result.length - 1])
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.tab_accompagnants = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    connection.query(visite_model.que_tab_accompagnants, [
        bearer_content.id_utilisateur,
        bearer_content.role,
        bearer_content.flag_medical,
        bearer_content.flag_pharmaceutique
    ], (err, result) => {
        if (!err) {
            return res.status(200).json({ accompagnants: result[result.length - 1] }).end();
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.tab_gamme_produits = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    connection.query(visite_model.que_tab_gammes_produits, [
        bearer_content.id_utilisateur,
        bearer_content.role,
        bearer_content.flag_medical,
        bearer_content.flag_pharmaceutique
    ], (err, result) => {
        if (!err) {
            let liste_gammes = result[result.length - 2];
            let liste_produits = result[result.length - 1];

            liste_gammes.forEach(gamme => {
                gamme['produits'] = [];
                liste_produits.forEach(produit => {
                    if (gamme.code_codification == produit.code_gamme) {
                        gamme['produits'].push(produit);
                    }
                })
            });

            return res.status(200).json({ gammes: liste_gammes }).end();
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.tab_feedbacks = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    connection.query(visite_model.que_tab_feedbacks, (err, result) => {
        if (!err) {
            return res.status(200).json({ feedbacks: result }).end();
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.ajouter_visite = (req, res) => {
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
        date_visite,
        code_statut_visite,
        commentaire,
        flag_accompagnee,
        id_accompagnant,
        partenaires,
        produits,
        heure_fin_visite,
        type_visite,
    } = { ...req.body }

    let bulk_query = ' ';
    let bulk_array = [];

    bulk_query += visite_model.que_add_visite;
    bulk_array.push(
        bearer_content.id_utilisateur,
        bearer_content.role,
        bearer_content.flag_medical,
        bearer_content.flag_pharmaceutique,
        code_statut_visite,
        commentaire,
        flag_accompagnee,
        id_accompagnant,
        date_visite,
        heure_fin_visite,
        type_visite,
        partenaires.map(par => { return par[0] })
    );
    partenairesIds = partenaires.map(e => e[0])
    let query_infos = mysql.format(partenaire_model.que_get_infos_partenaire, [partenairesIds]);
    full_query = bulk_query + query_infos
    connection.query(full_query, bulk_array, (err, result) => {
        if (!err) {

            let { isOK, conflictSource, conflictCount, ids } = result[3][0];
            if (isOK == "no") {
                return res.status(409).send(
                    {
                        ok: false,
                        conflictSource,
                        conflictCount,
                        ids: JSON.parse(ids),
                    }
                );
            }
            else if (isOK == "yes") {
                console.log(result)

                let partenairesNames = result[result.length - 1].map(e => e.nom_partenaire)
                let id_new_visite = result[4][0].id_visite;
                let done = result[5][0].done;
                let date = moment(new Date(date_visite)).format("DD-MM-YYYY");
                let query_historique = mysql.format(utilisateur_model.que_add_historique_utilisateur, [
                    bearer_content.id_utilisateur,
                    "Modification de la visite du " + date + (partenairesNames.length == 1 ? " chez le partenaire : " : " chez les partenaires : ") + (partenairesNames.length > 1 ? partenairesNames.join(', ') : partenairesNames.toString())
                ]);
                if (id_new_visite == 0) {
                    return res.status(200).json({ duplicate: true, error: 'This partner is already planned for the selected week' });
                }
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
                            }
                        })
                        if (done == 'ok' && produits && produits.length && code_statut_visite == 'REAL') {
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
                                    return res.status(200).json({ id_visite: id_new_visite }).end();
                                }
                            });
                        }
                        else
                            return res.status(200).json({ id_visite: id_new_visite }).end();
                    }
                    else {
                        return res.status(500).json(err);
                    }
                })

            }

        } else {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(200).json({ duplicate: true, error: 'This partner is already planned for the selected week' });
            }
            return res.status(500).json(err);
        }
    })
}

exports.fiche_visite = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    let { id_visite } = { ...req.params }

    connection.query(visite_model.que_fiche_visite, [
        bearer_content.id_utilisateur,
        bearer_content.role,
        id_visite
    ], (err, result) => {
        if (!err) {
            let visite = result[result.length - 3];
            if (!visite.length) {
                return res.status(200).json({ flag_non_disponible: 'O' }).end();
            }

            visite[0]['produits'] = result[result.length - 1];
            visite[0].partenaires = result[result.length - 2]
            return res.status(200).json({ visite: visite[0] }).end();
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.modifier_visite = (req, res) => {
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
        code_potentiel,
        date_visite,
        id_planification,
        date_replanification,
        code_type_visite,
        code_statut_visite,
        commentaire,
        flag_accompagnee,
        id_accompagnant,
        type_visite,
        partenaires,
        produits,
        heure_fin_visite
    } = { ...req.body }

    let bulk_query = ' ';
    let bulk_array = [];

    bulk_query += visite_model.que_upd_visite;
    bulk_array.push(
        bearer_content.id_utilisateur,
        bearer_content.role,
        id_visite,
        id_planification,
        code_potentiel,
        date_visite,
        date_replanification,
        code_type_visite,
        code_statut_visite,
        commentaire,
        flag_accompagnee,
        id_accompagnant,
        heure_fin_visite,
        type_visite
    );
    // console.log(heure_fin_visite)
    if ((code_type_visite == 'HOPL' && (code_statut_visite == 'ABSE' || code_statut_visite == 'REAL')) || code_type_visite == 'PLAN') {
        bulk_query += visite_model.que_delete_visite_produit;
        bulk_array.push(id_visite);
    }

    if (code_type_visite != 'PLAN' || code_statut_visite != 'REPL') {
        bulk_query += visite_model.que_delete_visite_partenaire;
        bulk_array.push(id_visite);
    }
    partenairesIds = partenaires.map(e => e[0])
    let query_infos = mysql.format(partenaire_model.que_get_infos_partenaire, [partenairesIds]);
    full_query = bulk_query + query_infos
    connection.query(full_query, bulk_array, (err, result) => {
        if (!err) {

            let { isOK, conflictSource, conflictCount, ids } = result[3][0];
            if (isOK == "no") {
                return res.status(409).send(
                    {
                        ok: false,
                        conflictSource,
                        conflictCount,
                        ids: JSON.parse(ids),
                    }
                );
            }
            else if (isOK == "yes") {
                let partenairesNames = result[result.length - 1].map(e => e.nom_partenaire)
                let id_new_visite = result[4][0].id_visite;
                let done = result[4][0].done;
                let date = moment(new Date(date_visite)).format("DD-MM-YYYY");
                let query_historique = mysql.format(utilisateur_model.que_add_historique_utilisateur, [
                    bearer_content.id_utilisateur,
                    "Modification de la visite du " + date + (partenairesNames.length == 1 ? " chez le partenaire : " : " chez les partenaires : ") + (partenairesNames.length > 1 ? partenairesNames.join(', ') : partenairesNames.toString())
                ]);
                if (id_new_visite == 0) {
                    return res.status(200).json({ duplicate: true, error: 'This partner is already planned for the selected week' });
                }


                connection.query(query_historique, (err, result) => {
                    if (!err) {
                        // console.log(partenaires)

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
                            }
                        })


                        if (done == 'ok' && produits && produits.length && code_statut_visite == 'REAL') {
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
                                    return res.status(200).json({ id_visite: id_new_visite }).end();
                                }
                            });
                        }
                        else
                            return res.status(200).json({ id_visite: id_new_visite }).end();
                    }
                    else {
                        return res.status(500).json(err);
                    }
                })

            }

        } else {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(200).json({ duplicate: true, error: 'This partner is already planned for the selected week' });
            }
            return res.status(500).json(err);
        }
    })
}

exports.export_visites = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    if (bearer_content.flag_export != 'O' || bearer_content.export_visites != 'O') {
        return res.status(403).json({ message: "Not Authorized" });
    }

    let {
        type_partenaire,
        code_specialite,
        code_potentiel,
        date_debut_visite,
        date_fin_visite,
        code_statut_visite,
        code_region,
        nom_partenaire,
        id_utilisateur,
        order_by,
        type_tri
    } = { ...req.body }

    let query = visite_model.que_export_visites;

    if (code_potentiel) {
        code_potentiel = code_potentiel.join('\',\'');
        query += 'AND code_potentiel IN (\'' + code_potentiel + '\')';
    }
    if (code_specialite) {
        code_specialite = code_specialite.join('\',\'');
        query += 'AND code_specialite IN (\'' + code_specialite + '\')';
    }


    if (order_by != null) {
        if (order_by == 'nom_partenaire')
            query += ' ORDER BY nom_partenaire ' + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC') + ', tpv.date_visite DESC, tpv.id_visite DESC';

        else if (order_by == 'date_visite')
            query += ' ORDER BY tpv.date_visite ' + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC') + ', tpv.id_visite DESC';

        else if (order_by == 'nom_utilisateur')
            query += ' ORDER BY nom_utilisateur ' + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC') + ', tpv.date_visite DESC, tpv.id_visite DESC';

        else
            query += ' ORDER BY tpv.date_visite DESC, tpv.id_visite DESC';
    }
    else {
        query += ' ORDER BY tpv.date_visite DESC, tpv.id_visite DESC';
    }

    connection.query('SELECT libelle_parametrage FROM `tab_parametrage` WHERE code_parametrage = \'LIMIT\'', (err, limit) => {
        let limits = Number(limit[0].libelle_parametrage)
        if (limits >= 0) query += ' LIMIT ? '
        connection.query(query + ';', [
            bearer_content.id_utilisateur,
            bearer_content.role,
            bearer_content.flag_medical,
            bearer_content.flag_pharmaceutique,
            type_partenaire,
            date_debut_visite,
            date_fin_visite,
            code_statut_visite,
            code_region,
            nom_partenaire,
            id_utilisateur,
            limits
        ], async (err, result) => {
            if (!err) {
                console.time(1)
                let visites = result[result.length - 1];
                let visites_ids = visites?.length > 0 ? visites.map(el => el.id_visite) : -1
                const produit_que = mysql.format(visite_model.que_get_produits_visite, [visites_ids])
                connection.query(produit_que, async (err, result) => {
                    if (!err) {
                        console.timeEnd(1)
                        const produits = result
                        let filteredVisites = []
                        const myWorker = new Worker('./api/main/workers/worker.js', {
                            workerData: { v: visites, p: produits }
                        })
                        console.time(2)
                        myWorker.on('message', async (data) => {
                            filteredVisites = data
                            console.timeEnd(2)

                            console.time(3)

                            try {
                                console.timeEnd(3)
                                console.time(4)
                                var dir = './temp_exports';
                                if (!fs.existsSync(dir)) {
                                    fs.mkdirSync(dir);
                                }

                                const workbook = new excelJs.Workbook();  // Create a new workbook  
                                const worksheet = workbook.addWorksheet("Visites"); // New Worksheet  
                                // Column for data in excel. key must match data key
                                worksheet.columns = [
                                    { header: "Nombre de compte visités", key: "nbr_comptes", width: 20 },
                                    { header: "Nom Compte 1", key: "nom_partenaire1", width: 20 },
                                    { header: "Spécialité Compte 1", key: "specialite1", width: 20 },
                                    { header: "Potentiel Compte 1", key: "code_potentiel1", width: 20 },
                                    { header: "Nom Compte 2", key: "nom_partenaire2", width: 20 },
                                    { header: "Nom Compte 3", key: "nom_partenaire3", width: 20 },
                                    { header: "Nom Compte 4", key: "nom_partenaire4", width: 20 },
                                    { header: "Nom Compte 5", key: "nom_partenaire5", width: 20 },
                                    { header: "Type visite", key: "type_visite", width: 20 },
                                    { header: "Date visite", key: "date_visite", width: 12 },
                                    { header: "Heure début visite", key: "heure_debut_visite", width: 20 },
                                    { header: "Heure fin visite", key: "heure_fin_visite", width: 20 },
                                    { header: "Visiteur", key: "nom_utilisateur", width: 20 },
                                    { header: "Accompagnée", key: "accompagnant", width: 20 },
                                    { header: "Nom Produit 1", key: "nom_produit1", width: 20 },
                                    { header: "Gamme Produit 1", key: "gamme_produit1", width: 20 },
                                    { header: "Nombre d'échantillon 1", key: "nbr_echantillon1", width: 20 },
                                    { header: "Nom Produit 2", key: "nom_produit2", width: 20 },
                                    { header: "Gamme Produit 2", key: "gamme_produit2", width: 20 },
                                    { header: "Nombre d'échantillon 2", key: "nbr_echantillon2", width: 20 },
                                    { header: "Nom Produit 3", key: "nom_produit3", width: 20 },
                                    { header: "Gamme Produit 3", key: "gamme_produit3", width: 20 },
                                    { header: "Nombre d'échantillon 3", key: "nbr_echantillon3", width: 20 },
                                    { header: "Nom Produit 4", key: "nom_produit4", width: 20 },
                                    { header: "Gamme Produit 4", key: "gamme_produit4", width: 20 },
                                    { header: "Nombre d'échantillon 4", key: "nbr_echantillon4", width: 20 },
                                    { header: "Nom Produit 5", key: "nom_produit5", width: 20 },
                                    { header: "Gamme Produit 5", key: "gamme_produit5", width: 20 },
                                    { header: "Nombre d'échantillon 5", key: "nbr_echantillon5", width: 20 },
                                    { header: "Status", key: "Status", width: 10 },
                                ];
                                // Looping through data
                                filteredVisites.forEach((visite) => {
                                    worksheet.addRow(visite); // Add data in worksheet  
                                });
                                console.timeEnd(4)

                                console.time(5)
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
                                            res.download(path, "Visites.xlsx", (err) => {
                                                console.timeEnd(5)

                                                if (!err) {
                                                    fs.unlink(path, () => { });
                                                }
                                                else {
                                                    return res.status(500).json({ message: "export download error" });
                                                }
                                            });
                                        });
                                } catch (err) {
                                    return res.status(500).json({
                                        message: "export error",
                                    });
                                }


                            } catch (error) {
                                console.log(error)
                                return res.status(500).json(error);

                            }
                            myWorker.terminate();
                        })

                    } else {
                        return res.status(500).json(err);
                    }
                })

            } else {
                return res.status(500).json(err);
            }
        })
    })
}
