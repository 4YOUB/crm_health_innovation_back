const que_tab_visites = `
SET @token_id               = ?,
    @token_role             = ?,
    @token_medical          = ?,
    @token_pharmaceutique   = ?,
    @type_partenaire        = ?,
    @date_debut_visite      = ?,
    @date_fin_visite        = ?,
    @code_statut_visite     = ?,
    @code_region            = ?,
    @nom_partenaire         = CONCAT('%',IFNULL(?,''),'%'),
    @id_utilisateur         = ?;



SELECT
    tpv.id_visite                                                                                                       ,
    (SELECT COUNT(tpvr.id_partenaire) - 1 FROM tab_partenaire_visite tpvr WHERE tpvr.id_visite = tpv.id_visite ) AS autrePartenaires,
    tpv.flag_accompagnee                                                                                                ,
    tpv.date_visite                                                                                                     ,
    tpv.code_statut_visite                                                                                              ,
    tpv.code_type_visite                                                                                                ,
    tpv.date_replanification                                                                                            ,
    tpv.id_utilisateur                                                                                                  ,
    IF(code_type_visite = 'PLAN','Planifiée','Hors planification')                              AS type_visite          ,
    IF(tp.code_type_partenaire = 'MEDE', 'Médecin', 'Pharmacie')                                AS type_partenaire      ,
    (SELECT CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur) FROM tab_utilisateur tu
        WHERE tu.id_utilisateur = tpv.id_utilisateur)                                           AS nom_utilisateur      ,
    tp.code_type_partenaire                                                                     AS code_type_partenaire ,
    tp.code_potentiel                                                                           AS code_potentiel       ,
    tp.code_specialite                                                                          AS code_specialite      ,
    UPPER(CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,'')))  AS nom_partenaire       ,
    IF(flag_accompagnee = 'O', (SELECT CONCAT(nom_utilisateur,' ', prenom_utilisateur) FROM tab_utilisateur tu 
                                    WHERE tu.id_utilisateur = id_accompagnant LIMIT 1), null)   AS accompagnant         ,
    (SELECT COUNT(0) FROM tab_visite_produit tvp1 WHERE tvp1.id_visite = tpv.id_visite LIMIT 1) AS nbr_produit          ,
    (SELECT SUM(nbr_echantillon) FROM tab_visite_produit tvp1 WHERE 
                                tvp1.id_visite = tpv.id_visite LIMIT 1)                                                     AS nbr_echantillon      ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'SPEC' AND code_codification = tp.code_specialite)            AS specialite,
    tpv.heure_fin_visite
FROM        tab_visite tpv
LEFT JOIN tab_partenaire_visite tpv2 ON tpv.id_visite = tpv2.id_visite
LEFT JOIN   tab_partenaire  tp ON tpv2.id_partenaire  = tp.id_partenaire
WHERE
    tpv.code_statut_visite <> 'SUPP' 
    AND tpv2.order_partenaire = 1
AND IF(@nom_partenaire  IS NOT NULL, CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,'')) , 1) LIKE IF(@nom_partenaire    IS NOT NULL, @nom_partenaire    , 1)
AND IF(@type_partenaire     IS NOT NULL, tpv2.code_type_partenaire   , 1) = IF(@type_partenaire      IS NOT NULL, @type_partenaire   , 1)
AND IF(@code_statut_visite  IS NOT NULL, tpv.code_statut_visite     , 1) = IF(@code_statut_visite   IS NOT NULL, @code_statut_visite, 1)
AND IF(@id_utilisateur      IS NOT NULL, tpv.id_utilisateur         , 1) = IF(@id_utilisateur       IS NOT NULL, @id_utilisateur    , 1)
AND IF(@code_region         IS NOT NULL, tpv2.code_region_partenaire , 1) = IF(@code_region          IS NOT NULL, @code_region       , 1)
AND CASE
        WHEN @date_debut_visite IS NOT NULL AND @date_fin_visite IS NOT NULL THEN 
            date_visite BETWEEN @date_debut_visite AND @date_fin_visite
        ELSE 1 = 1
    END
AND CASE
        WHEN @token_role NOT IN ('ADMI','DIR','PM') THEN
                tpv.id_utilisateur  = @token_id
            OR 
                tpv.id_accompagnant = @token_id
            OR
                tpv.id_responsable  = @token_id
            OR
                tpv.id_utilisateur  IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                            WHERE tu1.id_responsable IN (
                                                SELECT tu2.id_utilisateur FROM tab_utilisateur tu2
                                                                            WHERE tu2.id_responsable = @token_id)
                                        )
            OR
                tpv.id_utilisateur  IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
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
`
const que_visite_partenaires = `
   SET @id_visite = ?;

   SELECT id_visite,
   tp.id_partenaire,
   nom_remplacent,
   tp.code_region_partenaire,
   tp.code_type_partenaire,
   code_gamme_partenaire,
   order_partenaire,
   UPPER(CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,'')))  AS nom_partenaire       ,
   tp.code_type_partenaire                                                                     AS code_type_partenaire ,
   tp.code_potentiel ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'REGI' AND code_codification = tp.code_region_partenaire)             AS region_partenaire    ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'VILL' AND code_codification = tp.code_ville_partenaire)              AS ville_partenaire     ,
    (SELECT libelle_codification FROM tab_par_codification  
        WHERE type_codification = 'SECT' AND code_codification = tp.code_secteur_partenaire)            AS secteur_partenaire   ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification IN ('ETPR','ETPU') AND code_codification = tp.code_type_etablissement)  AS etablissement        ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'SPEC' AND code_codification = tp.code_specialite)            AS specialite

   FROM tab_partenaire_visite tpvr
   LEFT JOIN tab_partenaire tp
   ON tpvr.id_partenaire = tp.id_partenaire
   WHERE id_visite = @id_visite
`
const que_nbr_tab_visites = `
SET @token_id               = ?,
    @token_role             = ?,
    @token_medical          = ?,
    @token_pharmaceutique   = ?,
    @type_partenaire        = ?,
    @date_debut_visite      = ?,
    @date_fin_visite        = ?,
    @code_statut_visite     = ?,
    @code_region            = ?,
    @nom_partenaire         = CONCAT('%',IFNULL(?,''),'%'),
    @id_utilisateur         = ?;

SELECT      COUNT(0) AS nbr_total_visites
FROM        tab_visite tpv
LEFT JOIN tab_partenaire_visite tpv2 ON tpv.id_visite = tpv2.id_visite
LEFT JOIN   tab_partenaire  tp ON tpv2.id_partenaire  = tp.id_partenaire
WHERE
    tpv.code_statut_visite <> 'SUPP' 
AND IF(@nom_partenaire  IS NOT NULL, CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,'')) , 1) LIKE IF(@nom_partenaire    IS NOT NULL, @nom_partenaire    , 1)
AND IF(@type_partenaire     IS NOT NULL, tpv2.code_type_partenaire   , 1) = IF(@type_partenaire      IS NOT NULL, @type_partenaire   , 1)
AND IF(@code_statut_visite  IS NOT NULL, tpv.code_statut_visite     , 1) = IF(@code_statut_visite   IS NOT NULL, @code_statut_visite, 1)
AND IF(@id_utilisateur      IS NOT NULL, tpv.id_utilisateur         , 1) = IF(@id_utilisateur       IS NOT NULL, @id_utilisateur    , 1)
AND IF(@code_region         IS NOT NULL, tpv2.code_region_partenaire , 1) = IF(@code_region          IS NOT NULL, @code_region       , 1)
AND CASE
        WHEN @date_debut_visite IS NOT NULL AND @date_fin_visite IS NOT NULL THEN 
            date_visite BETWEEN @date_debut_visite AND @date_fin_visite
        ELSE 1 = 1
    END
AND CASE
        WHEN @token_role NOT IN ('ADMI','DIR','PM') THEN
                tpv.id_utilisateur  = @token_id
            OR 
                tpv.id_accompagnant = @token_id
            OR
                tpv.id_responsable  = @token_id
            
            OR
                tpv.id_utilisateur  IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                            WHERE tu1.id_responsable IN (
                                                SELECT tu2.id_utilisateur FROM tab_utilisateur tu2
                                                                            WHERE tu2.id_responsable = @token_id)
                                        )
            OR
                tpv.id_utilisateur  IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
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
`

