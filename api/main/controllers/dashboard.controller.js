const dashboard_model                   = require('../models/dashboard.model')      ;
const utilisateur_model                 = require('../models/utilisateur.model')    ;
const jwt_decode                        = require('jwt-decode')                     ;
const {validateAccess}                  = require('../../helpers/function.helper')  ;
const mysql                             =  require('mysql')                         ;

exports.get_statistiques = (req, res) => { 
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }
    
    const roles = ['ADMI','ACH','DIR','DRG','PM','DSM','KAM','DEL'];
    if(!validateAccess(roles, bearer_content.role)){
        return res.status(200).json({message : "Sorry, you're not authorized to use this API"}).end();
    }

    let { 
        id_utilisateur      ,
        role_utilisateur    ,
        date_debut          ,
        date_fin 
    } = {...req.body}

    let query        = mysql.format(dashboard_model.que_get_stats,[
        bearer_content.id_utilisateur   ,
        bearer_content.role             ,
        id_utilisateur                  ,
        role_utilisateur                ,
        date_debut + " 00:00",
        date_fin + " 23:59"
    ])
    let query_gammes = mysql.format(utilisateur_model.que_get_gammes_utilisateur,[
        bearer_content.id_utilisateur   ,
        bearer_content.role             ,
        id_utilisateur                  ,
        role_utilisateur
    ]);
    
    connection.query(query + query_gammes, (err, result) => {
        if (!err) {
            let statistiques        = result[result.length-3][0];
            let liste_gammes        = result[result.length-1]   ;
            let query_stats_gammes  = ' '                       ;

            liste_gammes.forEach(gamme => {
                query_stats_gammes += mysql.format(dashboard_model.que_get_stats_par_gamme,[
                    bearer_content.id_utilisateur   ,
                    bearer_content.role             ,
                    id_utilisateur                  ,
                    date_debut + " 00:00",
                    date_fin + " 23:59",
                    gamme.code_codification
                ])
            });

            statistiques['nbr_autre_planification'] = statistiques.nbr_total_planifications - statistiques.nbr_mes_planifications;
            statistiques['gammes'] = []
            statistiques['nbr_total_gammes_visites_planifiees']     = 0;
            statistiques['nbr_total_gammes_visites_non_planifiees'] = 0;

            if(liste_gammes.length){
                connection.query(query_stats_gammes, (err, result) => {
                    if(!err){
                        statistiques['gammes'] = []
                        let nbr_total_gammes_visites_planifiees     = 0;
                        let nbr_total_gammes_visites_non_planifiees = 0;
    
                        result.forEach(element =>{
                            if(Array.isArray(element)){
                                nbr_total_gammes_visites_planifiees     += element[0].nbr_visites_realisees_planifiees      ;
                                nbr_total_gammes_visites_non_planifiees += element[0].nbr_visites_realisees_non_planifiees  ;
                                statistiques['gammes'].push(element[0]);
                            }
                        })
                        statistiques['nbr_total_gammes_visites_planifiees']     = nbr_total_gammes_visites_planifiees       ;
                        statistiques['nbr_total_gammes_visites_non_planifiees'] = nbr_total_gammes_visites_non_planifiees   ;
                        return res.status(200).json({statistiques}).end();
                    } else{
                        return res.status(500).json(err);
                    }
                })
            }
            else {
                return res.status(200).json({statistiques}).end();
            }
        } else {
            return res.status(500).json(err);
        }
    })
}