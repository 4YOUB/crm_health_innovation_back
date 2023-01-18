const que_get_stats = `
SET @token_id           = ?,
    @token_role         = ?,
    @id_utilisateur     = ?,
    @role_utilisateur   = ?,
    @date_debut         = ?,
    @date_fin           = ?;

SELECT
    (SELECT COUNT(0) FROM tab_visite tpv
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite
        WHERE   tpv.code_type_visite        = 'PLAN'
        AND     tpv.code_statut_visite      IN ('REAL','ABSE')
        AND     tpv2.code_type_partenaire    = 'MEDE'
        AND     CASE
                    WHEN @date_debut IS NOT NULL AND @date_fin IS NOT NULL THEN
                        tpv.date_visite BETWEEN @date_debut AND @date_fin
                    ELSE
                        1 = 1
                END
        AND     CASE
                    WHEN @id_utilisateur IS NOT NULL THEN
                            tpv.id_utilisateur  = @id_utilisateur
                        OR 
                            tpv.id_accompagnant = @id_utilisateur
                    WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN
                        (
                                tpv.id_utilisateur  = @token_id
                            OR 
                                tpv.id_accompagnant = @token_id
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
                                    tpv2.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                                    WHERE   tur.id_utilisateur = @token_id
                                                                    AND     tur.flag_actif = 'O')
                                AND 
                                    @token_medical = 'O'
                                AND
                                    tpv.flag_medical = 'O'
                                AND
                                    tpv2.code_gamme_partenaire IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                                                    WHERE   tug.id_utilisateur  = @token_id
                                                                    AND     tug.flag_actif      = 'O')
                            )
                        )
                    ELSE
                        1 = 1
                END
    )                                                                                       AS nbr_visites_medicales_planifiees       ,
    (SELECT COUNT(0) FROM tab_visite tpv
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite
        WHERE   tpv.code_type_visite        = 'PLAN'
        AND     tpv.code_statut_visite      IN ('REAL','ABSE')
        AND     tpv2.code_type_partenaire    = 'PHAR'
        AND     CASE
                    WHEN @date_debut IS NOT NULL AND @date_fin IS NOT NULL THEN
                        tpv.date_visite BETWEEN @date_debut AND @date_fin
                    ELSE
                        1 = 1
                END
        AND     CASE
                    WHEN @id_utilisateur IS NOT NULL THEN
                            tpv.id_utilisateur  = @id_utilisateur
                        OR 
                            tpv.id_accompagnant = @id_utilisateur
                    WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN  
                        (
                                tpv.id_utilisateur  = @token_id
                            OR 
                                tpv.id_accompagnant = @token_id
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
                                    tpv2.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                                    WHERE   tur.id_utilisateur = @token_id
                                                                    AND     tur.flag_actif = 'O')
                                AND 
                                    @token_pharmaceutique = 'O'
                                AND
                                    tpv.flag_pharmaceutique = 'O'
                            )
                        )
                    ELSE
                        1 = 1
                END
    )                                                                                       AS nbr_visites_pharmaceutiques_planifiees ,
    (SELECT COUNT(0) FROM tab_visite tpv
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite
        WHERE   tpv.code_type_visite    = 'PLAN'
        AND     tpv.code_statut_visite  IN ('REAL','ABSE')
        AND     CASE
                    WHEN @date_debut IS NOT NULL AND @date_fin IS NOT NULL THEN
                        tpv.date_visite BETWEEN @date_debut AND @date_fin
                    ELSE
                        1 = 1
                END
        AND     CASE
                    WHEN @id_utilisateur IS NOT NULL THEN
                            tpv.id_utilisateur  = @id_utilisateur
                        OR 
                            tpv.id_accompagnant = @id_utilisateur
                    WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN  
                        (
                                tpv.id_utilisateur  = @token_id
                            OR 
                                tpv.id_accompagnant = @token_id
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
                                    tpv2.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                                    WHERE   tur.id_utilisateur = @token_id
                                                                    AND     tur.flag_actif = 'O')
                                AND 
                                    (
                                        (
                                            @token_medical = 'O'
                                        AND
                                            tpv.flag_medical = 'O'

                                        AND            
                                            tpv2.code_type_partenaire = 'MEDE'
                                        AND
                                            tpv2.code_gamme_partenaire IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                                                            WHERE   tug.id_utilisateur  = @token_id
                                                                            AND     tug.flag_actif      = 'O')
                                        )
                                    OR
                                        (
                                            @token_pharmaceutique = 'O'
                                        AND
                                            tpv.flag_pharmaceutique = 'O' 

                                        AND
                                            tpv2.code_type_partenaire = 'PHAR'
                                        )
                                    )
                            )
                        )
                    ELSE
                        1 = 1
                END
    )                                                                                       AS nbr_total_visites_planifiees           ,
    (SELECT COUNT(0) FROM tab_visite tpv
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite
        WHERE   tpv.code_statut_visite <> 'SUPP'  
        AND     tpv.code_type_visite    = 'HOPL'
        AND     tpv2.code_type_partenaire = 'MEDE'
        AND     CASE
                    WHEN @date_debut IS NOT NULL AND @date_fin IS NOT NULL THEN
                        tpv.date_visite BETWEEN @date_debut AND @date_fin
                    ELSE
                        1 = 1
                END
        AND     CASE
                    WHEN @id_utilisateur IS NOT NULL THEN
                            tpv.id_utilisateur  = @id_utilisateur
                        OR 
                            tpv.id_accompagnant = @id_utilisateur
                    WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN  
                        (
                                tpv.id_utilisateur  = @token_id
                            OR 
                                tpv.id_accompagnant = @token_id
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
                                    tpv2.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                                    WHERE   tur.id_utilisateur = @token_id
                                                                    AND     tur.flag_actif = 'O')
                                AND 
                                    @token_medical = 'O'
                                AND
                                    tpv.flag_medical = 'O'
                                AND
                                    tpv2.code_gamme_partenaire IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                                                    WHERE   tug.id_utilisateur  = @token_id
                                                                    AND     tug.flag_actif      = 'O')
                            )
                        )
                    ELSE
                        1 = 1
                END
    )                                                                                           AS nbr_visites_medicales_non_planifiees        ,
    (SELECT COUNT(0) FROM tab_visite tpv
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite
        WHERE   tpv.code_statut_visite <> 'SUPP'  
        AND     tpv.code_type_visite    = 'HOPL'
        AND     tpv2.code_type_partenaire = 'PHAR'
        AND     CASE
                    WHEN @date_debut IS NOT NULL AND @date_fin IS NOT NULL THEN
                        tpv.date_visite BETWEEN @date_debut AND @date_fin
                    ELSE
                        1 = 1
                END
        AND     CASE
                    WHEN @id_utilisateur IS NOT NULL THEN
                            tpv.id_utilisateur  = @id_utilisateur
                        OR 
                            tpv.id_accompagnant = @id_utilisateur
                    WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN  
                        (
                                tpv.id_utilisateur  = @token_id
                            OR 
                                tpv.id_accompagnant = @token_id
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
                                    tpv2.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                                    WHERE   tur.id_utilisateur = @token_id
                                                                    AND     tur.flag_actif = 'O')
                                AND 
                                    @token_pharmaceutique = 'O'
                                AND
                                    tpv.flag_pharmaceutique = 'O'
                            )
                        )
                    ELSE
                        1 = 1
                END
    )                                                                                           AS nbr_visites_pharmaceutiques_non_planifiees   ,
    (SELECT COUNT(0) FROM tab_visite tpv
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite
        WHERE   tpv.code_statut_visite <> 'SUPP'  
        AND     tpv.code_type_visite    = 'HOPL'
        AND     CASE
                    WHEN @date_debut IS NOT NULL AND @date_fin IS NOT NULL THEN
                        tpv.date_visite BETWEEN @date_debut AND @date_fin
                    ELSE
                        1 = 1
                END
        AND     CASE
                    WHEN @id_utilisateur IS NOT NULL THEN
                            tpv.id_utilisateur  = @id_utilisateur
                        OR 
                            tpv.id_accompagnant = @id_utilisateur
                    WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN  
                        (
                                tpv.id_utilisateur  = @token_id
                            OR 
                                tpv.id_accompagnant = @token_id
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
                                    tpv2.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                                    WHERE   tur.id_utilisateur = @token_id
                                                                    AND     tur.flag_actif = 'O')
                                AND 
                                    (
                                        (
                                            @token_medical = 'O'
                                        AND
                                            tpv.flag_medical = 'O'
                                        AND            
                                            tpv2.code_type_partenaire = 'MEDE'
                                        AND
                                            tpv2.code_gamme_partenaire IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                                                            WHERE   tug.id_utilisateur  = @token_id
                                                                            AND     tug.flag_actif      = 'O')
                                        )
                                    OR
                                        (
                                            @token_pharmaceutique = 'O'
                                        AND
                                            tpv.flag_pharmaceutique = 'O' 
                                        AND
                                            tpv2.code_type_partenaire = 'PHAR'
                                        )
                                    )
                            )
                        )
                    ELSE
                        1 = 1
                END
    )                                                                                       AS nbr_total_visites_non_planifiees       ,
    (SELECT COUNT(0) FROM tab_visite tpv
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite
        WHERE   tpv.code_type_visite    = 'PLAN'
        AND     tpv.code_statut_visite  IN ('REAL','ABSE')
        AND     tpv2.code_type_partenaire = 'MEDE'
        AND     CASE
                    WHEN @date_debut IS NOT NULL AND @date_fin IS NOT NULL THEN
                        tpv.date_visite BETWEEN @date_debut AND @date_fin
                    ELSE
                        1 = 1
                END
        AND     CASE
                    WHEN @id_utilisateur IS NOT NULL THEN
                            tpv.id_utilisateur  = @id_utilisateur
                        OR 
                            tpv.id_accompagnant = @id_utilisateur
                    WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN  
                        (
                                tpv.id_utilisateur  = @token_id
                            OR 
                                tpv.id_accompagnant = @token_id
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
                                    tpv2.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                                    WHERE   tur.id_utilisateur = @token_id
                                                                    AND     tur.flag_actif = 'O')
                                AND 
                                    @token_medical = 'O'
                                AND
                                    tpv.flag_medical = 'O'
                                AND
                                    tpv2.code_gamme_partenaire IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                                                    WHERE   tug.id_utilisateur  = @token_id
                                                                    AND     tug.flag_actif      = 'O')
                            )
                        )
                    ELSE
                        1 = 1
                END
        AND     tpv2.id_partenaire IN (
                                    SELECT  tp.id_partenaire FROM tab_partenaire tp
                                    WHERE   tp.code_type_etablissement IN (
                                                                            SELECT  tpc.code_codification FROM tab_par_codification tpc
                                                                            WHERE   tpc.type_codification = 'ETPR'
                                                                        )
                                    )
    )                                                                                           AS nbr_visites_privees_planifiees     ,
    (SELECT COUNT(0) FROM tab_visite tpv
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite
        WHERE   tpv.code_statut_visite <> 'SUPP'  
        AND     tpv.code_type_visite    = 'HOPL'
        AND     tpv2.code_type_partenaire = 'MEDE'
        AND     CASE
                    WHEN @date_debut IS NOT NULL AND @date_fin IS NOT NULL THEN
                        tpv.date_visite BETWEEN @date_debut AND @date_fin
                    ELSE
                        1 = 1
                END
        AND     CASE
                    WHEN @id_utilisateur IS NOT NULL THEN
                            tpv.id_utilisateur  = @id_utilisateur
                        OR 
                            tpv.id_accompagnant = @id_utilisateur
                    WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN  
                        (
                                tpv.id_utilisateur  = @token_id
                            OR 
                                tpv.id_accompagnant = @token_id
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
                                    tpv2.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                                    WHERE   tur.id_utilisateur = @token_id
                                                                    AND     tur.flag_actif = 'O')
                                AND 
                                    @token_medical = 'O'
                                AND
                                    tpv.flag_medical = 'O'
                                AND
                                    tpv2.code_gamme_partenaire IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                                                    WHERE   tug.id_utilisateur  = @token_id
                                                                    AND     tug.flag_actif      = 'O')
                            )
                        )
                    ELSE
                        1 = 1
                END
        AND     tpv2.id_partenaire IN (
                                    SELECT  tp.id_partenaire FROM tab_partenaire tp
                                    WHERE   tp.code_type_etablissement IN (
                                                                            SELECT  tpc.code_codification FROM tab_par_codification tpc
                                                                            WHERE   tpc.type_codification = 'ETPR'
                                                                        )
                                    )
    )                                                                                           AS nbr_visites_privees_non_planifiees ,
    (SELECT COUNT(0) FROM tab_visite tpv
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite
        WHERE   tpv.code_type_visite    = 'PLAN'
        AND     tpv.code_statut_visite  IN ('REAL','ABSE')
        AND     tpv2.code_type_partenaire = 'MEDE'
        AND     CASE
                    WHEN @date_debut IS NOT NULL AND @date_fin IS NOT NULL THEN
                        tpv.date_visite BETWEEN @date_debut AND @date_fin
                    ELSE
                        1 = 1
                END
        AND     CASE
                    WHEN @id_utilisateur IS NOT NULL THEN
                            tpv.id_utilisateur  = @id_utilisateur
                        OR 
                            tpv.id_accompagnant = @id_utilisateur
                    WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN  
                        (
                                tpv.id_utilisateur  = @token_id
                            OR 
                                tpv.id_accompagnant = @token_id
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
                                    tpv2.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                                    WHERE   tur.id_utilisateur = @token_id
                                                                    AND     tur.flag_actif = 'O')
                                AND 
                                    @token_medical = 'O'
                                AND
                                    tpv.flag_medical = 'O'
                                AND
                                    tpv2.code_gamme_partenaire IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                                                    WHERE   tug.id_utilisateur  = @token_id
                                                                    AND     tug.flag_actif      = 'O')
                            )
                        )
                    ELSE
                        1 = 1
                END
        AND     tpv2.id_partenaire IN (
                                    SELECT  tp.id_partenaire FROM tab_partenaire tp
                                    WHERE   tp.code_type_etablissement IN (
                                                                            SELECT  tpc.code_codification FROM tab_par_codification tpc
                                                                            WHERE   tpc.type_codification = 'ETPU'
                                                                        )
                                    )
        )                                                                                           AS nbr_visites_publiques_planifiees,
    (SELECT COUNT(0) FROM tab_visite tpv
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite
        WHERE   tpv.code_statut_visite <> 'SUPP'  
        AND     tpv.code_type_visite     = 'HOPL'
        AND     tpv2.code_type_partenaire = 'MEDE'
        AND     CASE
                    WHEN @date_debut IS NOT NULL AND @date_fin IS NOT NULL THEN
                        tpv.date_visite BETWEEN @date_debut AND @date_fin
                    ELSE
                        1 = 1
                END
        AND     CASE
                    WHEN @id_utilisateur IS NOT NULL THEN
                            tpv.id_utilisateur  = @id_utilisateur
                        OR 
                            tpv.id_accompagnant = @id_utilisateur
                    WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN  
                        (
                                tpv.id_utilisateur  = @token_id
                            OR 
                                tpv.id_accompagnant = @token_id
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
                                    tpv2.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                                    WHERE   tur.id_utilisateur = @token_id
                                                                    AND     tur.flag_actif = 'O')
                                AND 
                                    @token_medical = 'O'
                                AND
                                    tpv.flag_medical = 'O'
                                AND
                                    tpv2.code_gamme_partenaire IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                                                    WHERE   tug.id_utilisateur  = @token_id
                                                                    AND     tug.flag_actif      = 'O')
                            )
                        )
                    ELSE
                        1 = 1
                END
        AND     tpv2.id_partenaire IN (
                                    SELECT  tp.id_partenaire FROM tab_partenaire tp
                                    WHERE   tp.code_type_etablissement IN (
                                                                            SELECT  tpc.code_codification FROM tab_par_codification tpc
                                                                            WHERE   tpc.type_codification = 'ETPU'
                                                                        )
                                    )
        )                                                                                           AS nbr_visites_publiques_non_planifiees,
    (SELECT COUNT(0) FROM tab_visite tpv
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite
        WHERE   tpv.code_type_visite    = 'PLAN'
        AND     tpv.code_statut_visite  IN ('REAL','ABSE')
        AND     tpv.flag_accompagnee    = 'N'
        AND     tpv.id_accompagnant IS NULL
        AND     CASE
                    WHEN @date_debut IS NOT NULL AND @date_fin IS NOT NULL THEN
                        tpv.date_visite BETWEEN @date_debut AND @date_fin
                    ELSE
                        1 = 1
                END
        AND     CASE
                    WHEN @id_utilisateur IS NOT NULL THEN
                            tpv.id_utilisateur  = @id_utilisateur
                        OR 
                            tpv.id_accompagnant = @id_utilisateur
                    WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN  
                        (
                                tpv.id_utilisateur  = @token_id
                            OR 
                                tpv.id_accompagnant = @token_id
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
                                    tpv2.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                                    WHERE   tur.id_utilisateur = @token_id
                                                                    AND     tur.flag_actif = 'O')
                                AND 
                                    (
                                        (
                                            @token_medical = 'O'
                                        AND
                                            tpv.flag_medical = 'O'
                                        AND            
                                            tpv2.code_type_partenaire = 'MEDE'
                                        AND
                                            tpv2.code_gamme_partenaire IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                                                            WHERE   tug.id_utilisateur  = @token_id
                                                                            AND     tug.flag_actif      = 'O')
                                        )
                                    OR
                                        (
                                            @token_pharmaceutique = 'O'
                                        AND
                                            tpv.flag_pharmaceutique = 'O'
                                        AND
                                            tpv2.code_type_partenaire = 'PHAR'
                                        )
                                    )
                            )
                        )
                    ELSE
                        1 = 1
                END
    )                                                                                           AS nbr_visites_simples_planifiees               ,
    (SELECT COUNT(0) FROM tab_visite tpv
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite
        WHERE   tpv.code_statut_visite <> 'SUPP'  
        AND     tpv.code_type_visite    = 'HOPL'
        AND     tpv.flag_accompagnee    = 'N'
        AND     tpv.id_accompagnant IS NULL
        AND     CASE
                    WHEN @date_debut IS NOT NULL AND @date_fin IS NOT NULL THEN
                        tpv.date_visite BETWEEN @date_debut AND @date_fin
                    ELSE
                        1 = 1
                END
        AND     CASE
                    WHEN @id_utilisateur IS NOT NULL THEN
                            tpv.id_utilisateur  = @id_utilisateur
                        OR 
                            tpv.id_accompagnant = @id_utilisateur
                    WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN  
                        (
                                tpv.id_utilisateur  = @token_id
                            OR 
                                tpv.id_accompagnant = @token_id
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
                                    tpv2.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                                    WHERE   tur.id_utilisateur = @token_id
                                                                    AND     tur.flag_actif = 'O')
                                AND 
                                    (
                                        (
                                            @token_medical = 'O'
                                        AND
                                            tpv.flag_medical = 'O'
                                        AND            
                                            tpv2.code_type_partenaire = 'MEDE'
                                        AND
                                            tpv2.code_gamme_partenaire IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                                                            WHERE   tug.id_utilisateur  = @token_id
                                                                            AND     tug.flag_actif      = 'O')
                                        )
                                    OR
                                        (
                                            @token_pharmaceutique = 'O'
                                        AND
                                            tpv.flag_pharmaceutique = 'O'
                                        AND
                                            tpv2.code_type_partenaire = 'PHAR'
                                        )
                                    )
                            )
                        )
                    ELSE
                        1 = 1
                END
    )                                                                                           AS nbr_visites_simples_non_planifiees           ,
    (SELECT COUNT(0) FROM tab_visite tpv
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite
        WHERE   tpv.code_type_visite    = 'PLAN'
        AND     tpv.code_statut_visite  IN ('REAL','ABSE')
        AND     tpv.flag_accompagnee    = 'O'
        AND     tpv.id_accompagnant IS NOT NULL
        AND     CASE
                    WHEN @date_debut IS NOT NULL AND @date_fin IS NOT NULL THEN
                        tpv.date_visite BETWEEN @date_debut AND @date_fin
                    ELSE
                        1 = 1
                END
        AND     CASE
                    WHEN @id_utilisateur IS NOT NULL THEN
                            tpv.id_utilisateur  = @id_utilisateur
                        OR 
                            tpv.id_accompagnant = @id_utilisateur
                    WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN  
                        (
                                tpv.id_utilisateur  = @token_id
                            OR 
                                tpv.id_accompagnant = @token_id
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
                                    tpv2.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                                    WHERE   tur.id_utilisateur = @token_id
                                                                    AND     tur.flag_actif = 'O')
                                AND 
                                    (
                                        (
                                            @token_medical = 'O'
                                        AND
                                            tpv.flag_medical = 'O'
                                        AND            
                                            tpv2.code_type_partenaire = 'MEDE'
                                        AND
                                            tpv2.code_gamme_partenaire IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                                                            WHERE   tug.id_utilisateur  = @token_id
                                                                            AND     tug.flag_actif      = 'O')
                                        )
                                    OR
                                        (
                                            @token_pharmaceutique = 'O'
                                        AND
                                            tpv.flag_pharmaceutique = 'O'
                                        AND
                                            tpv2.code_type_partenaire = 'PHAR'
                                        )
                                    )
                            )
                        )
                    ELSE
                        1 = 1
                END
    )                                                                                           AS nbr_visites_en_double_planifiees             ,
    (SELECT     COUNT(0) FROM tab_visite tpv
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite
        WHERE   tpv.code_statut_visite <> 'SUPP'  
        AND     tpv.code_type_visite    = 'HOPL'
        AND     tpv.flag_accompagnee    = 'O'
        AND     tpv.id_accompagnant IS NOT NULL
        AND     CASE
                    WHEN @date_debut IS NOT NULL AND @date_fin IS NOT NULL THEN
                        tpv.date_visite BETWEEN @date_debut AND @date_fin
                    ELSE
                        1 = 1
                END
        AND     CASE
                    WHEN @id_utilisateur IS NOT NULL THEN
                            tpv.id_utilisateur  = @id_utilisateur
                        OR 
                            tpv.id_accompagnant = @id_utilisateur
                    WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN  
                        (
                                tpv.id_utilisateur  = @token_id
                            OR 
                                tpv.id_accompagnant = @token_id
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
                                    tpv2.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                                    WHERE   tur.id_utilisateur = @token_id
                                                                    AND     tur.flag_actif = 'O')
                                AND 
                                    (
                                        (
                                            @token_medical = 'O'
                                        AND
                                            tpv.flag_medical = 'O'
                                        AND            
                                            tpv2.code_type_partenaire = 'MEDE'
                                        AND
                                            tpv2.code_gamme_partenaire IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                                                            WHERE   tug.id_utilisateur  = @token_id
                                                                            AND     tug.flag_actif      = 'O')
                                        )
                                    OR
                                        (
                                            @token_pharmaceutique = 'O'
                                        AND
                                            tpv.flag_pharmaceutique = 'O'
                                        AND
                                            tpv2.code_type_partenaire = 'PHAR'
                                        )
                                    )
                            )
                        )
                    ELSE
                        1 = 1
                END
    )                                                                                           AS nbr_visites_en_double_non_planifiees         ,
    (SELECT COUNT(DISTINCT(Date(tpv.date_visite))) 
        FROM        tab_visite tpv
        WHERE   CASE
                    WHEN @id_utilisateur IS NOT NULL THEN
                        tpv.id_utilisateur = @id_utilisateur
                    ELSE
                        tpv.id_utilisateur = @token_id
                END
        AND tpv.code_type_visite = 'PLAN'
        AND     CASE
                    WHEN @date_debut IS NOT NULL AND @date_fin IS NOT NULL THEN
                        tpv.date_visite BETWEEN @date_debut AND @date_fin
                    ELSE
                        1 = 1
                END
    )                                                                                           AS nbr_mes_planifications                       ,
    (SELECT COUNT(DISTINCT(Date(tpv.date_visite))) 
        FROM        tab_visite tpv
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite
        WHERE       CASE
                        WHEN @date_debut IS NOT NULL AND @date_fin IS NOT NULL THEN
                            tpv.date_visite BETWEEN @date_debut AND @date_fin
                        ELSE
                            1 = 1
                    END
        AND tpv.code_type_visite = 'PLAN'
        AND CASE
                WHEN @id_utilisateur IS NOT NULL THEN
                        tpv.id_utilisateur  = @id_utilisateur
                    OR 
                        tpv.id_accompagnant = @id_utilisateur
                WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN  
                (
                        tpv.id_utilisateur  = @token_id
                    OR 
                        tpv.id_accompagnant = @token_id
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
                            tpv2.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                            WHERE   tur.id_utilisateur = @token_id
                                                            AND     tur.flag_actif = 'O')
                        AND 
                            (
                                (
                                    @token_medical = 'O'
                                AND
                                    tpv.flag_medical = 'O'
                                AND            
                                    tpv2.code_type_partenaire = 'MEDE'
                                AND
                                    tpv2.code_gamme_partenaire IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                                                    WHERE   tug.id_utilisateur  = @token_id
                                                                    AND     tug.flag_actif      = 'O')
                                )
                            OR
                                (
                                    @token_pharmaceutique = 'O'
                                AND
                                    tpv.flag_pharmaceutique = 'O'
                                AND
                                    tpv2.code_type_partenaire = 'PHAR'
                                )
                            )
                    )
                )
            ELSE
                1 = 1
        END
    )                                                                                           AS nbr_total_planifications                     ,
    (SELECT COUNT(0) FROM tab_visite tpv
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite
        WHERE   tpv.code_type_visite    = 'PLAN'
        AND     tpv.code_statut_visite  = 'REAL'
        AND     CASE
                    WHEN @date_debut IS NOT NULL AND @date_fin IS NOT NULL THEN
                        tpv.date_visite BETWEEN @date_debut AND @date_fin
                    ELSE
                        1 = 1
                END
        AND CASE
                WHEN @id_utilisateur IS NOT NULL THEN
                        tpv.id_utilisateur  = @id_utilisateur
                    OR 
                        tpv.id_accompagnant = @id_utilisateur
                WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN  
                (
                        tpv.id_utilisateur  = @token_id
                    OR 
                        tpv.id_accompagnant = @token_id
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
                            tpv2.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                            WHERE   tur.id_utilisateur = @token_id
                                                            AND     tur.flag_actif = 'O')
                        AND 
                            (
                                (
                                    @token_medical = 'O'
                                AND
                                    tpv.flag_medical = 'O'
                                AND            
                                    tpv2.code_type_partenaire = 'MEDE'
                                AND
                                    tpv2.code_gamme_partenaire IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                                                    WHERE   tug.id_utilisateur  = @token_id
                                                                    AND     tug.flag_actif      = 'O')
                                )
                            OR
                                (
                                    @token_pharmaceutique = 'O'
                                AND
                                    tpv.flag_pharmaceutique = 'O'
                                AND
                                    tpv2.code_type_partenaire = 'PHAR'
                                )
                            )
                    )
                )
            ELSE
                1 = 1
        END
    )                                                                                           AS total_realises                               ,  
    (SELECT COUNT(0) FROM tab_visite tpv
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite
        WHERE   tpv.code_type_visite    = 'PLAN'
        AND     tpv.code_statut_visite  = 'ABSE'
        AND     CASE
                    WHEN @date_debut IS NOT NULL AND @date_fin IS NOT NULL THEN
                        tpv.date_visite BETWEEN @date_debut AND @date_fin
                    ELSE
                        1 = 1
                END
        AND CASE
                WHEN @id_utilisateur IS NOT NULL THEN
                        tpv.id_utilisateur  = @id_utilisateur
                    OR 
                        tpv.id_accompagnant = @id_utilisateur
                WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN  
                (
                        tpv.id_utilisateur  = @token_id
                    OR 
                        tpv.id_accompagnant = @token_id
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
                            tpv2.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                            WHERE   tur.id_utilisateur = @token_id
                                                            AND     tur.flag_actif = 'O')
                        AND 
                            (
                                (
                                    @token_medical = 'O'
                                AND
                                    tpv.flag_medical = 'O'
                                AND            
                                    tpv2.code_type_partenaire = 'MEDE'
                                AND
                                    tpv2.code_gamme_partenaire IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                                                    WHERE   tug.id_utilisateur  = @token_id
                                                                    AND     tug.flag_actif      = 'O')
                                )
                            OR
                                (
                                    @token_pharmaceutique = 'O'
                                AND
                                    tpv.flag_pharmaceutique = 'O'
                                AND
                                    tpv2.code_type_partenaire = 'PHAR'
                                )
                            )
                    )
                )
            ELSE
                1 = 1
        END
    )                                                                                           AS total_absent                                 ,
    (SELECT COUNT(0) FROM tab_visite tpv
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite
        WHERE   tpv.code_type_visite    = 'PLAN'
        AND     tpv.code_statut_visite  = 'REPL'
        AND     CASE
                    WHEN @date_debut IS NOT NULL AND @date_fin IS NOT NULL THEN
                        tpv.date_visite BETWEEN @date_debut AND @date_fin
                    ELSE
                        1 = 1
                END
        AND CASE
                WHEN @id_utilisateur IS NOT NULL THEN
                        tpv.id_utilisateur  = @id_utilisateur
                    OR 
                        tpv.id_accompagnant = @id_utilisateur
                WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN  
                (
                        tpv.id_utilisateur  = @token_id
                    OR 
                        tpv.id_accompagnant = @token_id
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
                            tpv2.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                            WHERE   tur.id_utilisateur = @token_id
                                                            AND     tur.flag_actif = 'O')
                        AND 
                            (
                                (
                                    @token_medical = 'O'
                                AND
                                    tpv.flag_medical = 'O'
                                AND            
                                    tpv2.code_type_partenaire = 'MEDE'
                                AND
                                    tpv2.code_gamme_partenaire IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                                                    WHERE   tug.id_utilisateur  = @token_id
                                                                    AND     tug.flag_actif      = 'O')
                                )
                            OR
                                (
                                    @token_pharmaceutique = 'O'
                                AND
                                    tpv.flag_pharmaceutique = 'O'
                                AND
                                    tpv2.code_type_partenaire = 'PHAR'
                                )
                            )
                    )
                )
            ELSE
                1 = 1
        END

    )                                                                                           AS total_replanifies                            ,
    (SELECT COUNT(0) FROM tab_visite tpv
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite
        WHERE   tpv.code_type_visite    = 'PLAN'
        AND     tpv.code_statut_visite  = 'ENAT'
        AND     CASE
                    WHEN @date_debut IS NOT NULL AND @date_fin IS NOT NULL THEN
                        tpv.date_visite BETWEEN @date_debut AND @date_fin
                    ELSE
                        1 = 1
                END
        AND CASE
                WHEN @id_utilisateur IS NOT NULL THEN
                        tpv.id_utilisateur  = @id_utilisateur
                    OR 
                        tpv.id_accompagnant = @id_utilisateur
                WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN  
                (
                        tpv.id_utilisateur  = @token_id
                    OR 
                        tpv.id_accompagnant = @token_id
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
                            tpv2.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                            WHERE   tur.id_utilisateur = @token_id
                                                            AND     tur.flag_actif = 'O')
                        AND 
                            (
                                (
                                    @token_medical = 'O'
                                AND
                                    tpv.flag_medical = 'O'
                                AND            
                                    tpv2.code_type_partenaire = 'MEDE'
                                AND
                                    tpv2.code_gamme_partenaire IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                                                    WHERE   tug.id_utilisateur  = @token_id
                                                                    AND     tug.flag_actif      = 'O')
                                )
                            OR
                                (
                                    @token_pharmaceutique = 'O'
                                AND
                                    tpv.flag_pharmaceutique = 'O'
                                AND
                                    tpv2.code_type_partenaire = 'PHAR'
                                )
                            )
                    )
                )
            ELSE
                1 = 1
        END
    )                                                                                           AS total_en_attente                             ,
    (SELECT     COUNT(0) FROM tab_partenaire_bc tb
        WHERE   CASE
                    WHEN @date_debut IS NOT NULL AND @date_fin IS NOT NULL THEN
                        tb.date_creation BETWEEN @date_debut AND @date_fin
                    ELSE
                        1 = 1
                END
        AND CASE
                WHEN @id_utilisateur IS NOT NULL AND @role_utilisateur <> 'ACH' THEN
                    tb.id_utilisateur  = @id_utilisateur
                WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN  
                (
                        tb.id_utilisateur  = @token_id
                    OR
                    (
                            (
                                ( @token_role = ('KAM') AND tb.role_utilisateur = 'DEL')
                                OR
                                ( @token_role = ('DSM') AND tb.role_utilisateur IN ('KAM','DEL'))
                                OR
                                ( @token_role = ('DRG') AND tb.role_utilisateur IN ('DSM','KAM','DEL'))
                            )
                        AND
                            tb.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                            WHERE   tur.id_utilisateur = @token_id
                                                            AND     tur.flag_actif = 'O')
                        AND 
                            (
                                (
                                    @token_medical = 'O'
                                AND
                                    tb.flag_medical = 'O'
                                AND            
                                    tb.code_type_partenaire = 'MEDE'
                                AND
                                    tb.code_gamme_partenaire IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                                                    WHERE   tug.id_utilisateur  = @token_id
                                                                    AND     tug.flag_actif      = 'O')
                                )
                            OR
                                (
                                    @token_pharmaceutique = 'O'
                                AND
                                    tb.flag_pharmaceutique = 'O'
                                AND
                                    tb.code_type_partenaire = 'PHAR'
                                )
                            )
                    )
                )
            ELSE
                1 = 1
        END
    )                                                                                           AS nbr_total_investissements                        ,
    (SELECT     COUNT(0) FROM tab_partenaire_bc tb
        WHERE   CASE
                    WHEN @date_debut IS NOT NULL AND @date_fin IS NOT NULL THEN
                        tb.date_creation BETWEEN @date_debut AND @date_fin
                    ELSE
                        1 = 1
                END
        AND     tb.code_statut_bc = 'ENAT'
        AND CASE
                WHEN @id_utilisateur IS NOT NULL AND @role_utilisateur <> 'ACH' THEN
                    tb.id_utilisateur  = @id_utilisateur
                WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN  
                (
                        tb.id_utilisateur  = @token_id
                    OR
                    (
                            
                            (
                                ( @token_role = ('KAM') AND tb.role_utilisateur = 'DEL')
                                OR
                                ( @token_role = ('DSM') AND tb.role_utilisateur IN ('KAM','DEL'))
                                OR
                                ( @token_role = ('DRG') AND tb.role_utilisateur IN ('DSM','KAM','DEL'))
                            )
                        AND
                            tb.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                            WHERE   tur.id_utilisateur = @token_id
                                                            AND     tur.flag_actif = 'O')
                        AND 
                            (
                                (
                                    @token_medical = 'O'
                                AND
                                    tb.flag_medical = 'O'
                                AND            
                                    tb.code_type_partenaire = 'MEDE'
                                AND
                                    tb.code_gamme_partenaire IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                                                    WHERE   tug.id_utilisateur  = @token_id
                                                                    AND     tug.flag_actif      = 'O')
                                )
                            OR
                                (
                                    @token_pharmaceutique = 'O'
                                AND
                                    tb.flag_pharmaceutique = 'O'
                                AND
                                    tb.code_type_partenaire = 'PHAR'
                                )
                            )
                    )
                )
            ELSE
                1 = 1
        END
    )                                                                                           AS nbr_investissements_en_attente               ,
    (SELECT     COUNT(0) FROM tab_partenaire_bc tb
        WHERE   CASE
                    WHEN @date_debut IS NOT NULL AND @date_fin IS NOT NULL THEN
                        tb.date_creation BETWEEN @date_debut AND @date_fin
                    ELSE
                        1 = 1
                END
        AND     tb.code_statut_bc = 'VALI'
        AND CASE
                WHEN @id_utilisateur IS NOT NULL AND @role_utilisateur <> 'ACH' THEN
                    tb.id_utilisateur  = @id_utilisateur
                WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN  
                (
                        tb.id_utilisateur  = @token_id
                    OR
                    (
                            
                            (
                                ( @token_role = ('KAM') AND tb.role_utilisateur = 'DEL')
                                OR
                                ( @token_role = ('DSM') AND tb.role_utilisateur IN ('KAM','DEL'))
                                OR
                                ( @token_role = ('DRG') AND tb.role_utilisateur IN ('DSM','KAM','DEL'))
                            )
                        AND
                            tb.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                            WHERE   tur.id_utilisateur = @token_id
                                                            AND     tur.flag_actif = 'O')
                        AND 
                            (
                                (
                                    @token_medical = 'O'
                                AND
                                    tb.flag_medical = 'O'
                                AND            
                                    tb.code_type_partenaire = 'MEDE'
                                AND
                                    tb.code_gamme_partenaire IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                                                    WHERE   tug.id_utilisateur  = @token_id
                                                                    AND     tug.flag_actif      = 'O')
                                )
                            OR
                                (
                                    @token_pharmaceutique = 'O'
                                AND
                                    tb.flag_pharmaceutique = 'O'
                                AND
                                    tb.code_type_partenaire = 'PHAR'
                                )
                            )
                    )
                )
            ELSE
                1 = 1
        END
    )                                                                                           AS nbr_investissements_valides              ,
    (SELECT     COUNT(0) FROM tab_partenaire_bc tb
        WHERE   CASE
                    WHEN @date_debut IS NOT NULL AND @date_fin IS NOT NULL THEN
                        tb.date_creation BETWEEN @date_debut AND @date_fin
                    ELSE
                        1 = 1
                END
        AND     tb.code_statut_bc = 'REAL'
        AND CASE
                WHEN @id_utilisateur IS NOT NULL AND @role_utilisateur <> 'ACH' THEN
                    tb.id_utilisateur  = @id_utilisateur
                WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN  
                (
                        tb.id_utilisateur  = @token_id
                    OR
                    (
                            (
                                ( @token_role = ('KAM') AND tb.role_utilisateur = 'DEL')
                                OR
                                ( @token_role = ('DSM') AND tb.role_utilisateur IN ('KAM','DEL'))
                                OR
                                ( @token_role = ('DRG') AND tb.role_utilisateur IN ('DSM','KAM','DEL'))
                            )
                        AND
                            tb.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                            WHERE   tur.id_utilisateur = @token_id
                                                            AND     tur.flag_actif = 'O')
                        AND 
                            (
                                (
                                    @token_medical = 'O'
                                AND
                                    tb.flag_medical = 'O'
                                AND            
                                    tb.code_type_partenaire = 'MEDE'
                                AND
                                    tb.code_gamme_partenaire IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                                                    WHERE   tug.id_utilisateur  = @token_id
                                                                    AND     tug.flag_actif      = 'O')
                                )
                            OR
                                (
                                    @token_pharmaceutique = 'O'
                                AND
                                    tb.flag_pharmaceutique = 'O'
                                AND
                                    tb.code_type_partenaire = 'PHAR'
                                )
                            )
                    )
                )
            ELSE
                1 = 1
        END
    )                                                                                           AS nbr_investissements_realises             ,
    (SELECT     COUNT(0) FROM tab_partenaire_bc tb
        WHERE   CASE
                    WHEN @date_debut IS NOT NULL AND @date_fin IS NOT NULL THEN
                        tb.date_creation BETWEEN @date_debut AND @date_fin
                    ELSE
                        1 = 1
                END
        AND     tb.code_statut_bc = 'REJE'
        AND CASE
                WHEN @id_utilisateur IS NOT NULL AND @role_utilisateur <> 'ACH' THEN
                    tb.id_utilisateur  = @id_utilisateur
                WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN  
                (
                        tb.id_utilisateur  = @token_id
                    OR
                    (
                            (
                                ( @token_role = ('KAM') AND tb.role_utilisateur = 'DEL')
                                OR
                                ( @token_role = ('DSM') AND tb.role_utilisateur IN ('KAM','DEL'))
                                OR
                                ( @token_role = ('DRG') AND tb.role_utilisateur IN ('DSM','KAM','DEL'))
                            )
                        AND
                            tb.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                            WHERE   tur.id_utilisateur = @token_id
                                                            AND     tur.flag_actif = 'O')
                        AND 
                            (
                                (
                                    @token_medical = 'O'
                                AND
                                    tb.flag_medical = 'O'
                                AND            
                                    tb.code_type_partenaire = 'MEDE'
                                AND
                                    tb.code_gamme_partenaire IN (SELECT tug.code_gamme FROM tab_utilisateur_gamme tug
                                                                    WHERE   tug.id_utilisateur  = @token_id
                                                                    AND     tug.flag_actif      = 'O')
                                )
                            OR
                                (
                                    @token_pharmaceutique = 'O'
                                AND
                                    tb.flag_pharmaceutique = 'O'
                                AND
                                    tb.code_type_partenaire = 'PHAR'
                                )
                            )
                    )
                )
            ELSE
                1 = 1
        END
    )                                                                                           AS nbr_investissements_rejetes              ;
`

