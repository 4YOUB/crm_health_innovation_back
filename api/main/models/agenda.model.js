const que_agenda_perso_visites = `
SET @token_id               = ?,
    @date_debut_visite      = ?,
    @date_fin_visite        = ?,
    @id_utilisateur = ?;

SELECT
    tpv.id_utilisateur                                                                                                  ,
    tpv.id_visite                                                                                                       ,
    tpv.flag_accompagnee                                                                                                ,
    tpv.date_visite                                                                                                     ,
    tpv.heure_fin_visite                                                                                                ,
    tpv.code_statut_visite                                                                                              ,
    tpv.code_type_visite                                                                                                ,
    IF(code_type_visite = 'PLAN','Planifiée','Hors planification')                              AS type_visite          ,
    IF(tp.code_type_partenaire = 'MEDE', 'Médecin', 'Pharmacie')                                AS type_partenaire      ,
    tp.code_type_partenaire                                                                     AS code_type_partenaire ,
    UPPER(CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,'')) ) AS nom_partenaire       ,
    IF(flag_accompagnee = 'O', (SELECT CONCAT(nom_utilisateur,' ', prenom_utilisateur) FROM tab_utilisateur tu 
                                    WHERE tu.id_utilisateur = id_accompagnant LIMIT 1), null)   AS accompagnant         ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'REGI' AND code_codification = tp.code_region_partenaire)     AS region_partenaire    ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'VILL' AND code_codification = tp.code_ville_partenaire)      AS ville_partenaire     ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'SECT' AND code_codification = tp.code_secteur_partenaire)    AS secteur_partenaire,
    (SELECT CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur) FROM tab_utilisateur tu
    WHERE tu.id_utilisateur = tpv.id_utilisateur)                                           AS nom_utilisateur      
FROM        tab_visite tpv
LEFT JOIN tab_partenaire_visite tpv2 ON tpv.id_visite = tpv2.id_visite
LEFT JOIN   tab_partenaire  tp ON tpv2.id_partenaire  = tp.id_partenaire
WHERE
tpv.code_statut_visite <> 'SUPP'
AND tpv2.order_partenaire = 1
AND
CASE
        WHEN @date_debut_visite IS NOT NULL AND @date_fin_visite IS NOT NULL THEN 
            date_visite BETWEEN @date_debut_visite AND @date_fin_visite
        ELSE 1 = 1
    END
AND ( 
    tpv.id_utilisateur = IF(@id_utilisateur IS NOT NULL, @id_utilisateur , @token_id) 
    OR 
    tpv.id_accompagnant = IF(@id_utilisateur IS NOT NULL, @id_utilisateur , @token_id) 
    )
`

const que_agenda_perso_nbr_visites = `
SET @token_id               = ?,
    @date_debut_visite      = ?,
    @date_fin_visite        = ?,
    @id_utilisateur = ?;

SELECT      COUNT(0) AS nbr_total_visites
FROM        tab_visite tpv
LEFT JOIN tab_partenaire_visite tpv2 ON tpv.id_visite = tpv2.id_visite
LEFT JOIN   tab_partenaire  tp ON tpv2.id_partenaire  = tp.id_partenaire
WHERE
tpv.code_statut_visite <> 'SUPP'
AND
CASE
        WHEN @date_debut_visite IS NOT NULL AND @date_fin_visite IS NOT NULL THEN 
            date_visite BETWEEN @date_debut_visite AND @date_fin_visite
        ELSE 1 = 1
    END
AND ( 
    tpv.id_utilisateur = IF(@id_utilisateur IS NOT NULL, @id_utilisateur , @token_id) 
    OR 
    tpv.id_accompagnant = IF(@id_utilisateur IS NOT NULL, @id_utilisateur , @token_id) 
    )
`




