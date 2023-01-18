const que_tab_partenaires_planifies = `
SET @date_planification         = ?,
    @token_id                   = ?;

SELECT
    t.id_visite                                                                                                     ,
    t2.id_partenaire                                                                                                 ,
    t.date_visite                                                                                                   ,
    t.code_statut_visite                                                                                            ,
    (SELECT code_potentiel FROM tab_partenaire 
        WHERE id_partenaire = t2.id_partenaire LIMIT 1)                                      AS potentiel            ,
    (SELECT UPPER(CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,'')))
        FROM tab_partenaire tp 
        WHERE tp.id_partenaire = t2.id_partenaire LIMIT 1)                                   AS nom_partenaire       ,
    (SELECT code_type_partenaire    FROM tab_partenaire tp 
        WHERE tp.id_partenaire = t2.id_partenaire LIMIT 1)                                   AS code_type_partenaire ,
    (SELECT libelle_codification FROM tab_par_codification
        WHERE   type_codification = 'SPEC' 
        AND     code_codification = (SELECT code_specialite FROM tab_partenaire tp 
                                        WHERE tp.id_partenaire = t2.id_partenaire LIMIT 1))  AS specialite_partenaire,
    (SELECT libelle_codification FROM tab_par_codification
        WHERE   type_codification = 'VILL' 
        AND     code_codification = (SELECT code_ville_partenaire FROM tab_partenaire tp 
                                        WHERE tp.id_partenaire = t2.id_partenaire LIMIT 1))  AS ville_partenaire     ,
    (SELECT libelle_codification FROM tab_par_codification
        WHERE   type_codification = 'SECT' 
        AND     code_codification = (SELECT code_secteur_partenaire FROM tab_partenaire tp 
                                        WHERE tp.id_partenaire = t2.id_partenaire LIMIT 1))  AS secteur_partenaire,
    t.heure_fin_visite
FROM
    tab_visite t
    LEFT JOIN tab_partenaire_visite t2
    ON t.id_visite = t2.id_visite
WHERE
    t.id_utilisateur = @token_id
AND
    t.code_statut_visite <> 'SUPP'
AND
    t.code_type_visite = 'PLAN'
AND
    Date(t.date_visite) = @date_planification
ORDER BY
    t.date_visite;

SELECT
    (SELECT COUNT(0) FROM tab_visite tpv  
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite
        WHERE id_utilisateur = @token_id
        AND code_statut_visite <> 'SUPP'
        AND (SELECT code_type_partenaire FROM tab_partenaire WHERE id_partenaire = tpv2.id_partenaire) = 'MEDE'
        AND Date(date_visite) = @date_planification)                  AS nbr_med_planifies    ,
    (SELECT COUNT(0) FROM tab_visite tpv
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite
        WHERE id_utilisateur = @token_id
        AND code_statut_visite <> 'SUPP'
        AND (SELECT code_type_partenaire FROM tab_partenaire WHERE id_partenaire = tpv2.id_partenaire) = 'PHAR'
        AND Date(date_visite) = @date_planification)                  AS nbr_phrama_planifiees;
`

const que_tab_partenaires = `
SET @date_planification       = ?,
    @type_partenaire        = ?,
    @code_region            = ?,
    @code_ville             = ?,
    @code_secteur           = ?,
    @token_role             = ?,
    @token_id               = ?,
    @token_medical          = ?,
    @token_pharmaceutique   = ?,
    @id_partenaire          = ?,
    @nom_partenaire         = CONCAT('%',IFNULL(?,''),'%');

SELECT
    t.id_partenaire                                                                                                     ,
    t.code_type_partenaire                                                                                              ,
    UPPER(CONCAT(t.nom_partenaire,' ',IF(t.prenom_partenaire IS NOT NULL,t.prenom_partenaire,'')))     AS nom_partenaire       ,
    (SELECT code_potentiel FROM tab_partenaire 
        WHERE id_partenaire = t.id_partenaire LIMIT 1)                                          AS potentiel            ,
    (SELECT libelle_codification FROM tab_par_codification
        WHERE   type_codification = 'SPEC' 
        AND     code_codification = (SELECT code_specialite FROM tab_partenaire tp 
                                        WHERE tp.id_partenaire = t.id_partenaire LIMIT 1))      AS specialite_partenaire,
    (SELECT date_visite FROM tab_visite tpv
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite
        WHERE    tpv2.id_partenaire       = t.id_partenaire
        AND      tpv.code_statut_visite IN ('REAL','ABSE')
        AND      tpv.id_utilisateur      = @token_id
        ORDER BY tpv.id_visite DESC LIMIT 1)                                                    AS date_derniere_visite,
        (SELECT libelle_codification FROM tab_par_codification WHERE code_codification LIKE t.code_ville_partenaire) AS libelle_ville                

FROM
    tab_partenaire t
WHERE 
    t.code_statut_partenaire = 'VALI'
AND CASE
        WHEN @token_role NOT IN ('ADMI','DIR','PM') THEN
                t.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                            WHERE   tur.id_utilisateur  = @token_id
                                            AND     tur.flag_actif      = 'O')
            AND
            (
                (
                        @token_medical = 'O'
                    AND
                        t.code_type_partenaire = 'MEDE'
                    AND
                        t.code_gamme IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                        WHERE   tug.id_utilisateur  = @token_id
                                        AND     tug.flag_actif      = 'O')
                )
                OR
                (
                        @token_pharmaceutique = 'O'
                    AND
                        t.code_type_partenaire = 'PHAR'
                )
            )
        ELSE 1 = 1
    END 
AND (
            t.id_partenaire NOT IN (SELECT tpv2.id_partenaire FROM tab_visite tpv1
            LEFT JOIN tab_partenaire_visite tpv2
            ON tpv1.id_visite = tpv2.id_visite
            WHERE   Date(tpv1.date_visite)   = @date_planification
            AND     tpv1.id_utilisateur     = @token_id)
    )


AND IF(@type_partenaire IS NOT NULL, t.code_type_partenaire     , 1)    = IF(@type_partenaire   IS NOT NULL, @type_partenaire   , 1)
AND IF(@code_region     IS NOT NULL, t.code_region_partenaire   , 1)    = IF(@code_region       IS NOT NULL, @code_region       , 1)
AND IF(@code_ville      IS NOT NULL, t.code_ville_partenaire    , 1)    = IF(@code_ville        IS NOT NULL, @code_ville        , 1)
AND IF(@code_secteur    IS NOT NULL, t.code_secteur_partenaire  , 1)    = IF(@code_secteur      IS NOT NULL, @code_secteur      , 1) 
AND IF(@id_partenaire   IS NOT NULL, t.id_partenaire            , 1)    = IF(@id_partenaire     IS NOT NULL, @id_partenaire     , 1)
AND IF(@nom_partenaire  IS NOT NULL, CONCAT(t.nom_partenaire,' ',IF(t.prenom_partenaire IS NOT NULL,t.prenom_partenaire,'')) , 1) LIKE IF(@nom_partenaire    IS NOT NULL, @nom_partenaire    , 1)
`

