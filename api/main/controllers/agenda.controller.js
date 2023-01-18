const agenda_model                      = require('../models/agenda.model')         ;
const jwt_decode                        = require('jwt-decode')                     ;
const mysql                             = require('mysql')                          ;
const {validateAccess}                  = require('../../helpers/function.helper')  ;
const utilisateur_model                 = require('../models/utilisateur.model')    ;
const moment                            = require('moment')                         ;

exports.get_agenda_perso_visites = (req, res) => { 
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    let {
        date_debut_visite   ,
        date_fin_visite     ,
        id_utilisateur                      ,
    } = {...req.body}
    
    let query           = agenda_model.que_agenda_perso_visites;
    let count_query     = agenda_model.que_agenda_perso_nbr_visites;


    count_query = mysql.format(count_query,[
        bearer_content.id_utilisateur       ,
        date_debut_visite + " 00:00"        ,
        date_fin_visite + " 23:59"          ,
        id_utilisateur                      ,
    ])

    connection.query(query + ';' + count_query,[
        bearer_content.id_utilisateur       ,
        date_debut_visite + " 00:00"        ,
        date_fin_visite + " 23:59"          ,
        id_utilisateur                      ,
    ] , (err, result) => {
        if (!err) {
            const response = {
                visites             : result[result.length-3],
                nbr_total_visites   : result[result.length-1][0].nbr_total_visites
            }
            return res.status(200).json(response).end();

        } else {
            return res.status(500).json(err);
        }
    })
}


exports.get_agenda_fiche_visite = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    let { id_visite } = {...req.params}
    
    connection.query(agenda_model.que_agenda_fiche_visite,[
        bearer_content.id_utilisateur   ,
        id_visite
    ], (err, result) => {
        if (!err) {
            let visite = result[result.length-2];

            if(!visite.length){
                return res.status(200).json({ flag_non_disponible : 'O' }).end();
            }

            visite[0]['produits'] = result[result.length-1];
            return res.status(200).json({ visite : visite[0] }).end();
        } else {
            return res.status(500).json(err);
        }
    })
}


exports.get_agenda_equipe_visites = (req, res) => { 
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    let {
        date_debut_visite   ,
        date_fin_visite     ,
    } = {...req.body}
    
    let query           = agenda_model.que_agenda_equipe_visites;
    let count_query     = agenda_model.que_agenda_equipe_nbr_visites;


    count_query = mysql.format(count_query,[
        bearer_content.id_utilisateur       ,
        bearer_content.role,
        date_debut_visite + " 00:00"        ,
        date_fin_visite + " 23:59"          ,
    ])

    connection.query(query + ';' + count_query,[
        bearer_content.id_utilisateur       ,
        bearer_content.role,
        date_debut_visite + " 00:00"        ,
        date_fin_visite + " 23:59"          ,
    ] , (err, result) => {
        if (!err) {
            const response = {
                visites             : result[result.length-3],
                nbr_total_visites   : result[result.length-1][0].nbr_total_visites
            }
            return res.status(200).json(response).end();

        } else {
            return res.status(500).json(err);
        }
    })
}


exports.get_agenda_evenements = (req, res) => { 
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    let {
        date_debut_evenements,
        date_fin_evenements,
        id_utilisateur                      ,
    } = {...req.body}

    let query = agenda_model.que_tab_agenda_evenements;
    let count_query = mysql.format(
        agenda_model.que_nbr_tab_agenda_evenements,
        [ 
            bearer_content.id_utilisateur,
            date_debut_evenements + " 00:00",
            date_fin_evenements + " 23:59",
            id_utilisateur                      ,
        ]
    );

    connection.query(query + ';' + count_query,
    [ 
        bearer_content.id_utilisateur,
        date_debut_evenements + " 00:00",
        date_fin_evenements + " 23:59",
        id_utilisateur                      ,
    ] , (err, result) => {
        if (!err) {
            const response = {
                evenements: result[result.length-3],
                nbr_total_evenements: result[result.length-1][0].nbr_total_evenements
            }
            return res.status(200).json(response).end();
        } else {
            return res.status(500).json(err);
        }    
    })
}