const que_agenda_fiche_visite = `
SET @token_id   = ?,
    @id_visite  = ?;

SELECT
    tpv.id_visite                                                                                                       ,
    tpv.flag_accompagnee                                                                                                ,
    tpv.date_visite                                                                                                     ,
    tpv.code_statut_visite                                                                                              ,
    tpv.code_type_visite                                                                                                ,
    tpv.date_replanification                                                                                            ,
    tpv2.id_partenaire                                                                                                   ,
    tpv2.nom_remplacent                                                                                                  ,
    tpv.commentaire                                                                                                     ,                                                                                                
    tpv.id_utilisateur                                                                                                  ,
    tpv.heure_fin_visite                                                                                                 ,
    IF(code_type_visite = 'PLAN','Planifiée','Hors planification')                              AS type_visite          ,
    IF(tp.code_type_partenaire = 'MEDE', 'Médecin', 'Pharmacie')                                AS type_partenaire      ,
    (SELECT CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur) FROM tab_utilisateur tu
        WHERE tu.id_utilisateur = tpv.id_utilisateur)                                           AS nom_utilisateur      ,
    tp.code_type_partenaire                                                                     AS code_type_partenaire ,
    tp.code_potentiel                                                                           AS code_potentiel       ,
    tp.code_specialite                                                                          AS code_specialite      ,
    tp.adresse_partenaire                                                                                               ,
    tp.tel1_partenaire                                                                                                  ,
    tp.tel2_partenaire                                                                                                  ,
    UPPER(CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,'')) ) AS nom_partenaire       ,
    IF(flag_accompagnee = 'O', (SELECT CONCAT(nom_utilisateur,' ', prenom_utilisateur) FROM tab_utilisateur tu 
                                    WHERE tu.id_utilisateur = id_accompagnant LIMIT 1), null)   AS accompagnant         ,
    (SELECT COUNT(0) FROM tab_visite_produit tvp1 WHERE tvp1.id_visite = tpv.id_visite LIMIT 1) AS nbr_produit          ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'SPEC' AND code_codification = tp.code_specialite)            AS specialite           ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'REGI' AND code_codification = tp.code_region_partenaire)     AS region_partenaire    ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'VILL' AND code_codification = tp.code_ville_partenaire)      AS ville_partenaire     ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'SECT' AND code_codification = tp.code_secteur_partenaire)    AS secteur_partenaire
FROM        tab_visite tpv
LEFT JOIN tab_partenaire_visite tpv2 ON tpv.id_visite = tpv2.id_visite
LEFT JOIN   tab_partenaire  tp ON tpv2.id_partenaire  = tp.id_partenaire
WHERE
    tpv.id_visite = @id_visite;

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



const que_agenda_equipe_visites = `
SET @token_id               = ?,
    @token_role = ?,
    @date_debut_visite      = ?,
    @date_fin_visite        = ?;

SELECT
    tpv.id_utilisateur                                                                                                  ,
    tpv.id_visite                                                                                                       ,
    tpv.flag_accompagnee                                                                                                ,
    tpv.date_visite                                                                                                     ,
    tpv.code_statut_visite                                                                                              ,
    tpv.code_type_visite                                                                                                ,
    IF(code_type_visite = 'PLAN','Planifiée','Hors planification')                              AS type_visite          ,
    IF(tp.code_type_partenaire = 'MEDE', 'Médecin', 'Pharmacie')                                AS type_partenaire      ,
    tp.code_type_partenaire                                                                     AS code_type_partenaire ,
    UPPER(CONCAT(tp.nom_partenaire,' ',IF(tp.prenom_partenaire IS NOT NULL,tp.prenom_partenaire,'')) ) AS nom_partenaire       ,
    IF(flag_accompagnee = 'O', (SELECT CONCAT(nom_utilisateur,' ', prenom_utilisateur) FROM tab_utilisateur tu 
                                    WHERE tu.id_utilisateur = id_accompagnant LIMIT 1), null)   AS accompagnant         ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'REGI' AND code_codification = tp.code_region_partenaire)     AS region_partenaire    ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'VILL' AND code_codification = tp.code_ville_partenaire)      AS ville_partenaire     ,
    (SELECT libelle_codification FROM tab_par_codification 
        WHERE type_codification = 'SECT' AND code_codification = tp.code_secteur_partenaire)    AS secteur_partenaire   ,
    (SELECT CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur) FROM tab_utilisateur tu
    WHERE tu.id_utilisateur = tpv.id_utilisateur)                                           AS nom_utilisateur      
FROM        tab_visite tpv
LEFT JOIN tab_partenaire_visite tpv2 ON tpv.id_visite = tpv2.id_visite
LEFT JOIN   tab_partenaire  tp ON tpv2.id_partenaire  = tp.id_partenaire
WHERE
tpv.code_statut_visite <> 'SUPP'
AND
CASE
        WHEN @date_debut_visite IS NOT NULL AND @date_fin_visite IS NOT NULL THEN 
            date_visite BETWEEN @date_debut_visite AND @date_fin_visite
        ELSE 1 = 1
    END
AND ( 
    CASE
        WHEN @token_role <> 'ADMI' THEN 
        (
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
        )
        ELSE tpv.id_utilisateur <> @token_id
    END
    )