const que_nbr_tab_partenaires = `
SET @date_planification       = ?,
    @type_partenaire        = ?,
    @code_region            = ?,
    @code_ville             = ?,
    @code_secteur           = ?,
    @token_role             = ?,
    @token_id               = ?,
    @token_medical          = ?,
    @token_pharmaceutique   = ?,
    @id_partenaire          = ?,
    @nom_partenaire         = CONCAT('%',IFNULL(?,''),'%');

SELECT
    COUNT(t.id_partenaire) AS nbr_total_partenaires
FROM
    tab_partenaire t
WHERE 
    t.code_statut_partenaire = 'VALI'
AND CASE
        WHEN @token_role NOT IN ('ADMI','DIR','PM') THEN
                t.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                            WHERE   tur.id_utilisateur  = @token_id
                                            AND     tur.flag_actif      = 'O')
            AND
            (
                (
                        @token_medical = 'O'
                    AND
                        t.code_type_partenaire = 'MEDE'
                    AND
                        t.code_gamme IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                        WHERE   tug.id_utilisateur  = @token_id
                                        AND     tug.flag_actif      = 'O')
                )
                OR
                (
                        @token_pharmaceutique = 'O'
                    AND
                        t.code_type_partenaire = 'PHAR'
                )
            )
        ELSE 1 = 1
    END 
AND (
            t.id_partenaire NOT IN (SELECT tpv2.id_partenaire FROM tab_visite tpv1
            LEFT JOIN tab_partenaire_visite tpv2 ON tpv1.id_visite = tpv2.id_visite
            WHERE   Date(tpv1.date_visite)   = @date_planification
            AND     tpv1.id_utilisateur     = @token_id)
    )


AND IF(@type_partenaire IS NOT NULL, t.code_type_partenaire     , 1)    = IF(@type_partenaire   IS NOT NULL, @type_partenaire   , 1)
AND IF(@code_region     IS NOT NULL, t.code_region_partenaire   , 1)    = IF(@code_region       IS NOT NULL, @code_region       , 1)
AND IF(@code_ville      IS NOT NULL, t.code_ville_partenaire    , 1)    = IF(@code_ville        IS NOT NULL, @code_ville        , 1)
AND IF(@code_secteur    IS NOT NULL, t.code_secteur_partenaire  , 1)    = IF(@code_secteur      IS NOT NULL, @code_secteur      , 1) 
AND IF(@id_partenaire   IS NOT NULL, t.id_partenaire            , 1)    = IF(@id_partenaire     IS NOT NULL, @id_partenaire     , 1)
AND IF(@nom_partenaire  IS NOT NULL, CONCAT(t.nom_partenaire,' ',IF(t.prenom_partenaire IS NOT NULL,t.prenom_partenaire,'')) , 1) LIKE IF(@nom_partenaire    IS NOT NULL, @nom_partenaire    , 1)
`

const que_tab_partenaires_old = `
SET @id_planification       = ?,
    @type_partenaire        = ?,
    @code_region            = ?,
    @code_ville             = ?,
    @code_secteur           = ?,
    @token_role             = ?,
    @token_id               = ?,
    @token_medical          = ?,
    @token_pharmaceutique   = ?,
    @id_partenaire          = ?,
    @nom_partenaire         = CONCAT('%',IFNULL(?,''),'%');

SELECT
    t.id_partenaire                                                                                                     ,
    t.code_type_partenaire                                                                                              ,
    UPPER(CONCAT(t.nom_partenaire,' ',IF(t.prenom_partenaire IS NOT NULL,t.prenom_partenaire,'')))     AS nom_partenaire       ,
    (SELECT code_potentiel FROM tab_partenaire 
        WHERE id_partenaire = t.id_partenaire LIMIT 1)                                          AS potentiel            ,
    (SELECT libelle_codification FROM tab_par_codification
        WHERE   type_codification = 'SPEC' 
        AND     code_codification = (SELECT code_specialite FROM tab_partenaire tp 
                                        WHERE tp.id_partenaire = t.id_partenaire LIMIT 1))      AS specialite_partenaire,
    (SELECT date_visite FROM tab_visite tpv
        WHERE    tpv.id_partenaire       = t.id_partenaire
        AND      tpv.code_statut_visite IN ('REAL','ABSE')
        AND      tpv.id_utilisateur      = @token_id
        ORDER BY tpv.id_visite DESC LIMIT 1)                                                    AS date_derniere_visite
FROM
    tab_partenaire t
WHERE 
    t.code_statut_partenaire = 'VALI'
AND CASE
        WHEN @token_role NOT IN ('ADMI','DIR','PM') THEN
                t.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                            WHERE   tur.id_utilisateur  = @token_id
                                            AND     tur.flag_actif      = 'O')
            AND
            (
                (
                        @token_medical = 'O'
                    AND
                        t.code_type_partenaire = 'MEDE'
                    AND
                        t.code_gamme IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                        WHERE   tug.id_utilisateur  = @token_id
                                        AND     tug.flag_actif      = 'O')
                )
                OR
                (
                        @token_pharmaceutique = 'O'
                    AND
                        t.code_type_partenaire = 'PHAR'
                )
            )
        ELSE 1 = 1
    END 
AND (
        (
                t.id_partenaire IN (SELECT tpv1.id_partenaire FROM tab_visite tpv1
                                            WHERE   tpv1.id_planification   = @id_planification
                                            AND     tpv1.id_utilisateur     = @token_id)
            AND 
                (IF(EXISTS(SELECT 1 FROM tab_visite tpv1
                                WHERE   tpv1.id_planification   = @id_planification 
                                AND     tpv1.id_partenaire      = t.id_partenaire 
                                AND     tpv1.id_utilisateur     = @token_id 
                                AND     tpv1.code_statut_visite = 'ENAT' LIMIT 1), 0, 1)) = 1
        )
        OR
            t.id_partenaire NOT IN (SELECT tpv1.id_partenaire FROM tab_visite tpv1
            WHERE   tpv1.id_planification   = @id_planification
            AND     tpv1.id_utilisateur     = @token_id)
    )


AND IF(@type_partenaire IS NOT NULL, t.code_type_partenaire     , 1)    = IF(@type_partenaire   IS NOT NULL, @type_partenaire   , 1)
AND IF(@code_region     IS NOT NULL, t.code_region_partenaire   , 1)    = IF(@code_region       IS NOT NULL, @code_region       , 1)
AND IF(@code_ville      IS NOT NULL, t.code_ville_partenaire    , 1)    = IF(@code_ville        IS NOT NULL, @code_ville        , 1)
AND IF(@code_secteur    IS NOT NULL, t.code_secteur_partenaire  , 1)    = IF(@code_secteur      IS NOT NULL, @code_secteur      , 1) 
AND IF(@id_partenaire   IS NOT NULL, t.id_partenaire            , 1)    = IF(@id_partenaire     IS NOT NULL, @id_partenaire     , 1)
AND IF(@nom_partenaire  IS NOT NULL, CONCAT(t.nom_partenaire,' ',IF(t.prenom_partenaire IS NOT NULL,t.prenom_partenaire,'')) , 1) LIKE IF(@nom_partenaire    IS NOT NULL, @nom_partenaire    , 1)
`

const que_ajout_planification = `
SET @date_debut_planification   = ?,
    @date_fin_planification     = ?,
    @token_id                   = ?,
    @id_planification           = NULL;

SELECT  id_planification INTO @id_planification
FROM    tab_planification
WHERE   date_deb_planification = @date_debut_planification
AND     date_fin_planification = @date_fin_planification
AND		id_utilisateur		   = @token_id        ;

IF @id_planification IS NULL THEN
    INSERT INTO tab_planification (
        id_utilisateur          ,
        date_deb_planification  ,
        date_fin_planification
    )
    VALUES (
        @token_id             ,
        @date_debut_planification   ,
        @date_fin_planification     
    );
    SELECT LAST_INSERT_ID() INTO @id_planification;
END IF;
SELECT @id_planification AS id_planification;
`

