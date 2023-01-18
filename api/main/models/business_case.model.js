const que_tab_business_cases = `
SET @token_id               = ?,
    @token_role             = ?,
    @token_medical          = ?,
    @token_pharmaceutique   = ?,
    @id_partenaire          = ?,
    @nom_partenaire         = CONCAT('%',IFNULL(?,''),'%'),
    @id_utilisateur         = ?,
    @code_statut_bc         = ?,
    @code_region            = ?;

SELECT
    tb.id_business_case         ,
    tb.id_utilisateur           ,
    tp.id_partenaire            ,
    tp.code_potentiel           ,
    tb.description              ,
    tb.date_creation            ,
    tb.date_validation          ,
    tb.date_realisation         ,
    tb.code_type_investissement ,
    tb.destination              ,
    tb.objet_investissement     ,
    tb.code_statut_bc           ,
    tp.code_specialite          ,
    UPPER(CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,''))  )        AS nom_partenaire       ,
    (SELECT CONCAT(tu.nom_utilisateur, ' ', tu.prenom_utilisateur) FROM tab_utilisateur tu 
        WHERE tu.id_utilisateur = tb.id_utilisateur)                                                    AS nom_demandeur        ,
    (SELECT CONCAT(tu.nom_utilisateur, ' ', tu.prenom_utilisateur) FROM tab_utilisateur tu 
        WHERE tu.id_utilisateur = tb.id_user_validation)                                                AS nom_validateur       ,
    (SELECT CONCAT(tu.nom_utilisateur, ' ', tu.prenom_utilisateur) FROM tab_utilisateur tu 
        WHERE tu.id_utilisateur = tb.id_user_realisation)                                               AS nom_realisateur      ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'SPEC' AND code_codification = tp.code_specialite LIMIT 1)            AS specialite           ,
    (SELECT CONCAT(td.cle_document,'.',td.extension_document) FROM tab_document td
        WHERE td.id_objet = tb.id_business_case AND td.code_objet = 'BC' LIMIT 1)                       AS intitule_document    ,
    (SELECT nom_document FROM tab_document td
        WHERE td.id_objet = tb.id_business_case AND code_objet = 'BC' LIMIT 1)                          AS nom_document         ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'TYIN' AND code_codification = tb.code_type_investissement LIMIT 1)   AS type_investissement
FROM 
    tab_partenaire_bc tb
LEFT JOIN
    tab_partenaire tp ON tp.id_partenaire = tb.id_partenaire
WHERE
    1 = 1
AND IF(@nom_partenaire  IS NOT NULL, CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,'')) , 1) LIKE IF(@nom_partenaire    IS NOT NULL, @nom_partenaire    , 1)
AND IF(@id_partenaire   IS NOT NULL, tb.id_partenaire   , 1) = IF(@id_partenaire     IS NOT NULL, @id_partenaire     , 1)
AND IF(@code_statut_bc  IS NOT NULL, tb.code_statut_bc  , 1) = IF(@code_statut_bc    IS NOT NULL, @code_statut_bc    , 1)
AND IF(@id_utilisateur  IS NOT NULL, tb.id_utilisateur  , 1) = IF(@id_utilisateur    IS NOT NULL, @id_utilisateur    , 1)
AND CASE
        WHEN @code_region IS NOT NULL THEN
            tb.id_partenaire IN (SELECT tp.id_partenaire FROM tab_partenaire tp WHERE tp.code_region_partenaire = @code_region)
        ELSE 1 = 1
    END
AND CASE
        WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN
                tb.id_utilisateur  = @token_id 
            OR
                tb.id_responsable  = @token_id
            OR
                tb.id_utilisateur  IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                            WHERE tu1.id_responsable IN (
                                                SELECT tu2.id_utilisateur FROM tab_utilisateur tu2
                                                                            WHERE tu2.id_responsable = @token_id)
                                        )
            OR
                tb.id_utilisateur  IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                            WHERE tu1.id_responsable IN (
                                                                            SELECT  tu2.id_utilisateur FROM tab_utilisateur tu2
                                                                            WHERE   tu2.id_responsable IN (
                                                                                        SELECT  tu3.id_utilisateur FROM tab_utilisateur tu3
                                                                                        WHERE   tu3.id_responsable = @token_id
                                                                                    )
                                                                        )
                                        )
        WHEN @token_role = 'ACH' THEN
            tb.code_statut_bc IN ('VALI','REAL')
        ELSE
            1 = 1
    END
`

