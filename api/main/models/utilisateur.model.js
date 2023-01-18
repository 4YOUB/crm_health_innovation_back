const que_tab_utilisateurs = `
SET @nom_utilisateur        = CONCAT('%',IFNULL(?,''),'%'),
    @role                   = ?,
    @email                  = CONCAT('%',IFNULL(?,''),'%'),
    @telephone              = CONCAT('%',IFNULL(?,''),'%'),
    @code_statut_utilisateur= ?,
    @code_gamme             = ?,
    @code_region            = ?;

SELECT  
    tu.id_utilisateur                                                       ,
    tu.id_responsable                                                       ,
    tu.role                                                                 ,
    tu.nom_utilisateur                                                      ,
    tu.prenom_utilisateur                                                   ,
    tu.email                                                                ,
    tu.login                                                                ,
    tu.telephone                                                            ,
    tu.flag_medical                                                         ,
    tu.flag_pharmaceutique                                                  ,
    tu.code_statut_utilisateur                                              ,
    tu.date_creation                                                        ,
    tu.date_desactivation                                                   ,
    tu.commentaire_desactivation                                            ,
    CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur)    AS nom_complet  ,
    IF(tu.role IN ('DRG','PM','ACH'),
        (SELECT CONCAT(tu1.nom_utilisateur,' ',tu1.prenom_utilisateur) FROM tab_utilisateur tu1
            WHERE tu1.role = 'DIR' LIMIT 1),
        (SELECT CONCAT(tu1.nom_utilisateur,' ',tu1.prenom_utilisateur) FROM tab_utilisateur tu1
            WHERE tu1.id_utilisateur = tu.id_responsable))  AS nom_responsable,
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
WHERE
    IF(@nom_utilisateur         IS NOT NULL, CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur), 1) LIKE IF(@nom_utilisateur IS NOT NULL, @nom_utilisateur, 1)
AND IF(@email                   IS NOT NULL, tu.email                   , 1) LIKE IF(@email                     IS NOT NULL, @email                     , 1)
AND IF(@telephone               IS NOT NULL, tu.telephone               , 1) LIKE IF(@telephone                 IS NOT NULL, @telephone                 , 1)
AND IF(@code_statut_utilisateur IS NOT NULL, tu.code_statut_utilisateur , 1)    = IF(@code_statut_utilisateur   IS NOT NULL, @code_statut_utilisateur   , 1)
AND IF(@role                    IS NOT NULL, tu.role                    , 1)    = IF(@role                      IS NOT NULL, @role                      , 1)
AND CASE
        WHEN @code_region IS NOT NULL THEN
            @code_region IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                WHERE tur.id_utilisateur = tu.id_utilisateur)
        ELSE 1 = 1
    END
AND CASE
        WHEN @code_gamme IS NOT NULL THEN
            @code_gamme IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                            WHERE tug.id_utilisateur = tu.id_utilisateur)
        ELSE 1 = 1
    END 
`

const que_tab_regions_gammes = `
SELECT  tur.id_utilisateur  ,
        tur.code_region     ,
        (SELECT libelle_codification FROM tab_par_codification
            WHERE type_codification = 'REGI' 
            AND code_codification   = tur.code_region)  AS libelle_codification
FROM    tab_utilisateur_region tur
WHERE   tur.flag_actif = 'O';

SELECT  tug.id_utilisateur  ,
        tug.code_gamme      ,
        (SELECT libelle_codification FROM tab_par_codification
            WHERE type_codification = 'GAMM' 
            AND code_codification   = tug.code_gamme)     AS libelle_codification
FROM    tab_utilisateur_gamme tug
WHERE   tug.flag_actif = 'O';
`

