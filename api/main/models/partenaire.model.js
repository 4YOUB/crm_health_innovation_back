const que_tab_partenaires = `
SET @token_id               = ?,
    @token_role             = ?,
    @token_medical          = ?,
    @token_pharmaceutique   = ?,
    @id_partenaire          = ?,
    @code_statut_partenaire = ?,
    @type_partenaire        = ?,
    @nom_partenaire         = CONCAT('%',IFNULL(?,''),'%'),
    @code_type_etablissement= ?,
    @code_region            = ?,
    @code_ville             = ?,
    @code_secteur           = ?;

SELECT
    tp.id_partenaire                                                                                                            ,
    tp.code_statut_partenaire                                                                                                   ,
    tp.code_potentiel                                                                                                           ,
    tp.tel1_partenaire                                                                                                          ,
    tp.tel2_partenaire                                                                                                          ,
    tp.code_type_partenaire                                                                                                     ,
    UPPER(CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,''))  )        AS nom_partenaire       ,
    (SELECT COUNT(tpv.id_visite) FROM tab_visite tpv
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite 
        WHERE   tpv.code_statut_visite <> 'SUPP'  
        AND     tpv2.id_partenaire = tp.id_partenaire 
        AND     tpv.code_statut_visite = 'REAL')                                                        AS nbr_visites_realisees,
    IF((SELECT type_codification FROM tab_par_codification
            WHERE code_codification = tp.code_type_etablissement) = 'ETPR', 'Privé', 'Public')          AS type_etablissement   ,
    IF(code_type_partenaire = 'MEDE', 'Médecin', 'Pharmacie')                                           AS type_partenaire      ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'REGI' AND code_codification = tp.code_region_partenaire)             AS region_partenaire    ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'VILL' AND code_codification = tp.code_ville_partenaire)              AS ville_partenaire     ,
    (SELECT libelle_codification FROM tab_par_codification  
        WHERE type_codification = 'SECT' AND code_codification = tp.code_secteur_partenaire)            AS secteur_partenaire   ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification IN ('ETPR','ETPU') AND code_codification = tp.code_type_etablissement)  AS etablissement        ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'SPEC' AND code_codification = tp.code_specialite)                    AS specialite
FROM
    tab_partenaire tp
WHERE
    IF(@id_partenaire           IS NOT NULL, tp.id_partenaire               , 1)    = IF(@id_partenaire             IS NOT NULL, @id_partenaire             , 1)
AND IF(@type_partenaire         IS NOT NULL, tp.code_type_partenaire        , 1)    = IF(@type_partenaire           IS NOT NULL, @type_partenaire           , 1)
AND IF(@code_type_etablissement IS NOT NULL, tp.code_type_etablissement     , 1)    = IF(@code_type_etablissement   IS NOT NULL, @code_type_etablissement   , 1)
AND IF(@code_region             IS NOT NULL, tp.code_region_partenaire      , 1)    = IF(@code_region               IS NOT NULL, @code_region               , 1)
AND IF(@code_ville              IS NOT NULL, tp.code_ville_partenaire       , 1)    = IF(@code_ville                IS NOT NULL, @code_ville                , 1)
AND IF(@code_secteur            IS NOT NULL, tp.code_secteur_partenaire     , 1)    = IF(@code_secteur              IS NOT NULL, @code_secteur              , 1)
AND IF(@nom_partenaire          IS NOT NULL, CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,'')) , 1) LIKE IF(@nom_partenaire    IS NOT NULL, @nom_partenaire    , 1)
AND IF(@code_statut_partenaire  IS NOT NULL, tp.code_statut_partenaire      , 1)    = IF(@code_statut_partenaire    IS NOT NULL, @code_statut_partenaire    , 1)
AND CASE
        WHEN @token_role = 'ADMI' THEN
            tp.code_statut_partenaire <> 'MIGR'
        ELSE
            tp.code_statut_partenaire <> 'REJE'
    END
AND CASE
        WHEN @token_role NOT IN ('ADMI','DIR','PM') THEN
            tp.code_region_partenaire IN (SELECT    tur.code_region FROM tab_utilisateur_region tur 
                                            WHERE   tur.id_utilisateur  = @token_id
                                            AND     tur.flag_actif      = 'O')
            AND
            (
                (
                    @token_medical = 'O'
                AND            
                    tp.code_type_partenaire = 'MEDE'
                AND
                    tp.code_gamme IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                        WHERE   tug.id_utilisateur  = @token_id
                                        AND     tug.flag_actif      = 'O')
                )
            OR
                (
                    @token_pharmaceutique = 'O'
                AND
                    tp.code_type_partenaire = 'PHAR'
                )
            )
        ELSE 1 = 1
    END 
`

