const que_get_params = `
SELECT  tp.libelle_parametrage  AS flag_samedi          ,
        tp.libelle_parametrage2 AS type_journee_samedi
FROM    tab_parametrage tp
WHERE   tp.type_parametrage = 'WEEK'
AND     tp.code_parametrage = 'SAME';

SELECT  tp.libelle_parametrage  AS flag_dimanche        ,
        tp.libelle_parametrage2 AS type_journee_dimanche
FROM    tab_parametrage tp
WHERE   tp.type_parametrage = 'WEEK'
AND     tp.code_parametrage = 'DIMA';

SELECT  tp.libelle_parametrage  AS heure_debut_journee
FROM    tab_parametrage tp
WHERE   tp.type_parametrage = 'HEVI'
AND     tp.code_parametrage = 'HRSTART';

SELECT  tp.libelle_parametrage  AS heure_fin_journee
FROM    tab_parametrage tp
WHERE   tp.type_parametrage = 'HEVI'
AND     tp.code_parametrage = 'HREND';
`

const que_get_evenements_global = `
SET @annee = ?;
SELECT  MONTH(teg.date_deb_evenement)            AS mois ,
        (
            SELECT  SUM(DATEDIFF(teg1.date_fin_evenement, teg1.date_deb_evenement))
            FROM    tab_evenement_global teg1
            WHERE   YEAR(teg1.date_deb_evenement)  = @annee
            AND     MONTH(teg1.date_deb_evenement) = mois
        )                                       AS nbr_jours_evenement
FROM    tab_evenement_global teg
WHERE   YEAR(teg.date_deb_evenement) = @annee
GROUP BY mois;
`