const que_ajout_visite_planifiee = `
SET @id_partenaire          = ?,
    @date_visite            = ?,
    @token_id               = ?,
    @token_role             = ?,
    @token_medical          = ?,
    @token_pharmaceutique   = ?,
    @code_region_partenaire = NULL,
    @code_type_partenaire   = NULL,
    @code_gamme_partenaire  = NULL,
    @heure_fin_visite = ?
    ;



SELECT
@conflictCountV := COUNT(tpv.id_visite)
FROM
    tab_visite tpv
WHERE
    tpv.id_utilisateur = @token_id 
    AND
    tpv.code_statut_visite <> 'SUPP'
    AND
    (
        (
            @date_visite >= tpv.date_visite 
            AND @date_visite < CONCAT(DATE(tpv.date_visite),' ',tpv.heure_fin_visite)
        ) OR(
            CONCAT(DATE(@date_visite),' ',@heure_fin_visite) > tpv.date_visite
            AND CONCAT(DATE(@date_visite),' ',@heure_fin_visite) <= CONCAT(DATE(tpv.date_visite),' ',tpv.heure_fin_visite)
        ) 
    );



SELECT
@conflictCountE := COUNT(te.id_evenement),
@idsE := CONCAT('[', GROUP_CONCAT(te.id_evenement),
']')
FROM
    tab_evenement te
WHERE
    te.id_utilisateur = @token_id 
    AND(
        (
            @date_visite >= te.date_deb_evenement 
            AND 
            @date_visite < te.date_fin_evenement
        ) 
        OR
        (
            CONCAT(DATE(@date_visite),' ',@heure_fin_visite) > te.date_deb_evenement 
            AND 
            CONCAT(DATE(@date_visite),' ',@heure_fin_visite) <= te.date_fin_evenement
        )
    );


IF (SELECT tp.code_statut_partenaire FROM tab_partenaire tp
    WHERE tp.id_partenaire = @id_partenaire) = 'VALI' THEN 

    IF (@conflictCountE = 0 AND @conflictCountV = 0)
    THEN

        SELECT  tp.code_region_partenaire, tp.code_type_partenaire INTO @code_region_partenaire, @code_type_partenaire
        FROM    tab_partenaire tp
        WHERE   tp.id_partenaire = @id_partenaire;

        SELECT  code_parent INTO @code_gamme_partenaire
        FROM    tab_par_codification
        WHERE   type_codification = 'SPEC'
        AND     code_codification = (SELECT tp.code_specialite FROM tab_partenaire tp
                                        WHERE tp.id_partenaire = @id_partenaire)
        AND     type_parent       = 'GAMM';

        INSERT INTO tab_visite (
            id_utilisateur          ,
            role_utilisateur        ,
            flag_medical            ,
            flag_pharmaceutique     ,
            code_type_visite        ,
            code_statut_visite      ,
            date_visite             ,
            id_responsable          ,
            heure_fin_visite        ,
            type_visite
        )
        VALUES (
            @token_id               ,
            @token_role             ,
            @token_medical          ,
            @token_pharmaceutique   ,
            'PLAN'                  ,
            'ENAT'                  ,
            @date_visite            ,
            (SELECT tu.id_responsable FROM tab_utilisateur tu WHERE tu.id_utilisateur = @token_id),
            @heure_fin_visite       ,
            'S'
        );
        
        SELECT id_visite INTO @id_new_visite FROM tab_visite ORDER BY id_visite DESC LIMIT 1;

        INSERT INTO tab_partenaire_visite(
            id_visite,
            id_partenaire,
            code_region_partenaire,
            code_type_partenaire,
            code_gamme_partenaire) 
        VALUES (
            @id_new_visite,
            @id_partenaire,
            @code_region_partenaire ,
            @code_type_partenaire   ,
            @code_gamme_partenaire  
        );

        SELECT "false" AS notFree; 

        SELECT 'ok' INTO @done;
        
        SELECT LAST_INSERT_ID() AS id_visite;

    ELSE
        SELECT "true" AS notFree; 
    END IF;

    
ELSE
    SELECT 'ko' INTO @done;
END IF; 

SELECT @done AS done;
`

const que_annuler_visite = `
SET @token_id       = ?,
    @id_visite      = ?,
    @nom_partenaire = NULL;

SELECT  CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,'')) INTO @nom_partenaire
FROM    tab_partenaire tp
WHERE   tp.id_partenaire = (SELECT  id_partenaire FROM tab_visite tpv
                            LEFT JOIN tab_partenaire_visite tpvr ON
                            tpvr.id_visite = tpv.id_visite
                            WHERE   tpv.id_visite           = @id_visite
                            AND     tpv.code_statut_visite  = 'ENAT' LIMIT 1);

IF (SELECT tpv.code_statut_visite FROM tab_visite tpv
        WHERE tpv.id_visite = @id_visite) = 'ENAT' 
    AND
    (SELECT tpv.id_utilisateur FROM tab_visite tpv
        WHERE tpv.id_visite = @id_visite) = @token_id THEN

    DELETE  FROM tab_visite
    WHERE   id_visite       = @id_visite
    AND     id_utilisateur  = @token_id;

END IF;

SELECT @nom_partenaire AS nom_partenaire;
`

const que_tab_planifications = `
SET @token_id               = ?,
    @token_role             = ?,
    @token_medical          = ?,
    @token_pharmaceutique   = ?,
    @date_deb_semaine       = ?,
    @date_fin_semaine       = ?,
    @id_utilisateur         = ?;

SELECT
    tpl.id_planification                                                                                            ,
    tpl.date_deb_planification                                                                                      ,
    tpl.date_fin_planification                                                                                      ,
    tpl.id_utilisateur                                                                                              ,
    (SELECT CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur) FROM tab_utilisateur tu
        WHERE tu.id_utilisateur = tpl.id_utilisateur)                                        AS nom_utilisateur     ,
    (SELECT COUNT(0) FROM tab_visite tpv
        WHERE   tpv.id_planification    = tpl.id_planification
        AND     tpv.id_utilisateur      = tpl.id_utilisateur
        AND     tpv.code_type_visite    = 'PLAN'
        AND     tpv.code_statut_visite  = 'REAL'
        AND     tpv.date_visite BETWEEN tpl.date_deb_planification AND tpl.date_fin_planification
    )                                                                                       AS total_realises       ,  
    (SELECT COUNT(0) FROM tab_visite tpv
        WHERE   tpv.id_planification    = tpl.id_planification
        AND     tpv.id_utilisateur      = tpl.id_utilisateur
        AND     tpv.code_type_visite    = 'PLAN'
        AND     tpv.code_statut_visite  = 'ABSE'
        AND     tpv.date_visite BETWEEN tpl.date_deb_planification AND tpl.date_fin_planification
    )                                                                                       AS total_absent         ,
    (SELECT COUNT(0) FROM tab_visite tpv
        WHERE   tpv.id_planification    = tpl.id_planification
        AND     tpv.id_utilisateur      = tpl.id_utilisateur
        AND     tpv.code_type_visite    = 'PLAN'
        AND     tpv.code_statut_visite  = 'REPL'
        AND     tpv.date_visite BETWEEN tpl.date_deb_planification AND tpl.date_fin_planification
    )                                                                                       AS total_replanifies    ,
    (SELECT COUNT(0) FROM tab_visite tpv
        WHERE   tpv.id_planification    = tpl.id_planification
        AND     tpv.id_utilisateur      = tpl.id_utilisateur
        AND     tpv.code_type_visite    = 'PLAN'
        AND     tpv.code_statut_visite  = 'ENAT'
        AND     tpv.date_visite BETWEEN tpl.date_deb_planification AND tpl.date_fin_planification
    )                                                                                       AS total_en_attente     ,
    (SELECT COUNT(0) FROM tab_visite tpv
        WHERE   tpv.id_planification    = tpl.id_planification
        AND     tpv.id_utilisateur      = tpl.id_utilisateur
        AND     tpv.code_type_visite    = 'PLAN'
        AND     tpv.date_visite BETWEEN tpl.date_deb_planification AND tpl.date_fin_planification
    )                                                                                       AS total_planifies
FROM        tab_planification tpl
LEFT JOIN   tab_visite tpv ON tpv.id_planification = tpl.id_planification
WHERE 
    tpv.code_type_visite = 'PLAN'
AND IF(@id_utilisateur IS NOT NULL, tpl.id_utilisateur, 1) = IF(@id_utilisateur IS NOT NULL, @id_utilisateur, 1)
AND CASE 
        WHEN @date_deb_semaine IS NOT NULL AND @date_fin_semaine IS NOT NULL THEN
            tpl.date_deb_planification = @date_deb_semaine AND tpl.date_fin_planification = @date_fin_semaine  
        ELSE 1 = 1
    END      
AND CASE
        WHEN @token_role NOT IN ('ADMI','DIR','PM') THEN 
                tpl.id_utilisateur = @token_id
            OR
                tpv.id_responsable  = @token_id
            OR
                tpl.id_utilisateur  IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                            WHERE tu1.id_responsable IN (
                                                SELECT tu2.id_utilisateur FROM tab_utilisateur tu2
                                                                            WHERE tu2.id_responsable = @token_id)
                                        )
            OR
                tpl.id_utilisateur  IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                            WHERE tu1.id_responsable IN (
                                                                            SELECT  tu2.id_utilisateur FROM tab_utilisateur tu2
                                                                            WHERE   tu2.id_responsable IN (
                                                                                        SELECT  tu3.id_utilisateur FROM tab_utilisateur tu3
                                                                                        WHERE   tu3.id_responsable = @token_id
                                                                                    )
                                                                        )
                                        )
        ELSE 1 = 1
    END
GROUP BY tpl.id_planification 
`