const que_get_nbr_tab_utilisateurs = `
SET @nom_utilisateur        = CONCAT('%',IFNULL(?,''),'%'),
    @role                   = ?,
    @email                  = CONCAT('%',IFNULL(?,''),'%'),
    @telephone              = CONCAT('%',IFNULL(?,''),'%'),
    @code_statut_utilisateur= ?,
    @code_gamme             = ?,
    @code_region            = ?;

SELECT  COUNT(0) AS nbr_total_utilisateurs
FROM    tab_utilisateur tu
WHERE
    IF(@nom_utilisateur         IS NOT NULL, CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur), 1) LIKE IF(@nom_utilisateur IS NOT NULL, @nom_utilisateur, 1)
AND IF(@email                   IS NOT NULL, tu.email                   , 1) LIKE IF(@email                     IS NOT NULL, @email                     , 1)
AND IF(@telephone               IS NOT NULL, tu.telephone               , 1) LIKE IF(@telephone                 IS NOT NULL, @telephone                 , 1)
AND IF(@code_statut_utilisateur IS NOT NULL, tu.code_statut_utilisateur , 1)    = IF(@code_statut_utilisateur   IS NOT NULL, @code_statut_utilisateur   , 1)
AND IF(@role                    IS NOT NULL, tu.role                    , 1)    = IF(@role                      IS NOT NULL, @role                      , 1)
AND CASE
        WHEN @code_region IS NOT NULL THEN
            @code_region IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                WHERE tur.id_utilisateur = tu.id_utilisateur)
        ELSE 1 = 1
    END
AND CASE
    WHEN @code_gamme IS NOT NULL THEN
        @code_gamme IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                        WHERE tug.id_utilisateur = tu.id_utilisateur)
    ELSE 1 = 1
END;
`

const que_get_tab_responsables = `
SET @role           = ?,
    @id_utilisateur = ?;

SELECT 
    DISTINCT(tu.id_utilisateur) ,
    tu.role                     ,
    CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur) AS nom_utilisateur
FROM
    tab_utilisateur tu
WHERE
    tu.role = 'DIR'

UNION ALL

SELECT
    DISTINCT(tu.id_utilisateur) ,
    tu.role                     ,
    CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur) AS nom_utilisateur
FROM
    tab_utilisateur tu
LEFT JOIN
    tab_utilisateur_region  tur ON tur.id_utilisateur = tu.id_utilisateur
LEFT JOIN
    tab_utilisateur_gamme   tug ON tug.id_utilisateur = tu.id_utilisateur
WHERE
    tu.id_utilisateur <> @id_utilisateur
AND
    (
            (@role = 'DEL' AND tu.role IN ('KAM','DSM','DRG'))
        OR
            (@role = 'KAM' AND tu.role IN ('DSM','DRG'))
        OR
            (@role = 'DSM' AND tu.role  = 'DRG')
    )
`

const que_ajouter_utilisateur = `
SET @id_responsable         = ?,
    @nom_utilisateur        = ?,
    @prenom_utilisateur     = ?,
    @role                   = ?,
    @telephone              = ?,
    @email                  = ?,
    @login                  = ?,
    @password               = ?,
    @flag_medical           = ?,
    @flag_pharmaceutique    = ?,
    @flag_export = ?,
    @flag_reporting = ?
    ;

INSERT INTO tab_utilisateur (
    nom_utilisateur         ,
    prenom_utilisateur      ,
    code_statut_utilisateur ,
    role                    ,
    telephone               ,
    email                   ,
    login                   ,
    password                ,
    id_responsable          ,
    flag_medical            ,
    flag_pharmaceutique,
    flag_export,
    flag_reporting
)
VALUES (
    @nom_utilisateur        ,
    @prenom_utilisateur     ,
    'ACTI'                  ,
    @role                   ,
    @telephone              ,
    @email                  ,
    @login                  ,
    md5(@password)          ,
    IF(@role NOT IN ('ADMI','DIR','PM','ACH'),IF(@role = 'DRG',(SELECT  tu.id_utilisateur FROM tab_utilisateur tu
                                                                WHERE   tu.role = 'DIR'),
                                                    @id_responsable),NULL)                                              ,
    IF(@role IN ('ADMI','DIR','PM','ACH'),'O',@flag_medical)                                                            ,
    IF(@role IN ('ADMI','DIR','PM'),'O',IF(@role = 'ACH','N',@flag_pharmaceutique)),
    @flag_export,
    @flag_reporting
);
SELECT  LAST_INSERT_ID()                                                                            AS id_utilisateur   ,
        (CONCAT(@nom_utilisateur,' ',IF(@prenom_utilisateur IS NOT NULL,@prenom_utilisateur,'')))   AS nom_utilisateur  ;
`