`


const que_agenda_equipe_nbr_visites = `
SET @token_id               = ?,
    @token_role = ?,
    @date_debut_visite      = ?,
    @date_fin_visite        = ?;

SELECT      COUNT(0) AS nbr_total_visites
FROM        tab_visite tpv
LEFT JOIN tab_partenaire_visite tpv2 ON tpv.id_visite = tpv2.id_visite
LEFT JOIN   tab_partenaire  tp ON tpv2.id_partenaire  = tp.id_partenaire
WHERE
tpv.code_statut_visite <> 'SUPP'
AND
CASE
        WHEN @date_debut_visite IS NOT NULL AND @date_fin_visite IS NOT NULL THEN 
            date_visite BETWEEN @date_debut_visite AND @date_fin_visite
        ELSE 1 = 1
    END
AND ( 
    CASE
        WHEN @token_role <> 'ADMI' THEN 
        (
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
        )
        ELSE tpv.id_utilisateur <> @token_id
    END
    )
`


const que_tab_agenda_evenements = `
SET @token_id = ?,
    @date_debut_evenements = ?,
    @date_fin_evenements = ?,
    @id_utilisateur = ?;

SELECT
    te.id_evenement,
    te.id_utilisateur,
    te.id_creation,
    te.date_creation,
    te.titre,
    te.date_deb_evenement,
    te.date_fin_evenement,
    te.type_evenement,
    te.code_evenement,
    (SELECT 
        libelle_codification FROM tab_par_codification 
    WHERE 
        type_codification = 'EVENT' AND code_codification = te.code_evenement
    ) AS libelle_code_evenement,
    (SELECT CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur) FROM tab_utilisateur tu
    WHERE tu.id_utilisateur = te.id_utilisateur) AS nom_utilisateur
FROM
    tab_evenement te
WHERE
    te.id_utilisateur = IF(@id_utilisateur IS NOT NULL, @id_utilisateur , @token_id)
AND
    CASE
        WHEN @date_debut_evenements IS NOT NULL AND @date_fin_evenements IS NOT NULL THEN 
        (
            te.date_deb_evenement <= @date_fin_evenements
            AND
            te.date_fin_evenement >= @date_debut_evenements
        )
        ELSE 1 = 1
    END
`

const que_nbr_tab_agenda_evenements = `
SET @token_id = ?,
    @date_debut_evenements = ?,
    @date_fin_evenements = ?,
    @id_utilisateur = ?;

SELECT
    COUNT(0) AS nbr_total_evenements
FROM
    tab_evenement te
WHERE
    te.id_utilisateur = IF(@id_utilisateur IS NOT NULL, @id_utilisateur , @token_id)
AND
    CASE
        WHEN @date_debut_evenements IS NOT NULL AND @date_fin_evenements IS NOT NULL THEN 
        (
            te.date_deb_evenement <= @date_fin_evenements
            AND
            te.date_fin_evenement >= @date_debut_evenements
        )
        ELSE 1 = 1
    END
`

const que_tab_agenda_equipe_evenements = `
SET @token_id = ?,
    @token_role = ?,
    @date_debut_evenements = ?,
    @date_fin_evenements = ?;

SELECT
    te.id_evenement,
    te.id_utilisateur,
    te.id_creation,
    te.date_creation,
    te.titre,
    te.date_deb_evenement,
    te.date_fin_evenement,
    te.type_evenement,
    te.code_evenement,
    (SELECT 
        libelle_codification FROM tab_par_codification 
    WHERE 
        type_codification = 'EVENT' AND code_codification = te.code_evenement
    ) AS libelle_code_evenement,
    (SELECT CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur) FROM tab_utilisateur tu
    WHERE tu.id_utilisateur = te.id_utilisateur) AS nom_utilisateur      
FROM
    tab_evenement te
WHERE
    CASE
        WHEN @date_debut_evenements IS NOT NULL AND @date_fin_evenements IS NOT NULL THEN 
        (
            te.date_deb_evenement <= @date_fin_evenements
            AND
            te.date_fin_evenement >= @date_debut_evenements
        )
        ELSE 1 = 1
    END
