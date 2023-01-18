const que_get_codification_param = `
SET	@type_codification = ?,
    @code_codification = ?,
    @type_parent       = ?,
    @code_parent       = ?;

SELECT
    c.type_codification     ,
    c.code_codification     ,
    c.libelle_codification  ,
    c.type_parent           ,
    c.code_parent
FROM	tab_par_codification c
WHERE	1 = 1 
AND 	IFNULL(c.type_codification	,' ')		= IF(IFNULL(@type_codification	,' ') = ' ', IFNULL(c.type_codification,' ')	, @type_codification) 
AND 	IFNULL(c.code_codification	,' ')		= IF(IFNULL(@code_codification	,' ') = ' ', IFNULL(c.code_codification,' ')	, @code_codification) 
AND 	IFNULL(c.type_parent		,' ')		= IF(IFNULL(@type_parent		,' ') = ' ', IFNULL(c.type_parent	   ,' ')	, @type_parent) 
AND 	IFNULL(c.code_parent		,' ')		= IF(IFNULL(@code_parent		,' ') = ' ', IFNULL(c.code_parent	   ,' ')	, @code_parent)
AND		c.flag_actif 							= 'O'
ORDER BY ordre_codification`;

const que_get_date = `
SELECT NOW() AS date_jour;
`

const que_get_tab_parametrages = `
SET	@code_codification      = ?,
    @type_codification      = ?,
    @libelle_codification   = ?,
    @code_parent            = ?,
    @libelle_parent         = ?,
    @flag_actif             = ?;

SELECT
    tpc.type_codification       ,
    tpc.code_codification       ,
    tpc.flag_actif              ,
    tpc.ordre_codification      ,
    tpc.libelle_codification    ,
    tpc.date_creation           ,
    tpc.type_parent             ,
    tpc.code_parent             ,
    (SELECT libelle_codification FROM tab_par_codification
        WHERE   type_codification = tpc.type_parent
        AND     code_codification = tpc.code_parent) AS libelle_parent
FROM	
    tab_par_codification tpc
WHERE
    tpc.type_codification       = @type_codification
AND IF(@libelle_codification    IS NOT NULL, tpc.libelle_codification   , 1) LIKE IF(@libelle_codification  IS NOT NULL, CONCAT('%',IFNULL(@libelle_codification,''),'%')   , 1)
AND IF(@libelle_parent          IS NOT NULL, (SELECT libelle_codification FROM tab_par_codification
                                                WHERE   type_codification = tpc.type_parent
                                                AND     code_codification = tpc.code_parent)             
                                                                        , 1) LIKE IF(@libelle_parent        IS NOT NULL, CONCAT('%',IFNULL(@libelle_parent      ,''),'%')   , 1)
AND IF(@code_codification       IS NOT NULL, tpc.code_codification      , 1) LIKE IF(@code_codification     IS NOT NULL, CONCAT('%',IFNULL(@code_codification   ,''),'%')   , 1)
AND IF(@code_parent             IS NOT NULL, tpc.code_parent            , 1) LIKE IF(@code_parent           IS NOT NULL, CONCAT('%',IFNULL(@code_parent         ,''),'%')   , 1)
`

const que_get_nbr_tab_parametrages = `
SET	@code_codification      = ?,
    @type_codification      = ?,
    @libelle_codification   = ?,
    @code_parent            = ?,
    @libelle_parent         = ?,
    @flag_actif             = ?;

SELECT  COUNT(0) AS nbr_total_codification
FROM    tab_par_codification tpc
WHERE   tpc.type_codification       = @type_codification
AND     IF(@libelle_codification    IS NOT NULL, tpc.libelle_codification   , 1) LIKE IF(@libelle_codification  IS NOT NULL, CONCAT('%',IFNULL(@libelle_codification,''),'%')   , 1)
AND     IF(@libelle_parent          IS NOT NULL, (SELECT libelle_codification FROM tab_par_codification
                                                    WHERE   type_codification = tpc.type_parent
                                                    AND     code_codification = tpc.code_parent)             
                                                                            , 1) LIKE IF(@libelle_parent        IS NOT NULL, CONCAT('%',IFNULL(@libelle_parent,''),'%')         , 1)
AND     IF(@code_codification       IS NOT NULL, tpc.code_codification      , 1) = IF(@code_codification        IS NOT NULL, @code_codification                                 , 1)
AND     IF(@code_parent             IS NOT NULL, tpc.code_parent            , 1) = IF(@code_parent              IS NOT NULL, @code_parent                                       , 1);
`