const que_add_utilisateur_region = `
SET @id_utilisateur = ?,
    @code_region    = ?;

IF (EXISTS(SELECT 1 FROM tab_utilisateur_region tur
    WHERE   tur.code_region     = @code_region
    AND     tur.id_utilisateur  = @id_utilisateur LIMIT 1)) THEN
    
    UPDATE  tab_utilisateur_region
    SET     flag_actif      = 'O'
    WHERE   id_utilisateur  = id_utilisateur
    AND     code_region     = @code_region;

ELSE
    INSERT INTO tab_utilisateur_region (
        id_utilisateur      ,
        flag_actif          ,
        code_region
    )
    VALUES (    
        @id_utilisateur     ,
        'O'                 ,
        @code_region 
    );
END IF;
`

const que_add_utilisateur_gamme = `
SET @id_utilisateur = ?,
    @code_gamme     = ?;

IF (EXISTS(SELECT 1 FROM tab_utilisateur_gamme tug
    WHERE   tug.code_gamme      = @code_gamme
    AND     tug.id_utilisateur  = @id_utilisateur LIMIT 1)) THEN
    
    UPDATE  tab_utilisateur_gamme
    SET     flag_actif      = 'O'
    WHERE   id_utilisateur  = id_utilisateur
    AND     code_gamme      = @code_gamme;

ELSE
    INSERT INTO tab_utilisateur_gamme (
        id_utilisateur      ,
        flag_actif          ,
        code_gamme
    )
    VALUES (    
        @id_utilisateur     ,
        'O'                 ,
        @code_gamme
    );
END IF;
`

const que_add_up_utilisateur_permission = `
SET @id_utilisateur = ?,
    @export_comptes = ?,
    @export_planifications = ?,
    @export_visites = ?,
    @export_investissements = ?,
    @export_rapports_planification = ?,
    @export_evenement = ?,
    @export_rapport_visite = ?,
    @export_taux_couverture = ?,
    @export_delegues = ?,
    @export_utilisateurs = ?,
    @reporting_visite_planification = ?,
    @reporting_taux_freq_couverture = ?
    ;

IF (EXISTS(SELECT * FROM tab_utilisateur_permission tup
    WHERE tup.id_utilisateur  = @id_utilisateur)) THEN

    UPDATE
    tab_utilisateur_permission
    SET
        export_comptes = @export_comptes,
        export_planifications = @export_planifications,  
        export_visites = @export_visites,  
        export_investissements = @export_investissements,  
        export_rapports_planification = @export_rapports_planification,      
        export_evenement = @export_evenement,
        export_rapport_visite = @export_rapport_visite,  
        export_taux_couverture = @export_taux_couverture,  
        export_delegues = @export_delegues,
        export_utilisateurs = @export_utilisateurs,
        reporting_visite_planification = @reporting_visite_planification,  
        reporting_taux_freq_couverture = @reporting_taux_freq_couverture 
    WHERE
        id_utilisateur = @id_utilisateur;

ELSE

    INSERT INTO tab_utilisateur_permission(
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
    )
    VALUES(
        @id_utilisateur,
        @export_comptes,
        @export_planifications,
        @export_visites,
        @export_investissements,
        @export_rapports_planification,
        @export_evenement,
        @export_rapport_visite,
        @export_taux_couverture,
        @export_delegues,
        @export_utilisateurs,
        @reporting_visite_planification,
        @reporting_taux_freq_couverture
    );


END IF;
`