const que_nbr_tab_partenaires = `
SET @token_id               = ?,
    @token_role             = ?,
    @token_medical          = ?,
    @token_pharmaceutique   = ?,
    @id_partenaire          = ?,
    @code_statut_partenaire = ?,
    @type_partenaire        = ?,
    @nom_partenaire         = CONCAT('%',IFNULL(?,''),'%'),
    @code_type_etablissement= ?,
    @code_region            = ?,
    @code_ville             = ?,
    @code_secteur           = ?;
     
SELECT  COUNT(0) AS nbr_total_partenaires
FROM    tab_partenaire tp
WHERE
    IF(@id_partenaire           IS NOT NULL, tp.id_partenaire              , 1)    = IF(@id_partenaire             IS NOT NULL, @id_partenaire             , 1)
AND IF(@type_partenaire         IS NOT NULL, tp.code_type_partenaire       , 1)    = IF(@type_partenaire           IS NOT NULL, @type_partenaire           , 1)
AND IF(@code_type_etablissement IS NOT NULL, tp.code_type_etablissement    , 1)    = IF(@code_type_etablissement   IS NOT NULL, @code_type_etablissement   , 1)
AND IF(@code_region             IS NOT NULL, tp.code_region_partenaire     , 1)    = IF(@code_region               IS NOT NULL, @code_region               , 1)
AND IF(@code_ville              IS NOT NULL, tp.code_ville_partenaire      , 1)    = IF(@code_ville                IS NOT NULL, @code_ville                , 1)
AND IF(@code_secteur            IS NOT NULL, tp.code_secteur_partenaire    , 1)    = IF(@code_secteur              IS NOT NULL, @code_secteur              , 1)
AND IF(@nom_partenaire  IS NOT NULL, CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,'')) , 1) LIKE IF(@nom_partenaire    IS NOT NULL, @nom_partenaire    , 1)
AND IF(@code_statut_partenaire  IS NOT NULL, tp.code_statut_partenaire      , 1)    = IF(@code_statut_partenaire    IS NOT NULL, @code_statut_partenaire    , 1)
AND CASE
    WHEN @token_role = 'ADMI' THEN
        tp.code_statut_partenaire <> 'MIGR'
    ELSE
        tp.code_statut_partenaire <> 'REJE'
    END
AND CASE
        WHEN @token_role NOT IN ('ADMI','DIR','PM') THEN
                tp.code_region_partenaire IN (SELECT    tur.code_region 
                                                FROM    tab_utilisateur_region tur 
                                                WHERE   tur.id_utilisateur  = @token_id
                                                AND     tur.flag_actif      = 'O')
            AND
            (
                (
                    @token_medical = 'O'
                AND            
                    tp.code_type_partenaire = 'MEDE'
                AND
                    tp.code_gamme IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                                    WHERE   tug.id_utilisateur  = @token_id
                                                    AND     tug.flag_actif      = 'O')
                )
            OR
                (
                    @token_pharmaceutique = 'O'
                AND
                    tp.code_type_partenaire = 'PHAR'
                )
            )
        ELSE 1 = 1
    END 
`