const que_tab_accompagnants = `
SET @token_id               = ?,
    @token_role             = ?,
    @token_medical          = ?,
    @token_pharmaceutique   = ?;

SELECT 
    CONCAT(tu.nom_utilisateur, ' ', tu.prenom_utilisateur) AS nom_utilisateur   ,
    tu.id_utilisateur                                                           ,
    tu.role
FROM
    tab_utilisateur tu
WHERE
    tu.role NOT IN ('ADMI','ACH')
AND
    tu.id_utilisateur <> @token_id
AND
    tu.code_statut_utilisateur = 'ACTI'
AND
    tu.id_utilisateur   =   (SELECT tu1.id_responsable FROM tab_utilisateur tu1
                                WHERE tu1.id_utilisateur = @token_id)

UNION ALL

(
    SELECT 
        CONCAT(tu.nom_utilisateur, ' ', tu.prenom_utilisateur) AS nom_utilisateur   ,
        tu.id_utilisateur                                                           ,
        tu.role
    FROM
        tab_utilisateur tu
    WHERE
        tu.role NOT IN ('ADMI','ACH')
    AND
        tu.id_utilisateur <> @token_id
    AND
        tu.code_statut_utilisateur = 'ACTI'
    AND CASE
            WHEN @token_role NOT IN ('DIR','PM','ADMI') THEN
                (
                        (@token_role = 'DEL' AND tu.role = 'DEL')
                    OR
                        (@token_role = 'KAM' AND tu.role IN ('KAM','DEL'))
                    OR
                        (@token_role = 'DSM' AND tu.role IN ('DSM','KAM','DEL'))
                    OR
                        (@token_role = 'DRG' AND tu.role IN ('DRG','DSM','KAM','DEL'))
                )
                AND
                (
                        tu.id_responsable   =   (SELECT tu1.id_responsable FROM tab_utilisateur tu1
                                                    WHERE tu1.id_utilisateur = @token_id)
                    OR
                        tu.id_utilisateur   IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                                    WHERE tu1.id_responsable = @token_id)
                    OR
                        tu.id_utilisateur   IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                                    WHERE tu1.id_responsable IN (
                                                        SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                                                                    WHERE tu1.id_responsable = @token_id)
                                                    )
                    OR
                        tu.id_utilisateur   IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                                    WHERE tu1.id_responsable IN (
                                                        SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                                            WHERE tu1.id_responsable IN (
                                                                SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                                                    WHERE tu1.id_responsable = @token_id
                                                            )
                                                    )
                                                )   
                )
            ELSE 1 = 1
        END
    ORDER BY tu.role DESC
);
`