const que_nbr_tab_planifications = `
SET @token_id               = ?,
    @token_role             = ?,
    @token_medical          = ?,
    @token_pharmaceutique   = ?,
    @date_deb_semaine       = ?,
    @date_fin_semaine       = ?,
    @id_utilisateur         = ?;

SELECT      COUNT(DISTINCT(tpl.id_planification)) AS nbr_total_planifications
FROM        tab_planification tpl
LEFT JOIN   tab_visite tpv ON tpv.id_planification = tpl.id_planification
WHERE 
    tpv.code_type_visite = 'PLAN'
AND IF(@id_utilisateur IS NOT NULL, tpv.id_utilisateur, 1) = IF(@id_utilisateur IS NOT NULL, @id_utilisateur, 1)
AND CASE 
        WHEN @date_deb_semaine IS NOT NULL AND @date_fin_semaine IS NOT NULL THEN
            tpl.date_deb_planification = @date_deb_semaine AND tpl.date_fin_planification = @date_fin_semaine  
        ELSE 1 = 1
    END      
AND CASE
        WHEN @token_role NOT IN ('ADMI','DIR','PM') THEN 
                tpl.id_utilisateur = @token_id
            OR
            (
                (
                    ( @token_role = ('KAM') AND tpv.role_utilisateur = 'DEL')
                    OR
                    ( @token_role = ('DSM') AND tpv.role_utilisateur IN ('KAM','DEL'))
                    OR
                    ( @token_role = ('DRG') AND tpv.role_utilisateur IN ('DSM','KAM','DEL'))
                )
                AND
                    tpl.id_utilisateur IN (SELECT  tu.id_utilisateur FROM tab_utilisateur tu
                                            LEFT JOIN tab_utilisateur_region tur    ON tu.id_utilisateur = tur.id_utilisateur
                                            LEFT JOIN tab_utilisateur_gamme tug     ON tu.id_utilisateur = tug.id_utilisateur
                                            WHERE   
                                                tur.code_region IN (SELECT tur1.code_region FROM tab_utilisateur_region tur1
                                                                    WHERE tur1.id_utilisateur   = @token_id
                                                                    AND     tur1.flag_actif     = 'O')
                                            AND
                                            (
                                                (
                                                        @token_medical = 'O'
                                                    AND
                                                        (SELECT tu.flag_medical FROM tab_utilisateur tu
                                                            WHERE tu.id_utilisateur = tpl.id_utilisateur) = 'O'
                                                    AND
                                                        tug.code_gamme IN (SELECT tug1.code_gamme FROM tab_utilisateur_gamme tug1
                                                                            WHERE   tug1.id_utilisateur = @token_id
                                                                            AND     tug1.flag_actif     = 'O')
                                                )
                                                OR
                                                (
                                                        @token_pharmaceutique = 'O'
                                                    AND
                                                        (SELECT tu.flag_pharmaceutique FROM tab_utilisateur tu
                                                            WHERE tu.id_utilisateur = tpl.id_utilisateur) = 'O'
                                                )
                                            ))
            )
        ELSE 1 = 1
    END;
`

const que_tab_rapports = `
SET @token_id           = ?,
    @token_role         = ?,
    @id_planification   = ?,
    @date_jour          = ?;

IF (SELECT tpv.id_utilisateur FROM tab_visite tpv
        WHERE tpv.id_planification = @id_planification LIMIT 1) = @token_id THEN
    SELECT
        tpv.id_visite                                                                                                       ,
        tpv.id_planification                                                                                                ,
        tpv.id_utilisateur                                                                                                  ,
        tpv.id_partenaire                                                                                                   ,
        tpv.code_statut_visite                                                                                              ,
        tpv.date_visite                                                                                                     ,
        tpv.date_replanification                                                                                            ,
        (SELECT UPPER(CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,'')))
        FROM tab_partenaire tp WHERE id_partenaire = tpv.id_partenaire)                         AS nom_partenaire           ,
        (SELECT code_potentiel FROM tab_partenaire WHERE id_partenaire = tpv.id_partenaire)     AS code_potentiel           ,
        (SELECT code_specialite FROM tab_partenaire WHERE id_partenaire = tpv.id_partenaire)    AS code_specialite          ,
        (SELECT code_type_partenaire FROM tab_partenaire
            WHERE id_partenaire = tpv.id_partenaire)                                            AS code_type_partenaire     ,
        IF((SELECT code_type_partenaire FROM tab_partenaire
            WHERE id_partenaire = tpv.id_partenaire) = 'MEDE', 'Médecin', 'Pharmacie')          AS type_partenaire          ,
        (SELECT libelle_codification FROM tab_par_codification 
            WHERE   type_codification = 'SPEC' 
            AND     code_codification = (SELECT code_specialite FROM tab_partenaire
                                        WHERE id_partenaire = tpv.id_partenaire LIMIT 1))       AS specialite               ,
        (SELECT libelle_codification FROM tab_par_codification 
            WHERE   type_codification = 'VILL' 
            AND     code_codification = (SELECT code_ville_partenaire FROM tab_partenaire
                                            WHERE id_partenaire = tpv.id_partenaire LIMIT 1))   AS ville_partenaire         ,
        (SELECT libelle_codification FROM tab_par_codification 
            WHERE   type_codification = 'SECT' 
            AND     code_codification = (SELECT code_secteur_partenaire FROM tab_partenaire
                                            WHERE id_partenaire = tpv.id_partenaire LIMIT 1))   AS secteur_partenaire
    FROM        
        tab_visite tpv
    WHERE
        IF(@date_jour IS NOT NULL, date_visite, 1) = IF(@date_jour IS NOT NULL, @date_jour, 1)
    AND tpv.code_type_visite = 'PLAN'
    AND tpv.id_planification = @id_planification
    AND tpv.id_utilisateur   = @token_id     
`

