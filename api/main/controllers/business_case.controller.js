const business_case_model               = require('../models/business_case.model')  ;
const utilisateur_model                 = require('../models/utilisateur.model')    ;
const jwt_decode                        = require('jwt-decode')                     ;
const mysql                             = require('mysql')                          ;
const {validateAccess}                  = require('../../helpers/function.helper')  ;
const fs = require("fs");
const path = require("path");
const excelJs = require("exceljs");

exports.tab_business_cases = (req, res) => { 
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }
    let records_per_page    = parseInt(req.params['records_per_page'], 10) || 1;
    let page_number         = parseInt(req.params['page_number'], 10) || 0;
    let records_to_skip     = page_number * records_per_page;
    let limit               = records_to_skip  + ',' + records_per_page;

    let {
        id_partenaire                       ,
        nom_partenaire                      ,
        id_utilisateur                      ,
        potentiel                           ,
        code_specialite                     ,
        code_statut_bc                      ,
        code_region                         ,
        order_by                            ,
        type_tri
    } = {...req.body}
    
    let query           = business_case_model.que_tab_business_cases;
    let count_query     = business_case_model.que_nbr_tab_business_cases;

    if(potentiel){
        potentiel       = potentiel.join('\',\'');
        query           += 'AND code_potentiel IN (\'' + potentiel + '\')';
        count_query     += 'AND code_potentiel IN (\'' + potentiel + '\')';
    }
    if(code_specialite){
        code_specialite = code_specialite.join('\',\'');
        query           += 'AND code_specialite IN (\'' + code_specialite +'\')';
        count_query     += 'AND code_specialite IN (\'' + code_specialite +'\')';
    }

    if(order_by != null) {
        if(order_by == 'nom_partenaire')
            query += ' ORDER BY nom_partenaire '        + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC') + ', tb.id_business_case DESC';

        else if(order_by == 'date_validation')
            query += ' ORDER BY tb.date_validation '    + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC');

        else if(order_by == 'date_realisation')
            query += ' ORDER BY tb.date_realisation '   + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC');
        
        else 
            query += ' ORDER BY tb.id_business_case '   + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC');
    }
    else {
        query +=' ORDER BY tb.id_business_case DESC';
    }

    count_query = mysql.format(count_query,[
        bearer_content.id_utilisateur       ,
        bearer_content.role                 ,
        bearer_content.flag_medical         ,
        bearer_content.flag_pharmaceutique  ,
        id_partenaire                       ,
        nom_partenaire                      ,
        id_utilisateur                      ,
        code_statut_bc                      ,
        code_region 
    ])

    connection.query(query + ' LIMIT ' + limit + ';' + count_query,[
        bearer_content.id_utilisateur       ,
        bearer_content.role                 ,
        bearer_content.flag_medical         ,
        bearer_content.flag_pharmaceutique  ,
        id_partenaire                       ,
        nom_partenaire                      ,
        id_utilisateur                      ,
        code_statut_bc                      ,
        code_region
    ] , (err, result) => {
        if (!err) {
            let business_cases = result[result.length-3];
            business_cases.forEach(bc => {
                bc['url_document'] = bc.intitule_document?CONFIG.url_api+(CONFIG.bc_document_folder + bc.id_partenaire + '/' + bc.intitule_document):null;
            });
            const response = {
                business_cases            ,
                nbr_total_business_cases   : result[result.length-1][0].nbr_total_business_cases
            }
            return res.status(200).json(response).end();

        } else {
            return res.status(500).json(err);
        }
    })
}