const que_tab_gammes_produits = `
SET     @token_id               = ?,
        @token_role             = ?,
        @token_medical          = ?,
        @token_pharmaceutique   = ?;

SELECT  tpc.code_codification       ,
        tpc.type_codification       ,
        tpc.libelle_codification    ,
        tpc.type_parent             ,
        tpc.code_parent
FROM    tab_par_codification tpc
WHERE   tpc.flag_actif      = 'O'
AND     type_codification   = 'GAMM'
AND     CASE
            WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN
                (
                        @token_medical          = 'O'
                    AND
                        tpc.code_codification IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                                    WHERE   tug.id_utilisateur  = @token_id
                                                    AND     tug.flag_actif      = 'O')
                )
                OR
                (
                        @token_medical          = 'N'
                    AND
                        @token_pharmaceutique   = 'O'
                    AND
                        1 = 1
                )    
            ELSE
                1 = 1
        END;

SELECT  tp.id_produit       ,
        tp.libelle_produit  ,
        tpg.code_gamme
FROM    tab_produit tp
LEFT JOIN
        tab_produit_gamme tpg ON tpg.id_produit = tp.id_produit
LEFT JOIN 
        tab_par_codification tpc ON tpg.code_gamme = tpc.code_codification
WHERE   tpc.type_codification = 'GAMM'
AND     CASE
            WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN
                (
                    @token_medical          = 'O'
                AND
                    tpc.code_codification IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                                WHERE   tug.id_utilisateur  = @token_id
                                                AND     tug.flag_actif      = 'O')
                )
                OR
                (
                        @token_medical          = 'N'
                    AND
                        @token_pharmaceutique   = 'O'
                    AND
                        1 = 1
                )   
            ELSE
                1 = 1
        END;
`

const que_tab_feedbacks = `
SELECT  code_codification           ,
        type_codification           ,
        libelle_codification        ,
        type_parent                 ,
        code_parent              
FROM    tab_par_codification
WHERE   type_codification   = 'FEED'
AND     flag_actif          = 'O'   ;
`

const que_add_visite = `
SET @token_id               = ?,
    @token_role             = ?,
    @token_medical          = ?,
    @token_pharmaceutique   = ?,
    @code_statut_visite     = ?,
    @commentaire            = ?,
    @flag_accompagnee       = ?,
    @id_accompagnant        = ?,
    @date_visite            = ?,
    @code_region_partenaire = NULL,
    @code_type_partenaire   = NULL,
    @code_gamme_partenaire  = NULL,
    @flag_medical           = NULL,
    @flag_pharmaceutique    = NULL,
    @heure_fin_visite = ?,
    @type_visite = ? 
    
    ;

SELECT
    @conflictCountV := COUNT(tv.id_visite),
    @idsV := CONCAT('[', GROUP_CONCAT(tv.id_visite),
    ']')
FROM
    tab_visite tv
WHERE
    tv.code_statut_visite <> 'SUPP' 
    AND 
    tv.id_utilisateur = @token_id
    AND
    tv.date_visite = @date_visite;


SELECT
@conflictCountE := COUNT(te.id_evenement),
@idsE := CONCAT('[', GROUP_CONCAT(te.id_evenement),
']')
FROM
    tab_evenement te
WHERE
    te.id_utilisateur = @token_id AND(
        (
            @date_visite >= te.date_deb_evenement AND @date_visite < te.date_fin_evenement
        ) OR(
            ADDTIME(
                @date_visite,
                (
                SELECT
                    libelle_codification
                FROM
                    tab_par_codification
                WHERE
                    type_codification = 'HEURE' AND code_codification = 'DVISIT' AND flag_actif = 'O'
            )
            ) > te.date_deb_evenement AND ADDTIME(
                @date_visite,
                (
                SELECT
                    libelle_codification
                FROM
                    tab_par_codification
                WHERE
                    type_codification = 'HEURE' AND code_codification = 'DVISIT' AND flag_actif = 'O'
            )
            ) <= te.date_fin_evenement
        )
    );

IF  @conflictCountE = 0
THEN
    IF  @conflictCountV = 0     
    THEN

        IF (SELECT COUNT(*) FROM tab_partenaire tp
            WHERE tp.id_partenaire in (?) and tp.code_statut_partenaire <> 'VALI') = 0 THEN 
    
            INSERT INTO tab_visite (
                id_utilisateur          ,
                role_utilisateur        ,
                flag_medical            ,
                flag_pharmaceutique     ,
                code_type_visite        ,
                code_statut_visite      ,
                commentaire             ,
                flag_accompagnee        ,
                id_accompagnant         ,
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
                'HOPL'                  ,
                @code_statut_visite     ,
                @commentaire            ,
                @flag_accompagnee       ,
                @id_accompagnant        ,
                @date_visite            ,
                (SELECT tu.id_responsable FROM tab_utilisateur tu WHERE tu.id_utilisateur = @token_id),
                @heure_fin_visite       ,
                @type_visite
            );


            SELECT 'yes' AS isOK;
        
            SELECT 'ok' INTO @done;
        
            SELECT LAST_INSERT_ID() AS id_visite;
        
        ELSE
            SELECT 'ko' INTO @done;
        END IF; 
        
        SELECT @done AS done;

    ELSE
        SELECT 
            'no' AS isOK, 
            'visite' AS conflictSource, 
            @conflictCountV AS conflictCount,
            @idsV AS ids
            ;
    END IF;
ELSE
    SELECT 
        'no' AS isOK, 
        'evenement' AS conflictSource, 
        @conflictCountE AS conflictCount,
        @idsE AS ids
        ;
END IF;

`

