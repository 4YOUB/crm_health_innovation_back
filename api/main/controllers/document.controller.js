const document_model            = require('../models/document.model') ;
const {upload_document}         = require('../../middlewares/multer') ;
const multer                    = require('multer')                   ;
const jwt_decode                = require('jwt-decode')               ;
const path                      = require('path')                     ;
const fs                        = require('fs')                       ;
const {validateAccess}          = require('../../helpers/function.helper')  ;

exports.upload_document = async (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    const roles = ['ADMI','DIR','DRG','PM','DSM','KAM','DEL'];
    if(!validateAccess(roles, bearer_content.role)){
        return res.status(200).json({message : "Sorry, you're not authorized to use this API"}).end();
    }
    
    if (req.file) {
        return res.send({ success: false });
    }
    else {
        let { 
            code                ,
            id                  , 
            extension_document 
        } = {...req.params}

        connection.query(document_model.que_ajo_document,[
            bearer_content.id_utilisateur,
            extension_document
        ],
        (err, result) => {
            if (err) {
                res.status(500).json({
                message: 'an error has occured please try again at a later time',
                err
                })
            } else if (result.length == 0) {
                res.status(400).json({
                error: 'there was a problem with the query'
                })
            } else {
                let id_document     = result[result.length - 1][0].id_document          ;
                let cle_document    = result[result.length - 1][0].cle_document         ;
                extension_document  = result[result.length - 1][0].extension_document   ;

                req.object = {
                    cle_document        :   cle_document        ,
                    extension_document  :   extension_document  ,
                    code_objet          :   code                ,
                    id_objet            :   id
                }

                ensureExists(path.join(__dirname, "../../../../" + (code=='PART'?CONFIG.partenaire_document_folder:CONFIG.bc_document_folder) + "/" + id), (err) =>{
                    upload_document(req, res, async (err) => {
                        if (err instanceof multer.MulterError) {
                            return res.status(500).json(err);
                        } else if (err) {
                        // An unknown error occurred when uploading.
                        return res.status(500).json({
                            uploaded: false,
                            message: "An unknown error occurred when uploading." + err
                        }).end();
                        }
                        return res.status(200).json({
                            id_document        ,
                            cle_document       ,
                            extension_document ,
                            url_document : CONFIG.url_api+(code=='PART'?CONFIG.partenaire_document_folder:CONFIG.bc_document_folder) + id + '/' + cle_document + '.' + extension_document
                        }).end();
                    });
                })
            }
        });
    }
}

function ensureExists(path, mask, cb) {
    if (typeof mask == 'function') { // allow the `mask` parameter to be optional
        cb = mask;
        mask = 0777;
    }
    fs.mkdir(path, mask, function(err) {
        if (err) {
            if (err.code === 'EEXIST') cb(null); // ignore the error if the folder already exists
            else cb(err); // something else went wrong
        } else cb(null); // successfully created folder
    });
}