const que_get_semaine_planification = `
SET @id_planification   = ?;
SELECT
    (SELECT date_deb_planification FROM tab_planification tpl 
        WHERE tpl.id_planification = @id_planification)                                 AS date_deb_planification   ,
    (SELECT date_fin_planification FROM tab_planification tpl 
        WHERE tpl.id_planification = @id_planification)                                 AS date_fin_planification   ,
    WEEKOFYEAR(NOW())                                                                   AS num_semaine              ;
`

const que_nbr_tab_rapports = `
SET @token_id           = ?,
    @token_role         = ?,
    @id_planification   = ?,
    @date_jour          = ?;

SELECT  date_deb_planification, date_fin_planification INTO @date_deb_planification, @date_fin_planification
FROM    tab_planification 
WHERE   id_planification = @id_planification;

SELECT
    COUNT(0) AS nbr_total_rapports
    FROM        
    tab_visite tpv
WHERE
    IF(@date_jour IS NOT NULL, date_visite, 1) = IF(@date_jour IS NOT NULL, @date_jour, 1)
AND tpv.code_type_visite = 'PLAN'
AND tpv.id_planification = @id_planification
AND tpv.id_utilisateur   = @token_id;
`

const que_ajouter_rapport_planification = `
SET @token_id               = ?,
    @token_role             = ?,
    @id_visite              = ?,
    @id_planification       = ?,
    @id_partenaire          = ?,
    @code_statut_visite     = ?,
    @code_potentiel         = ?,
    @flag_accompagnee       = ?,
    @id_accompagnant        = ?,
    @date_replanification   = ?,
    @commentaire            = ?,
    @id_new_planification   = NULL,
    @date_deb_semaine       = NULL,
    @id_new_visite          = NULL,
    @date_visite            = ?,
    @notFree                = NULL,
    @heure_fin_visite       = ?,
    @type_visite            = ?;


SELECT
@conflictCountV := COUNT(tpv.id_visite)
FROM
    tab_visite tpv
WHERE
    tpv.id_utilisateur = @token_id 
    AND
    tpv.code_statut_visite <> 'SUPP' 
    AND
    tpv.id_visite <> @id_visite
    AND
    (
        (
            DATE(IF(@date_visite IS NOT NULL, @date_visite, @date_replanification)) >= DATE(tpv.date_visite) 
            AND 
            DATE(@date_visite) < DATE(CONCAT(DATE(tpv.date_visite),' ',tpv.heure_fin_visite))
        ) OR(
            DATE(CONCAT(DATE(IF(@date_visite IS NOT NULL, @date_visite, @date_replanification)),' ',@heure_fin_visite)) >DATE( tpv.date_visite)
            AND 
            DATE(CONCAT(DATE(IF(@date_visite IS NOT NULL, @date_visite, @date_replanification)),' ',@heure_fin_visite)) <= DATE(CONCAT(DATE(tpv.date_visite),' ',tpv.heure_fin_visite))
        )
    );


SELECT
@conflictCountE := COUNT(te.id_evenement),
@idsE := CONCAT('[', GROUP_CONCAT(te.id_evenement),
']')
FROM
    tab_evenement te
WHERE
    te.id_utilisateur = @token_id 
    AND(
        (
            IF(@date_visite IS NOT NULL, @date_visite, @date_replanification) >= te.date_deb_evenement 
            AND 
            IF(@date_visite IS NOT NULL, @date_visite, @date_replanification) < te.date_fin_evenement
        ) OR(
            CONCAT(DATE(IF(@date_visite IS NOT NULL, @date_visite, @date_replanification)),' ',@heure_fin_visite) > te.date_deb_evenement 
            AND 
            CONCAT(DATE(IF(@date_visite IS NOT NULL, @date_visite, @date_replanification)),' ',@heure_fin_visite) <= te.date_fin_evenement
        )
    );


SELECT
@conflictCountP := COUNT(tpv2.id_partenaire)
FROM
    tab_visite tpv
    LEFT JOIN tab_partenaire_visite tpv2
    ON tpv.id_visite = tpv2.id_visite
WHERE
    tpv.id_utilisateur = @token_id 
    AND
    tpv.code_statut_visite <> 'SUPP'
    AND
    tpv2.id_partenaire = @id_partenaire
    AND
    tpv.date_visite = @date_replanification;


IF (SELECT tpv.date_visite FROM tab_visite tpv
        WHERE tpv.id_visite = @id_visite) <= NOW() THEN
    IF @code_statut_visite = 'REAL' AND (SELECT id_utilisateur FROM tab_visite
                                            WHERE id_visite = @id_visite) = @token_id THEN
        
        IF  (@conflictCountE = 0 AND @conflictCountV = 0)     
        THEN

            UPDATE  tab_visite
            SET     code_statut_visite      = @code_statut_visite   ,
                    flag_accompagnee        = @flag_accompagnee     ,
                    commentaire             = @commentaire          ,
                    id_accompagnant         = @id_accompagnant      ,
                    type_visite             = @type_visite          ,
                    date_rapport            = NOW()                 ,
                    date_visite             = @date_visite          ,
                    heure_fin_visite        = @heure_fin_visite
            WHERE   id_visite               = @id_visite            
            AND     id_utilisateur          = @token_id             ;

        ELSE
            SELECT "true" INTO @notFree; 
        END IF;

    ELSEIF @code_statut_visite = 'ABSE' AND (SELECT id_utilisateur FROM tab_visite
                                                WHERE id_visite = @id_visite) = @token_id THEN

        IF  (@conflictCountE = 0 AND @conflictCountV = 0)     
        THEN

            UPDATE  tab_visite
            SET     code_statut_visite      = @code_statut_visite   ,
                    flag_accompagnee        = @flag_accompagnee     ,
                    id_accompagnant         = @id_accompagnant      ,
                    commentaire             = @commentaire          ,
                    type_visite             = @type_visite          ,
                    date_visite             = @date_visite          ,
                    heure_fin_visite        = @heure_fin_visite     ,
                    date_rapport            = NOW(),
                    heure_fin_visite = @heure_fin_visite
            WHERE   id_visite               = @id_visite            
            AND     id_utilisateur          = @token_id             ;

        ELSE
            SELECT "true" INTO @notFree; 
        END IF;

    ELSEIF @code_statut_visite = 'REPL' AND (SELECT id_utilisateur FROM tab_visite
                                                WHERE id_visite = @id_visite) = @token_id THEN


        IF  (@conflictCountE = 0 AND @conflictCountV = 0 AND @conflictCountP = 0)     
        THEN

            INSERT INTO tab_visite (
                id_visite_origine           ,
                id_utilisateur              ,
                role_utilisateur            ,
                code_type_visite            ,
                code_statut_visite          ,
                flag_accompagnee            ,
                id_accompagnant             ,
                date_visite                 ,
                id_responsable              ,
                heure_fin_visite            ,
                type_visite
            ) VALUES(
                @id_visite                  ,
                @token_id                   ,
                @token_role                 ,
                'PLAN'                      ,
                'ENAT'                      ,
                @flag_accompagnee           ,
                @id_accompagnant            ,
                @date_replanification       ,
                (SELECT tpv.id_responsable FROM tab_visite tpv WHERE tpv.id_visite = @id_visite),
                TIME(ADDTIME(@date_replanification, "00:30:00")),
                @type_visite
            );
            SELECT LAST_INSERT_ID() INTO @id_new_visite;
            
            UPDATE  tab_visite
            SET     code_statut_visite      = 'REPL'                ,
                    date_replanification    = @date_replanification ,
                    id_visite_replanifiee   = @id_new_visite        ,
                    date_visite             = @date_visite          ,
                    heure_fin_visite        = @heure_fin_visite     ,
                    type_visite             = @type_visite          

            WHERE   id_visite               = @id_visite
            AND     id_utilisateur          = @token_id             ;

            SELECT "false" INTO @notFree; 

            SELECT @id_new_visite INTO @id_visite;

        ELSE
            SELECT "true" INTO @notFree; 
        END IF;

    ELSEIF @code_statut_visite = 'ENAT' AND (SELECT id_utilisateur FROM tab_visite
        WHERE id_visite = @id_visite) = @token_id THEN    
        UPDATE  tab_visite
        SET     date_visite             = @date_visite          ,
                heure_fin_visite        = @heure_fin_visite     ,
                commentaire             = @commentaire 
        WHERE   id_visite               = @id_visite
        AND     id_utilisateur          = @token_id             ;
    END IF;    
END IF;
SELECT  @id_visite AS id_visite ,
        (SELECT tpv.date_visite
        FROM    tab_visite tpv
        WHERE   tpv.id_visite = @id_visite) AS date_visite,
        @notFree AS notFree;
`