const que_add_visite_produit = `
INSERT INTO tab_visite_produit (
    id_visite       ,
    id_produit      ,
    code_gamme      ,
    code_feedback   ,
    nbr_echantillon
)
VALUES ?;
`
const que_add_partenaire_visite = `
INSERT INTO tab_partenaire_visite (
    id_visite       ,
    id_partenaire      ,
    nom_remplacent    ,
    code_region_partenaire  ,
    code_type_partenaire    ,
    code_gamme_partenaire   ,
    order_partenaire
)
VALUES ?;
`

const que_fiche_visite = `
SET @token_id   = ?,
    @token_role = ?,
    @id_visite  = ?;

SELECT
    tpv.id_visite                                                                                                       ,
    tpv.id_visite_origine                                                                                               ,
    tpv.id_visite_replanifiee                                                                                           ,
    tpv.id_utilisateur                                                                                                  ,
    tpv.flag_accompagnee                                                                                                ,
    tpv.id_accompagnant                                                                                                 ,
    tpv.date_creation                                                                           AS date_planification   ,
    tpv.date_visite                                                                                                     ,
    tpv.date_rapport                                                                                                    ,
    tpv.date_replanification                                                                                            ,
    tpv.commentaire                                                                                                     ,
    tpv.code_statut_visite                                                                                              ,
    tpv.code_type_visite                                                                                                ,                                                                                                                                    
    tpv.type_visite                     AS 'typeVisite'                                                                                ,
    IF(tpv.code_type_visite = 'PLAN','Planifiée','Non planifiée')                               AS type_visite          ,
    (SELECT CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur) FROM tab_utilisateur tu
        WHERE tu.id_utilisateur = tpv.id_utilisateur)                                           AS nom_utilisateur      ,
    (SELECT CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur) FROM tab_utilisateur tu
        WHERE tu.id_utilisateur = tpv.id_accompagnant)                                          AS accompagnant,
    tpv.heure_fin_visite
FROM
    tab_visite tpv
WHERE
    tpv.id_visite = @id_visite;

SELECT 
    id,
    id_visite,
    id_partenaire,
    nom_remplacent,
    code_region_partenaire,
    code_type_partenaire,
    code_gamme_partenaire,
    order_partenaire,
    (SELECT UPPER(CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,'')))
        FROM tab_partenaire tp 
        WHERE tp.id_partenaire = tpvr.id_partenaire) AS nom_partenaire       
    FROM tab_partenaire_visite tpvr
    WHERE tpvr.id_visite = @id_visite;


SELECT
    tvp.id_produit                                                                                                      ,
    tvp.code_gamme                                                                                                      ,
    tvp.code_feedback                                                                                                   ,
    nbr_echantillon                                                                                                     ,
    (SELECT libelle_produit FROM tab_produit tp WHERE tp.id_produit = tvp.id_produit)          AS produit               ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'GAMM' AND code_codification = tvp.code_gamme)               AS gamme                 ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'FEED' AND code_codification = tvp.code_feedback)            AS feedback
FROM
    tab_visite_produit tvp
WHERE
    tvp.id_visite = @id_visite;
`