const que_nbr_tab_business_cases = `
SET @token_id               = ?,
    @token_role             = ?,
    @token_medical          = ?,
    @token_pharmaceutique   = ?,
    @id_partenaire          = ?,
    @nom_partenaire         = CONCAT('%',IFNULL(?,''),'%'),
    @id_utilisateur         = ?,
    @code_statut_bc         = ?,
    @code_region            = ?;

SELECT  COUNT(0) AS nbr_total_business_cases
FROM    tab_partenaire_bc tb
LEFT JOIN
    tab_partenaire tp ON tp.id_partenaire = tb.id_partenaire
    WHERE
    1 = 1
AND IF(@nom_partenaire  IS NOT NULL, CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,'')) , 1) LIKE IF(@nom_partenaire    IS NOT NULL, @nom_partenaire    , 1)
AND IF(@id_partenaire   IS NOT NULL, tb.id_partenaire                                   , 1)    = IF(@id_partenaire     IS NOT NULL, @id_partenaire     , 1)
AND IF(@code_statut_bc  IS NOT NULL, tb.code_statut_bc                                  , 1)    = IF(@code_statut_bc    IS NOT NULL, @code_statut_bc    , 1)
AND IF(@id_utilisateur  IS NOT NULL, tb.id_utilisateur                                  , 1)    = IF(@id_utilisateur    IS NOT NULL, @id_utilisateur    , 1)
AND CASE
        WHEN @code_region IS NOT NULL THEN
            tb.id_partenaire IN (SELECT tp.id_partenaire FROM tab_partenaire tp WHERE tp.code_region_partenaire = @code_region)
        ELSE 1 = 1
    END
AND CASE
        WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN
                tb.id_utilisateur  = @token_id 
            OR
                tb.id_responsable  = @token_id
            OR
                tb.id_utilisateur  IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                            WHERE tu1.id_responsable IN (
                                                SELECT tu2.id_utilisateur FROM tab_utilisateur tu2
                                                                            WHERE tu2.id_responsable = @token_id)
                                        )
            OR
                tb.id_utilisateur  IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                            WHERE tu1.id_responsable IN (
                                                                            SELECT  tu2.id_utilisateur FROM tab_utilisateur tu2
                                                                            WHERE   tu2.id_responsable IN (
                                                                                        SELECT  tu3.id_utilisateur FROM tab_utilisateur tu3
                                                                                        WHERE   tu3.id_responsable = @token_id
                                                                                    )
                                                                        )
                                        )
        WHEN @token_role = 'ACH' THEN
            tb.code_statut_bc IN ('VALI','REAL')
        ELSE
            1 = 1
    END 
`

