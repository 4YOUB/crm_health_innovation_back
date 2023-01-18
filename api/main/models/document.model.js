const que_ajo_document = `
SET @id_utilisateur     = ?,
    @extension_document = ?,
    @id_document        = NULL;

INSERT INTO tab_document (
    id_utilisateur      ,
    extension_document

) VALUES (
    @id_utilisateur     ,
    @extension_document
);
SELECT LAST_INSERT_ID() INTO @id_document;

UPDATE  tab_document 
SET     cle_document    = CONCAT(@id_document,md5(@id_document))
WHERE   id_document     = @id_document;

SELECT  id_document                ,
        cle_document               ,
        extension_document
FROM    tab_document t
WHERE   t.id_document = @id_document ;
`

module.exports = {
    que_ajo_document
}