const que_upd_visite = `
SET @token_id               = ?,
    @token_role             = ?,
    @id_visite              = ?,
    @id_planification       = ?,
    @code_potentiel         = ?,
    @date_visite            = ?,
    @date_replanification   = ?,
    @code_type_visite       = ?,
    @code_statut_visite     = ?,
    @commentaire            = ?,
    @flag_accompagnee       = ?,
    @id_accompagnant        = ?,
    @id_new_planification   = NULL,
    @date_deb_semaine       = NULL,
    @id_new_visite          = NULL,
    @done                   = NULL,
    @heure_fin_visite = ?,
    @type_visite = ?;

SELECT
    @conflictCountV := COUNT(tv.id_visite),
    @idsV := CONCAT('[', GROUP_CONCAT(tv.id_visite),
    ']')
FROM
    tab_visite tv
WHERE
    tv.code_statut_visite <> 'SUPP' 
    AND 
    tv.id_visite <> @id_visite
    AND 
    tv.id_utilisateur = @token_id
    AND
    tv.date_visite = @date_visite;


SELECT
@conflictCountE := COUNT(te.id_evenement),
@idsE := CONCAT('[', GROUP_CONCAT(te.id_evenement),
']')
FROM
    tab_evenement te
WHERE
    te.id_utilisateur = @token_id AND(
        (
            IF(@code_statut_visite = 'REPL', @date_replanification, @date_visite) >= te.date_deb_evenement 
            AND 
            IF(@code_statut_visite = 'REPL', @date_replanification, @date_visite) < te.date_fin_evenement
        ) OR(
            ADDTIME(
                IF(@code_statut_visite = 'REPL', @date_replanification, @date_visite),
                (
                SELECT
                    libelle_codification
                FROM
                    tab_par_codification
                WHERE
                    type_codification = 'HEURE' AND code_codification = 'DVISIT' AND flag_actif = 'O'
            )
            ) > te.date_deb_evenement AND ADDTIME(
                IF(@code_statut_visite = 'REPL', @date_replanification, @date_visite),
                (
                SELECT
                    libelle_codification
                FROM
                    tab_par_codification
                WHERE
                    type_codification = 'HEURE' AND code_codification = 'DVISIT' AND flag_actif = 'O'
            )
            ) <= te.date_fin_evenement
        )
    );

IF  @conflictCountE = 0
THEN
    IF  @conflictCountV = 0     
    THEN

        IF (SELECT tpv.id_utilisateur FROM tab_visite tpv
            WHERE tpv.id_visite = @id_visite) = @token_id       THEN

            IF @code_type_visite = 'PLAN' THEN
                IF (SELECT code_statut_visite FROM tab_visite
                        WHERE id_visite = @id_visite) = 'REPL' THEN

                    UPDATE tab_visite
                    SET code_statut_visite = 'SUPP'
                    WHERE id_visite_origine = @id_visite;

                    UPDATE tab_visite
                    SET id_visite_replanifiee = NULL
                    WHERE
                        id_visite = @id_visite;
                END IF;

                UPDATE tab_visite
                SET
                    flag_accompagnee        = 'N'                   ,
                    id_accompagnant         = NULL                  ,
                    commentaire             = NULL                  ,
                    date_replanification    = NULL                  ,
                    date_rapport            = NULL                  ,
                    type_visite             = @type_visite
                WHERE
                    id_visite               = @id_visite            ;
                
                IF @code_statut_visite  = 'REPL' THEN

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
                        TIME(ADDTIME(@date_replanification,"00:30:00")),
                        @type_visite
                        );
                    SELECT LAST_INSERT_ID() INTO @id_new_visite;
     
                    UPDATE  tab_visite
                    SET     code_statut_visite      = 'REPL'                ,
                            date_replanification    = @date_replanification ,
                            id_visite_replanifiee   = @id_new_visite        ,
                            date_visite             = @date_visite          ,
                            heure_fin_visite        = @heure_fin_visite     ,
                            commentaire             = @commentaire                
                    WHERE   id_visite               = @id_visite
                    AND     id_utilisateur          = @token_id             ;

                ELSEIF @code_statut_visite  = 'ENAT' THEN
                    UPDATE tab_visite
                    SET
                        code_statut_visite  = @code_statut_visite   ,
                        date_visite             = @date_visite          ,
                            heure_fin_visite        = @heure_fin_visite     
                    WHERE
                        id_visite           = @id_visite;

                    SELECT @id_visite INTO @id_new_visite;
                END IF;

            ELSEIF @code_type_visite = 'HOPL' 
            AND 
                @code_statut_visite IN ('REAL','ABSE')
            AND
                @date_visite <= NOW() THEN

                UPDATE tab_visite
                SET
                    flag_accompagnee        = 'N'               ,
                    id_accompagnant         = NULL              ,
                    type_visite             = @type_visite      ,
                    commentaire             = @commentaire      ,
                    date_replanification    = NULL              ,
                    date_rapport            = NULL
                WHERE
                    id_visite               = @id_visite        ;

                UPDATE tab_visite
                SET
                    date_visite         = @date_visite,
                    heure_fin_visite = @heure_fin_visite
                WHERE
                    id_visite           = @id_visite            ;

                SELECT @id_visite INTO @id_new_visite;
            END IF;

            IF @code_statut_visite = 'ABSE' THEN
                UPDATE tab_visite
                SET
                    code_statut_visite  = @code_statut_visite   ,
                    type_visite         = @type_visite      ,
                    flag_accompagnee    = @flag_accompagnee     ,
                    date_visite             = @date_visite          ,
                    heure_fin_visite        = @heure_fin_visite     ,
                    id_accompagnant     = @id_accompagnant      ,
                    commentaire         = @commentaire
                WHERE
                    id_visite           = @id_visite            ;

                SELECT @id_visite INTO @id_new_visite;
            
            ELSEIF @code_statut_visite  = 'REAL' THEN
                UPDATE tab_visite
                SET
                    code_statut_visite  = @code_statut_visite   ,
                    flag_accompagnee    = @flag_accompagnee     ,
                    type_visite         = @type_visite      ,
                    commentaire             = @commentaire      ,
                    date_visite             = @date_visite          ,
                    heure_fin_visite        = @heure_fin_visite     ,        
                    id_accompagnant     = @id_accompagnant      ,
                    date_rapport        = NOW()
                WHERE
                    id_visite           = @id_visite            ;

                SELECT @id_visite INTO @id_new_visite;
            END IF;

            SELECT 'yes' AS isOK;

            SELECT 'ok' INTO @done;

        ELSE
            SELECT 'ko' INTO @done;
        END IF;

        SELECT @done AS done, @id_new_visite AS id_visite;

    ELSE
        SELECT 
            'no' AS isOK, 
            'visite' AS conflictSource, 
            @conflictCountV AS conflictCount,
            @idsV AS ids
            ;
    END IF;
ELSE
    SELECT 
        'no' AS isOK, 
        'evenement' AS conflictSource, 
        @conflictCountE AS conflictCount,
        @idsE AS ids
        ;
END IF;
        

`