const que_add_business_case = `
SET @token_id                   = ?,
    @token_role                 = ?,
    @token_medical              = ?,
    @token_pharmaceutique       = ?,
    @id_partenaire              = ?,
    @nom_beneficiaire           = ?,
    @rib_beneficiaire           = ?,
    @code_type_investissement   = ?,
    @description                = ?,
    @budget                     = ?,
    @destination                = ?,
    @objet_investissement       = ?,
    @code_region_partenaire     = NULL,
    @code_type_partenaire       = NULL,
    @code_gamme_partenaire      = NULL;

IF (SELECT tp.code_statut_partenaire FROM tab_partenaire tp
        WHERE tp.id_partenaire = @id_partenaire) = 'VALI' THEN 

    SELECT  tp.code_region_partenaire, tp.code_type_partenaire INTO @code_region_partenaire, @code_type_partenaire
    FROM    tab_partenaire tp
    WHERE   tp.id_partenaire = @id_partenaire;

    SELECT  code_parent INTO @code_gamme_partenaire
    FROM    tab_par_codification
    WHERE   type_codification = 'SPEC'
    AND     code_codification = (SELECT tp.code_specialite FROM tab_partenaire tp
                                    WHERE tp.id_partenaire = @id_partenaire)
    AND     type_parent       = 'GAMM';

    INSERT INTO tab_partenaire_bc (
        id_utilisateur              ,
        id_partenaire               ,
        code_region_partenaire      ,
        code_type_partenaire        ,
        code_gamme_partenaire       ,
        role_utilisateur            ,
        flag_medical                ,
        flag_pharmaceutique         ,
        nom_beneficiaire            ,
        rib_beneficiaire            ,
        code_statut_bc              ,
        code_type_investissement    ,
        description                 ,
        budget                      ,
        destination                 ,
        objet_investissement        ,
        id_responsable
    )
    VALUES (
        @token_id                   ,
        @id_partenaire              ,
        @code_region_partenaire     ,
        @code_type_partenaire       ,
        @code_gamme_partenaire      ,
        @token_role                 ,
        @token_medical              ,
        @token_pharmaceutique       ,
        @nom_beneficiaire           ,
        @rib_beneficiaire           ,
        'ENAT'                      ,
        @code_type_investissement   ,
        @description                ,
        @budget                     ,
        @destination                ,
        @objet_investissement       ,
        (SELECT tu.id_responsable FROM tab_utilisateur tu WHERE tu.id_utilisateur = @token_id)
    );

    SELECT 'ok' INTO @done;

    SELECT  LAST_INSERT_ID() AS id_business_case,
            (SELECT UPPER(CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,'')))
            FROM    tab_partenaire tp
            WHERE   tp.id_partenaire = @id_partenaire) AS nom_partenaire;

ELSE
    SELECT 'ko' INTO @done;
END IF; 

SELECT @done AS done;
`

const que_add_document_bc = `
UPDATE  tab_document
SET     code_objet  = 'BC'  ,
        id_objet    = ?     ,
        nom_document= ?
WHERE   id_document = ?     ;
`

const que_del_document_bc = `
DELETE FROM tab_document
WHERE   code_objet  = 'BC'
AND     id_objet    = ?
AND     id_document <> ?;
`

const que_get_fiche_business_case = `
SELECT
    tb.id_business_case         ,
    tb.id_utilisateur           ,
    tb.id_user_validation       ,
    tb.id_user_realisation      ,
    tb.id_partenaire            ,
    tb.code_statut_bc           ,
    tb.code_type_investissement ,
    tb.budget                   ,
    tb.nom_beneficiaire         ,
    tb.rib_beneficiaire         ,
    tb.objet_investissement     ,
    tb.destination              ,
    tb.description              ,
    tb.date_creation            ,
    tb.date_validation          ,
    tb.date_realisation         ,
    (SELECT tpc.libelle_codification FROM tab_par_codification tpc
        WHERE   tpc.type_codification = 'TYIN'
        AND     tpc.code_codification = tb.code_type_investissement)                        AS type_investissement  ,
    (SELECT CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NULL,'',tp.prenom_partenaire)) 
        FROM    tab_partenaire tp
        WHERE   tp.id_partenaire = tb.id_partenaire LIMIT 1)                                AS nom_partenaire       ,
    (SELECT CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur) FROM tab_utilisateur tu
        WHERE tu.id_utilisateur = tb.id_utilisateur LIMIT 1)                                AS nom_utilisateur      ,
    (SELECT CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur) FROM tab_utilisateur tu
        WHERE tu.id_utilisateur = tb.id_user_validation LIMIT 1)                            AS nom_validateur       ,
    (SELECT CONCAT(tu.nom_utilisateur   ,' '   ,tu.prenom_utilisateur) FROM tab_utilisateur tu
        WHERE tu.id_utilisateur = tb.id_user_realisation LIMIT 1)                           AS nom_realisateur      ,
    (SELECT td.id_document FROM tab_document td
        WHERE   td.id_objet     = tb.id_business_case
        AND     td.code_objet   = 'BC' LIMIT 1)                                             AS id_document          ,
    (SELECT td.cle_document FROM tab_document td
        WHERE   td.id_objet     = tb.id_business_case
        AND     td.code_objet   = 'BC' LIMIT 1)                                             AS cle_document         ,
    (SELECT td.extension_document FROM tab_document td
        WHERE   td.id_objet     = tb.id_business_case
        AND     td.code_objet   = 'BC' LIMIT 1)                                             AS extension_document   ,
    (SELECT td.nom_document FROM tab_document td
        WHERE   td.id_objet     = tb.id_business_case
        AND     td.code_objet   = 'BC' LIMIT 1)                                             AS nom_document         ,
    (SELECT CONCAT(td.nom_document,'.', td.extension_document) FROM tab_document td
        WHERE   td.id_objet     = tb.id_business_case
        AND     td.code_objet   = 'BC' LIMIT 1)                                             AS intitule_document    
FROM
    tab_partenaire_bc tb
WHERE
    tb.id_business_case = ?;
`