AND ( 
    CASE
        WHEN @token_role <> 'ADMI' THEN 
        (
            (te.id_creation  = @token_id AND te.id_utilisateur <> @token_id)
            OR
            te.id_utilisateur  IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                        WHERE tu1.id_responsable IN (
                                            SELECT tu2.id_utilisateur FROM tab_utilisateur tu2
                                                                        WHERE tu2.id_responsable = @token_id)
                                    )
            OR
            te.id_utilisateur  IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                        WHERE tu1.id_responsable IN (
                                                                        SELECT  tu2.id_utilisateur FROM tab_utilisateur tu2
                                                                        WHERE   tu2.id_responsable IN (
                                                                                    SELECT  tu3.id_utilisateur FROM tab_utilisateur tu3
                                                                                    WHERE   tu3.id_responsable = @token_id
                                                                                )
                                                                    )
                                    )
        )
        ELSE te.id_utilisateur <> @token_id
    END
    )
`

const que_nbr_tab_agenda_equipe_evenements = `
SET @token_id = ?,
    @token_role = ?,
    @date_debut_evenements = ?,
    @date_fin_evenements = ?;

SELECT
    COUNT(0) AS nbr_total_evenements
FROM
    tab_evenement te
WHERE
    CASE
        WHEN @date_debut_evenements IS NOT NULL AND @date_fin_evenements IS NOT NULL THEN 
        (
            te.date_deb_evenement <= @date_fin_evenements
            AND
            te.date_fin_evenement >= @date_debut_evenements
        )
        ELSE 1 = 1
    END
AND ( 
    CASE
        WHEN @token_role <> 'ADMI' THEN 
        (
            (te.id_creation  = @token_id AND te.id_utilisateur <> @token_id)
            OR
            te.id_utilisateur  IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                        WHERE tu1.id_responsable IN (
                                            SELECT tu2.id_utilisateur FROM tab_utilisateur tu2
                                                                        WHERE tu2.id_responsable = @token_id)
                                    )
            OR
            te.id_utilisateur  IN  (SELECT tu1.id_utilisateur FROM tab_utilisateur tu1
                                        WHERE tu1.id_responsable IN (
                                                                        SELECT  tu2.id_utilisateur FROM tab_utilisateur tu2
                                                                        WHERE   tu2.id_responsable IN (
                                                                                    SELECT  tu3.id_utilisateur FROM tab_utilisateur tu3
                                                                                    WHERE   tu3.id_responsable = @token_id
                                                                                )
                                                                    )
                                    )
        )
        ELSE te.id_utilisateur <> @token_id
    END
    )
`


const que_add_evenement = `
SET @id_utilisateur = ?,
    @id_creation = ?,
    @code_evenement = ?, 
    @type_evenement = ?, 
    @titre = ?,   
    @date_deb_evenement = ?, 
    @date_fin_evenement = ?,
    @lieu = ?,
    @commentaire = ?
    ;

SELECT 
    @conflictCountE := COUNT(te.id_utilisateur), 
    @idsE := CONCAT('[',GROUP_CONCAT(te.id_evenement),']')
FROM tab_evenement te
WHERE te.id_utilisateur = @id_utilisateur
AND
(
    (
        (
            @date_deb_evenement >= te.date_deb_evenement
            AND @date_deb_evenement < te.date_fin_evenement
        )
        OR(
            @date_fin_evenement > te.date_deb_evenement
            AND @date_fin_evenement <= te.date_fin_evenement
        )
    )
    OR(
        (
            te.date_deb_evenement >= @date_deb_evenement
            AND te.date_deb_evenement < @date_fin_evenement
        )
        OR(
            te.date_fin_evenement > @date_deb_evenement
            AND te.date_fin_evenement <= @date_fin_evenement
        )
    )
    OR(
        @date_deb_evenement = @date_fin_evenement
        AND (
            DATE_FORMAT(
                te.date_deb_evenement,
                "%Y-%m-%d"
            ) IN(
                DATE_FORMAT(@date_deb_evenement, "%Y-%m-%d"),
                DATE_FORMAT(@date_fin_evenement, "%Y-%m-%d")
            )
            OR DATE_FORMAT(
                te.date_fin_evenement,
                "%Y-%m-%d"
            ) IN(
                DATE_FORMAT(@date_deb_evenement, "%Y-%m-%d"),
                DATE_FORMAT(@date_fin_evenement, "%Y-%m-%d")
            )
        )
    )
    OR(
        te.date_deb_evenement = te.date_fin_evenement
        AND (
            DATE_FORMAT(
                @date_deb_evenement,
                "%Y-%m-%d"
            ) IN(
                DATE_FORMAT(te.date_deb_evenement, "%Y-%m-%d"),
                DATE_FORMAT(te.date_fin_evenement, "%Y-%m-%d")
            )
            OR DATE_FORMAT(
                @date_fin_evenement,
                "%Y-%m-%d"
            ) IN(
                DATE_FORMAT(te.date_deb_evenement, "%Y-%m-%d"),
                DATE_FORMAT(te.date_fin_evenement, "%Y-%m-%d")
            )
        )
    )
);