const que_add_partenaire = `
SET @token_id               = ?,
    @token_role             = ?,
    @type_partenaire        = ?,
    @nom_partenaire         = ?,
    @prenom_partenaire      = ?,
    @date_naissance         = ?,
    @code_potentiel         = ?,
    @code_type_etablissement= ?,
    @code_specialite        = ?,
    @email_partenaire       = ?,
    @tel1_partenaire        = ?,
    @tel2_partenaire        = ?,
    @adresse_partenaire     = ?,
    @code_region            = ?,
    @code_ville             = ?,
    @code_secteur           = ?;

IF  (
            @type_partenaire = 'PHAR'
        AND
            @nom_partenaire IS NOT NULL
    )
    OR
    (       @type_partenaire = 'MEDE'
        AND
            @nom_partenaire IS NOT NULL
        AND
            @prenom_partenaire IS NOT NULL
    ) THEN

    INSERT INTO tab_partenaire (
        code_type_partenaire    ,
        date_naissance          ,
        code_statut_partenaire  ,
        code_potentiel          ,
        email_partenaire        ,
        code_region_partenaire  ,
        code_ville_partenaire   ,
        code_secteur_partenaire ,
        adresse_partenaire      ,
        tel1_partenaire         ,
        tel2_partenaire         ,
        id_utilisateur          ,
        nom_partenaire          ,
        prenom_partenaire       ,
        code_type_etablissement ,
        code_specialite         ,
        code_gamme    
    )
    VALUES (
        @type_partenaire        ,
        @date_naissance         ,
        'CREE'                  ,
        @code_potentiel         ,
        @email_partenaire       ,
        @code_region            ,
        @code_ville             ,
        @code_secteur           ,
        @adresse_partenaire     ,
        @tel1_partenaire        ,
        @tel2_partenaire        ,
        @token_id               ,
        @nom_partenaire         ,
        IF(@type_partenaire = 'MEDE', @prenom_partenaire      , NULL),
        IF(@type_partenaire = 'MEDE', @code_type_etablissement, NULL),
        IF(@type_partenaire = 'MEDE', @code_specialite        , NULL),
        IF(@type_partenaire = 'MEDE' AND @code_specialite IS NOT NULL, (SELECT code_parent FROM tab_par_codification
                                                                        WHERE   type_codification = 'SPEC'
                                                                        AND     code_codification = @code_specialite
                                                                        AND     type_parent       = 'GAMM'), NULL)
    );

    SELECT 'ok' INTO @done;
ELSE
    SELECT 'ko' INTO @done;
END IF;
SELECT  LAST_INSERT_ID()    AS id_partenaire,
        @done               AS done         ,
        UPPER(CONCAT(@nom_partenaire,' ',IF(@prenom_partenaire IS NOT NULL,@prenom_partenaire,'')) ) AS nom_partenaire;
`

const que_upd_partenaire = `
SET @token_role             = ?,
    @id_partenaire          = ?,
    @type_partenaire        = ?,
    @code_statut_partenaire = ?,
    @nom_partenaire         = ?,
    @prenom_partenaire      = ?,
    @date_naissance         = ?,
    @code_potentiel         = ?,
    @code_type_etablissement= ?,
    @code_specialite        = ?,
    @email_partenaire       = ?,
    @tel1_partenaire        = ?,
    @tel2_partenaire        = ?,
    @adresse_partenaire     = ?,
    @code_region            = ?,
    @code_ville             = ?,
    @code_secteur           = ?;

UPDATE tab_partenaire
SET
    code_type_partenaire    = @type_partenaire          ,
    date_naissance          = @date_naissance           ,
    code_potentiel          = @code_potentiel           ,
    code_statut_partenaire  = IF((SELECT code_statut_partenaire FROM tab_partenaire
                                    WHERE id_partenaire = @id_partenaire) = 'MIGR','VALI',@code_statut_partenaire),
    email_partenaire        = @email_partenaire         ,
    tel1_partenaire         = @tel1_partenaire          ,
    tel2_partenaire         = @tel2_partenaire          ,
    adresse_partenaire      = @adresse_partenaire       ,
    code_region_partenaire  = @code_region              ,
    code_ville_partenaire   = @code_ville               ,
    code_secteur_partenaire = @code_secteur             ,
    nom_partenaire          = @nom_partenaire           ,
    prenom_partenaire       = IF(@type_partenaire = 'MEDE', @prenom_partenaire      , NULL),
    code_type_etablissement = IF(@type_partenaire = 'MEDE', @code_type_etablissement, NULL),
    code_specialite         = IF(@type_partenaire = 'MEDE', @code_specialite        , NULL),
    code_gamme              = IF(@type_partenaire = 'MEDE' AND @code_specialite IS NOT NULL, (SELECT code_parent FROM tab_par_codification
                                                                                                WHERE   type_codification = 'SPEC'
                                                                                                AND     code_codification = @code_specialite
                                                                                                AND     type_parent       = 'GAMM'), NULL)
WHERE
    id_partenaire           = @id_partenaire            ;
`

