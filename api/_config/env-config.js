const dotenv =require('dotenv').config({path:'dev.env'});//instantiate environment variables
let CONFIG = {} //Make this global to use all over the application

CONFIG.app                          = process.env.APP   
CONFIG.port                         = process.env.PORT  

CONFIG.db_host                      = process.env.DB_HOST      
CONFIG.db_port                      = process.env.DB_PORT      
CONFIG.db_name                      = process.env.DB_NAME      
CONFIG.db_user                      = process.env.DB_USER      
CONFIG.db_password                  = process.env.DB_PASSWORD

CONFIG.version                      = process.env.VERSION 

CONFIG.bc_document_folder           = process.env.BC_DOCUMENT_FOLDER 
CONFIG.partenaire_document_folder   = process.env.PART_DOCUMENT_FOLDER 

CONFIG.url_api                      = process.env.URL_API 

CONFIG.jwt_encryption               = process.env.JWT_ENCRYPTION

module.exports.CONFIG = CONFIG
global.CONFIG = CONFIG