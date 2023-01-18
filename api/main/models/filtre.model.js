const que_tab_partenaires = `
SET @token_id               = ?,
    @token_role             = ?,
    @token_medical          = ?,
    @token_pharmaceutique   = ?,
    @type                   = ?;

SELECT
    id_partenaire       ,
    code_type_partenaire,
    code_specialite   ,
    code_ville_partenaire,
    (SELECT libelle_codification FROM tab_par_codification WHERE code_codification = code_specialite) AS libelle_specialite,
    (SELECT libelle_codification FROM tab_par_codification WHERE code_codification = code_ville_partenaire) AS libelle_ville,
    code_potentiel      ,
    code_region_partenaire,
    code_gamme AS code_gamme_partenaire,
    UPPER(CONCAT(nom_partenaire,' ',IF(prenom_partenaire IS NOT NULL,prenom_partenaire,''))) AS nom_partenaire
FROM 
    tab_partenaire 
WHERE
    code_statut_partenaire = 'VALI'
AND IF(@type IS NOT NULL, code_type_partenaire, 1) = IF(@type IS NOT NULL, @type, 1)
AND CASE
        WHEN @token_role NOT IN ('ADMI','DIR','PM') THEN
                code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                            WHERE   tur.id_utilisateur  = @token_id
                                            AND     tur.flag_actif      = 'O')
            AND
            (
                (
                        @token_medical = 'O'
                    AND
                        code_type_partenaire = 'MEDE'
                    AND
                        code_gamme IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                            WHERE   tug.id_utilisateur  = @token_id
                                            AND     tug.flag_actif      = 'O')
                )
                OR
                (
                        @token_pharmaceutique = 'O'
                    AND
                        code_type_partenaire = 'PHAR'
                )
            )
        ELSE 1 = 1
    END
ORDER BY code_type_partenaire, nom_partenaire ASC;
`

const que_tab_etablissements = `
SET     @token_role          = ?;

SELECT  code_codification       ,
        type_codification       ,
        libelle_codification
FROM    tab_par_codification
WHERE   type_codification = 'ETPR'
AND     CASE
            WHEN @token_role <> 'ADMI' THEN
                flag_actif = 'O'
            ELSE 1 = 1
        END
ORDER BY ordre_codification, libelle_codification;

SELECT  code_codification       ,
        type_codification       ,
        libelle_codification
FROM    tab_par_codification
WHERE   type_codification = 'ETPU'
AND     CASE
            WHEN @token_role <> 'ADMI' THEN
                flag_actif = 'O'
            ELSE 1 = 1
        END
ORDER BY ordre_codification, libelle_codification;
`

const que_tab_specialites = `
SET     @token_id            = ?,
        @token_role          = ?;

SELECT  code_codification       ,
        type_codification       ,
        libelle_codification
FROM    tab_par_codification
WHERE   type_codification   = 'SPEC'
AND     type_parent         = 'GAMM'
AND     CASE
            WHEN @token_role IN ('DIR','PM','ACH') THEN
                flag_actif = 'O'
            WHEN @token_role <> 'ADMI' THEN
                    code_parent IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                            WHERE   tug.id_utilisateur  = @token_id
                                            AND     tug.flag_actif      = 'O')
                AND
                    flag_actif = 'O'
            ELSE 1 = 1
        END
ORDER BY ordre_codification, libelle_codification;
`