const que_get_rapport_annuel = `
SET @token_id               = ?,
    @token_role             = ?,
    @annee                  = ?,
    @heure_debut_journee    = ?,
    @heure_fin_journee      = ?,
    @id_utilisateur         = ?,
    @role_utilisateur       = NULL;

SELECT  tu.role
INTO    @role_utilisateur
FROM    tab_utilisateur tu
WHERE   tu.id_utilisateur = @id_utilisateur;

SELECT  tv.date_visite                                              ,
        tv.id_utilisateur                                           ,
        (
            SELECT  CONCAT(tu.nom_utilisateur, ' ', tu.prenom_utilisateur)
            FROM    tab_utilisateur tu
            WHERE   tu.id_utilisateur = tv.id_utilisateur
        )                                   AS nom_utilisateur      ,
        MONTH(tv.date_visite)               AS mois                 ,
        (
            SELECT  COUNT(tv1.id_visite)
            FROM    tab_visite tv1
            WHERE   tv1.id_utilisateur      = tv.id_utilisateur
            AND     MONTH(tv1.date_visite)  = MONTH(tv.date_visite)
            AND     YEAR(tv1.date_visite)   = @annee
            AND     tv1.code_type_visite    = 'PLAN'
        )                                   AS nbr_visites_plan     ,
        (
            SELECT  COUNT(tv1.id_visite)
            FROM    tab_visite tv1
            WHERE   tv1.id_utilisateur      = tv.id_utilisateur
            AND     MONTH(tv1.date_visite)  = MONTH(tv.date_visite)
            AND     YEAR(tv1.date_visite)   = @annee
            AND     tv1.code_type_visite    = 'HOPL'
        )                                   AS nbr_visites_horsplan ,
        DAY(LAST_DAY(tv.date_visite))       AS nbr_jours_mois       ,
        # (
        #     SELECT DAY(LAST_DAY(tv.date_visite)) +  ( 
        #                                                 SELECT  ROUND(SUM(TIME_TO_SEC(timediff(te.date_deb_evenement, te.date_fin_evenement))/3600)/8)
        #                                                 FROM    tab_evenement te
        #                                                 WHERE   te.id_utilisateur           = tv.id_utilisateur
        #                                                 AND     MONTH(te.date_deb_evenement)= MONTH(tv.date_visite)
        #                                             )
        # )                                   AS working_day        ,
        (
            SELECT  COUNT(te.id_evenement)
            FROM    tab_evenement te
            WHERE   te.id_utilisateur               = tv.id_utilisateur
            AND     MONTH(te.date_deb_evenement)    = MONTH(tv.date_visite)
            AND     @heure_debut_journee            <= te.date_deb_evenement
            AND     @heure_fin_journee              >= te.date_fin_evenement
        )                                   AS nbr_evenements       ,
        (
            SELECT  IF(tu.code_statut_utilisateur = 'ACTI', 'O', 'N')
            FROM    tab_utilisateur tu
            WHERE   tu.id_utilisateur = tv.id_utilisateur
        )                                   AS flag_actif           ,
        (
            SELECT  tu.date_creation
            FROM    tab_utilisateur tu
            WHERE   tu.id_utilisateur = tv.id_utilisateur
        )                                   AS date_creation        ,
        (
            SELECT  tu.date_desactivation
            FROM    tab_utilisateur tu
            WHERE   tu.id_utilisateur = tv.id_utilisateur
        )                                   AS date_desactivation
FROM    tab_visite tv
LEFT JOIN
        tab_partenaire_visite tpv ON tv.id_visite = tpv.id_visite
WHERE   1 = 1
AND		
    YEAR(tv.date_visite) = IF(@annee IS NOT NULL, @annee, YEAR(CURDATE()))
AND     
    
    (   
                tv.id_utilisateur       = IF(@id_utilisateur IS NOT NULL, @id_utilisateur, @token_id)
        OR 
                tv.id_responsable       = IF(@id_utilisateur IS NOT NULL, @id_utilisateur, @token_id)
        OR 
                tv.id_accompagnant      = IF(@id_utilisateur IS NOT NULL, @id_utilisateur, @token_id)
        OR
        (
                CASE
                    WHEN @id_utilisateur IS NOT NULL AND @role_utilisateur IS NOT NULL THEN
                        ( @role_utilisateur = ('KAM') AND tv.role_utilisateur = 'DEL')
                        OR
                        ( @role_utilisateur = ('DSM') AND tv.role_utilisateur IN ('KAM','DEL'))
                        OR
                        ( @role_utilisateur IN ('DRG', 'PM') AND tv.role_utilisateur IN ('DSM','KAM','DEL'))
                    ELSE
                        ( @token_role = ('KAM') AND tv.role_utilisateur = 'DEL')
                        OR
                        ( @token_role = ('DSM') AND tv.role_utilisateur IN ('KAM','DEL'))
                        OR
                        ( @token_role IN ('DRG', 'PM') AND tv.role_utilisateur IN ('DSM','KAM','DEL'))
                END
            AND
                tpv.code_region_partenaire IN 
                                            ( 
                                                SELECT  tur.code_region FROM tab_utilisateur_region tur
                                                WHERE   tur.id_utilisateur = IF(@id_utilisateur IS NOT NULL, @id_utilisateur, @token_id)
                                                AND     tur.flag_actif = 'O'
                                            )
            AND
                (
                    (
                        @token_medical = 'O'
                    AND
                        tv.flag_medical = 'O'
                    AND            
                        tpv.code_type_partenaire = 'MEDE'
                    AND
                        tpv.code_gamme_partenaire IN 
                                                    (
                                                        SELECT  tug.code_gamme FROM tab_utilisateur_gamme tug
                                                        WHERE   tug.id_utilisateur  = IF(@id_utilisateur IS NOT NULL, @id_utilisateur, @token_id)
                                                        AND     tug.flag_actif      = 'O'
                                                    )
                    )
                OR
                    (
                        @token_pharmaceutique = 'O'
                    AND
                        tv.flag_pharmaceutique = 'O' 

                    AND
                        tpv.code_type_partenaire = 'PHAR'
                    )
                )
        )
    )
GROUP BY tv.id_utilisateur, mois;
`

const que_get_rapport_anneeExiste = `
SELECT DISTINCT YEAR(date_visite) AS annees FROM tab_visite
`