exports.add_evenement = (req, res) => { 
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    const roles = ['ADMI','DIR','DRG','PM','DSM','KAM','DEL'];
    if(!validateAccess(roles, bearer_content.role)){
        return res.status(200).json({message : "Sorry, you're not authorized to use this API"}).end();
    }
    
    let { 
        id_utilisateur,
        code_evenement, 
        type_evenement, 
        titre, 
        date_deb_evenement, 
        date_fin_evenement,
        lieu,
        commentaire
    } = {...req.body};

    connection.query(agenda_model.que_add_evenement,[ 
        id_utilisateur ? id_utilisateur : bearer_content.id_utilisateur,
        bearer_content.id_utilisateur,
        code_evenement, 
        type_evenement, 
        titre, 
        date_deb_evenement, 
        date_fin_evenement,
        lieu,
        commentaire
    ] , (err, result) => {
        if (!err) {
            let {isOK, conflictSource, conflictCount, ids} = result[3][0];
            if(isOK == "no") {
                return res.status(409).send(
                    {
                        ok: false, 
                        conflictSource, 
                        conflictCount,
                        ids: JSON.parse(ids),
                    }
                );
            }
            else if(isOK == "yes") {
                let id_evenement = result[4][0].id_evenement;
                let code_evenement = result[6][0].libelle_code_evenement;
                let date_debut = moment(date_deb_evenement).format("DD-MM-YYYY HH:mm");
                let date_fin = moment(date_fin_evenement).format("DD-MM-YYYY HH:mm");
                let type = type_evenement == "GLOB" ? "globale" : "individuel";

                let query_historique = mysql.format(utilisateur_model.que_add_historique_utilisateur,[
                    bearer_content.id_utilisateur, 
                    `Ajout d'un nouveau événement ${type} de type ${code_evenement} : du ${date_debut} au ${date_fin}` 
                ]);

                connection.query(query_historique, (err, result)=>{
                    if (!err) {
                        return res.status(200).json({ok: true, id_evenement}).end();
                    }
                    else {
                        return res.status(500).json(err);
                    }
                })
            }
        } else {
            return res.status(500).json(err);
        }    
    })
}