const que_modifier_utilisateur = `
SET @id_utilisateur     = ?,
    @id_responsable     = ?,
    @nom_utilisateur    = ?,
    @prenom_utilisateur = ?,
    @role               = ?,
    @telephone          = ?,
    @email              = ?,
    @login              = ?,
    @password           = ?,
    @flag_medical       = ?,
    @flag_pharmaceutique= ?,
    @flag_export = ?,
    @flag_reporting = ?
    ;

UPDATE tab_utilisateur 
SET
    nom_utilisateur         = @nom_utilisateur          ,
    prenom_utilisateur      = @prenom_utilisateur       ,
    role                    = @role                     ,
    telephone               = @telephone                ,
    email                   = @email                    ,
    login                   = @login                    ,
    password                = IF(@password IS NULL, (SELECT tu.password FROM tab_utilisateur tu
                                                        WHERE tu.id_utilisateur = @id_utilisateur)              ,
                                md5(@password))                                                                 ,
    id_responsable          = IF(@role NOT IN ('ADMI','DIR','PM','ACH'),
                                    IF(@role = 'DRG',(  SELECT  tu.id_utilisateur FROM tab_utilisateur tu
                                                        WHERE   tu.role = 'DIR'),
                                                    @id_responsable
                                        ),
                                NULL)                                                                           ,
    flag_medical            = IF(@role IN ('ADMI','DIR','PM','ACH') ,'O',@flag_medical)                         ,
    flag_pharmaceutique     = IF(@role IN ('ADMI','DIR','PM'),'O',IF(@role = 'ACH','N',@flag_pharmaceutique)),
    flag_export     =    @flag_export,
    flag_reporting  =    @flag_reporting
WHERE
    id_utilisateur          = @id_utilisateur           ;
`

const que_desactivate_utilisateur_region = `
UPDATE  tab_utilisateur_region
SET     flag_actif      = 'N'
WHERE   id_utilisateur  = ?;
`

const que_desactivate_utilisateur_gamme = `
UPDATE  tab_utilisateur_gamme
SET     flag_actif      = 'N'
WHERE   id_utilisateur = ?;
`

const que_get_role_regions_gammes = `
SET @id_utilisateur = ?,
    @resultat         = NULL;

IF (SELECT tu1.role FROM tab_utilisateur tu1 WHERE tu1.id_utilisateur = @id_utilisateur) <> 'DEL' AND
    EXISTS(SELECT  tu.id_utilisateur
            FROM    tab_utilisateur tu
            LEFT JOIN
                    tab_utilisateur_region tur ON tu.id_utilisateur = tur.id_utilisateur
            LEFT JOIN
                    tab_utilisateur_gamme  tug ON tu.id_utilisateur = tug.id_utilisateur
            WHERE   tu.id_utilisateur <> @id_utilisateur
            AND     tu.code_statut_utilisateur = 'ACTI'
            AND     tu.role = (SELECT tu1.role FROM tab_utilisateur tu1 WHERE tu1.id_utilisateur = @id_utilisateur)
            AND     tur.code_region IN (SELECT tur1.code_region FROM tab_utilisateur_region tur1
                                            WHERE   tur1.id_utilisateur = @id_utilisateur
                                            AND     tur1.flag_actif     = 'O')
            AND     tug.code_gamme IN (SELECT tug1.code_gamme FROM tab_utilisateur_gamme tug1
                                        WHERE   tug1.id_utilisateur = @id_utilisateur
                                        AND     tug1.flag_actif     = 'O')
            AND     tur.flag_actif = 'O'
            AND     tug.flag_actif = 'O') THEN
        
    SELECT 'ko' INTO @resultat;
ELSE
    SELECT 'ok' INTO @resultat;
END IF;

SELECT  @resultat AS resultat;
`