const que_get_sub_users = `
SET @id_user = ?,
    @role = ?,
    @all = ?;

SELECT id_utilisateur INTO @id_user 
        FROM tab_utilisateur WHERE 
        id_utilisateur = ( CASE WHEN @role IN ('ADMI','PM') THEN (SELECT id_utilisateur FROM tab_utilisateur WHERE role = 'DIR' AND code_statut_utilisateur = 'ACTI' LIMIT 1)  ELSE  @id_user END);

CREATE TEMPORARY TABLE users_id(id1 INT,id2 INT,id3 INT,id4 INT,id5 INT);

INSERT INTO users_id SELECT DISTINCT tu2.id_utilisateur,tu3.id_utilisateur,tu4.id_utilisateur,tu5.id_utilisateur,tu6.id_utilisateur FROM tab_utilisateur tu LEFT JOIN tab_utilisateur tu2 ON tu2.id_responsable = tu.id_utilisateur LEFT JOIN tab_utilisateur tu3 ON tu3.id_responsable = tu2.id_utilisateur LEFT JOIN tab_utilisateur tu4 ON tu4.id_responsable = tu3.id_utilisateur LEFT JOIN tab_utilisateur tu5 ON tu5.id_responsable = tu4.id_utilisateur LEFT JOIN tab_utilisateur tu6 ON tu6.id_responsable = tu5.id_utilisateur WHERE tu.id_utilisateur = @id_user;

SELECT  id_utilisateur,
        id_responsable,
        nom_utilisateur,
        prenom_utilisateur,
        role,
        UPPER(CONCAT(nom_utilisateur,' ',prenom_utilisateur)) AS nom_complet
        FROM tab_utilisateur tu WHERE id_utilisateur IN ( SELECT id1 FROM users_id WHERE id1 IS NOT NULL UNION DISTINCT SELECT id2 FROM users_id WHERE id2 IS NOT NULL UNION DISTINCT SELECT id3 FROM users_id  WHERE id3 IS NOT NULL UNION DISTINCT SELECT id4 FROM users_id WHERE id4 IS NOT NULL)
        AND (CASE
            WHEN @all = 0 THEN(SELECT COUNT(*) FROM tab_utilisateur WHERE id_responsable = tu.id_utilisateur) > 0
            ELSE 1 = 1
            END);
DROP TABLE users_id;
`