const que_get_stats_par_gamme = `
SET @token_id       = ?,
    @token_role     = ?,
    @id_utilisateur = ?,
    @date_debut     = ?,
    @date_fin       = ?,
    @code_gamme     = ?;

SELECT
    (SELECT libelle_codification FROM tab_par_codification
        WHERE   code_codification   = @code_gamme
        AND     type_codification   = 'GAMM'
    ) AS gamme ,
    (SELECT  COUNT(0)
        FROM    tab_visite tpv
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite
        WHERE   tpv.code_type_visite        = 'PLAN'
        AND     tpv.code_statut_visite      IN ('REAL','ABSE')
        AND     tpv2.code_type_partenaire    = 'MEDE'
        AND     CASE
                    WHEN @date_debut IS NOT NULL AND @date_fin IS NOT NULL THEN
                        tpv.date_visite BETWEEN @date_debut AND @date_fin
                    ELSE
                        1 = 1
                END
        AND     tpv2.code_gamme_partenaire   = @code_gamme
        AND CASE
                WHEN @id_utilisateur IS NOT NULL THEN
                        tpv.id_utilisateur  = @id_utilisateur
                    OR 
                        tpv.id_accompagnant = @id_utilisateur
                WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN
                (
                        tpv.id_utilisateur  = @token_id
                    OR 
                        tpv.id_accompagnant = @token_id
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
                            tpv2.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                            WHERE   tur.id_utilisateur = @token_id
                                                            AND     tur.flag_actif = 'O')
                        AND 
                            @token_medical = 'O'
                        AND
                            tpv.flag_medical = 'O'
                    )
                )
            ELSE
                1 = 1
        END
    )                                                                                           AS nbr_visites_realisees_planifiees             ,
    (SELECT  COUNT(0)
        FROM    tab_visite tpv
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite
        WHERE   tpv.code_statut_visite <> 'SUPP'  
        AND     tpv.code_type_visite        = 'HOPL'
        AND     tpv2.code_type_partenaire    = 'MEDE'
        AND     CASE
                    WHEN @date_debut IS NOT NULL AND @date_fin IS NOT NULL THEN
                        tpv.date_visite BETWEEN @date_debut AND @date_fin
                    ELSE
                        1 = 1
                END
        AND     tpv2.code_gamme_partenaire   = @code_gamme
        AND CASE
                WHEN @id_utilisateur IS NOT NULL THEN
                        tpv.id_utilisateur  = @id_utilisateur
                    OR 
                        tpv.id_accompagnant = @id_utilisateur
                WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN
                (
                        tpv.id_utilisateur  = @token_id
                    OR 
                        tpv.id_accompagnant = @token_id
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
                            tpv2.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                            WHERE   tur.id_utilisateur = @token_id
                                                            AND     tur.flag_actif = 'O')
                        AND 
                            @token_medical = 'O'
                        AND
                            tpv.flag_medical = 'O'
                    )
                )
            ELSE
                1 = 1
        END
    )                                                                                           AS nbr_visites_realisees_non_planifiees         ,
    (SELECT  COUNT(0)
        FROM    tab_visite tpv
        LEFT JOIN tab_partenaire_visite tpv2
        ON tpv.id_visite = tpv2.id_visite
        WHERE   tpv2.code_type_partenaire    = 'MEDE'
        AND     tpv.code_statut_visite      IN ('REAL','ABSE')
        AND     CASE
                    WHEN @date_debut IS NOT NULL AND @date_fin IS NOT NULL THEN
                        tpv.date_visite BETWEEN @date_debut AND @date_fin
                    ELSE
                        1 = 1
                END
        AND     tpv2.code_gamme_partenaire   = @code_gamme
        AND CASE
                WHEN @id_utilisateur IS NOT NULL THEN
                        tpv.id_utilisateur  = @id_utilisateur
                    OR 
                        tpv.id_accompagnant = @id_utilisateur
                WHEN @token_role NOT IN ('ADMI','DIR','PM','ACH') THEN
                (
                        tpv.id_utilisateur  = @token_id
                    OR 
                        tpv.id_accompagnant = @token_id
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
                            tpv2.code_region_partenaire IN (SELECT tur.code_region FROM tab_utilisateur_region tur
                                                            WHERE   tur.id_utilisateur = @token_id
                                                            AND     tur.flag_actif = 'O')
                        AND 
                            @token_medical = 'O'
                        AND
                            tpv.flag_medical = 'O'
                    )
                )
            ELSE
                1 = 1
        END
    )                                                                                               AS nbr_total_visites                        ;
`

module.exports = {
    que_get_stats,
    que_get_stats_par_gamme
}