module.exports = {
    que_authentification: `
        SELECT 
            tu.telephone                   ,  
            tu.nom_utilisateur             ,  
            tu.prenom_utilisateur          ,
            CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur) AS nom_prenom,
            tu.id_utilisateur              ,  
            tu.code_statut_utilisateur     ,
            tu.role                        ,
            tu.login                       ,
            tu.flag_medical                ,
            tu.flag_pharmaceutique,
            tu.flag_export,
            tu.flag_reporting,
            tup.export_comptes,
            tup.export_planifications,
            tup.export_visites,
            tup.export_investissements,
            tup.export_rapports_planification,
            tup.export_evenement,
            tup.export_rapport_visite,
            tup.export_taux_couverture,
            tup.export_delegues,
            tup.export_utilisateurs,
            tup.reporting_visite_planification,
            tup.reporting_taux_freq_couverture
        FROM    
            tab_utilisateur tu
        LEFT JOIN
            tab_utilisateur_permission  tup ON tup.id_utilisateur = tu.id_utilisateur
        WHERE   login                     = ?
        AND     password                  = md5(?)
        AND     code_statut_utilisateur   = 'ACTI';
    `,

    que_activation_utilisateur: `
        SELECT  code_statut_utilisateur
        FROM    tab_utilisateur
        WHERE   id_utilisateur = ?;
    `

}