const que_tab_revis = `
SET     @token_role   = ?,
        @token_id     = ?;

SELECT  code_codification           ,
        type_codification           ,
        libelle_codification        ,
        type_parent                 ,
        code_parent                 ,
        ordre_codification          ,
        flag_actif
FROM    tab_par_codification
WHERE   type_codification   = 'REGI'
AND     CASE
            WHEN @token_role IN ('DIR','PM','ACH') THEN
                flag_actif = 'O'
            WHEN @token_role <> 'ADMI' THEN
                    code_codification IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                            WHERE   tur.id_utilisateur  = @token_id
                                            AND     tur.flag_actif      = 'O')
                AND
                    flag_actif = 'O'
            ELSE 1 = 1
        END
ORDER BY ordre_codification, libelle_codification;

SELECT  code_codification           ,
        type_codification           ,
        libelle_codification        ,
        type_parent                 ,
        code_parent
FROM    tab_par_codification
WHERE   type_codification   = 'VILL'
AND     type_parent         = 'REGI'
AND     CASE
            WHEN @token_role IN ('DIR','PM','ACH') THEN
                flag_actif = 'O'
            WHEN @token_role <> 'ADMI' THEN
                    code_parent IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                        WHERE   tur.id_utilisateur  = @token_id
                        AND     tur.flag_actif      = 'O')
                AND
                    flag_actif = 'O'
            ELSE 1 = 1
        END
ORDER BY ordre_codification, libelle_codification;

SELECT  code_codification           ,
        type_codification           ,
        libelle_codification        ,
        type_parent                 ,
        code_parent
FROM    tab_par_codification
WHERE   type_codification   = 'SECT'
AND     type_parent         = 'VILL'
AND     CASE
            WHEN @token_role IN ('DIR','PM','ACH') THEN
                flag_actif = 'O'
            WHEN @token_role <> 'ADMI' THEN
                    code_parent IN (SELECT code_codification FROM tab_par_codification 
                        WHERE   type_codification   = 'VILL'
                        AND     type_parent         = 'REGI'
                        AND     code_parent IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                WHERE   tur.id_utilisateur  = @token_id
                                                AND     tur.flag_actif      = 'O'))
                AND
                    flag_actif = 'O'
            ELSE 1 = 1
        END
ORDER BY ordre_codification, libelle_codification;
`

const que_tab_semaines = `
SELECT 
    WEEKOFYEAR(NOW())                                                       AS num_semaine              ,
    (SELECT date_deb_planification FROM tab_planification
        ORDER BY id_planification ASC LIMIT 0,1)  AS                        premiere_planification      ,
    (SELECT libelle_codification FROM tab_par_codification
        WHERE type_codification = 'SEME' AND code_codification = 'SMFUTUR') AS nbr_semaines_futurs      ;
`

const que_tab_utilisateurs = `
SET     @token_id               = ?,    
        @token_role             = ?,
        @token_medical          = ?,
        @token_pharmaceutique   = ?,
        @code                   = ?;

SELECT  tu1.id_utilisateur  ,
        NULL AS role        ,
        'Mes activités' AS nom_utilisateur
FROM    tab_utilisateur tu1
WHERE   tu1.id_utilisateur = @token_id

UNION ALL

SELECT  tu.id_utilisateur  ,
        tu.role            ,
        CONCAT(tu.nom_utilisateur,' ',tu.prenom_utilisateur) AS nom_utilisateur
FROM    tab_utilisateur tu
WHERE   code_statut_utilisateur = 'ACTI'
AND     tu.id_utilisateur <> @token_id
AND     tu.role NOT IN ('ADMI','ACH')
AND CASE
        WHEN @token_role IN ('KAM','DSM','DRG') THEN
                tu.id_responsable  = @token_id
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
        WHEN @token_role <> 'DEL' THEN
            1 = 1
    END
ORDER BY role , nom_utilisateur;
`

const que_tab_gammes = `
SET     @token_id             = ?,
        @token_role           = ?;

SELECT  code_codification           ,
        type_codification           ,
        libelle_codification        ,
        type_parent                 ,
        code_parent
FROM    tab_par_codification
WHERE   type_codification = 'GAMM'
AND     CASE
            WHEN @token_role IN ('DIR','PM','ACH') THEN
                flag_actif = 'O'
            WHEN @token_role <> 'ADMI' THEN
                    code_codification IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                        WHERE tug.id_utilisateur    = @token_id
                        AND     tug.flag_actif      = 'O')
                AND
                    flag_actif = 'O'
            ELSE 1 = 1
        END 
`

const que_tab_types_evenement = `
SET     @token_role          = ?;

SELECT  code_codification       ,
        type_codification       ,
        libelle_codification
FROM    tab_par_codification
WHERE   type_codification = 'EVENT'
AND     CASE
            WHEN @token_role <> 'ADMI' THEN
                flag_actif = 'O'
            ELSE 1 = 1
        END
ORDER BY ordre_codification, libelle_codification;
`

module.exports = {
    que_tab_partenaires,
    que_tab_etablissements,
    que_tab_specialites,
    que_tab_revis,
    que_tab_semaines,
    que_tab_utilisateurs,
    que_tab_gammes,
    que_tab_types_evenement
}