const que_upd_business_case = `
SET @token_id                   = ?,
    @id_business_case           = ?,
    @id_partenaire              = ?,
    @nom_beneficiaire           = ?,
    @rib_beneficiaire           = ?,
    @code_type_investissement   = ?,
    @description                = ?,
    @budget                     = ?,
    @destination                = ?,
    @objet_investissement       = ?;

UPDATE tab_partenaire_bc
SET
    nom_beneficiaire            = @nom_beneficiaire         ,
    rib_beneficiaire            = @rib_beneficiaire         ,
    code_type_investissement    = @code_type_investissement ,
    description                 = @description              ,
    budget                      = @budget                   ,
    destination                 = @destination              ,
    objet_investissement        = @objet_investissement
WHERE
    id_business_case            = @id_business_case         
AND
    id_utilisateur              = @token_id                 
AND 
    code_statut_bc              = 'ENAT'                    ;
    
SELECT  (SELECT UPPER(CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,'')))
        FROM    tab_partenaire tp
        WHERE   tp.id_partenaire = @id_partenaire) AS nom_partenaire;
`

const que_valider_business_case = `
SET     @id_business_case   = ?,
        @done               = NULL;

IF (SELECT tb.code_statut_bc FROM tab_partenaire_bc tb
        WHERE tb.id_business_case = @id_business_case) IN ('ENAT','REJE') THEN
    
    Update  tab_partenaire_bc tb
    SET     tb.code_statut_bc   = 'VALI'
    WHERE   tb.id_business_case = @id_business_case;
    
    SELECT 'ok' INTO @done;
ELSE
    SELECT 'ko' INTO @done;
END IF;

SELECT @done AS done;
`

const que_rejeter_business_case = `
SET     @id_business_case   = ?,
        @done               = NULL;

IF (SELECT tb.code_statut_bc FROM tab_partenaire_bc tb
        WHERE tb.id_business_case = @id_business_case) = 'ENAT' THEN
    
    Update  tab_partenaire_bc tb
    SET     tb.code_statut_bc   = 'REJE'
    WHERE   tb.id_business_case = @id_business_case;
    
    SELECT 'ok' INTO @done;
ELSE
    SELECT 'ko' INTO @done;
END IF;

SELECT @done AS done;
`

const que_realiser_business_case = `
SET     @id_business_case   = ?,
        @done               = NULL;

IF (SELECT tb.code_statut_bc FROM tab_partenaire_bc tb
        WHERE tb.id_business_case = @id_business_case) = 'VALI' THEN
    
    Update  tab_partenaire_bc tb
    SET     tb.code_statut_bc   = 'REAL'
    WHERE   tb.id_business_case = @id_business_case;
    
    SELECT 'ok' INTO @done;
ELSE
    SELECT 'ko' INTO @done;
END IF;

SELECT @done AS done;
`