const que_upd_visite_old = `
SET @token_id               = ?,
    @token_role             = ?,
    @id_visite              = ?,
    @id_planification       = ?,
    @id_partenaire          = ?,
    @code_potentiel         = ?,
    @date_visite            = ?,
    @date_replanification   = ?,
    @code_type_visite       = ?,
    @code_statut_visite     = ?,
    @commentaire            = ?,
    @flag_accompagnee       = ?,
    @id_accompagnant        = ?,
    @id_new_planification   = NULL,
    @date_deb_semaine       = NULL,
    @id_new_visite          = NULL,
    @done                   = NULL;

SELECT
    @conflictCountV := COUNT(tv.id_visite),
    @idsV := CONCAT('[', GROUP_CONCAT(tv.id_visite),
    ']')
FROM
    tab_visite tv
WHERE
    tv.code_statut_visite <> 'SUPP' 
    AND 
    tv.id_visite <> @id_visite
    AND 
    tv.id_utilisateur = @token_id
    AND
    tv.date_visite = IF(@code_statut_visite = 'REPL', @date_replanification, @date_visite);


SELECT
@conflictCountE := COUNT(te.id_evenement),
@idsE := CONCAT('[', GROUP_CONCAT(te.id_evenement),
']')
FROM
    tab_evenement te
WHERE
    te.id_utilisateur = @token_id AND(
        (
            IF(@code_statut_visite = 'REPL', @date_replanification, @date_visite) >= te.date_deb_evenement 
            AND 
            IF(@code_statut_visite = 'REPL', @date_replanification, @date_visite) < te.date_fin_evenement
        ) OR(
            ADDTIME(
                IF(@code_statut_visite = 'REPL', @date_replanification, @date_visite),
                (
                SELECT
                    libelle_codification
                FROM
                    tab_par_codification
                WHERE
                    type_codification = 'HEURE' AND code_codification = 'DVISIT' AND flag_actif = 'O'
            )
            ) > te.date_deb_evenement AND ADDTIME(
                IF(@code_statut_visite = 'REPL', @date_replanification, @date_visite),
                (
                SELECT
                    libelle_codification
                FROM
                    tab_par_codification
                WHERE
                    type_codification = 'HEURE' AND code_codification = 'DVISIT' AND flag_actif = 'O'
            )
            ) <= te.date_fin_evenement
        )
    );

IF  @conflictCountE = 0
THEN
    IF  @conflictCountV = 0     
    THEN

        IF (SELECT tpv.id_utilisateur FROM tab_visite tpv
            WHERE tpv.id_visite = @id_visite) = @token_id       THEN

            IF @code_type_visite = 'PLAN' THEN

                IF (SELECT code_statut_visite FROM tab_visite
                        WHERE id_visite = @id_visite) = 'REPL' THEN

                    DELETE FROM tab_visite
                    WHERE id_visite_origine = @id_visite;

                    UPDATE tab_visite
                    SET id_visite_replanifiee = NULL
                    WHERE
                        id_visite = @id_visite;
                END IF;

                UPDATE tab_visite
                SET
                    flag_accompagnee        = 'N'                   ,
                    id_accompagnant         = NULL                  ,
                    commentaire             = NULL                  ,
                    date_replanification    = NULL                  ,
                    date_rapport            = NULL
                WHERE
                    id_visite               = @id_visite            ;
            
                IF @code_statut_visite  = 'REPL' THEN
                    SELECT  id_planification INTO @id_new_planification
                    FROM    tab_planification
                    WHERE   @date_replanification BETWEEN date_deb_planification AND date_fin_planification
                    AND     id_utilisateur      = @token_id LIMIT 1 ;

                    IF  @id_new_planification IS NOT NULL AND @id_new_planification = @id_planification THEN
                        UPDATE  tab_visite
                        SET     date_visite     = @date_replanification
                        WHERE   id_visite       = @id_visite
                        AND     id_utilisateur  = @token_id         ;

                        SELECT @id_visite INTO @id_new_visite;

                    ELSE
                        IF  @id_new_planification IS NOT NULL 
                        AND     ((IF( EXISTS(SELECT 1 FROM tab_visite tpv
                                                LEFT JOIN tab_partenaire_visite tpv2
                                                 ON tpv.id_visite = tpv2.id_visite
                                                WHERE   tpv.id_planification    = @id_new_planification 
                                                AND     tpv2.id_partenaire       = @id_partenaire
                                                AND     tpv.code_statut_visite  = 'ENAT' LIMIT 1), 1, 0)) = 1) THEN
                            SELECT 0 INTO @id_new_visite;

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
                                (SELECT tpv.code_region_partenaire FROM tab_partenaire_visite tpv WHERE tpv.id_visite = @id_visite),
                                (SELECT tpv.code_type_partenaire FROM tab_partenaire_visite tpv WHERE tpv.id_visite = @id_visite),
                                (SELECT tpv.id_responsable FROM tab_visite tpv WHERE tpv.id_visite = @id_visite),
                                (SELECT tpv.code_gamme_partenaire FROM tab_partenaire_visite tpv WHERE tpv.id_visite = @id_visite)
                            );
                            SELECT LAST_INSERT_ID() INTO @id_new_visite;
                        END IF;
                            
                        UPDATE  tab_visite
                        SET     code_statut_visite      = 'REPL'                ,
                                date_replanification    = @date_replanification ,
                                id_visite_replanifiee   = @id_new_visite        
                        WHERE   id_visite               = @id_visite
                        AND     id_utilisateur          = @token_id             ;
                    END IF;

                ELSEIF @code_statut_visite  = 'ENAT' THEN
                    UPDATE tab_visite
                    SET
                        code_statut_visite  = @code_statut_visite
                    WHERE
                        id_visite           = @id_visite;

                    SELECT @id_visite INTO @id_new_visite;
                END IF;

            ELSEIF @code_type_visite = 'HOPL' 
            AND 
                @code_statut_visite IN ('REAL','ABSE')
            AND
                @date_visite <= NOW() THEN

                UPDATE tab_visite
                SET
                    flag_accompagnee        = 'N'               ,
                    id_accompagnant         = NULL              ,
                    commentaire             = NULL              ,
                    date_replanification    = NULL              ,
                    date_rapport            = NULL
                WHERE
                    id_visite               = @id_visite        ;

                UPDATE tab_visite
                SET
                    id_partenaire       = @id_partenaire        ,
                    date_visite         = @date_visite
                WHERE
                    id_visite           = @id_visite            ;

                SELECT @id_visite INTO @id_new_visite;
            END IF;

            IF @code_statut_visite = 'ABSE' THEN
                UPDATE tab_visite
                SET
                    code_statut_visite  = @code_statut_visite   ,
                    flag_accompagnee    = @flag_accompagnee     ,
                    id_accompagnant     = @id_accompagnant      ,
                    commentaire         = @commentaire
                WHERE
                    id_visite           = @id_visite            ;

                SELECT @id_visite INTO @id_new_visite;
            
            ELSEIF @code_statut_visite  = 'REAL' THEN
                UPDATE tab_visite
                SET
                    code_statut_visite  = @code_statut_visite   ,
                    flag_accompagnee    = @flag_accompagnee     ,
                    id_accompagnant     = @id_accompagnant      ,
                    date_rapport        = NOW()
                WHERE
                    id_visite           = @id_visite            ;

                SELECT @id_visite INTO @id_new_visite;
            END IF;

            SELECT 'yes' AS isOK;

            SELECT 'ok' INTO @done;

        ELSE
            SELECT 'ko' INTO @done;
        END IF;

        SELECT @done AS done, @id_new_visite AS id_visite;

    ELSE
        SELECT 
            'no' AS isOK, 
            'visite' AS conflictSource, 
            @conflictCountV AS conflictCount,
            @idsV AS ids
            ;
    END IF;
ELSE
    SELECT 
        'no' AS isOK, 
        'evenement' AS conflictSource, 
        @conflictCountE AS conflictCount,
        @idsE AS ids
        ;
END IF;
        

`

