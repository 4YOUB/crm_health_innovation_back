const codification_model    = require('../models/codification.model')   ;
const utilisateur_model     = require('../models/utilisateur.model')    ;
const jwt_decode            = require('jwt-decode')                     ;
const mysql                 = require('mysql')                          ;
const {validateAccess}      = require('../../helpers/function.helper')  ;

module.exports = {
    tab_codification_param: (req, res) => {
        const bearer = req.headers.authorization.split(' ')[1];
        let bearer_content = {};
        try {
            bearer_content = jwt_decode(bearer);
        } catch {
            return res.status(400).json({
                error: 'the token is not valid'
            });
        }

        const {
            type_codification   ,
            code_codification   ,
            type_parent         ,
            code_parent
        } = req.body
        connection.query(codification_model.que_get_codification_param, [
            type_codification   ,
            code_codification   ,
            type_parent         ,
            code_parent
        ], (err, result) => {
            if (!err) {
                try {
                    return res.status(200).json({ codification: result[result.length - 1] });
                } catch (error) {
                    return res.status(500).send(error);
                }
            } else {
                return res.status(500).send(err);
            }
        });
    },
    ajouter_codification: (req, res) => {
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

        const {
            type_codification   ,
            ordre_codification  ,
            libelle_codification,
            type_parent         ,
            code_parent
        } = {...req.body}

        connection.query(codification_model.que_get_last_code_codification,[type_codification], (err, result) => {
            if (!err) {
                let message                 = '';
                let last_code_codification  = result[result.length - 1][0].code_codification;
                let code_codification       = (parseInt(last_code_codification.substr(2,last_code_codification.length)) + 1).toLocaleString('en-US', {
                    minimumIntegerDigits: 5,
                    useGrouping: false
                })

                switch(type_codification){
                    case 'SECT':
                        code_codification = 'SE' + code_codification;
                        message = "un nouveau secteur";
                        break;
                    case 'VILL':
                        code_codification = 'VI' + code_codification;
                        message = "une nouvelle ville";
                        break;
                    case 'REGI':
                        code_codification = 'RE' + code_codification;
                        message = "une nouvelle région";
                    break;
                    case 'GAMM':
                        code_codification = 'GA' + code_codification;
                        message = "une nouvelle gamme";
                    break;
                    case 'SPEC':
                        code_codification = 'SP' + code_codification;
                        message = "une nouvelle spécialité";
                    break;
                    case 'FEED':
                        code_codification = 'FE' + code_codification;
                        message = "un nouveau feedback";
                    break;
                    case 'ETPU':
                        code_codification = 'EP' + code_codification;
                        message = "un nouvel établissement publique";
                    break;
                    case 'ETPR':
                        code_codification       = (parseInt(last_code_codification.substr(3,last_code_codification.length)) + 1).toLocaleString('en-US', {
                            minimumIntegerDigits: 5,
                            useGrouping: false
                        })
                        code_codification = 'EPR' + code_codification;
                        message = "un nouvel établissement privé";
                    break;
                    default:
                        return res.status(200).send('Sorry, you cannot use this API.');
                }

                let query_historique    = mysql.format(utilisateur_model.que_add_historique_utilisateur,[
                    bearer_content.id_utilisateur   , 
                    "Ajout d'" + message + " : " + libelle_codification
                ]);

                connection.query(codification_model.que_add_codification + query_historique, [
                    code_codification   ,
                    type_codification   ,
                    ordre_codification  ,
                    libelle_codification,
                    type_parent         ,
                    code_parent
                ], (err, result) => {
                    if (!err) {
                        try {
                            return res.status(200).json({ msg : "done" });
                        } catch (error) {
                            return res.status(500).send(error);
                        }
                    } else {
                        return res.status(500).send(err);
                    }
                });
            } else {
                return res.status(500).send(err);
            }
        });
    },
    modifier_codification: (req, res) => {
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
            type_codification   ,
            code_codification   ,
            ordre_codification  ,
            libelle_codification
        } = {...req.body}

        let message = '';

        switch(type_codification){
            case 'SECT':
                message = "du secteur"
                break;
            case 'VILL':
                message = "de la ville"
                break;
            case 'REGI':
                message = "de la région"
            break;
            case 'GAMM':
                message = "de la gamme"
            break;
            case 'SPEC':
                message = "de la spécialité"
            break;
            case 'FEED':
                message = "du feedback"
            break;
            case 'ETPU':
                message = "de l'établissement publique"
            break;
            case 'ETPR':
                message = "de l'établissement privé"
            break;
            default:
                return res.status(200).send('Sorry, you cannot use this API.');
        }

        let query_historique    = mysql.format(utilisateur_model.que_add_historique_utilisateur,[
            bearer_content.id_utilisateur   , 
            "Modification " + message + " : " + libelle_codification
        ]);

        connection.query(codification_model.que_upd_codification + query_historique, [
            code_codification   ,
            type_codification   ,
            ordre_codification  ,
            libelle_codification
        ], (err, result) => {
            if (!err) {
                try {
                    return res.status(200).json({ msg : "done" });
                } catch (error) {
                    return res.status(500).send(error);
                }
            } else {
                return res.status(500).send(err);
            }
        });
    },
    desactiver_codification: (req, res) => {
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
            type_codification   ,
            code_codification
        } = {...req.body}

        connection.query(codification_model.que_desactivate_codification, [
            type_codification   ,
            code_codification
        ], (err, result) => {
            if (!err) {
                let message = '';

                switch(type_codification){
                    case 'SECT':
                        message = "du secteur"
                        break;
                    case 'VILL':
                        message = "de la ville"
                        break;
                    case 'REGI':
                        message = "de la région"
                    break;
                    case 'GAMM':
                        message = "de la gamme"
                    break;
                    case 'SPEC':
                        message = "de la spécialité"
                    break;
                    case 'FEED':
                        message = "du feedback"
                    break;
                    case 'ETPU':
                        message = "de l'établissement publique"
                    break;
                    case 'ETPR':
                        message = "de l'établissement privé"
                    break;
                    default:
                        return res.status(200).send('Sorry, you cannot use this API.');
                }

                let query_historique    = mysql.format(utilisateur_model.que_add_historique_utilisateur,[
                    bearer_content.id_utilisateur   , 
                    "Désactivation " + message + " : " + result[result.length - 1][0].libelle_codification
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
    },
    activer_codification: (req, res) => {
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
            type_codification   ,
            code_codification
        } = {...req.body}

        connection.query(codification_model.que_activate_codification, [
            type_codification   ,
            code_codification
        ], (err, result) => {
            if (!err) {
                let message = '';

                switch(type_codification){
                    case 'SECT':
                        message = "du secteur"
                        break;
                    case 'VILL':
                        message = "de la ville"
                        break;
                    case 'REGI':
                        message = "de la région"
                    break;
                    case 'GAMM':
                        message = "de la gamme"
                    break;
                    case 'SPEC':
                        message = "de la spécialité"
                    break;
                    case 'FEED':
                        message = "du feedback"
                    break;
                    case 'ETPU':
                        message = "de l'établissement publique"
                    break;
                    case 'ETPR':
                        message = "de l'établissement privé"
                    break;
                    default:
                        return res.status(200).send('Sorry, you cannot use this API.');
                }

                let query_historique    = mysql.format(utilisateur_model.que_add_historique_utilisateur,[
                    bearer_content.id_utilisateur   , 
                    "Activation " + message + " : " + result[result.length - 1][0].libelle_codification
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
    },
    get_infos: (req, res) => {
        connection.query(codification_model.que_get_date, (err, result) => {
            if (!err) {
                try {
                    let infos = {
                        date_jour   : result[result.length - 1].date_jour,
                        version     : CONFIG.version
                    }
                    return res.status(200).json( infos );
                } catch (error) {
                    return res.status(500).send(error);
                }
            } else {
                return res.status(500).send(err);
            }
        });
    },
    tab_parametrages: (req, res) => {
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
            code_codification       ,
            type_codification       ,
            libelle_codification    ,
            code_parent             ,
            libelle_parent          ,
            flag_actif              ,
            order_by                ,
            type_tri
        } = {...req.body}

        let query = codification_model.que_get_tab_parametrages;
        
        if(order_by != null) {
            if(order_by == 'code_codification')
                query += ' ORDER BY tpc.code_codification '     + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC');
                
            else if(order_by == 'libelle_codification')
                query += ' ORDER BY tpc.libelle_codification '  + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC');
            
            else if(order_by == 'ordre_codification')
                query += ' ORDER BY tpc.ordre_codification '    + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC');
            
            else if(order_by == 'code_parent')
                query += ' ORDER BY tpc.code_parent '           + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC');
            
            else if(order_by == 'libelle_parent')
                query += ' ORDER BY libelle_parent '            + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC');
    
            else if(order_by == 'date_creation')
                query += ' ORDER BY tpc.date_creation '         + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC');
            
            else 
                query += ' ORDER BY tpc.ordre_codification, tpc.libelle_codification';
        }
        else {
            query += ' ORDER BY tpc.ordre_codification, tpc.libelle_codification';
        }

        let count_query = mysql.format(codification_model.que_get_nbr_tab_parametrages, [
            code_codification       ,
            type_codification       ,
            libelle_codification    ,
            code_parent             ,
            libelle_parent          ,
            flag_actif
        ])

        connection.query(query + ' LIMIT ' + limit + ';' + count_query, [
            code_codification       ,
            type_codification       ,
            libelle_codification    ,
            code_parent             ,
            libelle_parent          ,
            flag_actif
        ], (err, result) => {
            if (!err) {
                const response = {
                    codification            : result[result.length-3],
                    nbr_total_codification  : result[result.length-1][0].nbr_total_codification
                }
                return res.status(200).json(response).end();
            } else {
                return res.status(500).send(err);
            }
        });
    },
    get_nbr_jours: (req, res) => {
        connection.query(codification_model.que_get_nbr_jours, (err, result) => {
            if (!err) {
                try {
                    const response = {
                        [result[0].code_codification]: result[0],
                        [result[1].code_codification]: result[1]
                    }
                    return res.status(200).json( response );
                } catch (error) {
                    return res.status(500).send(error);
                }
            } else {
                return res.status(500).send(err);
            }
        });
    },
    get_hours_range: (req, res) => {
        connection.query(codification_model.que_get_hours_range, (err, result) => {
            if (!err) {
                try {
                    let response = {};
                    for (let i = 0; i < result.length; i++) {
                        response[result[i].code_codification] = result[i];
                    }
                    return res.status(200).json( response );
                } catch (error) {
                    return res.status(500).send(error);
                }
            } else {
                return res.status(500).send(err);
            }
        });
    },
    get_status_colors: (req, res) => {
        connection.query(codification_model.que_get_status_colors, (err, result) => {
            if (!err) {
                try {
                    const response = {
                        status_colors: result
                    }
                    return res.status(200).json( response );
                } catch (error) {
                    return res.status(500).send(error);
                }
            } else {
                return res.status(500).send(err);
            }
        });
    },
    get_parametrages_app: (req, res) => {
        connection.query(codification_model.que_get_parametrages_app, (err, result) => {
            if (!err) {
                try {
                    let listTypeCodif = [];
                    for (let i = 0; i < result.length; i++) {
                        if(!listTypeCodif.includes(result[i].type_parametrage)){
                            listTypeCodif.push(result[i].type_parametrage);
                        }
                    }
                    let response = {};
                    listTypeCodif.forEach(type => {
                        response[type] = {};
                        for (let i = 0; i < result.length; i++) {
                            if(result[i].type_parametrage == type){
                                response[type][result[i].code_parametrage] = result[i].libelle_parametrage;
                            }
                        }
                    });
                    return res.status(200).json( response );
                } catch (error) {
                    return res.status(500).send(error);
                }
            } else {
                return res.status(500).send(err);
            }
        });
    },
}