exports.get_agenda_fiche_evenement = (req, res) => { 
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    let { id_evenement } = {...req.params}
    
    connection.query(agenda_model.que_agenda_fiche_evenement,[
        bearer_content.id_utilisateur   ,
        id_evenement
    ], (err, result) => {
        if (!err) {
            let evenement = result[1][0];
            return res.status(200).json({evenement}).end();
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.delete_agenda_evenement = (req, res) => { 
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    let { id_evenement } = {...req.params}
    
    connection.query(agenda_model.que_agenda_fiche_evenement,[
        bearer_content.id_utilisateur   ,
        id_evenement
    ], (err, resultE) => {
        if (!err) {
            let evenement = resultE[1][0];
            let code_evenement = evenement.libelle_code_evenement;
            let date_debut = moment(evenement.date_deb_evenement).format("DD-MM-YYYY HH:mm");
            let date_fin = moment(evenement.date_fin_evenement).format("DD-MM-YYYY HH:mm");
            let type = evenement.type_evenement == "GLOB" ? "globale" : "individuel";
            let query_historique = mysql.format(utilisateur_model.que_add_historique_utilisateur,[
                bearer_content.id_utilisateur, 
                `Suppression d'un événement ${type} de type ${code_evenement} : du ${date_debut} au ${date_fin}` 
            ]);

            connection.query(query_historique, (err, result)=>{
                if (err){
                    return res.status(500).json(err);
                }
                else {
                    connection.query(agenda_model.que_agenda_supprimer_evenement,[
                        bearer_content.id_utilisateur   ,
                        id_evenement
                    ], (err, result) => {
                        if (!err) {
                            return res.status(200).json({message: "ok"}).end();
                        } else {
                            return res.status(500).json(err);
                        }
                    })
                }
            });
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.edit_agenda_evenement = (req, res) => { 
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    let { id_evenement } = {...req.params}
    let { 
        id_utilisateur,
        code_evenement, 
        titre, 
        date_deb_evenement, 
        date_fin_evenement,
        lieu,
        commentaire
    } = {...req.body};

    connection.query(agenda_model.que_agenda_modifier_evenement,[
        bearer_content.id_utilisateur,
        id_utilisateur ? id_utilisateur : bearer_content.id_utilisateur,
        id_evenement,
        code_evenement, 
        titre, 
        date_deb_evenement, 
        date_fin_evenement,
        lieu,
        commentaire
    ], (err, result) => {
        if (!err) {
            let {isOK, conflictSource, conflictCount, ids} = result[3][0];
            if(isOK == "no") {
                return res.status(409).send(
                    {
                        ok: false, 
                        conflictSource, 
                        conflictCount,
                        ids: JSON.parse(ids),
                    }
                );
            }
            else if(isOK == "yes") {
                connection.query(agenda_model.que_agenda_fiche_evenement,[
                    bearer_content.id_utilisateur   ,
                    id_evenement,
                ], (err, resultE) => {
                    if (!err) {
                        let evenement = resultE[1][0];
                        let code_evenement = evenement.libelle_code_evenement;
                        let date_debut = moment(evenement.date_deb_evenement).format("DD-MM-YYYY HH:mm");
                        let date_fin = moment(evenement.date_fin_evenement).format("DD-MM-YYYY HH:mm");
                        let type = evenement.type_evenement == "GLOB" ? "globale" : "individuel";
                        let query_historique = mysql.format(utilisateur_model.que_add_historique_utilisateur,[
                            bearer_content.id_utilisateur, 
                            `Modification d'un événement ${type} de type ${code_evenement} : du ${date_debut} au ${date_fin}` 
                        ]);
            
                        connection.query(query_historique, (err, result)=>{
                            if (err){
                                return res.status(500).json(err);
                            }
                            else {
                                return res.status(200).json({message: "ok"}).end();
                            }
                        });
                    } else {
                        return res.status(500).json(err);
                    }
                })
            }
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.agenda_supp_visites = (req, res) => { 
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    let { 
        operation,
        visites_ids,
        id_utilisateur,
        code_evenement, 
        type_evenement, 
        titre, 
        date_deb_evenement, 
        date_fin_evenement,
        id_evenement
    } = {...req.body}
    
    connection.query(agenda_model.que_agenda_supp_visites,[
        bearer_content.id_utilisateur   ,
        id_utilisateur ? id_utilisateur : bearer_content.id_utilisateur,
        visites_ids
    ], (err, result) => {
        if (!err) {

            let nb_visites = visites_ids.length;
            let s = nb_visites > 1 ? "s" : "";
            let query_historique = mysql.format(utilisateur_model.que_add_historique_utilisateur,[
                bearer_content.id_utilisateur, 
                `Suppression de ${nb_visites} visite${s} : du ${date_deb_evenement} au ${date_fin_evenement}` 
            ]);

            connection.query(query_historique, (err, result)=>{
                if (!err) {
                }
                else {
                    return res.status(500).json(err);
                }
            })

            if(operation == "ajouter"){
                connection.query(agenda_model.que_add_evenement,[ 
                    id_utilisateur ? id_utilisateur : bearer_content.id_utilisateur,
                    bearer_content.id_utilisateur,
                    code_evenement, 
                    type_evenement, 
                    titre, 
                    date_deb_evenement, 
                    date_fin_evenement
                ] , (err, result) => {
                    if (!err) {
                        let {isOK, conflictSource, conflictCount, ids} = result[3][0];
                        if(isOK == "no") {
                            return res.status(409).send(
                                {
                                    ok: false, 
                                    conflictSource, 
                                    conflictCount,
                                    ids: JSON.parse(ids),
                                }
                            );
                        }
                        else if(isOK == "yes") {
                            let id_evenement = result[4][0].id_evenement;
                            let code_evenement = result[6][0].libelle_code_evenement;
                            let date_debut = moment(date_deb_evenement).format("DD-MM-YYYY HH:mm");
                            let date_fin = moment(date_fin_evenement).format("DD-MM-YYYY HH:mm");
                            let type = type_evenement == "GLOB" ? "globale" : "individuel";

                            let query_historique = mysql.format(utilisateur_model.que_add_historique_utilisateur,[
                                bearer_content.id_utilisateur, 
                                `Ajout d'un nouveau événement ${type} de type ${code_evenement} : du ${date_debut} au ${date_fin}` 
                            ]);

                            connection.query(query_historique, (err, result)=>{
                                if (!err) {
                                    return res.status(200).json({ok: true, id_evenement}).end();
                                }
                                else {
                                    return res.status(500).json(err);
                                }
                            })
                        }
                    } else {
                        return res.status(500).json(err);
                    }    
                })
            }
            else if(operation == "modifier"){
                connection.query(agenda_model.que_agenda_modifier_evenement,[
                    bearer_content.id_utilisateur,
                    id_utilisateur ? id_utilisateur : bearer_content.id_utilisateur,
                    id_evenement,
                    code_evenement, 
                    titre, 
                    date_deb_evenement, 
                    date_fin_evenement
                ], (err, result) => {
                    if (!err) {
                        let {isOK, conflictSource, conflictCount, ids} = result[3][0];
                        if(isOK == "no") {
                            return res.status(409).send(
                                {
                                    ok: false, 
                                    conflictSource, 
                                    conflictCount,
                                    ids: JSON.parse(ids),
                                }
                            );
                        }
                        else if(isOK == "yes") {
                            connection.query(agenda_model.que_agenda_fiche_evenement,[
                                bearer_content.id_utilisateur   ,
                                id_evenement,
                            ], (err, resultE) => {
                                if (!err) {
                                    let evenement = resultE[1][0];
                                    let code_evenement = evenement.libelle_code_evenement;
                                    let date_debut = moment(evenement.date_deb_evenement).format("DD-MM-YYYY HH:mm");
                                    let date_fin = moment(evenement.date_fin_evenement).format("DD-MM-YYYY HH:mm");
                                    let type = evenement.type_evenement == "GLOB" ? "globale" : "individuel";
                                    let query_historique = mysql.format(utilisateur_model.que_add_historique_utilisateur,[
                                        bearer_content.id_utilisateur, 
                                        `Modification d'un événement ${type} de type ${code_evenement} : du ${date_debut} au ${date_fin}` 
                                    ]);
                        
                                    connection.query(query_historique, (err, result)=>{
                                        if (err){
                                            return res.status(500).json(err);
                                        }
                                        else {
                                            return res.status(200).json({message: "ok"}).end();
                                        }
                                    });
                                } else {
                                    return res.status(500).json(err);
                                }
                            })
                        }
                    } else {
                        return res.status(500).json(err);
                    }
                })
            }
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.get_agenda_equipe_evenements = (req, res) => { 
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    let {
        date_debut_evenements   ,
        date_fin_evenements     ,
    } = {...req.body}
    
    let query           = agenda_model.que_tab_agenda_equipe_evenements;
    let count_query     = agenda_model.que_nbr_tab_agenda_equipe_evenements;


    count_query = mysql.format(count_query,[
        bearer_content.id_utilisateur       ,
        bearer_content.role,
        date_debut_evenements + " 00:00"        ,
        date_fin_evenements + " 23:59"          ,
    ])

    connection.query(query + ';' + count_query,[
        bearer_content.id_utilisateur       ,
        bearer_content.role,
        date_debut_evenements + " 00:00"        ,
        date_fin_evenements + " 23:59"          ,
    ] , (err, result) => {
        if (!err) {
            
            const response = {
                evenements             : result[result.length-3],
                nbr_total_evenements   : result[result.length-1][0].nbr_total_evenements
            }
            return res.status(200).json(response).end();

        } else {
            return res.status(500).json(err);
        }
    })
}

exports.is_date_free = (req, res) => { 
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    let {
        date
    } = req.body
    
    let query = agenda_model.que_is_date_free;

    connection.query(query, [
        bearer_content.id_utilisateur,
        date
    ] , (err, result) => {
        if (!err) {
            
            const response = {
               isFree: result[1][0].isFree == "false" ? false : true
            }
            return res.status(200).json(response).end();

        } else {
            return res.status(500).json(err);
        }
    })
}