const que_export_business_cases = `
SET @token_id               = ?,
    @token_role             = ?,
    @token_medical          = ?,
    @token_pharmaceutique   = ?,
    @id_partenaire          = ?,
    @nom_partenaire         = CONCAT('%',IFNULL(?,''),'%'),
    @id_utilisateur         = ?,
    @code_statut_bc         = ?,
    @code_region            = ?;

SELECT
    tb.id_business_case         ,
    tb.id_utilisateur           ,
    tp.id_partenaire            ,
    tp.code_potentiel           ,
    tb.description              ,
    tb.date_creation            ,
    tb.date_validation          ,
    tb.date_realisation         ,
    tb.code_type_investissement ,
    tb.destination              ,
    tb.objet_investissement     ,
    tb.code_statut_bc           ,
    CASE
        WHEN tb.code_statut_bc = 'ENAT' THEN 'En attente'
        WHEN tb.code_statut_bc = 'REAL' THEN 'Réalisée'
        WHEN tb.code_statut_bc = 'REJE' THEN 'Rejeté'
        WHEN tb.code_statut_bc = 'VALI' THEN 'Validé'
    END 
    AS Status,
    'Médecin' AS type_compte,
    tp.code_specialite          ,
    UPPER(CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,'')))          AS nom_partenaire       ,
    (SELECT CONCAT(tu.nom_utilisateur, ' ', tu.prenom_utilisateur) FROM tab_utilisateur tu 
        WHERE tu.id_utilisateur = tb.id_utilisateur)                                                    AS nom_demandeur        ,
    (SELECT CONCAT(tu.nom_utilisateur, ' ', tu.prenom_utilisateur) FROM tab_utilisateur tu 
        WHERE tu.id_utilisateur = tb.id_user_validation)                                                AS nom_validateur       ,
    (SELECT CONCAT(tu.nom_utilisateur, ' ', tu.prenom_utilisateur) FROM tab_utilisateur tu 
        WHERE tu.id_utilisateur = tb.id_user_realisation)                                               AS nom_realisateur      ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'SPEC' AND code_codification = tp.code_specialite LIMIT 1)            AS specialite           ,
    (SELECT CONCAT(td.cle_document,'.',td.extension_document) FROM tab_document td
        WHERE td.id_objet = tb.id_business_case AND td.code_objet = 'BC' LIMIT 1)                       AS intitule_document    ,
    (SELECT nom_document FROM tab_document td
        WHERE td.id_objet = tb.id_business_case AND code_objet = 'BC' LIMIT 1)                          AS nom_document         ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'TYIN' AND code_codification = tb.code_type_investissement LIMIT 1)   AS type_investissement
FROM 
    tab_partenaire_bc tb
LEFT JOIN
    tab_partenaire tp ON tp.id_partenaire = tb.id_partenaire
WHERE
    1 = 1
AND IF(@nom_partenaire  IS NOT NULL, CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,'')) , 1) LIKE IF(@nom_partenaire    IS NOT NULL, @nom_partenaire    , 1)
AND IF(@id_partenaire   IS NOT NULL, tb.id_partenaire   , 1) = IF(@id_partenaire     IS NOT NULL, @id_partenaire     , 1)
AND IF(@code_statut_bc  IS NOT NULL, tb.code_statut_bc  , 1) = IF(@code_statut_bc    IS NOT NULL, @code_statut_bc    , 1)
AND IF(@id_utilisateur  IS NOT NULL, tb.id_utilisateur  , 1) = IF(@id_utilisateur    IS NOT NULL, @id_utilisateur    , 1)
AND CASE
        WHEN @code_region IS NOT NULL THEN
            tb.id_partenaire IN (SELECT tp.id_partenaire FROM tab_partenaire tp WHERE tp.code_region_partenaire = @code_region)
        ELSE 1 = 1
    END
AND CASE
        WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN
                tb.id_utilisateur  = @token_id 
            OR
                tb.id_responsable  = @token_id
            OR
                tb.id_utilisateur  IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                            WHERE tu1.id_responsable IN (
                                                SELECT tu2.id_utilisateur FROM tab_utilisateur tu2
                                                                            WHERE tu2.id_responsable = @token_id)
                                        )
            OR
                tb.id_utilisateur  IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                            WHERE tu1.id_responsable IN (
                                                                            SELECT  tu2.id_utilisateur FROM tab_utilisateur tu2
                                                                            WHERE   tu2.id_responsable IN (
                                                                                        SELECT  tu3.id_utilisateur FROM tab_utilisateur tu3
                                                                                        WHERE   tu3.id_responsable = @token_id
                                                                                    )
                                                                        )
                                        )
        WHEN @token_role = 'ACH' THEN
            tb.code_statut_bc IN ('VALI','REAL')
        ELSE
            1 = 1
    END
`

module.exports = {
    que_tab_business_cases,
    que_nbr_tab_business_cases,
    que_add_business_case,
    que_add_document_bc,
    que_del_document_bc,
    que_get_fiche_business_case,
    que_upd_business_case,
    que_valider_business_case,
    que_rejeter_business_case,
    que_realiser_business_case,
    que_export_business_cases
}