const que_ajouter_rapport_planification_old = `
SET @token_id               = ?,
    @token_role             = ?,
    @id_visite              = ?,
    @id_planification       = ?,
    @id_partenaire          = ?,
    @code_statut_visite     = ?,
    @code_potentiel         = ?,
    @flag_accompagnee       = ?,
    @id_accompagnant        = ?,
    @date_replanification   = ?,
    @commentaire            = ?,
    @id_new_planification   = NULL,
    @date_deb_semaine       = NULL,
    @id_new_visite          = NULL,
    @date_visite            = NULL;

IF (SELECT tpv.date_visite FROM tab_visite tpv
        WHERE tpv.id_visite = @id_visite) <= NOW() THEN
    IF @code_statut_visite = 'REAL' AND (SELECT id_utilisateur FROM tab_visite
                                            WHERE id_visite = @id_visite) = @token_id THEN

        UPDATE  tab_visite
        SET     code_statut_visite      = @code_statut_visite   ,
                flag_accompagnee        = @flag_accompagnee     ,
                id_accompagnant         = @id_accompagnant      ,
                date_rapport            = NOW()
        WHERE   id_visite               = @id_visite            
        AND     id_utilisateur          = @token_id             ;

    ELSEIF @code_statut_visite = 'ABSE' AND (SELECT id_utilisateur FROM tab_visite
                                                WHERE id_visite = @id_visite) = @token_id THEN
        UPDATE  tab_visite
        SET     code_statut_visite      = @code_statut_visite   ,
                flag_accompagnee        = @flag_accompagnee     ,
                id_accompagnant         = @id_accompagnant      ,
                commentaire             = @commentaire          ,
                date_rapport            = NOW()
        WHERE   id_visite               = @id_visite            
        AND     id_utilisateur          = @token_id             ;

    ELSEIF @code_statut_visite = 'REPL' AND (SELECT id_utilisateur FROM tab_visite
                                                WHERE id_visite = @id_visite) = @token_id THEN
        SELECT  id_planification INTO @id_new_planification
        FROM    tab_planification
        WHERE   @date_replanification BETWEEN date_deb_planification AND date_fin_planification
        AND     id_utilisateur      = @token_id LIMIT 1         ;

        IF  @id_new_planification IS NOT NULL AND @id_new_planification = @id_planification THEN
            UPDATE  tab_visite
            SET     date_visite     = @date_replanification
            WHERE   id_visite       = @id_visite
            AND     id_utilisateur  = @token_id                 ;

        ELSE 
            IF  @id_new_planification IS NOT NULL 
            AND
                ((IF( EXISTS(SELECT 1 FROM tab_visite tpv
                                WHERE   tpv.id_planification    = @id_new_planification
                                AND     tpv.id_partenaire       = @id_partenaire 
                                AND     tpv.code_statut_visite  = 'ENAT' LIMIT 1), 1, 0)) = 1) THEN
                SELECT 0 INTO @id_visite;
            ELSE
                IF @id_new_planification IS NULL THEN 
                    SELECT DATE_ADD(@date_replanification, INTERVAL(-WEEKDAY(@date_replanification)) DAY) INTO @date_deb_semaine;

                    INSERT INTO tab_planification (
                        id_utilisateur          ,
                        date_deb_planification  ,
                        date_fin_planification
                    ) VALUES (
                        @token_id               ,
                        @date_deb_semaine       ,
                        DATE_ADD(@date_deb_semaine, INTERVAL 6 DAY)
                    );
                    SELECT LAST_INSERT_ID() INTO @id_new_planification;
                END IF;

                INSERT INTO tab_visite (
                    id_visite_origine           ,
                    id_planification            ,
                    id_utilisateur              ,
                    id_partenaire               ,
                    role_utilisateur            ,
                    code_type_visite            ,
                    code_statut_visite          ,
                    flag_accompagnee            ,
                    id_accompagnant             ,
                    date_visite                 ,
                    code_region_partenaire      ,
                    code_type_partenaire        ,
                    id_responsable              ,
                    code_gamme_partenaire
                ) VALUES(
                    @id_visite                  ,
                    @id_new_planification       ,
                    @token_id                   ,
                    @id_partenaire              ,
                    @token_role                 ,
                    'PLAN'                      ,
                    'ENAT'                      ,
                    @flag_accompagnee           ,
                    @id_accompagnant            ,
                    @date_replanification       ,
                    (SELECT tpv.code_region_partenaire FROM tab_visite tpv WHERE tpv.id_visite = @id_visite),
                    (SELECT tpv.code_type_partenaire FROM tab_visite tpv WHERE tpv.id_visite = @id_visite),
                    (SELECT tpv.id_responsable FROM tab_visite tpv WHERE tpv.id_visite = @id_visite),
                    (SELECT tpv.code_gamme_partenaire FROM tab_visite tpv WHERE tpv.id_visite = @id_visite)
                );
                SELECT LAST_INSERT_ID() INTO @id_new_visite;
                
                UPDATE  tab_visite
                SET     code_statut_visite      = 'REPL'                ,
                        date_replanification    = @date_replanification ,
                        id_visite_replanifiee   = @id_new_visite        
                WHERE   id_visite               = @id_visite
                AND     id_utilisateur          = @token_id             ;

                SELECT @id_new_visite INTO @id_visite;
            END IF;
        END IF;
    END IF;    
END IF;
SELECT  @id_visite AS id_visite ,
        (SELECT tpv.date_visite
        FROM    tab_visite tpv
        WHERE   tpv.id_visite = @id_visite) AS date_visite;
`