const test_annuel = `
SELECT TIME(libelle_parametrage*10000) INTO @heure_start FROM tab_parametrage WHERE code_parametrage = 'HRSTART';
SELECT TIME(libelle_parametrage*10000) INTO @heure_end FROM tab_parametrage WHERE code_parametrage = 'HREND';
SET @id_utilisateur = ?,
	@annee = ?;
SET @dynamicTableDrop = CONCAT('DROP TABLE IF EXISTS tmp_users_equipe_',@id_utilisateur);      
PREPARE DropTable FROM @dynamicTableDrop;
EXECUTE DropTable;    
SELECT  getEvenementsGlobal(@annee,1,31) AS nbr_evenements_global_01,
        getEvenementsGlobal(@annee,2,28) AS nbr_evenements_global_02,
        getEvenementsGlobal(@annee,3,31) AS nbr_evenements_global_03,
        getEvenementsGlobal(@annee,4,30) AS nbr_evenements_global_04,
        getEvenementsGlobal(@annee,5,31) AS nbr_evenements_global_05,
        getEvenementsGlobal(@annee,6,30) AS nbr_evenements_global_06,
        getEvenementsGlobal(@annee,7,31) AS nbr_evenements_global_07,
        getEvenementsGlobal(@annee,8,31) AS nbr_evenements_global_08,
        getEvenementsGlobal(@annee,9,30) AS nbr_evenements_global_09,
        getEvenementsGlobal(@annee,10,31) AS nbr_evenements_global_10,
        getEvenementsGlobal(@annee,11,30) AS nbr_evenements_global_11,
        getEvenementsGlobal(@annee,12,31) AS nbr_evenements_global_12;

SET @dynamicTableCreate = CONCAT('CREATE TEMPORARY TABLE tmp_users_equipe_',@id_utilisateur,'(id_utilisateur INT, role_utilisateur CHAR(10), date_creation timestamp NULL DEFAULT NULL, date_desactivation timestamp NULL DEFAULT NULL, nom_prenom CHAR(100))');
SET @dynamicTableInsert = CONCAT('INSERT INTO tmp_users_equipe_',@id_utilisateur," ( SELECT
    DISTINCT tu1.id_utilisateur AS id_utilisateur,
    tu1.role,
    tu1.date_creation,
    tu1.date_desactivation,
    CONCAT(tu1.nom_utilisateur,
    ' ',
    tu1.prenom_utilisateur) 
FROM
    tab_utilisateur tu1 
WHERE
    tu1.id_utilisateur = @id_utilisateur 
    AND tu1.id_utilisateur is not null 
    AND tu1.role IN (?) 
UNION
ALL SELECT
    DISTINCT tu2.id_utilisateur AS id_utilisateur,
    tu2.role,
    tu2.date_creation,
    tu2.date_desactivation,
    CONCAT(tu2.nom_utilisateur,
    ' ',
    tu2.prenom_utilisateur) 
FROM
    tab_utilisateur tu  
LEFT JOIN
    tab_utilisateur tu2 
        ON tu2.id_responsable = tu.id_utilisateur  
WHERE
    tu.id_utilisateur = @id_utilisateur 
    AND tu2.id_utilisateur is not null 
    AND tu2.role IN (?) 
UNION
ALL SELECT
    DISTINCT tu3.id_utilisateur AS id_utilisateur,
    tu3.role,
    tu3.date_creation,
    tu3.date_desactivation,
    CONCAT(tu3.nom_utilisateur,
    ' ',
    tu3.prenom_utilisateur) 
FROM
    tab_utilisateur tu  
LEFT JOIN
    tab_utilisateur tu2 
        ON tu2.id_responsable = tu.id_utilisateur  
LEFT JOIN
    tab_utilisateur tu3 
        ON tu3.id_responsable = tu2.id_utilisateur  
WHERE
    tu.id_utilisateur = @id_utilisateur 
    AND tu3.id_utilisateur is not null 
    AND tu3.role IN (?) 
UNION
ALL SELECT
    DISTINCT tu4.id_utilisateur AS id_utilisateur,
    tu4.role,
    tu4.date_creation,
    tu4.date_desactivation,
    CONCAT(tu4.nom_utilisateur,
    ' ',
    tu4.prenom_utilisateur) 
FROM
    tab_utilisateur tu  
LEFT JOIN
    tab_utilisateur tu2 
        ON tu2.id_responsable = tu.id_utilisateur  
LEFT JOIN
    tab_utilisateur tu3 
        ON tu3.id_responsable = tu2.id_utilisateur  
LEFT JOIN
    tab_utilisateur tu4 
        ON tu4.id_responsable = tu3.id_utilisateur   
WHERE
    tu.id_utilisateur = @id_utilisateur  
    AND tu4.id_utilisateur is not null 
    AND tu4.role IN (?) 
UNION
ALL SELECT
    DISTINCT tu5.id_utilisateur AS id_utilisateur,
    tu5.role,
    tu5.date_creation,
    tu5.date_desactivation,
    CONCAT(tu5.nom_utilisateur,
    ' ',
    tu5.prenom_utilisateur) 
FROM
    tab_utilisateur tu  
LEFT JOIN
    tab_utilisateur tu2 
        ON tu2.id_responsable = tu.id_utilisateur  
LEFT JOIN
    tab_utilisateur tu3 
        ON tu3.id_responsable = tu2.id_utilisateur  
LEFT JOIN
    tab_utilisateur tu4 
        ON tu4.id_responsable = tu3.id_utilisateur  
LEFT JOIN
    tab_utilisateur tu5 
        ON tu5.id_responsable = tu4.id_utilisateur  
WHERE
    tu.id_utilisateur = @id_utilisateur 
    AND tu5.id_utilisateur is not null 
    AND tu5.role IN (?) 
UNION
ALL SELECT
    DISTINCT tu6.id_utilisateur AS id_utilisateur,
    tu6.role,
    tu6.date_creation,
    tu6.date_desactivation,
    CONCAT(tu6.nom_utilisateur,
    ' ',
    tu6.prenom_utilisateur) 
FROM
    tab_utilisateur tu  
LEFT JOIN
    tab_utilisateur tu2 
        ON tu2.id_responsable = tu.id_utilisateur  
LEFT JOIN
    tab_utilisateur tu3 
        ON tu3.id_responsable = tu2.id_utilisateur  
LEFT JOIN
    tab_utilisateur tu4 
        ON tu4.id_responsable = tu3.id_utilisateur  
LEFT JOIN
    tab_utilisateur tu5 
        ON tu5.id_responsable = tu4.id_utilisateur  
LEFT JOIN
    tab_utilisateur tu6 
        ON tu6.id_responsable = tu5.id_utilisateur  
WHERE
    tu.id_utilisateur = @id_utilisateur 
    AND tu6.id_utilisateur is not null 
    AND tu6.role IN (?) )");

SET @dynamicTableSelect = CONCAT( "SELECT
        ue.id_utilisateur                                                                                                                                                                                           AS id_utilisateur          ,
        ue.nom_prenom                                                                                                                                                                                               AS nom_utilisateur         ,
        ue.date_creation                                                                                                                                                                                            AS date_creation           ,
        ue.date_desactivation                                                                                                                                                                                       AS date_desactivation      ,
        (CASE 
            WHEN ue.date_creation > str_to_date(concat('31/01/',
            @annee),
            '%d/%m/%Y') THEN 'N' 
            WHEN ue.date_desactivation < str_to_date(concat('01/01/',
            @annee),
            '%d/%m/%Y') THEN 'N'
            WHEN CURDATE() < str_to_date(concat('01/01/', @annee),
            '%d/%m/%Y') THEN 'N' 
            ELSE 'O' 
        END)                AS flag_actif_01           ,
        (CASE 
            WHEN ue.date_creation > str_to_date(concat('28/02/',
            @annee),
            '%d/%m/%Y') THEN 'N' 
            WHEN ue.date_desactivation < str_to_date(concat('01/02/',
            @annee),
            '%d/%m/%Y') THEN 'N'
            WHEN CURDATE() < str_to_date(concat('01/02/', @annee),
            '%d/%m/%Y') THEN 'N' 
            ELSE 'O' 
        END)                AS flag_actif_02           ,
        (CASE 
            WHEN ue.date_creation > str_to_date(concat('31/03/',
            @annee),
            '%d/%m/%Y') THEN 'N' 
            WHEN ue.date_desactivation < str_to_date(concat('01/03/',
            @annee),
            '%d/%m/%Y') THEN 'N'
            WHEN CURDATE() < str_to_date(concat('01/03/', @annee),
            '%d/%m/%Y') THEN 'N'  
            ELSE 'O' 
        END)                AS flag_actif_03           ,
        (CASE 
            WHEN ue.date_creation > str_to_date(concat('30/04/',
            @annee),
            '%d/%m/%Y') THEN 'N' 
            WHEN ue.date_desactivation < str_to_date(concat('01/04/',
            @annee),
            '%d/%m/%Y') THEN 'N' 
            WHEN CURDATE() < str_to_date(concat('01/04/', @annee),
            '%d/%m/%Y') THEN 'N' 
            ELSE 'O' 
        END)                AS flag_actif_04           ,
        (CASE 
            WHEN ue.date_creation > str_to_date(concat('31/05/',
            @annee),
            '%d/%m/%Y') THEN 'N' 
            WHEN ue.date_desactivation < str_to_date(concat('01/05/',
            @annee),
            '%d/%m/%Y') THEN 'N' 
            WHEN CURDATE() < str_to_date(concat('01/05/', @annee),
            '%d/%m/%Y') THEN 'N' 
            ELSE 'O' 
        END)                AS flag_actif_05           ,
        (CASE 
            WHEN ue.date_creation > str_to_date(concat('30/06/',
            @annee),
            '%d/%m/%Y') THEN 'N' 
            WHEN ue.date_desactivation < str_to_date(concat('01/06/',
            @annee),
            '%d/%m/%Y') THEN 'N' 
            WHEN CURDATE() < str_to_date(concat('01/06/', @annee),
            '%d/%m/%Y') THEN 'N' 
            ELSE 'O' 
        END)                AS flag_actif_06           ,
        (CASE 
            WHEN ue.date_creation > str_to_date(concat('31/07/',
            @annee),
            '%d/%m/%Y') THEN 'N' 
            WHEN ue.date_desactivation < str_to_date(concat('01/07/',
            @annee),
            '%d/%m/%Y') THEN 'N' 
            WHEN CURDATE() < str_to_date(concat('01/07/', @annee),
            '%d/%m/%Y') THEN 'N' 
            ELSE 'O' 
        END)                AS flag_actif_07           ,
        (CASE 
            WHEN ue.date_creation > str_to_date(concat('31/08/',
            @annee),
            '%d/%m/%Y') THEN 'N' 
            WHEN ue.date_desactivation < str_to_date(concat('01/08/',
            @annee),
            '%d/%m/%Y') THEN 'N' 
            WHEN CURDATE() < str_to_date(concat('01/08/', @annee),
            '%d/%m/%Y') THEN 'N' 
            ELSE 'O' 
        END)                AS flag_actif_08           ,
        (CASE 
            WHEN ue.date_creation > str_to_date(concat('30/09/',
            @annee),
            '%d/%m/%Y') THEN 'N' 
            WHEN ue.date_desactivation < str_to_date(concat('01/09/',
            @annee),
            '%d/%m/%Y') THEN 'N' 
            WHEN CURDATE() < str_to_date(concat('01/09/', @annee),
            '%d/%m/%Y') THEN 'N' 
            ELSE 'O' 
        END)                AS flag_actif_09           ,
        (CASE 
            WHEN ue.date_creation > str_to_date(concat('31/10/',
            @annee),
            '%d/%m/%Y') THEN 'N' 
            WHEN ue.date_desactivation < str_to_date(concat('01/10/',
            @annee),
            '%d/%m/%Y') THEN 'N' 
            WHEN CURDATE() < str_to_date(concat('01/10/', @annee),
            '%d/%m/%Y') THEN 'N' 
            ELSE 'O' 
        END)                AS flag_actif_10           ,
        (CASE 
            WHEN ue.date_creation > str_to_date(concat('30/11/',
            @annee),
            '%d/%m/%Y') THEN 'N' 
            WHEN ue.date_desactivation < str_to_date(concat('01/11/',
            @annee),
            '%d/%m/%Y') THEN 'N' 
            WHEN CURDATE() < str_to_date(concat('01/11/', @annee),
            '%d/%m/%Y') THEN 'N' 
            ELSE 'O' 
        END)                AS flag_actif_11           ,
        (CASE 
            WHEN ue.date_creation > str_to_date(concat('31/12/',
            @annee),
            '%d/%m/%Y') THEN 'N' 
            WHEN ue.date_desactivation < str_to_date(concat('01/12/',
            @annee),
            '%d/%m/%Y') THEN 'N' 
            WHEN CURDATE() < str_to_date(concat('01/12/', @annee),
            '%d/%m/%Y') THEN 'N' 
            ELSE 'O' 
        END)                AS flag_actif_12           ,
        (SELECT
            COUNT(tv1.id_visite)   
        FROM
            tab_visite      tv1 
        WHERE
            tv1.id_utilisateur = ue.id_utilisateur 
            AND MONTH(tv1.date_visite) = 1  
            AND YEAR(tv1.date_visite) = @annee 
            AND tv1.code_type_visite = 'PLAN')  AS nbr_visites_plan_01     ,
        (SELECT
            COUNT(tv1.id_visite)   
        FROM
            tab_visite      tv1 
        WHERE
            tv1.id_utilisateur = ue.id_utilisateur 
            AND MONTH(tv1.date_visite) = 2  
            AND YEAR(tv1.date_visite) = @annee 
            AND tv1.code_type_visite = 'PLAN')  AS nbr_visites_plan_02     ,
        (SELECT
            COUNT(tv1.id_visite)   
        FROM
            tab_visite      tv1 
        WHERE
            tv1.id_utilisateur = ue.id_utilisateur 
            AND MONTH(tv1.date_visite) = 3  
            AND YEAR(tv1.date_visite) = @annee 
            AND tv1.code_type_visite = 'PLAN')  AS nbr_visites_plan_03     ,
        (SELECT
            COUNT(tv1.id_visite)   
        FROM
            tab_visite      tv1 
        WHERE
            tv1.id_utilisateur = ue.id_utilisateur 
            AND MONTH(tv1.date_visite) = 4  
            AND YEAR(tv1.date_visite) = @annee 
            AND tv1.code_type_visite = 'PLAN')  AS nbr_visites_plan_04     ,
        (SELECT
            COUNT(tv1.id_visite)   
        FROM
            tab_visite      tv1 
        WHERE
            tv1.id_utilisateur = ue.id_utilisateur 
            AND MONTH(tv1.date_visite) = 5  
            AND YEAR(tv1.date_visite) = @annee 
            AND tv1.code_type_visite = 'PLAN')  AS nbr_visites_plan_05     ,
        (SELECT
            COUNT(tv1.id_visite)   
        FROM
            tab_visite      tv1 
        WHERE
            tv1.id_utilisateur = ue.id_utilisateur 
            AND MONTH(tv1.date_visite) = 6  
            AND YEAR(tv1.date_visite) = @annee 
            AND tv1.code_type_visite = 'PLAN')  AS nbr_visites_plan_06     ,
        (SELECT
            COUNT(tv1.id_visite)   
        FROM
            tab_visite      tv1 
        WHERE
            tv1.id_utilisateur = ue.id_utilisateur 
            AND MONTH(tv1.date_visite) = 7  
            AND YEAR(tv1.date_visite) = @annee 
            AND tv1.code_type_visite = 'PLAN')  AS nbr_visites_plan_07     ,
        (SELECT
            COUNT(tv1.id_visite)   
        FROM
            tab_visite      tv1 
        WHERE
            tv1.id_utilisateur = ue.id_utilisateur 
            AND MONTH(tv1.date_visite) = 8  
            AND YEAR(tv1.date_visite) = @annee 
            AND tv1.code_type_visite = 'PLAN')  AS nbr_visites_plan_08     ,
        (SELECT
            COUNT(tv1.id_visite)   
        FROM
            tab_visite      tv1 
        WHERE
            tv1.id_utilisateur = ue.id_utilisateur 
            AND MONTH(tv1.date_visite) = 9  
            AND YEAR(tv1.date_visite) = @annee 
            AND tv1.code_type_visite = 'PLAN')  AS nbr_visites_plan_09     ,
        (SELECT
            COUNT(tv1.id_visite)   
        FROM
            tab_visite      tv1 
        WHERE
            tv1.id_utilisateur = ue.id_utilisateur 
            AND MONTH(tv1.date_visite) = 10 
            AND YEAR(tv1.date_visite) = @annee 
            AND tv1.code_type_visite = 'PLAN')  AS nbr_visites_plan_10     ,
        (SELECT
            COUNT(tv1.id_visite)   
        FROM
            tab_visite      tv1 
        WHERE
            tv1.id_utilisateur = ue.id_utilisateur 
            AND MONTH(tv1.date_visite) = 11 
            AND YEAR(tv1.date_visite) = @annee 
            AND tv1.code_type_visite = 'PLAN')  AS nbr_visites_plan_11     ,
        (SELECT
            COUNT(tv1.id_visite)   
        FROM
            tab_visite      tv1 
        WHERE
            tv1.id_utilisateur = ue.id_utilisateur 
            AND MONTH(tv1.date_visite) = 12 
            AND YEAR(tv1.date_visite) = @annee 
            AND tv1.code_type_visite = 'PLAN')  AS nbr_visites_plan_12     ,
        (SELECT
            COUNT(tv1.id_visite)   
        FROM
            tab_visite      tv1 
        WHERE
            tv1.id_utilisateur = ue.id_utilisateur 
            AND MONTH(tv1.date_visite) = 1  
            AND YEAR(tv1.date_visite) = @annee 
            AND tv1.code_type_visite = 'HOPL')  AS nbr_visites_horsplan_01 ,
        (SELECT
            COUNT(tv1.id_visite)   
        FROM
            tab_visite      tv1 
        WHERE
            tv1.id_utilisateur = ue.id_utilisateur 
            AND MONTH(tv1.date_visite) = 2  
            AND YEAR(tv1.date_visite) = @annee 
            AND tv1.code_type_visite = 'HOPL')  AS nbr_visites_horsplan_02 ,
        (SELECT
            COUNT(tv1.id_visite)   
        FROM
            tab_visite      tv1 
        WHERE
            tv1.id_utilisateur = ue.id_utilisateur 
            AND MONTH(tv1.date_visite) = 3  
            AND YEAR(tv1.date_visite) = @annee 
            AND tv1.code_type_visite = 'HOPL')  AS nbr_visites_horsplan_03 ,
        (SELECT
            COUNT(tv1.id_visite)   
        FROM
            tab_visite      tv1 
        WHERE
            tv1.id_utilisateur = ue.id_utilisateur 
            AND MONTH(tv1.date_visite) = 4  
            AND YEAR(tv1.date_visite) = @annee 
            AND tv1.code_type_visite = 'HOPL')  AS nbr_visites_horsplan_04 ,
        (SELECT
            COUNT(tv1.id_visite)   
        FROM
            tab_visite      tv1 
        WHERE
            tv1.id_utilisateur = ue.id_utilisateur 
            AND MONTH(tv1.date_visite) = 5  
            AND YEAR(tv1.date_visite) = @annee 
            AND tv1.code_type_visite = 'HOPL')  AS nbr_visites_horsplan_05 ,
        (SELECT
            COUNT(tv1.id_visite)   
        FROM
            tab_visite      tv1 
        WHERE
            tv1.id_utilisateur = ue.id_utilisateur 
            AND MONTH(tv1.date_visite) = 6  
            AND YEAR(tv1.date_visite) = @annee 
            AND tv1.code_type_visite = 'HOPL')  AS nbr_visites_horsplan_06 ,
        (SELECT
            COUNT(tv1.id_visite)   
        FROM
            tab_visite      tv1 
        WHERE
            tv1.id_utilisateur = ue.id_utilisateur 
            AND MONTH(tv1.date_visite) = 7  
            AND YEAR(tv1.date_visite) = @annee 
            AND tv1.code_type_visite = 'HOPL')  AS nbr_visites_horsplan_07 ,
        (SELECT
            COUNT(tv1.id_visite)   
        FROM
            tab_visite      tv1 
        WHERE
            tv1.id_utilisateur = ue.id_utilisateur 
            AND MONTH(tv1.date_visite) = 8  
            AND YEAR(tv1.date_visite) = @annee 
            AND tv1.code_type_visite = 'HOPL')  AS nbr_visites_horsplan_08 ,
        (SELECT
            COUNT(tv1.id_visite)   
        FROM
            tab_visite      tv1 
        WHERE
            tv1.id_utilisateur = ue.id_utilisateur 
            AND MONTH(tv1.date_visite) = 9  
            AND YEAR(tv1.date_visite) = @annee 
            AND tv1.code_type_visite = 'HOPL')  AS nbr_visites_horsplan_09 ,
        (SELECT
            COUNT(tv1.id_visite)   
        FROM
            tab_visite      tv1 
        WHERE
            tv1.id_utilisateur = ue.id_utilisateur 
            AND MONTH(tv1.date_visite) = 10 
            AND YEAR(tv1.date_visite) = @annee 
            AND tv1.code_type_visite = 'HOPL')  AS nbr_visites_horsplan_10 ,
        (SELECT
            COUNT(tv1.id_visite)   
        FROM
            tab_visite      tv1 
        WHERE
            tv1.id_utilisateur = ue.id_utilisateur 
            AND MONTH(tv1.date_visite) = 11 
            AND YEAR(tv1.date_visite) = @annee 
            AND tv1.code_type_visite = 'HOPL')  AS nbr_visites_horsplan_11 ,
        (SELECT
            COUNT(tv1.id_visite)   
        FROM
            tab_visite      tv1 
        WHERE
            tv1.id_utilisateur = ue.id_utilisateur 
            AND MONTH(tv1.date_visite) = 12 
            AND YEAR(tv1.date_visite) = @annee 
            AND tv1.code_type_visite = 'HOPL')  AS nbr_visites_horsplan_12 ,
        (SELECT getEvenements(ue.id_utilisateur,@annee,01,@heure_start,@heure_end,31))  AS nbr_evenements_01       ,
        (SELECT getEvenements(ue.id_utilisateur,@annee,02,@heure_start,@heure_end,28))  AS nbr_evenements_02       ,
        (SELECT getEvenements(ue.id_utilisateur,@annee,03,@heure_start,@heure_end,31))  AS nbr_evenements_03       ,
        (SELECT getEvenements(ue.id_utilisateur,@annee,04,@heure_start,@heure_end,30))  AS nbr_evenements_04       ,
        (SELECT getEvenements(ue.id_utilisateur,@annee,05,@heure_start,@heure_end,31))  AS nbr_evenements_05       ,
        (SELECT getEvenements(ue.id_utilisateur,@annee,06,@heure_start,@heure_end,30))  AS nbr_evenements_06       ,
        (SELECT getEvenements(ue.id_utilisateur,@annee,07,@heure_start,@heure_end,31))  AS nbr_evenements_07       ,
        (SELECT getEvenements(ue.id_utilisateur,@annee,08,@heure_start,@heure_end,31))  AS nbr_evenements_08       ,
        (SELECT getEvenements(ue.id_utilisateur,@annee,09,@heure_start,@heure_end,30))  AS nbr_evenements_09       ,
        (SELECT getEvenements(ue.id_utilisateur,@annee,10,@heure_start,@heure_end,31))  AS nbr_evenements_10       ,
        (SELECT getEvenements(ue.id_utilisateur,@annee,11,@heure_start,@heure_end,30))  AS nbr_evenements_11       ,
        (SELECT getEvenements(ue.id_utilisateur,@annee,12,@heure_start,@heure_end,31))  AS nbr_evenements_12       
   
    FROM
        tmp_users_equipe_",@id_utilisateur,' ue');
 
PREPARE CreateTable FROM @dynamicTableCreate;
EXECUTE CreateTable;
PREPARE InsertIntoTable FROM @dynamicTableInsert;
EXECUTE InsertIntoTable;
PREPARE SelectTable FROM @dynamicTableSelect;
EXECUTE SelectTable;
PREPARE DropTable FROM @dynamicTableDrop;
EXECUTE DropTable;        
        

`
module.exports = {
    que_get_params,
    que_get_evenements_global,
    que_get_rapport_annuel,
    que_get_rapport_anneeExiste,
    que_get_sub_users,
    test_annuel
}