const que_get_infos_utilisateur = `
SELECT  role             ,
        CONCAT(tu.nom_utilisateur,' ',IF(tu.prenom_utilisateur IS NOT NULL,tu.prenom_utilisateur,'')) AS nom_utilisateur
FROM    tab_utilisateur tu
WHERE   tu.id_utilisateur = ?;
`

const que_activer_utilisateur = `
UPDATE  tab_utilisateur
SET     code_statut_utilisateur = 'ACTI'
WHERE   id_utilisateur = ?;
`

const que_desactiver_utilisateur = `
UPDATE  tab_utilisateur
SET     code_statut_utilisateur = 'DESA'
WHERE   id_utilisateur = ?;
`

const que_add_historique_utilisateur = `
SET @id_utilisateur = ?,
    @commentaire    = ?;
    
INSERT INTO tab_utilisateur_historique (
    id_utilisateur      ,
    commentaire
)
VALUES (
    @id_utilisateur     ,
    @commentaire
);
`

const que_tab_delegues = `
SET @token_id               = ?,
    @token_role             = ?,
    @token_medical          = ?,
    @token_pharmaceutique   = ?,
    @nom_utilisateur        = CONCAT('%',IFNULL(?,''),'%'),
    @role                   = ?,
    @email                  = CONCAT('%',IFNULL(?,''),'%'),
    @telephone              = CONCAT('%',IFNULL(?,''),'%'),
    @code_region            = ?;

SELECT  
    tu.id_utilisateur                                                               ,
    tu.role                                                                         ,
    tu.email                                                                        ,
    tu.login                                                                        ,
    tu.telephone                                                                    ,
    tu.flag_medical                                                                 ,
    tu.flag_pharmaceutique                                                          ,
    CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur)    AS nom_utilisateur      ,
    (SELECT COUNT(0) FROM tab_visite tpv
        WHERE   tpv.code_statut_visite <> 'SUPP'  
        AND     tpv.id_utilisateur = tu.id_utilisateur
        AND     code_statut_visite IN ('REAL','ABSE'))      AS nbr_visites          ,
    (SELECT COUNT(DISTINCT(Date(tpv.date_visite))) FROM tab_visite tpv 
        WHERE tpv.id_utilisateur  = tu.id_utilisateur
        AND tpv.code_type_visite = 'PLAN')      AS nbr_planifications   ,
    (SELECT COUNT(0) FROM tab_partenaire_bc tb
        WHERE   tb.id_utilisateur  = tu.id_utilisateur)     AS nbr_investissements  ,
    (SELECT CONCAT(tu1.nom_utilisateur,' ',tu1.prenom_utilisateur)
        FROM    tab_utilisateur tu1
        WHERE   tu1.id_utilisateur = tu.id_responsable)     AS nom_responsable      ,
    (SELECT tu1.role
        FROM    tab_utilisateur tu1
        WHERE   tu1.id_utilisateur = tu.id_responsable)     AS role_responsable
FROM tab_utilisateur tu
LEFT JOIN tab_utilisateur_gamme tug ON tu.id_utilisateur = tug.id_utilisateur
WHERE
    tu.code_statut_utilisateur = 'ACTI'
AND IF(@nom_utilisateur         IS NOT NULL, CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur), 1) LIKE IF(@nom_utilisateur IS NOT NULL, @nom_utilisateur, 1)
AND IF(@email                   IS NOT NULL, tu.email                   , 1) LIKE IF(@email                     IS NOT NULL, @email                     , 1)
AND IF(@telephone               IS NOT NULL, tu.telephone               , 1) LIKE IF(@telephone                 IS NOT NULL, @telephone                 , 1)
AND IF(@role                    IS NOT NULL, tu.role                    , 1)    = IF(@role                      IS NOT NULL, @role                      , 1)
AND (
        (@token_role = 'KAM'    AND tu.role = 'DEL')
        OR
        (@token_role = 'DSM'    AND tu.role IN ('DEL','KAM'))
        OR
        (@token_role = 'DRG'    AND tu.role IN ('DEL','KAM','DSM'))
        OR
        (@token_role = 'DIR'    AND tu.role NOT IN ('ADMI','DIR') AND tu.id_utilisateur <> @token_id)
        OR
        (@token_role = 'PM'     AND tu.role NOT IN ('ADMI','PM') AND tu.id_utilisateur <> @token_id)
        OR
        (@token_role = 'ADMI'   AND tu.id_utilisateur <> @token_id)
    )
AND CASE
        WHEN @token_role NOT IN ('ADMI','DIR','PM') THEN
                tu.id_responsable = @token_id
            OR
                tu.id_utilisateur  IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                            WHERE tu1.id_responsable IN (
                                                SELECT tu2.id_utilisateur FROM tab_utilisateur tu2
                                                                            WHERE tu2.id_responsable = @token_id)
                                        )
            OR
                tu.id_utilisateur  IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                            WHERE tu1.id_responsable IN (
                                                                            SELECT  tu2.id_utilisateur FROM tab_utilisateur tu2
                                                                            WHERE   tu2.id_responsable IN (
                                                                                        SELECT  tu3.id_utilisateur FROM tab_utilisateur tu3
                                                                                        WHERE   tu3.id_responsable = @token_id
                                                                                    )
                                                                        )
                                        )  
        ELSE
            1 = 1
    END
AND CASE
        WHEN @code_region IS NOT NULL THEN
            @code_region IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                WHERE   tur.id_utilisateur  = tu.id_utilisateur
                                AND     tur.flag_actif      = 'O')
        ELSE 
            1 = 1
    END  
`