const que_valider_partenaire = `
SET     @id_partenaire          = ?,
        @code_type_partenaire   = NULL,
        @code_potentiel         = NULL,
        @code_specialite        = NULL,
        @code_type_etablissement= NULL,
        @code_region_partenaire = NULL,
        @code_ville_partenaire  = NULL,
        @done                   = NULL;

SELECT  tp.code_type_partenaire             ,
        tp.code_potentiel                   ,
        tp.code_specialite                  ,
        tp.code_type_etablissement          ,
        tp.code_region_partenaire           ,
        tp.code_ville_partenaire

INTO    @code_type_partenaire               ,
        @code_potentiel                     ,
        @code_specialite                    ,
        @code_type_etablissement            ,
        @code_region_partenaire             ,
        @code_ville_partenaire
FROM
        tab_partenaire tp
WHERE
        tp.id_partenaire = @id_partenaire   ;

IF  ( 
            @code_type_partenaire = 'PHAR'
        OR
        (       @code_type_partenaire = 'MEDE'
            AND
                @code_specialite IS NOT NULL
            AND
                @code_type_etablissement IS NOT NULL
            AND
                @code_potentiel IS NOT NULL
        )
    )
    AND
        @code_region_partenaire IS NOT NULL
    AND
        @code_ville_partenaire IS NOT NULL THEN

    UPDATE  tab_partenaire
    SET     code_statut_partenaire  = 'VALI'
    WHERE   id_partenaire           = @id_partenaire;

    SELECT 'ok' INTO @done;
ELSE
    SELECT 'ko' INTO @done;
END IF;

SELECT @done AS done;
`

const que_rejeter_partenaire = `
UPDATE  tab_partenaire
SET     code_statut_partenaire  = 'REJE'
WHERE   id_partenaire           = ?;
`

const que_fiche_partenaire = `
SET @id_partenaire  = ?,
    @token_role     = ?;

SELECT
    id_partenaire                                                                                                               ,
    nom_partenaire                                                                                                              ,
    prenom_partenaire                                                                                                           ,
    email_partenaire                                                                                                            ,
    date_naissance                                                                                                              ,
    code_potentiel                                                                                                              ,
    tel1_partenaire                                                                                                             ,
    tel2_partenaire                                                                                                             ,
    adresse_partenaire                                                                                                          ,
    date_creation                                                                                                               ,
    code_statut_partenaire                                                                                                      ,
    code_region_partenaire                                                                                                      ,
    code_ville_partenaire                                                                                                       ,
    code_secteur_partenaire                                                                                                     ,
    code_type_etablissement                                                                                                     ,
    code_type_partenaire                                                                                                        ,
    code_specialite                                                                                                             ,
    code_gamme                                                                                                                  ,
    IF(code_type_partenaire = 'MEDE', 'Médecin', 'Pharmacie')                                       AS type_partenaire          ,
    IF((SELECT type_codification FROM tab_par_codification
        WHERE code_codification = code_type_etablissement) = 'ETPR', 'Privé', 'Public')             AS type_etablissement       ,   
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification IN ('ETPR','ETPU') AND code_codification = code_type_etablissement) AS etablissement            ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'REGI' AND code_codification = code_region_partenaire)            AS region_partenaire        ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'VILL' AND code_codification = code_ville_partenaire)             AS ville_partenaire         ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'SECT' AND code_codification = code_secteur_partenaire)           AS secteur_partenaire       ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'SPEC' AND code_codification = code_specialite)                   AS specialite               ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE   type_codification = 'GAMM' 
        AND     code_codification = (SELECT code_parent FROM tab_par_codification tpc 
                                        WHERE   tpc.type_codification   = 'SPEC'
                                        AND     tpc.code_codification   = code_specialite
                                        AND     type_parent             = 'GAMM'))                  AS gamme                   ,
    (SELECT date_visite FROM tab_visite tpv
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite
        WHERE    tpv.code_statut_visite <> 'SUPP'
        AND      tpv2.id_partenaire       = @id_partenaire
        AND      tpv.code_statut_visite IN ('REAL','ABSE')
        ORDER BY tpv.id_visite DESC LIMIT 1)                                                        AS date_derniere_visite     ,
    (SELECT date_visite FROM tab_visite tpv
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite
        WHERE    tpv.code_statut_visite <> 'SUPP'     
        AND      tpv2.id_partenaire       = @id_partenaire
        AND      tpv.code_statut_visite  = 'ENAT'
        ORDER BY tpv.id_visite ASC LIMIT 1)                                                         AS date_prochaine_visite    ,
    (SELECT COUNT(0) FROM tab_visite
        WHERE   code_statut_visite <> 'SUPP'   
        AND     id_partenaire       = @id_partenaire
        AND     code_type_visite    = 'PLAN'
        AND     code_statut_visite  = 'REAL')                                                       AS nbr_visite_planifiees    ,
    (SELECT COUNT(0) FROM tab_visite
        WHERE   code_statut_visite <> 'SUPP'  
        AND     id_partenaire       = @id_partenaire
        AND     code_type_visite    = 'HOPL'
        AND     code_statut_visite  = 'REAL')                                                       AS nbr_visite_non_planifiees,
    (SELECT COUNT(0) FROM tab_partenaire_bc
        WHERE   id_partenaire       = @id_partenaire)                                               AS nbr_business_cases
FROM    tab_partenaire
WHERE   id_partenaire = @id_partenaire
AND CASE
        WHEN @token_role <> 'ADMI' THEN
            code_statut_partenaire <> 'REJE'
        ELSE 
            1 = 1
    END;
`