const que_delete_visite_produit = `
DELETE FROM tab_visite_produit
WHERE id_visite = ?;
`

const que_delete_visite_partenaire = `
DELETE FROM tab_partenaire_visite
WHERE id_visite = ?;
`

const que_export_visites = `
SET @token_id               = ?,
    @token_role             = ?,
    @token_medical          = ?,
    @token_pharmaceutique   = ?,
    @type_partenaire        = ?,
    @date_debut_visite      = ?,
    @date_fin_visite        = ?,
    @code_statut_visite     = ?,
    @code_region            = ?,
    @nom_partenaire         = CONCAT('%',IFNULL(?,''),'%'),
    @id_utilisateur         = ?;
    
SELECT
    tpv.id_visite                                                                                                       ,
    tpv.flag_accompagnee                                                                                                ,
    tpv.date_visite                                                                                                     ,
    tpv.code_statut_visite                                                                                              ,
    CASE
        WHEN tpv.code_statut_visite = 'ENAT' THEN 'En attente'
        WHEN tpv.code_statut_visite = 'REAL' THEN 'Réalisée'
        WHEN tpv.code_statut_visite = 'ABSE' THEN 'Absent'
        WHEN tpv.code_statut_visite = 'REPL' THEN 'Replanifiée'
    END 
    AS Status,
    tpv2.order_partenaire                   AS 'order'                                                                    ,
    tpv.heure_fin_visite                                                                                                   ,
    tpv.code_type_visite                                                                                                ,
    tpv.date_replanification                                                                                            ,
    tpv2.id_partenaire                                                                                                   ,
    tpv.id_utilisateur                                                                                                  ,
    IF(code_type_visite = 'PLAN','Planifiée','Hors planification')                              AS type_visite          ,
    IF(tp.code_type_partenaire = 'MEDE', 'Médecin', 'Pharmacie')                                AS type_partenaire      ,
    (SELECT CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur) FROM tab_utilisateur tu
        WHERE tu.id_utilisateur = tpv.id_utilisateur)                                           AS nom_utilisateur      ,
    tp.code_type_partenaire                                                                     AS code_type_partenaire ,
    tp.code_potentiel                                                                           AS code_potentiel       ,
    tp.code_specialite                                                                          AS code_specialite      ,
    UPPER(CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,'')) ) AS nom_partenaire       ,
    IF(flag_accompagnee = 'O', (SELECT CONCAT(nom_utilisateur,' ', prenom_utilisateur) FROM tab_utilisateur tu 
                                    WHERE tu.id_utilisateur = id_accompagnant LIMIT 1), null)   AS accompagnant         ,
    (SELECT COUNT(0) FROM tab_visite_produit tvp1 WHERE tvp1.id_visite = tpv.id_visite LIMIT 1) AS nbr_produit          ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'SPEC' AND code_codification = tp.code_specialite)            AS specialite
FROM        tab_visite tpv
LEFT JOIN tab_partenaire_visite tpv2 ON tpv.id_visite = tpv2.id_visite
LEFT JOIN   tab_partenaire  tp ON tpv2.id_partenaire  = tp.id_partenaire
WHERE
    tpv.code_statut_visite <> 'SUPP' 
AND IF(@nom_partenaire  IS NOT NULL, CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,'')) , 1) LIKE IF(@nom_partenaire    IS NOT NULL, @nom_partenaire    , 1)
AND IF(@type_partenaire     IS NOT NULL, tpv2.code_type_partenaire   , 1) = IF(@type_partenaire      IS NOT NULL, @type_partenaire   , 1)
AND IF(@code_statut_visite  IS NOT NULL, tpv.code_statut_visite     , 1) = IF(@code_statut_visite   IS NOT NULL, @code_statut_visite, 1)
AND IF(@id_utilisateur      IS NOT NULL, tpv.id_utilisateur         , 1) = IF(@id_utilisateur       IS NOT NULL, @id_utilisateur    , 1)
AND IF(@code_region         IS NOT NULL, tpv2.code_region_partenaire , 1) = IF(@code_region          IS NOT NULL, @code_region       , 1)
AND CASE
        WHEN @date_debut_visite IS NOT NULL AND @date_fin_visite IS NOT NULL THEN 
            date_visite BETWEEN @date_debut_visite AND @date_fin_visite
        ELSE 1 = 1
    END
AND CASE
        WHEN @token_role NOT IN ('ADMI','DIR','PM') THEN
                tpv.id_utilisateur  = @token_id
            OR 
                tpv.id_accompagnant = @token_id
            OR
                tpv.id_responsable  = @token_id
            OR
                tpv.id_utilisateur  IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                            WHERE tu1.id_responsable IN (
                                                SELECT tu2.id_utilisateur FROM tab_utilisateur tu2
                                                                            WHERE tu2.id_responsable = @token_id)
                                        )
            OR
                tpv.id_utilisateur  IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
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
`
const que_get_produits_visite = `
SELECT
    tvp.id_visite                                                                                                       ,
    tvp.id_produit                                                                                                      ,
    tvp.code_gamme                                                                                                      ,
    tvp.code_feedback                                                                                                   ,
    nbr_echantillon                                                                                                     ,
    (SELECT libelle_produit FROM tab_produit tp WHERE tp.id_produit = tvp.id_produit)          AS produit               ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'GAMM' AND code_codification = tvp.code_gamme)               AS gamme                 ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'FEED' AND code_codification = tvp.code_feedback)            AS feedback
FROM
    tab_visite_produit tvp
WHERE
    tvp.id_visite IN (?);
`
module.exports = {
    que_tab_visites,
    que_nbr_tab_visites,
    que_tab_accompagnants,
    que_tab_gammes_produits,
    que_tab_feedbacks,
    que_add_visite,
    que_add_visite_produit,
    que_add_partenaire_visite,
    que_fiche_visite,
    que_upd_visite,
    que_delete_visite_produit,
    que_delete_visite_partenaire,
    que_export_visites,
    que_visite_partenaires,
    que_get_produits_visite
}