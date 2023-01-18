const que_tab_produits = `
SET @token_id               = ?,
    @id_produit             = ?,
    @code_gamme             = ?,
    @libelle_produit        = CONCAT('%',IFNULL(?,''),'%'),
    @code_statut_produit    = ?;

SELECT
    tp.id_produit           ,
    tp.libelle_produit      ,
    tp.date_creation        ,
    tp.ordre_produit        ,
    tp.code_statut_produit
FROM
    tab_produit tp
LEFT JOIN
    tab_produit_gamme tpg ON tpg.id_produit = tp.id_produit
WHERE
    IF(@id_produit          IS NOT NULL, tp.id_produit          , 1)    = IF(@id_produit            IS NOT NULL, @id_produit            , 1)
AND IF(@code_statut_produit IS NOT NULL, tp.code_statut_produit , 1)    = IF(@code_statut_produit   IS NOT NULL, @code_statut_produit   , 1)
AND IF(@code_gamme          IS NOT NULL, tpg.code_gamme         , 1)    = IF(@code_gamme            IS NOT NULL, @code_gamme            , 1)
AND IF(@libelle_produit     IS NOT NULL, tp.libelle_produit     , 1) LIKE IF(@libelle_produit       IS NOT NULL, @libelle_produit       , 1)
GROUP BY tp.id_produit 
`

const que_tab_produit_gammes = `
SET @id_produit             = ?;

SELECT
    tpg.id_produit_gamme    ,
    tpg.id_produit          ,
    tpg.code_gamme          ,
    (SELECT tpc.libelle_codification FROM tab_par_codification tpc
        WHERE   tpc.type_codification = 'GAMM'
        AND     tpc.code_codification = tpg.code_gamme)  AS libelle_gamme
FROM
    tab_produit_gamme tpg
WHERE
    IF(@id_produit IS NOT NULL, tpg.id_produit, 1) = IF(@id_produit IS NOT NULL, @id_produit    , 1);
`

const que_nbr_tab_produits = `
SET @token_id               = ?,
    @id_produit             = ?,
    @code_gamme             = ?,
    @libelle_produit        = CONCAT('%',IFNULL(?,''),'%'),
    @code_statut_produit    = ?;

SELECT  COUNT(0) AS nbr_total_produits
FROM    tab_produit tp
LEFT JOIN
        tab_produit_gamme tpg ON tpg.id_produit = tp.id_produit
WHERE   
    IF(@id_produit          IS NOT NULL, tp.id_produit          , 1)    = IF(@id_produit            IS NOT NULL, @id_produit            , 1)
AND IF(@code_statut_produit IS NOT NULL, tp.code_statut_produit , 1)    = IF(@code_statut_produit   IS NOT NULL, @code_statut_produit   , 1)
AND IF(@code_gamme          IS NOT NULL, tpg.code_gamme         , 1)    = IF(@code_gamme            IS NOT NULL, @code_gamme            , 1)
AND IF(@libelle_produit     IS NOT NULL, tp.libelle_produit     , 1) LIKE IF(@libelle_produit       IS NOT NULL, @libelle_produit       , 1);
`

const que_add_produit = `
SET @libelle_produit = ?,
    @ordre_produit   = ?;

INSERT INTO tab_produit (
    libelle_produit     ,
    ordre_produit       ,
    code_statut_produit
)
VALUES (
    @libelle_produit    ,
    @ordre_produit      ,
    'ACTI'
);
SELECT LAST_INSERT_ID() AS id_produit;
`

const que_add_produit_gamme = `
SET @id_produit = ?,
    @code_gamme = ?;

INSERT INTO tab_produit_gamme (
    id_produit  ,
    code_gamme
)
VALUES (
    @id_produit ,
    @code_gamme
);
`

const que_upd_produit = `
SET @id_produit      = ?,
    @libelle_produit = ?,
    @ordre_produit   = ?;

UPDATE tab_produit
SET
    libelle_produit = @libelle_produit  ,
    ordre_produit   = @ordre_produit
WHERE
    id_produit      = @id_produit       ;
`

const que_del_produit_gamme = `
DELETE  FROM tab_produit_gamme
WHERE   id_produit = ?;
`

const que_get_fiche_produit = `
SET @id_produit             = ?;

SELECT  tp.id_produit           ,
        tp.libelle_produit      ,
        tp.date_creation        ,
        tp.ordre_produit        ,
        tp.code_statut_produit
FROM    tab_produit tp
WHERE   id_produit = @id_produit;
`

const que_get_gammes_produit = `
SET @id_produit = ?;

SELECT 
    tpg.id_produit  ,
    tpg.code_gamme  ,
    (SELECT tpc.libelle_codification FROM tab_par_codification tpc
        WHERE   tpc.type_codification = 'GAMM'
        AND     tpc.code_codification = tpg.code_gamme)  AS libelle_gamme
FROM
    tab_produit_gamme tpg
WHERE
    tpg.id_produit = @id_produit;
`

const que_activate_produit = `
SET     @id_produit = ?;

UPDATE  tab_produit
SET     code_statut_produit = 'ACTI'
WHERE   id_produit = @id_produit;

SELECT  libelle_produit 
FROM    tab_produit
WHERE   id_produit = @id_produit;
`

const que_desactivate_produit = `
SET     @id_produit = ?;

UPDATE  tab_produit
SET     code_statut_produit = 'DESA'
WHERE   id_produit = @id_produit;

SELECT  libelle_produit 
FROM    tab_produit
WHERE   id_produit = @id_produit;
`

module.exports = {
    que_tab_produits        ,
    que_tab_produit_gammes  ,
    que_nbr_tab_produits    ,
    que_add_produit         ,
    que_add_produit_gamme   ,
    que_get_fiche_produit   ,
    que_get_gammes_produit  ,
    que_upd_produit         ,
    que_del_produit_gamme   ,
    que_activate_produit    ,
    que_desactivate_produit
}