const que_get_last_code_codification = `
SET @type_codification = ?;

SELECT  tpc.code_codification
FROM    tab_par_codification tpc
WHERE   tpc.type_codification = @type_codification
ORDER BY tpc.code_codification DESC LIMIT 0,1;
`

const que_add_codification = `
SET @code_codification      = ?,
    @type_codification      = ?,
    @ordre_codification     = ?,
    @libelle_codification   = ?,
    @type_parent            = ?,
    @code_parent            = ?;

INSERT INTO tab_par_codification (
    code_codification       ,
    type_codification       ,
    ordre_codification      ,
    libelle_codification    ,
    type_parent             ,
    code_parent             ,
    flag_actif
) Values (
    @code_codification      ,
    @type_codification      ,
    @ordre_codification     ,
    @libelle_codification   ,
    @type_parent            ,
    @code_parent            ,
    'O'
);
`

const que_upd_codification = `
SET @code_codification      = ?,
    @type_codification      = ?,
    @ordre_codification     = ?,
    @libelle_codification   = ?;

UPDATE tab_par_codification 
SET
    ordre_codification      = @ordre_codification   ,
    libelle_codification    = @libelle_codification
WHERE
    type_codification       = @type_codification
AND
    code_codification       = @code_codification    ;
`

const que_desactivate_codification = `
SET @type_codification          = ?,
    @code_codification          = ?;

UPDATE  tab_par_codification 
SET     flag_actif              = 'N'
WHERE   type_codification       = @type_codification
AND     code_codification       = @code_codification    ;

SELECT  libelle_codification 
FROM    tab_par_codification
WHERE   type_codification       = @type_codification
AND     code_codification       = @code_codification    ;
`

const que_activate_codification = `
SET @type_codification          = ?,
    @code_codification          = ?;

UPDATE  tab_par_codification 
SET     flag_actif              = 'O'
WHERE   type_codification       = @type_codification
AND     code_codification       = @code_codification    ;

SELECT  libelle_codification 
FROM    tab_par_codification
WHERE   type_codification       = @type_codification
AND     code_codification       = @code_codification    ;
`

const que_get_nbr_jours = `
SELECT
    *
FROM
    tab_par_codification
WHERE
    type_codification = 'JOUR'
    AND flag_actif = 'O';
`
const que_get_hours_range = `
SELECT
    *
FROM
    tab_par_codification
WHERE
    type_codification = 'HEURE'
    AND flag_actif = 'O';
`
const que_get_status_colors = `
SELECT
    *
FROM
    tab_par_codification
WHERE
    type_codification = 'COST'
    AND flag_actif = 'O';
`

const que_get_parametrages_app = `
SELECT
    code_parametrage       ,
    type_parametrage       ,
    libelle_parametrage    
FROM
    tab_parametrage;
`

module.exports = {
    que_get_codification_param      ,
    que_get_date                    ,
    que_get_tab_parametrages        ,
    que_get_nbr_tab_parametrages    ,
    que_get_last_code_codification  ,
    que_add_codification            ,
    que_upd_codification            ,
    que_desactivate_codification    ,
    que_activate_codification       ,
    que_get_nbr_jours               ,
    que_get_hours_range             ,
    que_get_status_colors           ,
    que_get_parametrages_app
};