const que_get_nbr_tab_delegues = `
SET @token_id               = ?,
    @token_role             = ?,
    @token_medical          = ?,
    @token_pharmaceutique   = ?,
    @nom_utilisateur        = CONCAT('%',IFNULL(?,''),'%'),
    @role                   = ?,
    @email                  = CONCAT('%',IFNULL(?,''),'%'),
    @telephone              = CONCAT('%',IFNULL(?,''),'%'),
    @code_region            = ?;

SELECT COUNT(DISTINCT(tu.id_utilisateur)) AS nbr_total_delegues
FROM tab_utilisateur tu
LEFT JOIN tab_utilisateur_gamme tug     ON tu.id_utilisateur = tug.id_utilisateur
WHERE
    tu.code_statut_utilisateur = 'ACTI'
AND IF(@nom_utilisateur         IS NOT NULL, CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur), 1) LIKE IF(@nom_utilisateur IS NOT NULL, @nom_utilisateur, 1)
AND IF(@email                   IS NOT NULL, tu.email                   , 1) LIKE IF(@email                     IS NOT NULL, @email                     , 1)
AND IF(@telephone               IS NOT NULL, tu.telephone               , 1) LIKE IF(@telephone                 IS NOT NULL, @telephone                 , 1)
AND IF(@role                    IS NOT NULL, tu.role                    , 1)    = IF(@role                      IS NOT NULL, @role                      , 1)
AND (
            (@token_role = 'KAM' AND tu.role = 'DEL')
        OR
            (@token_role = 'DSM' AND tu.role IN ('DEL','KAM'))
        OR
            (@token_role = 'DRG' AND tu.role IN ('DEL','KAM','DSM'))
        OR
            (@token_role IN ('DIR','PM') AND tu.role NOT IN ('ADMI','DIR') AND tu.id_utilisateur <> @token_id)
        OR
            (@token_role = 'ADMI' AND tu.id_utilisateur <> @token_id)
    )
AND CASE
        WHEN @token_role NOT IN ('ADMI','DIR','PM') THEN
                tu.id_responsable = @token_id
            OR
                tu.id_utilisateur  IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                            WHERE tu1.id_responsable IN (
                                                SELECT tu2.id_utilisateur FROM tab_utilisateur tu2
                                                                            WHERE tu2.id_responsable = @token_id)
                                        )
            OR
                tu.id_utilisateur  IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                            WHERE tu1.id_responsable IN (
                                                                            SELECT  tu2.id_utilisateur FROM tab_utilisateur tu2
                                                                            WHERE   tu2.id_responsable IN (
                                                                                        SELECT  tu3.id_utilisateur FROM tab_utilisateur tu3
                                                                                        WHERE   tu3.id_responsable = @token_id
                                                                                    )
                                                                        )
                                        )  
        ELSE
            1 = 1
    END
AND CASE
        WHEN @code_region IS NOT NULL THEN
            @code_region IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                WHERE   tur.id_utilisateur  = tu.id_utilisateur
                                AND     tur.flag_actif      = 'O')
        ELSE 
            1 = 1
    END  
`