SELECT
    @conflictCountV := COUNT(tv.id_utilisateur),
    @idsV := CONCAT('[', GROUP_CONCAT(tv.id_visite),
    ']')
FROM
    tab_visite tv
WHERE
    tv.code_statut_visite <> 'SUPP' AND tv.id_utilisateur = @id_utilisateur AND(
        (
            tv.date_visite >= @date_deb_evenement AND tv.date_visite < @date_fin_evenement
        ) OR(
            ADDTIME(
                tv.date_visite,
                (
                SELECT
                    libelle_codification
                FROM
                    tab_par_codification
                WHERE
                    type_codification = 'HEURE' AND code_codification = 'DVISIT' AND flag_actif = 'O'
            )
            ) > @date_deb_evenement AND ADDTIME(
                tv.date_visite,
                (
                SELECT
                    libelle_codification
                FROM
                    tab_par_codification
                WHERE
                    type_codification = 'HEURE' AND code_codification = 'DVISIT' AND flag_actif = 'O'
            )
            ) <= @date_fin_evenement
        )
    );


IF  @conflictCountE = 0
THEN
        IF  @conflictCountV = 0     
        THEN
            INSERT INTO tab_evenement (
                id_utilisateur, 
                id_creation, 
                code_evenement, 
                type_evenement, 
                titre, 
                date_deb_evenement, 
                date_fin_evenement,
                lieu,
                commentaire
            ) 
            VALUES (
                @id_utilisateur, 
                @id_creation, 
                @code_evenement, 
                @type_evenement, 
                @titre, 
                @date_deb_evenement, 
                @date_fin_evenement,
                @lieu,
                @commentaire
            );

            SELECT 'yes' AS isOK;

            SELECT LAST_INSERT_ID() AS id_evenement;
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

SELECT 
    libelle_codification AS libelle_code_evenement 
FROM tab_par_codification 
WHERE 
    type_codification = 'EVENT' AND code_codification = @code_evenement;
`

const que_agenda_fiche_evenement = `
SET @token_id   = ?,
    @id_evenement  = ?;

SELECT
    te.id_evenement,
    te.id_utilisateur,
    te.id_creation,
    te.date_creation,
    te.titre,
    te.date_deb_evenement,
    te.date_fin_evenement,
    te.type_evenement,
    te.code_evenement,
    (SELECT 
        libelle_codification FROM tab_par_codification 
    WHERE 
        type_codification = 'EVENT' AND code_codification = te.code_evenement
    ) AS libelle_code_evenement,
    (SELECT CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur) FROM tab_utilisateur tu
    WHERE tu.id_utilisateur = te.id_utilisateur) AS nom_utilisateur,
    te.lieu,
    te.commentaire 
FROM
    tab_evenement te
WHERE
    te.id_evenement = @id_evenement
`

const que_agenda_supprimer_evenement = `
SET @token_id   = ?,
    @id_evenement  = ?;

DELETE
FROM
    tab_evenement
WHERE
    id_evenement = @id_evenement
`

const que_agenda_modifier_evenement = `
SET @token_id   = ?,
    @id_utilisateur = ?,
    @id_evenement  = ?,
    @code_evenement  = ?,  
    @titre  = ?, 
    @date_deb_evenement  = ?, 
    @date_fin_evenement  = ?,
    @lieu = ?,
    @commentaire = ?
    ;