const que_modifier_partenaires_planifies = `
SET @token_id               = ?,
    @id_planification       = ?;

IF (SELECT date_fin_planification FROM tab_planification
        WHERE id_planification = @id_planification) >= NOW() THEN
    SELECT
        t.id_visite                                                                                                     ,
        t.id_planification                                                                                              ,
        t.id_partenaire                                                                                                 ,
        t.date_visite                                                                                                   ,
        t.code_statut_visite                                                                                            ,
        (SELECT code_potentiel FROM tab_partenaire 
            WHERE t.id_partenaire = t.id_partenaire LIMIT 1)                                    AS potentiel            ,
        (SELECT CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,''))
            FROM tab_partenaire tp 
            WHERE tp.id_partenaire = t.id_partenaire LIMIT 1)                                   AS nom_partenaire       ,
        (SELECT code_type_partenaire    FROM tab_partenaire tp 
            WHERE tp.id_partenaire = t.id_partenaire LIMIT 1)                                   AS code_type_partenaire ,
        (SELECT libelle_codification FROM tab_par_codification
            WHERE   type_codification = 'SPEC' 
            AND     code_codification = (SELECT code_specialite FROM tab_partenaire tp 
                                            WHERE tp.id_partenaire = t.id_partenaire LIMIT 1))  AS specialite_partenaire,
        (SELECT libelle_codification FROM tab_par_codification
            WHERE   type_codification = 'VILL' 
            AND     code_codification = (SELECT code_ville_partenaire FROM tab_partenaire tp 
                                            WHERE tp.id_partenaire = t.id_partenaire LIMIT 1))  AS ville_partenaire     ,
        (SELECT libelle_codification FROM tab_par_codification
            WHERE   type_codification = 'SECT' 
            AND     code_codification = (SELECT code_secteur_partenaire FROM tab_partenaire tp 
                                            WHERE tp.id_partenaire = t.id_partenaire LIMIT 1))  AS secteur_partenaire
    FROM
        tab_visite t
    WHERE
        t.id_utilisateur = @token_id
    AND
        t.id_planification = @id_planification;

    SELECT
        (SELECT COUNT(0) FROM tab_visite tpv
            WHERE id_utilisateur = @token_id
            AND (SELECT code_type_partenaire FROM tab_partenaire WHERE id_partenaire = tpv.id_partenaire) = 'MEDE'
            AND tpv.id_planification = @id_planification)                                                   AS nbr_med_planifies    ,
        (SELECT COUNT(0) FROM tab_visite tpv
            WHERE id_utilisateur = @token_id
            AND (SELECT code_type_partenaire FROM tab_partenaire WHERE id_partenaire = tpv.id_partenaire) = 'PHAR'
            AND tpv.id_planification = @id_planification)                                                   AS nbr_phrama_planifiees;

    SELECT  
        date_deb_planification                                      ,
        date_fin_planification                                      ,
        WEEKOFYEAR(date_deb_planification)        AS num_semaine    ,
        'O'                     AS flag_disponible 
    FROM    
        tab_planification
    WHERE   
        id_planification = @id_planification;

ELSE
    SELECT 'N' AS flag_disponible;
END IF;
`

const que_fiche_planification = `
SET @token_id               = ?,
    @token_role             = ?,
    @token_medical          = ?,
    @token_pharmaceutique   = ?,
    @id_planification       = ?,
    @id_utilisateur         = NULL;

SELECT  tpl.id_utilisateur INTO @id_utilisateur 
FROM    tab_planification tpl
WHERE   tpl.id_planification = @id_planification;

SELECT
    t.id_visite                                                                                                     ,
    t.id_planification                                                                                              ,
    t.id_partenaire                                                                                                 , 
    t.date_visite                                                                                                   ,
    t.code_statut_visite                                                                                            ,
    t.flag_accompagnee                                                                                              ,
    (SELECT CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur) FROM tab_utilisateur tu
        WHERE tu.id_utilisateur = t.id_accompagnant)                                        AS accompagnant         ,
    (SELECT code_potentiel FROM tab_partenaire 
        WHERE t.id_partenaire = t.id_partenaire LIMIT 1)                                    AS potentiel            ,
    (SELECT UPPER(CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,'')))
        FROM tab_partenaire tp 
        WHERE tp.id_partenaire = t.id_partenaire LIMIT 1)                                   AS nom_partenaire       ,
    (SELECT code_type_partenaire    FROM tab_partenaire tp 
        WHERE tp.id_partenaire = t.id_partenaire LIMIT 1)                                   AS code_type_partenaire ,
    (SELECT libelle_codification FROM tab_par_codification
        WHERE   type_codification = 'SPEC' 
        AND     code_codification = (SELECT code_specialite FROM tab_partenaire tp 
                                        WHERE tp.id_partenaire = t.id_partenaire LIMIT 1))  AS specialite_partenaire,
    (SELECT libelle_codification FROM tab_par_codification
        WHERE   type_codification = 'VILL' 
        AND     code_codification = (SELECT code_ville_partenaire FROM tab_partenaire tp 
                                        WHERE tp.id_partenaire = t.id_partenaire LIMIT 1))  AS ville_partenaire     ,
    (SELECT libelle_codification FROM tab_par_codification
        WHERE   type_codification = 'SECT' 
        AND     code_codification = (SELECT code_secteur_partenaire FROM tab_partenaire tp 
                                        WHERE tp.id_partenaire = t.id_partenaire LIMIT 1))  AS secteur_partenaire
FROM
    tab_visite t
WHERE
    t.id_planification = @id_planification
AND CASE
        WHEN @token_role NOT IN ('ADMI','DIR','PM') THEN
                t.id_utilisateur  = @token_id 
            OR
            (
                    
                    (
                        ( @token_role = ('KAM') AND t.role_utilisateur = 'DEL')
                        OR
                        ( @token_role = ('DSM') AND t.role_utilisateur IN ('KAM','DEL'))
                        OR
                        ( @token_role = ('DRG') AND t.role_utilisateur IN ('DSM','KAM','DEL'))
                    )
                AND
                    t.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                    WHERE   tur.id_utilisateur = @token_id
                                                    AND     tur.flag_actif = 'O')
                AND 
                    (
                        (
                            @token_medical = 'O'
                        AND
                            (SELECT tu.flag_medical FROM tab_utilisateur tu
                                WHERE tu.id_utilisateur = t.id_utilisateur) = 'O' 
                        AND            
                            t.code_type_partenaire = 'MEDE'
                        AND
                            t.code_gamme_partenaire IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                                            WHERE   tug.id_utilisateur  = @token_id
                                                            AND     tug.flag_actif      = 'O')
                        )
                    OR
                        (
                            @token_pharmaceutique = 'O'
                        AND
                            (SELECT tu.flag_pharmaceutique FROM tab_utilisateur tu
                                WHERE tu.id_utilisateur = t.id_utilisateur) = 'O' 

                        AND
                            t.code_type_partenaire = 'PHAR'
                        )
                    )
            )
        ELSE
            1 = 1
        END ;

SELECT
    (SELECT COUNT(0) FROM tab_visite tpv
        WHERE 
        (
                id_utilisateur = @token_id
            OR
                id_utilisateur = @id_utilisateur
        )
        AND (SELECT code_type_partenaire FROM tab_partenaire WHERE id_partenaire = tpv.id_partenaire) = 'MEDE'
        AND tpv.id_planification = @id_planification)                                                   AS nbr_med_planifies    ,
    (SELECT COUNT(0) FROM tab_visite tpv
        WHERE 
        (
                id_utilisateur = @token_id
            OR
                id_utilisateur = @id_utilisateur
        )
        AND (SELECT code_type_partenaire FROM tab_partenaire WHERE id_partenaire = tpv.id_partenaire) = 'PHAR'
        AND tpv.id_planification = @id_planification)                                                   AS nbr_phrama_planifiees;

SELECT  
    date_deb_planification                                          ,
    date_fin_planification                                          ,
    (SELECT CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur) FROM tab_utilisateur tu
        WHERE tu.id_utilisateur = @id_utilisateur) AS nom_utilisateur
FROM    
    tab_planification
WHERE   
    id_planification = @id_planification;
`