const que_tab_historique_utilisateur = `
SET @id_utilisateur  = ?;

SELECT  
    tuh.id_utilisateur  ,
    tuh.commentaire     ,
    tuh.date_creation
FROM    
    tab_utilisateur_historique tuh
WHERE 
    tuh.id_utilisateur = @id_utilisateur 
`

const que_get_nbr_tab_historique_utilisateur = `
SET     @id_utilisateur  = ?;

SELECT  COUNT(0) AS nbr_total_historique
FROM    tab_utilisateur_historique tuh
WHERE   tuh.id_utilisateur = @id_utilisateur 
`

const que_get_gammes_utilisateur = `
SET     @token_id           = ?,
        @token_role         = ?,
        @id_utilisateur     = ?,
        @role_utilisateur   = ?;

SELECT  DISTINCT(tpc.code_codification)
FROM    tab_par_codification tpc
LEFT JOIN
        tab_utilisateur_gamme tug ON tpc.code_codification = tug.code_gamme
WHERE  
    tpc.type_codification = 'GAMM'
AND 
    CASE
        WHEN @id_utilisateur IS NOT NULL AND @role_utilisateur IS NOT NULL AND @role_utilisateur NOT IN ('ADMI','DIR','PM','ACH') THEN
                tug.id_utilisateur  = @id_utilisateur
            AND
                tug.flag_actif      = 'O'
        WHEN @id_utilisateur IS NULL AND @role_utilisateur IS NULL AND @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN
                tug.id_utilisateur  = @token_id
            AND
                tug.flag_actif      = 'O'
        ELSE
            1 = 1
    END;
`