const que_tab_partenaire_visites = `
SET @id_partenaire = ?;

SELECT
    tpv.id_visite                                                                                                       ,
    tpv.id_utilisateur                                                                                                  ,
    tpv.date_visite                                                                                                     ,
    tpv.date_replanification                                                                                            ,
    tpv.flag_accompagnee                                                                                                ,
    tpv.code_statut_visite                                                                                              ,
    (SELECT CONCAT(nom_utilisateur,' ',prenom_utilisateur) FROM tab_utilisateur tu
        WHERE tu.id_utilisateur = tpv.id_utilisateur)                                               AS nom_utilisateur  ,
    (SELECT CONCAT(nom_utilisateur,' ',prenom_utilisateur) FROM tab_utilisateur tu
        WHERE tu.id_utilisateur = tpv.id_accompagnant)                                              AS accompagnant     ,
    (SELECT COUNT(0) FROM tab_visite_produit tvp1 WHERE tvp1.id_visite = tpv.id_visite LIMIT 1)     AS nbr_produits,
    tpv.heure_fin_visite
FROM
    tab_visite tpv
    LEFT JOIN tab_partenaire_visite tpv2
    ON tpv.id_visite = tpv2.id_visite
WHERE
    tpv.code_statut_visite <> 'SUPP' 
AND tpv2.id_partenaire = @id_partenaire
ORDER BY
    tpv.id_visite DESC
`

const que_tab_visites_produits = `
SELECT
    tvp.id_visite           ,
    (SELECT libelle_produit FROM tab_produit tp WHERE tp.id_produit = tvp.id_produit)               AS produit          ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'GAMM' AND code_codification = tvp.code_gamme)                    AS gamme            ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'FEED' AND code_codification = tvp.code_feedback)                 AS feedback
FROM
    tab_visite_produit tvp
ORDER BY
    tvp.id_visite DESC; 
`

const que_nbr_tab_visites = `
SELECT
    COUNT(0) AS nbr_total_visites
FROM
    tab_visite tpv
    LEFT JOIN tab_partenaire_visite tpv2
    ON tpv.id_visite = tpv2.id_visite
WHERE
    tpv.code_statut_visite <> 'SUPP' 
AND tpv2.id_partenaire = @id_partenaire;
`

