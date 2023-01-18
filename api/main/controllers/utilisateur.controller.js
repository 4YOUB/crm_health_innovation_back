const utilisateur_model = require('../models/utilisateur.model');
const jwt_decode = require('jwt-decode');
const { validateAccess } = require('../../helpers/function.helper');
const mysql = require('mysql');
const fs = require("fs");
const path = require("path");
const excelJs = require("exceljs");

exports.tab_utilisateurs = (req, res) => {
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

    const roles = ['DIR', 'PM', 'ADMI'];
    if (!validateAccess(roles, bearer_content.role)) {
        return res.status(200).json({ message: "Sorry, you're not authorized to use this API" }).end();
    }

    let {
        nom_utilisateur,
        role,
        email,
        telephone,
        code_statut_utilisateur,
        code_gamme,
        code_region,
        order_by,
        type_tri
    } = { ...req.body }

    let query = utilisateur_model.que_tab_utilisateurs;

    if (order_by != null) {
        if (order_by == 'role')
            query += ' ORDER BY tu.role ' + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC') + ', nom_complet ASC' + ', tu.id_utilisateur DESC';

        else if (order_by == 'date_creation')
            query += ' ORDER BY tu.id_utilisateur ' + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC');
        else
            query += ' ORDER BY nom_complet ' + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC') + ', tu.id_utilisateur DESC';
    }
    else {
        query += ' ORDER BY nom_complet ' + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC') + ', tu.id_utilisateur DESC';
    }

    let count_query = mysql.format(utilisateur_model.que_get_nbr_tab_utilisateurs, [
        nom_utilisateur,
        role,
        email,
        telephone,
        code_statut_utilisateur,
        code_gamme,
        code_region
    ]);

    connection.query(query + ' LIMIT ' + limit + ';' + utilisateur_model.que_tab_regions_gammes + count_query, [
        nom_utilisateur,
        role,
        email,
        telephone,
        code_statut_utilisateur,
        code_gamme,
        code_region
    ], (err, result) => {
        if (!err) {
            let utilisateurs = result[result.length - 5];
            let liste_regions = result[result.length - 4];
            let liste_gammes = result[result.length - 3];

            utilisateurs.forEach(utilisateur => {
                utilisateur['regions'] = [];
                liste_regions.forEach(region => {
                    if (region.id_utilisateur == utilisateur.id_utilisateur) {
                        utilisateur['regions'].push(region);
                    }
                });
            });

            utilisateurs.forEach(utilisateur => {
                utilisateur['gammes'] = [];
                liste_gammes.forEach(gamme => {
                    if (gamme.id_utilisateur == utilisateur.id_utilisateur) {
                        utilisateur['gammes'].push(gamme);
                    }
                });
            });

            const response = {
                utilisateurs: utilisateurs,
                nbr_total_utilisateurs: result[result.length - 1][0].nbr_total_utilisateurs
            }
            return res.status(200).json(response).end();
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.tab_responsables = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    const roles = ['ADMI'];
    if (!validateAccess(roles, bearer_content.role)) {
        return res.status(200).json({ message: "Sorry, you're not authorized to use this API" }).end();
    }

    let {
        role,
        flag_medical,
        regions,
        gammes,
        id_utilisateur
    } = { ...req.body }

    if (!(regions && regions.length) || (flag_medical == 'O' && !(gammes && gammes.length))) {
        return res.status(500).json({ message: 'Missing data.' });
    }

    let query = mysql.format(utilisateur_model.que_get_tab_responsables, [role, id_utilisateur]);

    regions = regions.join('\',\'');
    query += ' AND tur.code_region IN (\'' + regions + '\')';

    if (flag_medical == 'O') {
        gammes = gammes.join('\',\'');
        query += ' AND tug.code_gamme IN (\'' + gammes + '\')';
    }

    connection.query(query, (err, result) => {
        if (!err) {
            return res.status(200).json({ utilisateurs: result[result.length - 1] }).end();
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.ajouter_utilisateur = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    const roles = ['ADMI'];
    if (!validateAccess(roles, bearer_content.role)) {
        return res.status(200).json({ message: "Sorry, you're not authorized to use this API" }).end();
    }

    let {
        id_responsable,
        nom_utilisateur,
        prenom_utilisateur,
        role,
        telephone,
        email,
        login,
        password,
        regions,
        gammes,
        flag_medical,
        flag_pharmaceutique,
        flag_export,
        flag_reporting,
        export_comptes,
        export_planifications,
        export_visites,
        export_investissements,
        export_rapports_planification,
        export_evenement,
        export_rapport_visite,
        export_taux_couverture,
        export_delegues,
        export_utilisateurs,
        reporting_visite_planification,
        reporting_taux_freq_couverture
    } = { ...req.body }

    connection.query(utilisateur_model.que_ajouter_utilisateur, [
        id_responsable,
        nom_utilisateur,
        prenom_utilisateur,
        role,
        telephone,
        email,
        login,
        password,
        flag_medical,
        flag_pharmaceutique,
        flag_export,
        flag_reporting
    ], (err, result) => {
        if (!err) {
            let id_utilisateur = result[result.length - 1][0].id_utilisateur;
            let nom_complet = result[result.length - 1][0].nom_utilisateur;

            let query_historique = mysql.format(utilisateur_model.que_add_historique_utilisateur, [
                bearer_content.id_utilisateur,
                "Ajout d'un nouveau " + role + " : " + nom_complet
            ]);

            let query_region = '';
            let query_gamme = '';
            let query_permission = '';

            query_permission = mysql.format(
                utilisateur_model.que_add_up_utilisateur_permission,
                [
                    id_utilisateur,
                    export_comptes,
                    export_planifications,
                    export_visites,
                    export_investissements,
                    export_rapports_planification,
                    export_evenement,
                    export_rapport_visite,
                    export_taux_couverture,
                    export_delegues,
                    export_utilisateurs,
                    reporting_visite_planification,
                    reporting_taux_freq_couverture
                ]
            );

            if (flag_export == "O" || flag_reporting == "O") {
                connection.query(query_permission, (err) => {
                    if (err) {
                    }
                });
            }

            connection.query(query_historique, (err, result) => {
                if (!err) {
                    if (regions && regions.length && role != 'ADMI' && role != 'DIR' && role != 'PM' && role != 'ACH') {
                        regions.forEach(region => {
                            try {
                                query_region += mysql.format(utilisateur_model.que_add_utilisateur_region, [id_utilisateur, region]);
                            }
                            catch (err) {
                                return res.status(400).json({ error: "data sent is bad in region." });
                            }
                        });

                        if (flag_medical == 'O' && gammes && gammes.length) {
                            gammes.forEach(gamme => {
                                try {
                                    query_gamme += mysql.format(utilisateur_model.que_add_utilisateur_gamme, [id_utilisateur, gamme]);
                                }
                                catch (err) {
                                    return res.status(400).json({ error: "data sent is bad in gamme." });
                                }
                            });
                        }

                        connection.query(query_region + query_gamme, (err) => {
                            if (err) {
                                return res.status(500).json(err).end();
                            } else {
                                return res.status(200).json({ id_utilisateur }).end();
                            }
                        });
                    }
                    else {
                        return res.status(200).json({ id_utilisateur }).end();
                    }
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

exports.modifier_utilisateur = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    const roles = ['ADMI'];
    if (!validateAccess(roles, bearer_content.role)) {
        return res.status(200).json({ message: "Sorry, you're not authorized to use this API" }).end();
    }

    let {
        id_utilisateur,
        id_responsable,
        nom_utilisateur,
        prenom_utilisateur,
        role,
        telephone,
        email,
        login,
        password,
        regions,
        gammes,
        flag_medical,
        flag_pharmaceutique,
        flag_export,
        flag_reporting,
        export_comptes,
        export_planifications,
        export_visites,
        export_investissements,
        export_rapports_planification,
        export_evenement,
        export_rapport_visite,
        export_taux_couverture,
        export_delegues,
        export_utilisateurs,
        reporting_visite_planification,
        reporting_taux_freq_couverture
    } = { ...req.body }

    connection.query(utilisateur_model.que_modifier_utilisateur, [
        id_utilisateur,
        id_responsable,
        nom_utilisateur,
        prenom_utilisateur,
        role,
        telephone,
        email,
        login,
        password,
        flag_medical,
        flag_pharmaceutique,
        flag_export,
        flag_reporting
    ], (err, result) => {
        if (!err) {
            let query_region = mysql.format(utilisateur_model.que_desactivate_utilisateur_region, [id_utilisateur]);
            let query_gamme = mysql.format(utilisateur_model.que_desactivate_utilisateur_gamme, [id_utilisateur]);

            let query_historique = mysql.format(utilisateur_model.que_add_historique_utilisateur, [
                bearer_content.id_utilisateur,
                "Modification du " + role + " : " + (prenom_utilisateur ? nom_utilisateur.concat(" ", prenom_utilisateur) : nom_utilisateur)
            ]);

            let query_permission = '';

            query_permission = mysql.format(
                utilisateur_model.que_add_up_utilisateur_permission,
                [
                    id_utilisateur,
                    export_comptes,
                    export_planifications,
                    export_visites,
                    export_investissements,
                    export_rapports_planification,
                    export_evenement,
                    export_rapport_visite,
                    export_taux_couverture,
                    export_delegues,
                    export_utilisateurs,
                    reporting_visite_planification,
                    reporting_taux_freq_couverture
                ]
            );

            if (flag_export == "O" || flag_reporting == "O") {
                connection.query(query_permission, (err) => {
                    if (err) {
                    }
                });
            }

            connection.query(query_historique, (err, result) => {
                if (!err) {
                    if (regions && regions.length && role != 'ADMI' && role != 'DIR' && role != 'PM' && role != 'ACH') {
                        regions.forEach(region => {
                            try {
                                query_region += mysql.format(utilisateur_model.que_add_utilisateur_region, [id_utilisateur, region]);
                            }
                            catch (err) {
                                return res.status(400).json({ error: "data sent is bad in region." });
                            }
                        });
                        if (flag_medical == 'O' && gammes && gammes.length) {
                            gammes.forEach(gamme => {
                                try {
                                    query_gamme += mysql.format(utilisateur_model.que_add_utilisateur_gamme, [id_utilisateur, gamme]);
                                }
                                catch (err) {
                                    return res.status(400).json({ error: "data sent is bad in gamme." });
                                }
                            });
                        }

                        connection.query(query_region + query_gamme, (err) => {
                            if (err) {
                                return res.status(500).json(err).end();
                            } else {
                                return res.status(200).json({ id_utilisateur }).end();
                            }
                        });
                    }
                    else {
                        return res.status(200).json({ id_utilisateur }).end();
                    }
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

exports.activer_utilisateur = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    const roles = ['ADMI'];
    if (!validateAccess(roles, bearer_content.role)) {
        return res.status(200).json({ message: "Sorry, you're not authorized to use this API" }).end();
    }

    let { id_utilisateur } = { ...req.params }
    let query_infos = mysql.format(utilisateur_model.que_get_infos_utilisateur, [id_utilisateur]);

    connection.query(utilisateur_model.que_get_role_regions_gammes + query_infos, [id_utilisateur], (err, result) => {
        if (!err) {

            if (result[result.length - 2][0].resultat == 'ko') {
                return res.status(200).json({ duplicate: true });
            }
            let nom_utilisateur = result[result.length - 1][0].nom_utilisateur;
            let role = result[result.length - 1][0].role;
            let query_historique = mysql.format(utilisateur_model.que_add_historique_utilisateur, [
                bearer_content.id_utilisateur,
                "Activation du " + role + " : " + nom_utilisateur
            ]);

            connection.query(utilisateur_model.que_activer_utilisateur + query_historique, [id_utilisateur], (err, result) => {
                if (!err) {
                    return res.status(200).json({ id_utilisateur }).end();
                }
                else {
                    return res.status(500).json(err);
                }
            })
        }
        else {
            return res.status(500).json(err);
        }
    })
}

exports.desactiver_utilisateur = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    const roles = ['ADMI'];
    if (!validateAccess(roles, bearer_content.role)) {
        return res.status(200).json({ message: "Sorry, you're not authorized to use this API" }).end();
    }

    let { id_utilisateur } = { ...req.params }
    let query_infos = mysql.format(utilisateur_model.que_get_infos_utilisateur, [id_utilisateur]);

    connection.query(utilisateur_model.que_desactiver_utilisateur + query_infos, [id_utilisateur], (err, result) => {
        if (!err) {
            let nom_utilisateur = result[result.length - 1][0].nom_utilisateur;
            let role = result[result.length - 1][0].role;
            let query_historique = mysql.format(utilisateur_model.que_add_historique_utilisateur, [
                bearer_content.id_utilisateur,
                "Désactivation du " + role + " : " + nom_utilisateur
            ]);

            connection.query(query_historique, (err, result) => {
                if (!err) {
                    return res.status(200).json({ id_utilisateur }).end();
                }
                else {
                    return res.status(500).json(err);
                }
            })
        }
        else {
            return res.status(500).json(err);
        }
    })
}

exports.tab_delegues = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    const roles = ['ADMI', 'DIR', 'PM', 'DRG', 'DSM', 'KAM'];
    if (!validateAccess(roles, bearer_content.role)) {
        return res.status(200).json({ message: "Sorry, you're not authorized to use this API" }).end();
    }

    let records_per_page = parseInt(req.params['records_per_page'], 10) || 1;
    let page_number = parseInt(req.params['page_number'], 10) || 0;
    let records_to_skip = page_number * records_per_page;
    let limit = records_to_skip + ',' + records_per_page;

    let {
        nom_utilisateur,
        role,
        email,
        telephone,
        code_gamme,
        code_region,
        order_by,
        type_tri
    } = { ...req.body }

    let query = utilisateur_model.que_tab_delegues;

    let count_query = mysql.format(utilisateur_model.que_get_nbr_tab_delegues, [
        bearer_content.id_utilisateur,
        bearer_content.role,
        bearer_content.flag_medical,
        bearer_content.flag_pharmaceutique,
        nom_utilisateur,
        role,
        email,
        telephone,
        code_region
    ]);

    if (code_gamme) {
        code_gamme = code_gamme.join('\',\'');
        query += " AND tug.code_gamme IN (\'" + code_gamme + "\') AND tug.flag_actif = 'O' ";
        count_query += " AND tug.code_gamme IN (\'" + code_gamme + "\') AND tug.flag_actif = 'O' ";
    }

    query += ' GROUP BY tu.id_utilisateur';

    if (order_by != null) {
        if (order_by == 'nom_responsable')
            query += ' ORDER BY nom_responsable ' + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC') + ', role, nom_utilisateur, id_utilisateur DESC';

        else if (order_by == 'nom_utilisateur')
            query += ' ORDER BY nom_utilisateur ' + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC');
        else
            query += ' ORDER BY id_utilisateur ' + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC');
    }
    else {
        query += ' ORDER BY role, nom_utilisateur, id_utilisateur DESC';
    }

    connection.query(query + ' LIMIT ' + limit + ';' + utilisateur_model.que_tab_regions_gammes + count_query, [
        bearer_content.id_utilisateur,
        bearer_content.role,
        bearer_content.flag_medical,
        bearer_content.flag_pharmaceutique,
        nom_utilisateur,
        role,
        email,
        telephone,
        code_region
    ], (err, result) => {
        if (!err) {
            let delegues = result[result.length - 5];
            let liste_regions = result[result.length - 4];
            let liste_gammes = result[result.length - 3];

            delegues.forEach(utilisateur => {
                utilisateur['regions'] = [];
                liste_regions.forEach(region => {
                    if (region.id_utilisateur == utilisateur.id_utilisateur) {
                        utilisateur['regions'].push(region);
                    }
                });
            });

            delegues.forEach(utilisateur => {
                utilisateur['gammes'] = [];
                liste_gammes.forEach(gamme => {
                    if (gamme.id_utilisateur == utilisateur.id_utilisateur) {
                        utilisateur['gammes'].push(gamme);
                    }
                });
            });

            const response = {
                delegues: delegues,
                nbr_total_delegues: result[result.length - 1][0].nbr_total_delegues
            }
            return res.status(200).json(response).end();
        }
        else {
            return res.status(500).json(err);
        }
    })
}

exports.tab_historique_utilisateur = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    const roles = ['ADMI', 'DIR', 'DRG', 'PM', 'DSM', 'KAM'];
    if (!validateAccess(roles, bearer_content.role)) {
        return res.status(200).json({ message: "Sorry, you're not authorized to use this API" }).end();
    }

    let records_per_page = parseInt(req.params['records_per_page'], 10) || 1;
    let page_number = parseInt(req.params['page_number'], 10) || 0;
    let records_to_skip = page_number * records_per_page;
    let limit = records_to_skip + ',' + records_per_page;

    let { id_utilisateur } = { ...req.params }

    let query = utilisateur_model.que_tab_historique_utilisateur;
    let count_query = mysql.format(utilisateur_model.que_get_nbr_tab_historique_utilisateur, [id_utilisateur]);

    connection.query(query + 'ORDER BY id_historique DESC LIMIT ' + limit + ';' + count_query, [id_utilisateur], (err, result) => {
        if (!err) {
            const response = {
                historique: result[result.length - 3],
                nbr_total_historique: result[result.length - 1][0].nbr_total_historique
            }
            return res.status(200).json(response).end();
        }
        else {
            return res.status(500).json(err);
        }
    })
}

exports.export_delegues = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    if (bearer_content.flag_export != 'O' || bearer_content.export_delegues != 'O') {
        return res.status(403).json({ message: "Not Authorized" });
    }

    const roles = ['ADMI', 'DIR', 'PM', 'DRG', 'DSM', 'KAM'];
    if (!validateAccess(roles, bearer_content.role)) {
        return res.status(200).json({ message: "Sorry, you're not authorized to use this API" }).end();
    }


    let {
        nom_utilisateur,
        role,
        email,
        telephone,
        code_gamme,
        code_region,
        order_by,
        type_tri
    } = { ...req.body }

    let query = utilisateur_model.que_tab_delegues;


    if (code_gamme) {
        code_gamme = code_gamme.join('\',\'');
        query += " AND tug.code_gamme IN (\'" + code_gamme + "\') AND tug.flag_actif = 'O' ";
    }

    query += ' GROUP BY tu.id_utilisateur';

    if (order_by != null) {
        if (order_by == 'nom_responsable')
            query += ' ORDER BY nom_responsable ' + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC') + ', role, nom_utilisateur, id_utilisateur DESC';

        else if (order_by == 'nom_utilisateur')
            query += ' ORDER BY nom_utilisateur ' + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC');
        else
            query += ' ORDER BY id_utilisateur ' + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC');
    }
    else {
        query += ' ORDER BY role, nom_utilisateur, id_utilisateur DESC';
    }

    connection.query(query + ';' + utilisateur_model.que_tab_regions_gammes, [
        bearer_content.id_utilisateur,
        bearer_content.role,
        bearer_content.flag_medical,
        bearer_content.flag_pharmaceutique,
        nom_utilisateur,
        role,
        email,
        telephone,
        code_region
    ], async (err, result) => {
        if (!err) {
            let delegues = result[result.length - 3];
            let liste_regions = result[result.length - 2];
            let liste_gammes = result[result.length - 1];

            delegues.forEach(utilisateur => {
                utilisateur['regions'] = "";
                let sep = ",\n";
                liste_regions.forEach((region, index) => {
                    if (region.id_utilisateur == utilisateur.id_utilisateur) {
                        utilisateur['regions'] += `${region.libelle_codification}${sep}`;
                    }
                });
            });

            delegues.forEach(utilisateur => {
                utilisateur['gammes'] = "";
                let sep = ",\n";
                liste_gammes.forEach((gamme, index) => {
                    if (gamme.id_utilisateur == utilisateur.id_utilisateur) {
                        utilisateur['gammes'] += `${gamme.libelle_codification}${sep}`;
                    }
                });
            });

            try {
                var dir = './temp_exports';
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir);
                }

                const workbook = new excelJs.Workbook();  // Create a new workbook  
                const worksheet = workbook.addWorksheet("Délégués"); // New Worksheet  
                // Column for data in excel. key must match data key
                worksheet.columns = [
                    { header: "Nom", key: "nom_utilisateur", width: 20 },
                    { header: "Rôle", key: "role", width: 20 },
                    { header: "Pharmaceutique", key: "flag_pharmaceutique", width: 20 },
                    { header: "Medical", key: "flag_medical", width: 20 },
                    { header: "Nom responsable", key: "nom_responsable", width: 20 },
                    { header: "Rôle responsable", key: "role_responsable", width: 20 },
                    { header: "Email", key: "email", width: 20 },
                    { header: "Téléphone", key: "telephone", width: 20 },
                    { header: "Régions", key: "regions", width: 20 },
                    { header: "Gammes", key: "gammes", width: 20 },
                    { header: "Nombre visites", key: "nbr_visites", width: 20 },
                    { header: "Nombre planifications", key: "nbr_planifications", width: 25 },
                    { header: "Nombre investissements", key: "nbr_investissements", width: 25 },
                ];
                // Looping through data
                delegues.forEach((d) => {
                    worksheet.addRow(d); // Add data in worksheet  
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
                            res.download(path, "Délégués.xlsx", (err) => {
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
                // console.log(error)
                return res.status(500).json(error);

            }
        }
        else {
            return res.status(500).json(err);
        }
    })
}