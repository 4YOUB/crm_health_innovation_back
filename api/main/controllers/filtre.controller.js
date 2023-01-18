const filtre_model                      = require('../models/filtre.model')         ;
const jwt_decode                        = require('jwt-decode')                     ;
const {
    validateAccess      ,
    getDateRangeOfWeek
}                                       = require('../../helpers/function.helper')  ;

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

    let { type } = {...req.params}
    
    connection.query(filtre_model.que_tab_partenaires,[
        bearer_content.id_utilisateur       ,
        bearer_content.role                 ,
        bearer_content.flag_medical         ,
        bearer_content.flag_pharmaceutique  ,
        type
    ] , (err, result) => {
        if (!err) {
            const response = {
                partenaires : result[result.length-1]
            }
            return res.status(200).json(response).end();
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.tab_etablissements = (req, res) => { 
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }
    
    connection.query(filtre_model.que_tab_etablissements,[bearer_content.role], (err, result) => {
        if (!err) {
            let type_prive = {
                name: "Privé",
                data: result[result.length - 2]
            };
            let type_public = {
                name: "Public",
                data: result[result.length - 1]
            };
            let liste = [type_prive, type_public];

            return res.status(200).json({etablissements : liste}).end();
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.tab_specialites = (req, res) => { 
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }
    
    connection.query(filtre_model.que_tab_specialites,[
        bearer_content.id_utilisateur   ,
        bearer_content.role
    ], (err, result) => {
        if (!err) {
            return res.status(200).json({specialites : result[result.length - 1]}).end();
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.tab_revis = (req, res) => { 
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }
    
    connection.query(filtre_model.que_tab_revis,[bearer_content.role, bearer_content.id_utilisateur], (err, result) => {
        if (!err) {
            let liste_region    = result[result.length-3];
            let liste_ville     = result[result.length-2];
            let liste_secteur   = result[result.length-1];

            liste_ville.forEach(ville => {   
                ville['secteurs'] = []; 
                liste_secteur.forEach(secteur => {
                    if(secteur.code_parent==ville.code_codification){
                        ville['secteurs'].push(secteur);
                    }
                });
            });
            liste_region.forEach(region => {
                region['villes'] = [];
                liste_ville.forEach(ville => {
                    if(ville.code_parent==region.code_codification){
                        region['villes'].push(ville);
                    }
                });
            });

            return res.status(200).json({regions : liste_region }).end();
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.tab_semaines_liste_planification = (req, res) => { 
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }
    
    connection.query(filtre_model.que_tab_semaines, (err, result) => {
        if (!err) {
            let num_semaine                     = result[result.length-1].num_semaine           ;
            let date_premiere_planification     = result[result.length-1].premiere_planification;
            let nbr_semaines_futurs             = result[result.length-1].nbr_semaines_futurs   ;
            
            let liste_semaines = [];
            let semaine        = getDateRangeOfWeek(num_semaine,num_semaine);

            for(let i = 1, cpt = 0; new Date(semaine.date_fin) >= new Date(date_premiere_planification); i++){
                semaine['num_semaine']          = num_semaine-i >= 0 ? (num_semaine-i)+1 : 52-(cpt++);
                semaine['flag_sem_actuelle']    = i==1 ? 'O' : 'N'                              ;
                liste_semaines.unshift(semaine);
                semaine                         = getDateRangeOfWeek(num_semaine-i,num_semaine) ;
            }
            for(let i = 0, cpt = 1; i < nbr_semaines_futurs; i++){
                let semaine                     = getDateRangeOfWeek(num_semaine+i+1,num_semaine);
                semaine['num_semaine']          = num_semaine+i+1 > 52 ? cpt++ : num_semaine+i+1 ;
                semaine['flag_sem_actuelle']    = 'N'                                            ;
                liste_semaines.push(semaine);
            }
            return res.status(200).json({liste_semaines}).end();
        } else {
            return res.status(500).json(err);
        }
    })
}


exports.tab_semaines_ajouter_planification = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    const roles = ['DIR','DRG','PM','DSM','KAM','DEL'];
    if(!validateAccess(roles, bearer_content.role)){
        return res.status(200).json({message : "Sorry, you're not authorized to use this API"}).end();
    }

    connection.query(filtre_model.que_tab_semaines, (err, result) => {
        if (!err) {
            let num_semaine                         = result[result.length-1].num_semaine            ;
            let nbr_semaines_futurs                 = result[result.length-1].nbr_semaines_futurs    ;

            let liste_semaines = [];
            
            let semaine_actuelle                    = getDateRangeOfWeek(num_semaine,num_semaine)    ;
            semaine_actuelle['num_semaine']         = num_semaine                                    ;
            semaine_actuelle['flag_sem_actuelle']   = 'O'                                            ;
            liste_semaines.unshift(semaine_actuelle);
            for(let i = 0, cpt = 1; i < nbr_semaines_futurs; i++){
                let semaine                         = getDateRangeOfWeek(num_semaine+i+1,num_semaine);
                semaine['num_semaine']              = num_semaine+i+1 > 52 ? cpt++ : num_semaine+i+1 ;
                semaine['flag_sem_actuelle']        = 'N'                                            ;
                liste_semaines.push(semaine);
            }
            return res.status(200).json({liste_semaines}).end();
        } else {
            return res.status(500).json(err);
        }
    })
}

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

    let { code } = {...req.params}

    connection.query(filtre_model.que_tab_utilisateurs,[
        bearer_content.id_utilisateur       ,
        bearer_content.role                 ,
        bearer_content.flag_medical         ,
        bearer_content.flag_pharmaceutique  ,
        code
    ], (err, result) => {
        if (!err) {
            return res.status(200).json({utilisateurs : result[result.length-1]}).end();
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.tab_gammes = (req, res) => { 
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    connection.query(filtre_model.que_tab_gammes,[
        bearer_content.id_utilisateur   ,
        bearer_content.role
    ], (err, result) => {
        if (!err) {
            return res.status(200).json({gammes : result[result.length-1] }).end();
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.tab_types_evenement = (req, res) => { 
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }
    
    connection.query(filtre_model.que_tab_types_evenement,[bearer_content.role], (err, result) => {
        if (!err) {
            let liste = result[1];

            return res.status(200).json({types_evenement : liste}).end();
        } else {
            return res.status(500).json(err);
        }
    })
}