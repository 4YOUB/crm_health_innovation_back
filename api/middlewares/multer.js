const multer  = require('multer');
const path    = require('path');

const config_upload_document = multer.diskStorage({
  destination: function (req, file, callback) {
    final_path  = path.join(__dirname, "../../../" + (req.object['code_objet']=='PART'?CONFIG.partenaire_document_folder:CONFIG.bc_document_folder) + req.object['id_objet']);
    callback(null, final_path)
  },
  filename:function(req,file,callback){
    req.object['final_path']  = final_path + '/' + req.object['cle_document'] + '.' + req.object['extension_document'];
    callback(null, req.object['cle_document'] + '.' + req.object['extension_document']);
  }
})

const upload_document = multer({
  storage: config_upload_document,
  fileFilter: (req, file, callback) => {
    let extension = file.originalname.split('.').pop();
    if (extension !== 'jpg' && extension !== 'jpeg' && extension !== 'png' && extension !== 'docx' && extension !== 'doc' && extension !== 'pdf') {
      callback(null, false);
      return callback(new Error('Only .png, .jpg, .jpeg, .doc, .docx and .pdf format allowed!'));
    }
    else {
      callback(null, true);
    }
  }  
}).single("document");

module.exports = {
  upload_document
};