const que_tab_partenaire_bc = `
SET @id_partenaire = ?;

SELECT
    tpb.id_business_case    ,
    tpb.id_utilisateur      ,
    tpb.date_realisation    ,
    tpb.date_creation       ,
    tpb.date_validation     ,
    tpb.description         ,
    tpb.code_statut_bc      ,
    (SELECT CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur) FROM tab_utilisateur tu
        WHERE tu.id_utilisateur = tpb.id_utilisateur LIMIT 1)                                       AS nom_utilisateur          ,
    (SELECT CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur) FROM tab_utilisateur tu
        WHERE tu.id_utilisateur = tpb.id_user_validation LIMIT 1)                                   AS nom_validateur           ,
    (SELECT CONCAT(tu.nom_utilisateur   ,' '   ,tu.prenom_utilisateur) FROM tab_utilisateur tu
        WHERE tu.id_utilisateur = tpb.id_user_realisation LIMIT 1)                                  AS nom_realisateur          ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'TYIN' AND code_codification = tpb.code_type_investissement)      AS type_investissement      ,
    (SELECT td.nom_document FROM tab_document td 
        WHERE td.code_objet = 'BC' AND td.id_objet = tpb.id_business_case)                          AS nom_document             ,
    (SELECT CONCAT(td.cle_document, '.', td.extension_document) FROM tab_document td
        WHERE td.code_objet = 'BC' AND td.id_objet = tpb.id_business_case)                          AS intitule_document
FROM
    tab_partenaire_bc tpb
WHERE
    tpb.id_partenaire = @id_partenaire
AND
    (SELECT code_type_partenaire FROM tab_partenaire WHERE id_partenaire = @id_partenaire) = 'MEDE'
ORDER BY
    tpb.id_business_case DESC 
`

const que_nbr_tab_partenaire_bc = `
SET @id_partenaire = ?;

SELECT
    COUNT(0) AS nbr_total_business_cases
FROM
    tab_partenaire_bc tpb
WHERE
    tpb.id_partenaire = @id_partenaire
AND
    (SELECT code_type_partenaire FROM tab_partenaire WHERE id_partenaire = @id_partenaire) = 'MEDE';
`

const que_tab_partenaire_notes = `
SET @id_partenaire = ?;

SELECT
    tn.id_note          ,
    tn.id_utilisateur   ,
    tn.date_creation    ,
    tn.commentaire      ,
    (SELECT CONCAT(nom_utilisateur,' ',prenom_utilisateur) FROM tab_utilisateur tu
        WHERE tu.id_utilisateur = tn.id_utilisateur) AS nom_utilisateur
FROM
    tab_note tn
WHERE
    tn.code_objet   = 'PART'
AND
    tn.id_objet     = @id_partenaire
ORDER BY
    tn.id_note DESC 
`

const que_nbr_tab_partenaire_notes = `
SET @id_partenaire = ?;

SELECT
    COUNT(0) AS nbr_total_notes
FROM
    tab_note tn
WHERE
    tn.code_objet   = 'PART'
AND
    tn.id_objet     = @id_partenaire;
`

const que_tab_partenaire_docs = `
SET @id_partenaire = ?;

SELECT
    td.id_document      ,
    td.id_utilisateur   ,
    td.date_creation    ,
    td.nom_document     ,
    (SELECT CONCAT(nom_utilisateur,' ',prenom_utilisateur) FROM tab_utilisateur tu
        WHERE tu.id_utilisateur = td.id_utilisateur)    AS nom_utilisateur          ,
    CONCAT(td.cle_document, '.', td.extension_document) AS intitule_document
FROM
    tab_document td
WHERE
    td.code_objet   = 'PART'
AND
    td.id_objet     = @id_partenaire
ORDER BY
    td.id_document DESC 
`

const que_nbr_tab_partenaire_docs = `
SET @id_partenaire = ?;

SELECT
    COUNT(0) AS nbr_total_documents
FROM
    tab_document td
WHERE
    td.code_objet   = 'PART'
AND
    td.id_objet     = @id_partenaire;
`

const que_ajouter_note = `
SET @id_utilisateur = ?,
    @id_partenaire  = ?,
    @commentaire    = ?;

INSERT INTO tab_note (
    id_utilisateur      ,
    id_objet            ,
    code_objet          ,
    commentaire
)
VALUES (
    @id_utilisateur     ,
    @id_partenaire      ,
    'PART'              ,
    @commentaire
);
SELECT LAST_INSERT_ID() AS id_note;
`