const que_export_planifications = `
SET @token_id               = ?,
    @token_role             = ?,
    @token_medical          = ?,
    @token_pharmaceutique   = ?,
    @date_deb_semaine       = ?,
    @date_fin_semaine       = ?,
    @id_utilisateur         = ?;

SELECT
    tpl.id_planification                                                                                            ,
    tpl.date_deb_planification                                                                                      ,
    tpl.date_fin_planification                                                                                      ,
    CONCAT('Du ', tpl.date_deb_planification, ' Au ', tpl.date_fin_planification) AS semaine,
    tpl.id_utilisateur                                                                                              ,
    (SELECT CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur) FROM tab_utilisateur tu
        WHERE tu.id_utilisateur = tpl.id_utilisateur)                                        AS nom_utilisateur     ,
    (SELECT COUNT(0) FROM tab_visite tpv
        WHERE   tpv.id_planification    = tpl.id_planification
        AND     tpv.id_utilisateur      = tpl.id_utilisateur
        AND     tpv.code_type_visite    = 'PLAN'
        AND     tpv.code_statut_visite  = 'REAL'
        AND     tpv.date_visite BETWEEN tpl.date_deb_planification AND tpl.date_fin_planification
    )                                                                                       AS total_realises       ,  
    (SELECT COUNT(0) FROM tab_visite tpv
        WHERE   tpv.id_planification    = tpl.id_planification
        AND     tpv.id_utilisateur      = tpl.id_utilisateur
        AND     tpv.code_type_visite    = 'PLAN'
        AND     tpv.code_statut_visite  = 'ABSE'
        AND     tpv.date_visite BETWEEN tpl.date_deb_planification AND tpl.date_fin_planification
    )                                                                                       AS total_absent         ,
    (SELECT COUNT(0) FROM tab_visite tpv
        WHERE   tpv.id_planification    = tpl.id_planification
        AND     tpv.id_utilisateur      = tpl.id_utilisateur
        AND     tpv.code_type_visite    = 'PLAN'
        AND     tpv.code_statut_visite  = 'REPL'
        AND     tpv.date_visite BETWEEN tpl.date_deb_planification AND tpl.date_fin_planification
    )                                                                                       AS total_replanifies    ,
    (SELECT COUNT(0) FROM tab_visite tpv
        WHERE   tpv.id_planification    = tpl.id_planification
        AND     tpv.id_utilisateur      = tpl.id_utilisateur
        AND     tpv.code_type_visite    = 'PLAN'
        AND     tpv.code_statut_visite  = 'ENAT'
        AND     tpv.date_visite BETWEEN tpl.date_deb_planification AND tpl.date_fin_planification
    )                                                                                       AS total_en_attente     ,
    (SELECT COUNT(0) FROM tab_visite tpv
        WHERE   tpv.id_planification    = tpl.id_planification
        AND     tpv.id_utilisateur      = tpl.id_utilisateur
        AND     tpv.code_type_visite    = 'PLAN'
        AND     tpv.date_visite BETWEEN tpl.date_deb_planification AND tpl.date_fin_planification
    )                                                                                       AS total_planifies
FROM        tab_planification tpl
LEFT JOIN   tab_visite tpv ON tpv.id_planification = tpl.id_planification
WHERE 
    tpv.code_type_visite = 'PLAN'
AND IF(@id_utilisateur IS NOT NULL, tpl.id_utilisateur, 1) = IF(@id_utilisateur IS NOT NULL, @id_utilisateur, 1)
AND CASE 
        WHEN @date_deb_semaine IS NOT NULL AND @date_fin_semaine IS NOT NULL THEN
            tpl.date_deb_planification = @date_deb_semaine AND tpl.date_fin_planification = @date_fin_semaine  
        ELSE 1 = 1
    END      
AND CASE
        WHEN @token_role NOT IN ('ADMI','DIR','PM') THEN 
                tpl.id_utilisateur = @token_id
            OR
                tpv.id_responsable  = @token_id
            OR
                tpl.id_utilisateur  IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                            WHERE tu1.id_responsable IN (
                                                SELECT tu2.id_utilisateur FROM tab_utilisateur tu2
                                                                            WHERE tu2.id_responsable = @token_id)
                                        )
            OR
                tpl.id_utilisateur  IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                            WHERE tu1.id_responsable IN (
                                                                            SELECT  tu2.id_utilisateur FROM tab_utilisateur tu2
                                                                            WHERE   tu2.id_responsable IN (
                                                                                        SELECT  tu3.id_utilisateur FROM tab_utilisateur tu3
                                                                                        WHERE   tu3.id_responsable = @token_id
                                                                                    )
                                                                        )
                                        )
        ELSE 1 = 1
    END
GROUP BY tpl.id_planification 
`

const que_export_rapports = `
SET @token_id           = ?,
    @token_role         = ?,
    @id_planification   = ?,
    @date_jour          = ?;

    SELECT
        tpv.id_visite                                                                                                       ,
        tpv.id_planification                                                                                                ,
        tpv.id_utilisateur                                                                                                  ,
        tpv.id_partenaire                                                                                                   ,
        tpv.code_statut_visite                                                                                              ,
        CASE
            WHEN tpv.code_statut_visite = 'ENAT' THEN 'En attente'
            WHEN tpv.code_statut_visite = 'REAL' THEN 'Réalisée'
            WHEN tpv.code_statut_visite = 'ABSE' THEN 'Absent'
            WHEN tpv.code_statut_visite = 'REPL' THEN 'Replanifiée'
        END 
        AS Status,
        tpv.date_visite                                                                                                     ,
        tpv.date_replanification                                                                                            ,
        (SELECT UPPER(CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,'')))
        FROM tab_partenaire tp WHERE id_partenaire = tpv.id_partenaire)                         AS nom_partenaire           ,
        (SELECT code_potentiel FROM tab_partenaire WHERE id_partenaire = tpv.id_partenaire)     AS code_potentiel           ,
        (SELECT code_specialite FROM tab_partenaire WHERE id_partenaire = tpv.id_partenaire)    AS code_specialite          ,
        (SELECT code_type_partenaire FROM tab_partenaire
            WHERE id_partenaire = tpv.id_partenaire)                                            AS code_type_partenaire     ,
        IF((SELECT code_type_partenaire FROM tab_partenaire
            WHERE id_partenaire = tpv.id_partenaire) = 'MEDE', 'Médecin', 'Pharmacie')          AS type_partenaire          ,
        (SELECT libelle_codification FROM tab_par_codification 
            WHERE   type_codification = 'SPEC' 
            AND     code_codification = (SELECT code_specialite FROM tab_partenaire
                                        WHERE id_partenaire = tpv.id_partenaire LIMIT 1))       AS specialite               ,
        (SELECT libelle_codification FROM tab_par_codification 
            WHERE   type_codification = 'VILL' 
            AND     code_codification = (SELECT code_ville_partenaire FROM tab_partenaire
                                            WHERE id_partenaire = tpv.id_partenaire LIMIT 1))   AS ville_partenaire         ,
        (SELECT libelle_codification FROM tab_par_codification 
            WHERE   type_codification = 'SECT' 
            AND     code_codification = (SELECT code_secteur_partenaire FROM tab_partenaire
                                            WHERE id_partenaire = tpv.id_partenaire LIMIT 1))   AS secteur_partenaire
    FROM        
        tab_visite tpv
    WHERE
        IF(@date_jour IS NOT NULL, date_visite, 1) = IF(@date_jour IS NOT NULL, @date_jour, 1)
    AND tpv.code_type_visite = 'PLAN'
    AND tpv.id_planification = @id_planification
    AND tpv.id_utilisateur   = @token_id     
`

module.exports = {
    que_tab_partenaires_planifies,
    que_tab_partenaires,
    que_ajout_planification,
    que_ajout_visite_planifiee,
    que_annuler_visite,
    que_tab_planifications,
    que_nbr_tab_planifications,
    que_tab_rapports,
    que_get_semaine_planification,
    que_nbr_tab_rapports,
    que_ajouter_rapport_planification,
    que_modifier_partenaires_planifies,
    que_fiche_planification,
    que_export_planifications,
    que_export_rapports,
    que_nbr_tab_partenaires
}