const que_export_delegues = `
SET @token_id               = ?,
    @token_role             = ?,
    @token_medical          = ?,
    @token_pharmaceutique   = ?,
    @nom_utilisateur        = CONCAT('%',IFNULL(?,''),'%'),
    @role                   = ?,
    @email                  = CONCAT('%',IFNULL(?,''),'%'),
    @telephone              = CONCAT('%',IFNULL(?,''),'%'),
    @code_region            = ?;

SELECT  
    tu.id_utilisateur                                                               ,
    tu.role                                                                         ,
    tu.email                                                                        ,
    tu.login                                                                        ,
    tu.telephone                                                                    ,
    tu.flag_medical                                                                 ,
    tu.flag_pharmaceutique                                                          ,
    CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur)    AS nom_utilisateur      ,
    (SELECT COUNT(0) FROM tab_visite tpv
        WHERE   tpv.code_statut_visite <> 'SUPP'  
        AND     tpv.id_utilisateur = tu.id_utilisateur
        AND     code_statut_visite IN ('REAL','ABSE'))      AS nbr_visites          ,
    (SELECT COUNT(DISTINCT(Date(tpv.date_visite))) FROM tab_visite tpv 
    WHERE tpv.id_utilisateur  = tu.id_utilisateur
    AND tpv.code_type_visite = 'PLAN')      AS nbr_planifications   ,
    (SELECT COUNT(0) FROM tab_partenaire_bc tb
        WHERE   tb.id_utilisateur  = tu.id_utilisateur)     AS nbr_investissements  ,
    (SELECT CONCAT(tu1.nom_utilisateur,' ',tu1.prenom_utilisateur)
        FROM    tab_utilisateur tu1
        WHERE   tu1.id_utilisateur = tu.id_responsable)     AS nom_responsable      ,
    (SELECT tu1.role
        FROM    tab_utilisateur tu1
        WHERE   tu1.id_utilisateur = tu.id_responsable)     AS role_responsable
FROM tab_utilisateur tu
LEFT JOIN tab_utilisateur_gamme tug ON tu.id_utilisateur = tug.id_utilisateur
WHERE
    tu.code_statut_utilisateur = 'ACTI'
AND IF(@nom_utilisateur         IS NOT NULL, CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur), 1) LIKE IF(@nom_utilisateur IS NOT NULL, @nom_utilisateur, 1)
AND IF(@email                   IS NOT NULL, tu.email                   , 1) LIKE IF(@email                     IS NOT NULL, @email                     , 1)
AND IF(@telephone               IS NOT NULL, tu.telephone               , 1) LIKE IF(@telephone                 IS NOT NULL, @telephone                 , 1)
AND IF(@role                    IS NOT NULL, tu.role                    , 1)    = IF(@role                      IS NOT NULL, @role                      , 1)
AND (
        (@token_role = 'KAM'    AND tu.role = 'DEL')
        OR
        (@token_role = 'DSM'    AND tu.role IN ('DEL','KAM'))
        OR
        (@token_role = 'DRG'    AND tu.role IN ('DEL','KAM','DSM'))
        OR
        (@token_role = 'DIR'    AND tu.role NOT IN ('ADMI','DIR') AND tu.id_utilisateur <> @token_id)
        OR
        (@token_role = 'PM'     AND tu.role NOT IN ('ADMI','PM') AND tu.id_utilisateur <> @token_id)
        OR
        (@token_role = 'ADMI'   AND tu.id_utilisateur <> @token_id)
    )
AND CASE
        WHEN @token_role NOT IN ('ADMI','DIR','PM') THEN
                tu.id_responsable = @token_id
            OR
                tu.id_utilisateur  IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                            WHERE tu1.id_responsable IN (
                                                SELECT tu2.id_utilisateur FROM tab_utilisateur tu2
                                                                            WHERE tu2.id_responsable = @token_id)
                                        )
            OR
                tu.id_utilisateur  IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                            WHERE tu1.id_responsable IN (
                                                                            SELECT  tu2.id_utilisateur FROM tab_utilisateur tu2
                                                                            WHERE   tu2.id_responsable IN (
                                                                                        SELECT  tu3.id_utilisateur FROM tab_utilisateur tu3
                                                                                        WHERE   tu3.id_responsable = @token_id
                                                                                    )
                                                                        )
                                        )  
        ELSE
            1 = 1
    END
AND CASE
        WHEN @code_region IS NOT NULL THEN
            @code_region IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                WHERE   tur.id_utilisateur  = tu.id_utilisateur
                                AND     tur.flag_actif      = 'O')
        ELSE 
            1 = 1
    END  
`

module.exports = {
    que_tab_utilisateurs,
    que_tab_regions_gammes,
    que_get_nbr_tab_utilisateurs,
    que_get_tab_responsables,
    que_ajouter_utilisateur,
    que_add_utilisateur_region,
    que_add_utilisateur_gamme,
    que_modifier_utilisateur,
    que_desactivate_utilisateur_region,
    que_desactivate_utilisateur_gamme,
    que_get_role_regions_gammes,
    que_get_infos_utilisateur,
    que_activer_utilisateur,
    que_desactiver_utilisateur,
    que_add_historique_utilisateur,
    que_tab_delegues,
    que_get_nbr_tab_delegues,
    que_tab_historique_utilisateur,
    que_get_nbr_tab_historique_utilisateur,
    que_get_gammes_utilisateur,
    que_export_delegues,
    que_add_up_utilisateur_permission
}