const que_ajouter_document = `
SET @token_id       = ?,
    @id_partenaire  = ?,
    @id_document    = ?,
    @nom_document   = ?,
    @id_utilisateur = NULL;

SELECT id_utilisateur INTO @id_utilisateur FROM tab_document WHERE id_document = @id_document;

IF @id_utilisateur = @token_id THEN
    UPDATE  tab_document
    SET     code_objet      = 'PART'            ,
            id_objet        = @id_partenaire    ,
            nom_document    = @nom_document
    WHERE   id_document     = @id_document      ;
END IF;
`

const que_supprimer_note = `
SET @token_id       = ?,
    @token_role     = ?,
    @id_note        = ?,
    @done           = NULL,
    @nom_partenaire = NULL;

IF (SELECT id_utilisateur FROM tab_note
        WHERE id_note = @id_note) = @token_id 
    OR 
    @token_role = 'ADMI' THEN

    SELECT  CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,'')) INTO @nom_partenaire
    FROM    tab_partenaire tp
    WHERE   tp.id_partenaire = (SELECT id_objet FROM tab_note
                                WHERE   id_note     = @id_note
                                AND     code_objet  = 'PART');

    DELETE FROM tab_note
    WHERE id_note     = @id_note;

    SELECT 'ok' INTO @done;
ELSE
    SELECT 'ko' INTO @done;
END IF;

SELECT  @done AS done    ,
        @nom_partenaire AS nom_partenaire;
`

const que_supprimer_document = `
SET @token_id       = ?,
    @token_role     = ?,
    @id_document    = ?,
    @done           = NULL,
    @nom_partenaire = NULL;

IF (SELECT id_utilisateur FROM tab_document
        WHERE id_document = @id_document) = @token_id 
    OR 
    @token_role = 'ADMI' THEN

    SELECT  CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,'')) INTO @nom_partenaire
    FROM    tab_partenaire tp
    WHERE   tp.id_partenaire = (SELECT  id_objet FROM tab_document
                                WHERE   id_document     = @id_document
                                AND     code_objet  = 'PART');

    DELETE FROM tab_document
    WHERE id_document     = @id_document;

    SELECT 'ok' INTO @done;
ELSE
    SELECT 'ko' INTO @done;
END IF;

SELECT  @done AS done    ,
        @nom_partenaire AS nom_partenaire;
`

const que_get_infos_partenaire = `
SELECT  CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,'')) AS nom_partenaire
FROM    tab_partenaire tp
WHERE   tp.id_partenaire IN (?);
`