exports.ajouter_business_case = (req, res) => { 
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

    let {
        id_partenaire               ,
        nom_beneficiaire            ,
        rib_beneficiaire            ,
        code_type_investissement    ,
        description                 ,
        budget                      ,
        destination                 ,
        objet_investissement        ,
        id_document                 ,
        nom_document
    } = {...req.body}
    
    connection.query(business_case_model.que_add_business_case,[
        bearer_content.id_utilisateur       ,
        bearer_content.role                 ,
        bearer_content.flag_medical         ,
        bearer_content.flag_pharmaceutique  ,
        id_partenaire                       ,
        nom_beneficiaire                    ,
        rib_beneficiaire                    ,
        code_type_investissement            ,
        description                         ,
        budget                              ,
        destination                         ,
        objet_investissement
    ] , (err, result) => {
        if (!err) {
            if (result[result.length-1][0].done == 'ko') {
                return res.status(500).send({message : "Sorry, you're not authorized to use this API"});
            }

            let id_business_case = result[result.length-3][0].id_business_case  ;
            let nom_partenaire   = result[result.length-3][0].nom_partenaire    ;

            let query_historique = mysql.format(utilisateur_model.que_add_historique_utilisateur,[
                bearer_content.id_utilisateur   ,
                "Création d'une demande d'investissement pour le partenaire : " + nom_partenaire
            ]);

            if(id_document){
                connection.query(business_case_model.que_add_document_bc + query_historique,[id_business_case, nom_document, id_document],(err, result)=>{
                    if (!err) {
                        return res.status(200).json({id_business_case}).end();
                    }
                    else {
                        return res.status(500).json(err);
                    }
                })
            }
            else {
                connection.query(query_historique, (err, result)=>{
                    if (!err) {
                        return res.status(200).json({id_business_case}).end();
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

exports.fiche_business_case = (req, res) => { 
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

    let {id_business_case} = {...req.params}
    
    connection.query(business_case_model.que_get_fiche_business_case,[id_business_case] , (err, result) => {
        if (!err) {
            let business_case =  result[result.length-1];
            business_case['url_document'] = business_case.intitule_document?CONFIG.url_api+(CONFIG.bc_document_folder + business_case.id_partenaire + '/' + business_case.cle_document + '.' + business_case.extension_document):null;
            return res.status(200).json({business_case}).end();
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.modifier_business_case = (req, res) => { 
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

    let {
        id_business_case            ,
        id_partenaire               ,
        nom_beneficiaire            ,
        rib_beneficiaire            ,
        code_type_investissement    ,
        description                 ,
        budget                      ,
        destination                 ,
        objet_investissement        ,
        id_document                 ,
        nom_document
    } = {...req.body}
    
    connection.query(business_case_model.que_upd_business_case,[
        bearer_content.id_utilisateur       ,
        id_business_case                    ,
        id_partenaire                       ,
        nom_beneficiaire                    ,
        rib_beneficiaire                    ,
        code_type_investissement            ,
        description                         ,
        budget                              ,
        destination                         ,
        objet_investissement
    ] , (err, result) => {
        if (!err) {
            let nom_partenaire      = result[result.length - 1][0].nom_partenaire;
            let query_historique    = mysql.format(utilisateur_model.que_add_historique_utilisateur,[
                bearer_content.id_utilisateur   ,
                "Modification d'un investissement du partenaire : " + nom_partenaire
            ]);

            if(id_document){
                let query = mysql.format(business_case_model.que_del_document_bc,[id_business_case, id_document]);
                connection.query(query + business_case_model.que_add_document_bc + query_historique,[id_business_case, nom_document, id_document],(err, result)=>{
                    if (!err) {
                        return res.status(200).json({msg : "done"}).end();
                    }
                    else {
                        return res.status(500).json(err);
                    }
                })
            }
            else {
                connection.query(query_historique, (err, result)=>{
                    if (!err) {
                        return res.status(200).json({msg : "done"}).end();
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

exports.valider_business_case = (req, res) => { 
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    const roles = ['DIR','DRG','PM'];
    if(!validateAccess(roles, bearer_content.role)){
        return res.status(200).json({message : "Sorry, you're not authorized to use this API"}).end();
    } 

    let {id_business_case} = {...req.params}
    
    connection.query(business_case_model.que_valider_business_case,[id_business_case], (err, result) => {
        if (!err) {
            if(result[result.length - 1][0].done == 'ok'){
                return res.status(200).json({msg : "done"}).end();
            } else {
                return res.status(200).json({msg : "Sorry, you can't validate this activity"}).end();
            }
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.rejeter_business_case = (req, res) => { 
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    const roles = ['DIR','DRG','PM'];
    if(!validateAccess(roles, bearer_content.role)){
        return res.status(200).json({message : "Sorry, you're not authorized to use this API"}).end();
    } 

    let {id_business_case} = {...req.params}
    
    connection.query(business_case_model.que_rejeter_business_case,[id_business_case], (err, result) => {
        if (!err) {
            if(result[result.length - 1][0].done == 'ok'){
                return res.status(200).json({msg : "done"}).end();
            } else {
                return res.status(200).json({msg : "Sorry, you can't reject this activity"}).end();
            }
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.realiser_business_case = (req, res) => { 
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    const roles = ['ACH'];
    if(!validateAccess(roles, bearer_content.role)){
        return res.status(200).json({message : "Sorry, you're not authorized to use this API"}).end();
    } 

    let {id_business_case} = {...req.params}
    
    connection.query(business_case_model.que_realiser_business_case,[id_business_case], (err, result) => {
        if (!err) {
            if(result[result.length - 1][0].done == 'ok'){
                return res.status(200).json({msg : "done"}).end();
            } else {
                return res.status(200).json({msg : "Sorry, you can't modify this activity"}).end();
            }
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.export_business_cases = (req, res) => { 
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    if(bearer_content.flag_export != 'O' || bearer_content.export_investissements != 'O'){
        return res.status(403).json({message: "Not Authorized"});
    }

    let {
        id_partenaire                       ,
        nom_partenaire                      ,
        id_utilisateur                      ,
        potentiel                           ,
        code_specialite                     ,
        code_statut_bc                      ,
        code_region                         ,
        order_by                            ,
        type_tri
    } = {...req.body}
    
    let query           = business_case_model.que_export_business_cases;

    if(potentiel){
        potentiel       = potentiel.join('\',\'');
        query           += 'AND code_potentiel IN (\'' + potentiel + '\')';
        count_query     += 'AND code_potentiel IN (\'' + potentiel + '\')';
    }
    if(code_specialite){
        code_specialite = code_specialite.join('\',\'');
        query           += 'AND code_specialite IN (\'' + code_specialite +'\')';
        count_query     += 'AND code_specialite IN (\'' + code_specialite +'\')';
    }

    if(order_by != null) {
        if(order_by == 'nom_partenaire')
            query += ' ORDER BY nom_partenaire '        + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC') + ', tb.id_business_case DESC';

        else if(order_by == 'date_validation')
            query += ' ORDER BY tb.date_validation '    + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC');

        else if(order_by == 'date_realisation')
            query += ' ORDER BY tb.date_realisation '   + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC');
        
        else 
            query += ' ORDER BY tb.id_business_case '   + (type_tri != null && type_tri == 'ASC' ? type_tri : 'DESC');
    }
    else {
        query +=' ORDER BY tb.id_business_case DESC';
    }

    connection.query(query + ';',[
        bearer_content.id_utilisateur       ,
        bearer_content.role                 ,
        bearer_content.flag_medical         ,
        bearer_content.flag_pharmaceutique  ,
        id_partenaire                       ,
        nom_partenaire                      ,
        id_utilisateur                      ,
        code_statut_bc                      ,
        code_region
    ] , async (err, result) => {
        if (!err) {
            let business_cases = result[result.length-1];
            try {
                var dir = './temp_exports';
                if (!fs.existsSync(dir)){
                    fs.mkdirSync(dir);
                }

                const workbook = new excelJs.Workbook();  // Create a new workbook  
                const worksheet = workbook.addWorksheet("Investissements"); // New Worksheet  
                // Column for data in excel. key must match data key
                worksheet.columns = [    
                    { header: "Type Compte", key: "type_compte", width: 20 },
                    { header: "Nom Compte", key: "nom_partenaire", width: 20 },
                    { header: "Spécialité", key: "specialite", width: 20 },
                    { header: "Potentiel", key: "code_potentiel", width: 20 },
                    { header: "Date demande", key: "date_creation", width: 20 },
                    { header: "Nom demandeur", key: "nom_demandeur", width: 20 },
                    { header: "Date validation", key: "date_validation", width: 20 },
                    { header: "Nom validateur", key: "nom_validateur", width: 20 },
                    { header: "Date réalisation", key: "date_realisation", width: 20 },
                    { header: "Nom réalisateur", key: "nom_realisateur", width: 20 },
                    { header: "Type investissement", key: "type_investissement", width: 20 },
                    { header: "Document", key: "nom_document", width: 20 },
                    { header: "Status", key: "Status", width: 10 },
                ];
                // Looping through data
                business_cases.forEach((bc) => {  
                    worksheet.addRow(bc); // Add data in worksheet  
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
                        pattern:'solid',
                        fgColor:{argb:'00aa182d'},
                    };
                });
                try {  
                    const path = `${dir}/${Date.now()}.xlsx`;
                    const data = await workbook.xlsx.writeFile(path)   
                    .then(() => {     
                        res.download(path, "Investissements.xlsx", (err) => {
                            if (!err) {
                                fs.unlink(path, () => {});
                            }
                            else{
                                return res.status(500).json({message: "export download error"});
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