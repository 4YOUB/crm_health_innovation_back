const partenaire_model = require('../models/partenaire.model');
const utilisateur_model = require('../models/utilisateur.model');
const jwt_decode = require('jwt-decode');
const mysql = require('mysql');
const { validateAccess } = require('../../helpers/function.helper');
const fs = require("fs");
const path = require("path");
const excelJs = require("exceljs");

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
    let records_per_page = parseInt(req.params['records_per_page'], 10) || 1;
    let page_number = parseInt(req.params['page_number'], 10) || 0;
    let records_to_skip = page_number * records_per_page;
    let limit = records_to_skip + ',' + records_per_page;
    let {
        id_partenaire,
        code_statut_partenaire,
        type_partenaire,
        nom_partenaire,
        code_type_etablissement,
        potentiel,
        code_specialite,
        code_region,
        code_ville,
        code_secteur,
        order_by,
        type_tri
    } = { ...req.body }

    let query = partenaire_model.que_tab_partenaires;
    let count_query = partenaire_model.que_nbr_tab_partenaires;

    if (potentiel) {
        potentiel = potentiel.join('\',\'');
        query += 'AND code_potentiel IN (\'' + potentiel + '\')';
        count_query += 'AND code_potentiel IN (\'' + potentiel + '\')';
    }
    if (code_specialite) {
        code_specialite = code_specialite.join('\',\'');
        query += 'AND code_specialite IN (\'' + code_specialite + '\')';
        count_query += 'AND code_specialite IN (\'' + code_specialite + '\')';
    }

    if (order_by != null) {
        if (order_by == 'nom_partenaire')
            query += ' ORDER BY nom_partenaire ' + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC') + ', tp.id_partenaire DESC';

        else
            query += ' ORDER BY tp.id_partenaire ' + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC');
    }
    else {
        query += ' ORDER BY tp.id_partenaire DESC';
    }

    count_query = mysql.format(count_query, [
        bearer_content.id_utilisateur,
        bearer_content.role,
        bearer_content.flag_medical,
        bearer_content.flag_pharmaceutique,
        id_partenaire,
        code_statut_partenaire,
        type_partenaire,
        nom_partenaire,
        code_type_etablissement,
        code_region,
        code_ville,
        code_secteur
    ])

    connection.query(query + ' LIMIT ' + limit + ';' + count_query, [
        bearer_content.id_utilisateur,
        bearer_content.role,
        bearer_content.flag_medical,
        bearer_content.flag_pharmaceutique,
        id_partenaire,
        code_statut_partenaire,
        type_partenaire,
        nom_partenaire,
        code_type_etablissement,
        code_region,
        code_ville,
        code_secteur
    ], (err, result) => {
        if (!err) {
            const response = {
                partenaires: result[result.length - 3],
                nbr_total_partenaires: result[result.length - 1][0].nbr_total_partenaires
            }
            return res.status(200).json(response).end();

        } else {
            return res.status(500).json(err);
        }
    })
}