const que_export_partenaires = `
SET @token_id               = ?,
    @token_role             = ?,
    @token_medical          = ?,
    @token_pharmaceutique   = ?,
    @id_partenaire          = ?,
    @code_statut_partenaire = ?,
    @type_partenaire        = ?,
    @nom_partenaire         = CONCAT('%',IFNULL(?,''),'%'),
    @code_type_etablissement= ?,
    @code_region            = ?,
    @code_ville             = ?,
    @code_secteur           = ?;

SELECT
    CONCAT(IF(code_type_partenaire = 'MEDE', 'M', 'P'), tp.id_partenaire) AS Référence,
    CASE
        WHEN tp.code_statut_partenaire = 'CREE' THEN 'En attente'
        WHEN tp.code_statut_partenaire = 'MIGR' THEN 'Migré'
        WHEN tp.code_statut_partenaire = 'REJE' THEN 'Rejeté'
        WHEN tp.code_statut_partenaire = 'VALI' THEN 'Validé'
    END 
    AS Status,
    tp.code_potentiel AS Potentiel,
    tp.tel1_partenaire AS 'Téléphone 1',
    tp.tel2_partenaire AS 'Téléphone 2',
    UPPER(CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,''))) AS 'Nom Compte',
    (SELECT COUNT(tpv.id_visite) FROM tab_visite tpv
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite 
        WHERE   tpv.code_statut_visite <> 'SUPP'  
        AND     tpv2.id_partenaire = tp.id_partenaire 
        AND     tpv.code_statut_visite = 'REAL') AS 'Nombre visites',
    IF((SELECT type_codification FROM tab_par_codification
            WHERE code_codification = tp.code_type_etablissement) = 'ETPR', 'Privé', 'Public') AS 'Type Établissemment',
    IF(code_type_partenaire = 'MEDE', 'Médecin', 'Pharmacie') AS 'Type Compte',
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'REGI' AND code_codification = tp.code_region_partenaire) AS 'Région Compte',
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'VILL' AND code_codification = tp.code_ville_partenaire) AS 'Ville Compte',
    (SELECT libelle_codification FROM tab_par_codification  
        WHERE type_codification = 'SECT' AND code_codification = tp.code_secteur_partenaire) AS 'Secteur Compte',
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification IN ('ETPR','ETPU') AND code_codification = tp.code_type_etablissement) AS 'Établissemment',
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'SPEC' AND code_codification = tp.code_specialite) AS 'Spécialité'
FROM
    tab_partenaire tp
WHERE
    IF(@id_partenaire           IS NOT NULL, tp.id_partenaire               , 1)    = IF(@id_partenaire             IS NOT NULL, @id_partenaire             , 1)
AND IF(@type_partenaire         IS NOT NULL, tp.code_type_partenaire        , 1)    = IF(@type_partenaire           IS NOT NULL, @type_partenaire           , 1)
AND IF(@code_type_etablissement IS NOT NULL, tp.code_type_etablissement     , 1)    = IF(@code_type_etablissement   IS NOT NULL, @code_type_etablissement   , 1)
AND IF(@code_region             IS NOT NULL, tp.code_region_partenaire      , 1)    = IF(@code_region               IS NOT NULL, @code_region               , 1)
AND IF(@code_ville              IS NOT NULL, tp.code_ville_partenaire       , 1)    = IF(@code_ville                IS NOT NULL, @code_ville                , 1)
AND IF(@code_secteur            IS NOT NULL, tp.code_secteur_partenaire     , 1)    = IF(@code_secteur              IS NOT NULL, @code_secteur              , 1)
AND IF(@nom_partenaire          IS NOT NULL, CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,'')) , 1) LIKE IF(@nom_partenaire    IS NOT NULL, @nom_partenaire    , 1)
AND IF(@code_statut_partenaire  IS NOT NULL, tp.code_statut_partenaire      , 1)    = IF(@code_statut_partenaire    IS NOT NULL, @code_statut_partenaire    , 1)
AND CASE
        WHEN @token_role = 'ADMI' THEN
            tp.code_statut_partenaire <> 'MIGR'
        ELSE
            tp.code_statut_partenaire <> 'REJE'
    END
AND CASE
        WHEN @token_role NOT IN ('ADMI','DIR','PM') THEN
            tp.code_region_partenaire IN (SELECT    tur.code_region FROM tab_utilisateur_region tur 
                                            WHERE   tur.id_utilisateur  = @token_id
                                            AND     tur.flag_actif      = 'O')
            AND
            (
                (
                    @token_medical = 'O'
                AND            
                    tp.code_type_partenaire = 'MEDE'
                AND
                    tp.code_gamme IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                        WHERE   tug.id_utilisateur  = @token_id
                                        AND     tug.flag_actif      = 'O')
                )
            OR
                (
                    @token_pharmaceutique = 'O'
                AND
                    tp.code_type_partenaire = 'PHAR'
                )
            )
        ELSE 1 = 1
    END 
`



module.exports = {
    que_tab_partenaires,
    que_nbr_tab_partenaires,
    que_add_partenaire,
    que_upd_partenaire,
    que_valider_partenaire,
    que_rejeter_partenaire,
    que_fiche_partenaire,
    que_tab_partenaire_visites,
    que_tab_visites_produits,
    que_nbr_tab_visites,
    que_tab_partenaire_bc,
    que_nbr_tab_partenaire_bc,
    que_tab_partenaire_notes,
    que_nbr_tab_partenaire_notes,
    que_tab_partenaire_docs,
    que_nbr_tab_partenaire_docs,
    que_ajouter_note,
    que_ajouter_document,
    que_supprimer_note,
    que_supprimer_document,
    que_get_infos_partenaire,
    que_export_partenaires
}