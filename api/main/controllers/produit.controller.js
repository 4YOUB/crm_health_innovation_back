const produit_model                     = require('../models/produit.model')        ;
const utilisateur_model                 = require('../models/utilisateur.model')    ;
const jwt_decode                        = require('jwt-decode')                     ;
const {validateAccess}                  = require('../../helpers/function.helper')  ;
const mysql                             =  require('mysql')                         ;

exports.tab_produits = (req, res) => { 
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
    if(!validateAccess(roles, bearer_content.role)){
        return res.status(200).json({message : "Sorry, you're not authorized to use this API"}).end();
    }

    let records_per_page    = parseInt(req.params['records_per_page'], 10) || 1;
    let page_number         = parseInt(req.params['page_number'], 10) || 0;
    let records_to_skip     = page_number * records_per_page;
    let limit               = records_to_skip  + ',' + records_per_page;

    let {
        id_produit                          ,
        libelle_produit                     ,
        code_gamme                          ,
        code_statut_produit                 ,
        order_by                            ,
        type_tri
    } = {...req.body}
    
    let query           = produit_model.que_tab_produits;
    let query_gammes    = mysql.format(produit_model.que_tab_produit_gammes,[id_produit]);
    let count_query     = produit_model.que_nbr_tab_produits;

    if(order_by != null) {
        if(order_by == 'id_produit' || order_by == 'date_creation')
            query += ' ORDER BY tp.id_produit '         + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC');

        else if(order_by == 'libelle_produit')
            query += ' ORDER BY tp.libelle_produit '    + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC')   + ', tp.id_produit DESC';

        else if(order_by == 'libelle_gamme')
            query += ' ORDER BY tp.libelle_gamme '      + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC')   + ', tp.id_produit DESC';

        else if(order_by == 'ordre_produit')
            query += ' ORDER BY tp.ordre_produit '      + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC')   + ', tp.id_produit DESC';
        
        else 
            query += ' ORDER BY tp.id_produit '         + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC');
    }
    else {
        query +=' ORDER BY tp.id_produit DESC';
    }

    count_query = mysql.format(count_query,[
        bearer_content.id_utilisateur       ,
        id_produit                          ,
        code_gamme                          ,
        libelle_produit                     ,
        code_statut_produit 
    ])

    connection.query(query + ' LIMIT ' + limit + ';' + count_query + query_gammes,[
        bearer_content.id_utilisateur       ,
        id_produit                          ,
        code_gamme                          ,
        libelle_produit                     ,
        code_statut_produit                 ,
        order_by                            ,
        type_tri
    ] , (err, result) => {
        if (!err) {
            let produits    = result[result.length-5];
            let gammes      = result[result.length-1];

            produits.forEach(produit => {
                produit['gammes'] = [];
                gammes.forEach(gamme => {
                    if(gamme.id_produit == produit.id_produit){
                        produit["gammes"].push(gamme);
                    }
                })
            })

            const response = {
                produits            : produits,
                nbr_total_produits  : result[result.length-3][0].nbr_total_produits
            }
            return res.status(200).json(response).end();

        } else {
            return res.status(500).json(err);
        }
    })
}

exports.ajouter_produit = (req, res) => { 
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
    if(!validateAccess(roles, bearer_content.role)){
        return res.status(200).json({message : "Sorry, you're not authorized to use this API"}).end();
    }

    let {
        libelle_produit     ,
        gammes              ,
        ordre_produit
    } = {...req.body}
    
    connection.query(produit_model.que_add_produit,[
        libelle_produit                 ,
        ordre_produit
    ] , (err, result) => {
        if (!err) {
            let id_produit          = result[result.length-1][0].id_produit  ;
            let query_gammes        = '';
            gammes.forEach(gamme => {
                query_gammes += mysql.format(produit_model.que_add_produit_gamme,[id_produit,gamme]);
            });
            let query_historique    = mysql.format(utilisateur_model.que_add_historique_utilisateur,[
                bearer_content.id_utilisateur   , 
                "Ajout d'un nouveau produit : " + libelle_produit
            ]);

            connection.query(query_historique + query_gammes, (err, result) => {
                if (!err) {
                    return res.status(200).json({id_produit : id_produit}).end();
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

exports.modifier_produit = (req, res) => { 
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
    if(!validateAccess(roles, bearer_content.role)){
        return res.status(200).json({message : "Sorry, you're not authorized to use this API"}).end();
    }

    let {
        id_produit      ,
        libelle_produit ,
        ordre_produit   ,
        gammes
    } = {...req.body}

    let query_gammes        = '';
    gammes.forEach(gamme => {
        query_gammes += mysql.format(produit_model.que_add_produit_gamme,[id_produit,gamme]);
    });
    
    let query_del_produit_gamme = mysql.format(produit_model.que_del_produit_gamme,[id_produit]);

    connection.query(produit_model.que_upd_produit + query_del_produit_gamme + query_gammes,[
        id_produit      ,
        libelle_produit ,
        ordre_produit
    ] , (err, result) => {
        if (!err) {
            let query_historique    = mysql.format(utilisateur_model.que_add_historique_utilisateur,[
                bearer_content.id_utilisateur   , 
                "Modification du produit : " + libelle_produit
            ]);

            connection.query(query_historique, (err, result) => {
                if (!err) {
                    return res.status(200).json({id_produit : id_produit}).end();
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

exports.fiche_produit = (req, res) => { 
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
    if(!validateAccess(roles, bearer_content.role)){
        return res.status(200).json({message : "Sorry, you're not authorized to use this API"}).end();
    }

    let { id_produit } = {...req.params}

    let query_produit_gammes = mysql.format(produit_model.que_get_gammes_produit,[id_produit]);
    
    connection.query(produit_model.que_get_fiche_produit + query_produit_gammes,[ id_produit ] , (err, result) => {
        if (!err) {
            let produit         = result[result.length - 3][0];
            produit["gammes"]   = result[result.length - 1];

            return res.status(200).json({produit}).end();
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.activer_produit= (req, res) => {
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
    if(!validateAccess(roles, bearer_content.role)){
        return res.status(200).json({message : "Sorry, you're not authorized to use this API"}).end();
    }

    let { id_produit } = {...req.params}

    connection.query(produit_model.que_activate_produit, [ id_produit ], (err, result) => {
        if (!err) {
            let query_historique = mysql.format(utilisateur_model.que_add_historique_utilisateur,[
                bearer_content.id_utilisateur   , 
                "Activation du produit : " + result[result.length - 1][0].libelle_produit
            ]);

            connection.query(query_historique, (err, result) => {
                if (!err) {
                    return res.status(200).json({ msg : "done" });
                }
                else {
                    return res.status(500).json(err);
                }
            })
        } else {
            return res.status(500).send(err);
        }
    });
}

exports.desactiver_produit= (req, res) => {
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
    if(!validateAccess(roles, bearer_content.role)){
        return res.status(200).json({message : "Sorry, you're not authorized to use this API"}).end();
    }

    let { id_produit } = {...req.params}

    connection.query(produit_model.que_desactivate_produit, [ id_produit ], (err, result) => {
        if (!err) {
            let query_historique = mysql.format(utilisateur_model.que_add_historique_utilisateur,[
                bearer_content.id_utilisateur   , 
                "Désactivation du produit : " + result[result.length - 1][0].libelle_produit
            ]);

            connection.query(query_historique, (err, result) => {
                if (!err) {
                    return res.status(200).json({ msg : "done" });
                }
                else {
                    return res.status(500).json(err);
                }
            })
        } else {
            return res.status(500).send(err);
        }
    });
}