exports.ajouter_partenaire = (req, res) => {
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

    let {
        type_partenaire,
        nom_partenaire,
        prenom_partenaire,
        date_naissance,
        code_potentiel,
        code_type_etablissement,
        code_specialite,
        email_partenaire,
        tel1_partenaire,
        tel2_partenaire,
        adresse_partenaire,
        code_region,
        code_ville,
        code_secteur
    } = { ...req.body }

    connection.query(partenaire_model.que_add_partenaire, [
        bearer_content.id_utilisateur,
        bearer_content.role,
        type_partenaire,
        nom_partenaire,
        prenom_partenaire,
        date_naissance,
        code_potentiel,
        code_type_etablissement,
        code_specialite,
        email_partenaire,
        tel1_partenaire,
        tel2_partenaire,
        adresse_partenaire,
        code_region,
        code_ville,
        code_secteur
    ], (err, result) => {
        if (!err) {
            if (result[result.length - 1][0].done == 'ko') {
                return res.status(200).json({ done: false }).end();
            }
            let id_partenaire = result[result.length - 1][0].id_partenaire;
            let nom_partenaire = result[result.length - 1][0].nom_partenaire;

            let query_historique = mysql.format(utilisateur_model.que_add_historique_utilisateur, [
                bearer_content.id_utilisateur,
                "Création d'un nouveau partenaire : " + nom_partenaire
            ]);

            connection.query(query_historique, (err, result) => {
                if (!err) {
                    return res.status(200).json({ id_partenaire }).end();
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

exports.modifier_partenaire = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    // const roles = ['ADMI'];
    // if(!validateAccess(roles, bearer_content.role)){
    //     return res.status(200).json({message : "Sorry, you're not authorized to use this API"}).end();
    // }

    let {
        id_partenaire,
        type_partenaire,
        code_statut_partenaire,
        nom_partenaire,
        prenom_partenaire,
        date_naissance,
        code_potentiel,
        code_type_etablissement,
        code_specialite,
        email_partenaire,
        tel1_partenaire,
        tel2_partenaire,
        adresse_partenaire,
        code_region,
        code_ville,
        code_secteur
    } = { ...req.body }

    connection.query(partenaire_model.que_upd_partenaire, [
        bearer_content.role,
        id_partenaire,
        type_partenaire,
        code_statut_partenaire,
        nom_partenaire,
        prenom_partenaire,
        date_naissance,
        code_potentiel,
        code_type_etablissement,
        code_specialite,
        email_partenaire,
        tel1_partenaire,
        tel2_partenaire,
        adresse_partenaire,
        code_region,
        code_ville,
        code_secteur
    ], (err, result) => {
        if (!err) {
            return res.status(200).json({ message: "done" }).end();
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.valider_partenaire = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    if (!validateAccess(['ADMI'], bearer_content.role)) {
        return res.status(200).json({ message: "Sorry, you're not authorized to use this API" }).end();
    }

    let { id_partenaire } = { ...req.params };

    let query_infos = mysql.format(partenaire_model.que_get_infos_partenaire, [id_partenaire]);

    connection.query(partenaire_model.que_valider_partenaire + query_infos, [id_partenaire], (err, result) => {
        if (!err) {
            if (result[result.length - 3][0].done == 'ko') {
                return res.status(200).json({ done: false }).end();
            }
            let nom_partenaire = result[result.length - 1][0].nom_partenaire;

            let query_historique = mysql.format(utilisateur_model.que_add_historique_utilisateur, [
                bearer_content.id_utilisateur,
                "Validation du partenaire : " + nom_partenaire + " (id : " + id_partenaire + ")"
            ]);

            connection.query(query_historique, (err, result) => {
                if (!err) {
                    return res.status(200).json({ id_partenaire: id_partenaire }).end();
                } else {
                    return res.status(500).json(err);
                }
            })
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.fiche_partenaire = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    let { id_partenaire } = { ...req.params };

    connection.query(partenaire_model.que_fiche_partenaire, [id_partenaire, bearer_content.role], (err, result) => {
        if (!err) {
            if (!result[result.length - 1].length) {
                return res.status(200).json({ flag_disponible: 'N' }).end();
            }
            return res.status(200).json({ partenaire: result[result.length - 1] }).end();
        } else {
            return res.status(500).json(err);
        }
    })

}

exports.rejeter_partenaire = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    if (!validateAccess(['ADMI'], bearer_content.role)) {
        return res.status(200).json({ message: "Sorry, you're not authorized to use this API" }).end();
    }

    let { id_partenaire } = { ...req.params };
    let query_infos = mysql.format(partenaire_model.que_get_infos_partenaire, [id_partenaire]);

    connection.query(partenaire_model.que_rejeter_partenaire + query_infos, [id_partenaire], (err, result) => {
        if (!err) {
            let nom_partenaire = result[result.length - 1][0].nom_partenaire;
            let query_historique = mysql.format(utilisateur_model.que_add_historique_utilisateur, [
                bearer_content.id_utilisateur,
                "Rejet du partenaire : " + nom_partenaire + "(id: " + id_partenaire + ")"
            ]);

            connection.query(query_historique, [id_partenaire], (err, result) => {
                if (!err) {
                    return res.status(200).json({ id_partenaire: id_partenaire }).end();
                } else {
                    return res.status(500).json(err);
                }
            })
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.tab_partenaire_visites = (req, res) => {
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

    let { id_partenaire } = { ...req.body };

    let query = partenaire_model.que_tab_partenaire_visites;
    let count_query = mysql.format(partenaire_model.que_nbr_tab_visites);

    connection.query(query + 'LIMIT ' + limit + ';' + partenaire_model.que_tab_visites_produits + count_query, [id_partenaire], (err, result) => {
        if (!err) {
            let liste_visites = result[result.length - 3];
            let liste_produits = result[result.length - 2];

            liste_visites.forEach(visite => {
                visite['produits'] = [];
                liste_produits.forEach(produit => {
                    if (visite.id_visite == produit.id_visite) {
                        visite['produits'].push(produit);
                    }
                })
            });
            const response = {
                visites: liste_visites,
                nbr_total_visites: result[result.length - 1][0].nbr_total_visites
            }
            return res.status(200).json(response).end();
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.tab_partenaire_bc = (req, res) => {
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

    let { id_partenaire } = { ...req.body };
    let query = partenaire_model.que_tab_partenaire_bc;
    let count_query = mysql.format(partenaire_model.que_nbr_tab_partenaire_bc, [id_partenaire]);

    connection.query(query + 'LIMIT ' + limit + ';' + count_query, [id_partenaire], (err, result) => {
        if (!err) {
            let business_cases = result[result.length - 3];
            business_cases.forEach(bc => {
                bc['url_document'] = bc.intitule_document ? CONFIG.url_api + (CONFIG.bc_document_folder + id_partenaire + '/' + bc.intitule_document) : null;
            });
            const response = {
                business_cases,
                nbr_total_business_cases: result[result.length - 1][0].nbr_total_business_cases
            }
            return res.status(200).json(response).end();
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.tab_partenaire_notes = (req, res) => {
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

    let { id_partenaire } = { ...req.body };
    let query = partenaire_model.que_tab_partenaire_notes;
    let count_query = mysql.format(partenaire_model.que_nbr_tab_partenaire_notes, [id_partenaire]);

    connection.query(query + 'LIMIT ' + limit + ';' + count_query, [id_partenaire], (err, result) => {
        if (!err) {
            const response = {
                notes: result[result.length - 3],
                nbr_total_notes: result[result.length - 1][0].nbr_total_notes
            }
            return res.status(200).json(response).end();
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.tab_partenaire_docs = (req, res) => {
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

    let { id_partenaire } = { ...req.body };
    let query = partenaire_model.que_tab_partenaire_docs;
    let count_query = mysql.format(partenaire_model.que_nbr_tab_partenaire_docs, [id_partenaire]);

    connection.query(query + 'LIMIT ' + limit + ';' + count_query, [id_partenaire], (err, result) => {
        if (!err) {
            let documents = result[result.length - 3];
            documents.forEach(doc => {
                doc['url_document'] = doc.intitule_document ? CONFIG.url_api + (CONFIG.partenaire_document_folder + id_partenaire + '/' + doc.intitule_document) : null;
            });
            const response = {
                documents,
                nbr_total_documents: result[result.length - 1][0].nbr_total_documents
            }
            return res.status(200).json(response).end();
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.ajouter_note = (req, res) => {
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

    let {
        id_partenaire,
        commentaire
    } = { ...req.body };
    let query_infos = mysql.format(partenaire_model.que_get_infos_partenaire, [id_partenaire]);

    connection.query(partenaire_model.que_ajouter_note + query_infos, [
        bearer_content.id_utilisateur,
        id_partenaire,
        commentaire
    ], (err, result) => {
        if (!err) {
            let id_note = result[result.length - 3][0].id_note;
            let nom_partenaire = result[result.length - 1][0].nom_partenaire;

            let query_historique = mysql.format(utilisateur_model.que_add_historique_utilisateur, [
                bearer_content.id_utilisateur,
                "Ajout d'une nouvelle note au partenaire : " + nom_partenaire
            ]);

            connection.query(query_historique, (err, result) => {
                if (!err) {
                    return res.status(200).json({ id_note }).end();
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

exports.ajouter_document = (req, res) => {
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

    let {
        id_partenaire,
        id_document,
        nom_document
    } = { ...req.body };
    let query_infos = mysql.format(partenaire_model.que_get_infos_partenaire, [id_partenaire]);

    connection.query(partenaire_model.que_ajouter_document + query_infos, [
        bearer_content.id_utilisateur,
        id_partenaire,
        id_document,
        nom_document
    ], (err, result) => {
        if (!err) {
            let nom_partenaire = result[result.length - 1][0].nom_partenaire;
            let query_historique = mysql.format(utilisateur_model.que_add_historique_utilisateur, [
                bearer_content.id_utilisateur,
                "Ajout d'un nouveau document au partenaire : " + nom_partenaire
            ]);

            connection.query(query_historique, (err, result) => {
                if (!err) {
                    return res.status(200).json({ id_document }).end();
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

exports.supprimer_note = (req, res) => {
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

    let { id_note } = { ...req.params };

    connection.query(partenaire_model.que_supprimer_note, [
        bearer_content.id_utilisateur,
        bearer_content.role,
        id_note
    ], (err, result) => {
        if (!err) {
            if (result[result.length - 1][0].done == 'ko') {
                return res.status(200).json({ message: "Sorry, you're not authorized to delete the note" }).end();
            }

            let nom_partenaire = result[result.length - 1][0].nom_partenaire;

            let query_historique = mysql.format(utilisateur_model.que_add_historique_utilisateur, [
                bearer_content.id_utilisateur,
                "Suppression d'une note du partenaire : " + nom_partenaire
            ]);

            connection.query(query_historique, (err, result) => {
                if (!err) {
                    return res.status(200).json({ message: "done" }).end();
                } else {
                    return res.status(500).json(err);
                }
            })
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.supprimer_document = (req, res) => {
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

    let { id_document } = { ...req.params };

    connection.query(partenaire_model.que_supprimer_document, [
        bearer_content.id_utilisateur,
        bearer_content.role,
        id_document
    ], (err, result) => {
        if (!err) {
            if (result[result.length - 1][0].done == 'ko') {
                return res.status(200).json({ message: "Sorry, you're not authorized to delete the file" }).end();
            }
            let nom_partenaire = result[result.length - 1][0].nom_partenaire;

            let query_historique = mysql.format(utilisateur_model.que_add_historique_utilisateur, [
                bearer_content.id_utilisateur,
                "Suppression d'un document du partenaire : " + nom_partenaire
            ]);

            connection.query(query_historique, (err, result) => {
                if (!err) {
                    return res.status(200).json({ message: "done" }).end();
                } else {
                    return res.status(500).json(err);
                }
            })
        } else {
            return res.status(500).json(err);
        }
    })
}


exports.export_partenaires = (req, res) => {

    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    if (bearer_content.flag_export != 'O' || bearer_content.export_comptes != 'O') {
        return res.status(403).json({ message: "Not Authorized" });
    }

    let {
        id_partenaire,
        code_statut_partenaire,
        type_partenaire,
        nom_partenaire,
        code_type_etablissement,
        potentiel,
        code_specialite,
        code_region,
        code_ville,
        code_secteur,
        order_by,
        type_tri
    } = { ...req.body }

    let query = partenaire_model.que_export_partenaires;

    if (potentiel) {
        potentiel = potentiel.join('\',\'');
        query += 'AND code_potentiel IN (\'' + potentiel + '\')';
    }
    if (code_specialite) {
        code_specialite = code_specialite.join('\',\'');
        query += 'AND code_specialite IN (\'' + code_specialite + '\')';
    }

    if (order_by != null) {
        if (order_by == 'nom_partenaire')
            query += ' ORDER BY nom_partenaire ' + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC') + ', tp.id_partenaire DESC';

        else
            query += ' ORDER BY tp.id_partenaire ' + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC');
    }
    else {
        query += ' ORDER BY tp.id_partenaire DESC';
    }


    connection.query(query + ';', [
        bearer_content.id_utilisateur,
        bearer_content.role,
        bearer_content.flag_medical,
        bearer_content.flag_pharmaceutique,
        id_partenaire,
        code_statut_partenaire,
        type_partenaire,
        nom_partenaire,
        code_type_etablissement,
        code_region,
        code_ville,
        code_secteur
    ], async (err, result) => {
        if (!err) {
            let comptes = result[result.length - 1];
            try {
                var dir = './temp_exports';
                if (!fs.existsSync(dir)) {
                    fs.mkdirSync(dir);
                }

                const workbook = new excelJs.Workbook();  // Create a new workbook  
                const worksheet = workbook.addWorksheet("Comptes"); // New Worksheet  
                // Column for data in excel. key must match data key
                worksheet.columns = [
                    { header: "Référence", key: "Référence", width: 10 },
                    { header: "Status", key: "Status", width: 10 },
                    { header: "Type Compte", key: "Type Compte", width: 20 },
                    { header: "Nom Compte", key: "Nom Compte", width: 20 },
                    { header: "Spécialité", key: "Spécialité", width: 20 },
                    { header: "Potentiel", key: "Potentiel", width: 20 },
                    { header: "Établissemment", key: "Établissemment", width: 20 },
                    { header: "Nombre visites", key: "Nombre visites", width: 20 },
                    { header: "Téléphone 1", key: "Téléphone 1", width: 20 },
                    { header: "Téléphone 2", key: "Téléphone 2", width: 20 },
                    { header: "Région Compte", key: "Région Compte", width: 20 },
                    { header: "Ville Compte", key: "Ville Compte", width: 20 },
                    { header: "Secteur Compte", key: "Secteur Compte", width: 20 },
                ];
                // Looping through data
                comptes.forEach((compte) => {
                    worksheet.addRow(compte); // Add data in worksheet  
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
                            res.download(path, "Comptes.xlsx", (err) => {
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