SELECT 
@conflictCountE := COUNT(te.id_utilisateur), 
@idsE := CONCAT('[',GROUP_CONCAT(te.id_evenement),']')
FROM tab_evenement te
WHERE te.id_utilisateur = @id_utilisateur
AND te.id_evenement <> @id_evenement
AND
(
    (
        (
            @date_deb_evenement >= te.date_deb_evenement
            AND @date_deb_evenement < te.date_fin_evenement
        )
        OR(
            @date_fin_evenement > te.date_deb_evenement
            AND @date_fin_evenement <= te.date_fin_evenement
        )
    )
    OR(
        (
            te.date_deb_evenement >= @date_deb_evenement
            AND te.date_deb_evenement < @date_fin_evenement
        )
        OR(
            te.date_fin_evenement > @date_deb_evenement
            AND te.date_fin_evenement <= @date_fin_evenement
        )
    )
    OR(
        @date_deb_evenement = @date_fin_evenement
        AND (
            DATE_FORMAT(
                te.date_deb_evenement,
                "%Y-%m-%d"
            ) IN(
                DATE_FORMAT(@date_deb_evenement, "%Y-%m-%d"),
                DATE_FORMAT(@date_fin_evenement, "%Y-%m-%d")
            )
            OR DATE_FORMAT(
                te.date_fin_evenement,
                "%Y-%m-%d"
            ) IN(
                DATE_FORMAT(@date_deb_evenement, "%Y-%m-%d"),
                DATE_FORMAT(@date_fin_evenement, "%Y-%m-%d")
            )
        )
    )
    OR(
        te.date_deb_evenement = te.date_fin_evenement
        AND (
            DATE_FORMAT(
                @date_deb_evenement,
                "%Y-%m-%d"
            ) IN(
                DATE_FORMAT(te.date_deb_evenement, "%Y-%m-%d"),
                DATE_FORMAT(te.date_fin_evenement, "%Y-%m-%d")
            )
            OR DATE_FORMAT(
                @date_fin_evenement,
                "%Y-%m-%d"
            ) IN(
                DATE_FORMAT(te.date_deb_evenement, "%Y-%m-%d"),
                DATE_FORMAT(te.date_fin_evenement, "%Y-%m-%d")
            )
        )
    )
);


SELECT
    @conflictCountV := COUNT(tv.id_utilisateur),
    @idsV := CONCAT('[', GROUP_CONCAT(tv.id_visite),
    ']')
FROM
    tab_visite tv
WHERE
    tv.code_statut_visite <> 'SUPP' AND tv.id_utilisateur = @id_utilisateur AND(
        (
            tv.date_visite >= @date_deb_evenement AND tv.date_visite < @date_fin_evenement
        ) OR(
            ADDTIME(
                tv.date_visite,
                (
                SELECT
                    libelle_codification
                FROM
                    tab_par_codification
                WHERE
                    type_codification = 'HEURE' AND code_codification = 'DVISIT' AND flag_actif = 'O'
            )
            ) > @date_deb_evenement AND ADDTIME(
                tv.date_visite,
                (
                SELECT
                    libelle_codification
                FROM
                    tab_par_codification
                WHERE
                    type_codification = 'HEURE' AND code_codification = 'DVISIT' AND flag_actif = 'O'
            )
            ) <= @date_fin_evenement
        )
    );


IF  @conflictCountE = 0
THEN
    IF  @conflictCountV = 0     
    THEN
        UPDATE 
            tab_evenement 
        SET 
            code_evenement = @code_evenement, 
            titre = @titre, 
            date_deb_evenement = @date_deb_evenement, 
            date_fin_evenement = @date_fin_evenement,
            lieu = @lieu,
            commentaire = @commentaire
        WHERE
            id_evenement = @id_evenement;

        SELECT 'yes' AS isOK;
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

const que_agenda_supp_visites = `
SET @token_id = ?, 
    @id_utilisateur = ?
    ;

UPDATE tab_visite
SET
    code_statut_visite = 'SUPP'
WHERE
    id_utilisateur = @id_utilisateur
    AND
    id_visite IN (?)
;
`

const que_is_date_free = `
SET @token_id = ?, 
    @date = ? 
;

SELECT 
    CASE 
    	WHEN COUNT(te.id_evenement) = 0 
        THEN 'true' 
        ELSE 'false' 
    END AS isFree
FROM
    tab_evenement te
WHERE
    te.id_utilisateur = @token_id
    AND @date BETWEEN DATE(te.date_deb_evenement) AND DATE(te.date_fin_evenement)
    AND te.code_evenement IN ('MALD', 'CONG')
;
`

module.exports = {
    que_agenda_perso_visites,
    que_agenda_perso_nbr_visites,
    que_agenda_fiche_visite,
    que_agenda_equipe_visites,
    que_agenda_equipe_nbr_visites,
    que_tab_agenda_evenements,
    que_nbr_tab_agenda_evenements,
    que_add_evenement,
    que_agenda_fiche_evenement,
    que_agenda_supprimer_evenement,
    que_agenda_modifier_evenement,
    que_agenda_supp_visites,
    que_tab_agenda_equipe_evenements,
    que_nbr_tab_agenda_equipe_evenements,
    que_is_date_free
}