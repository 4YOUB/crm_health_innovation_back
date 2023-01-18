require('../../middlewares/passport');
const jwt                               = require('jsonwebtoken')                       ;
const passport                          = require('passport')                           ;
const jwt_decode                        = require('jwt-decode')                         ;
const authentification_model            = require('../models/authentification.model')   ;
const utilisateur_model                 = require('../models/utilisateur.model')    ;

module.exports = {
    authentification: (req, res, next) => {
        passport.authenticate('authentification', {
            session: false
        }, function (err, user, info) {
            if (err) {
                return res.status(500).json(err);
            } else if (!user[0]) {
                return res.status(401).json({error: 'Auth Error!'});
            } else {
                user = JSON.parse(JSON.stringify(user));
                user = {...user[0]};
                if (user.code_statut_utilisateur != 'ACTI') {
                    res.json({ validation: false });
                } else {
                    connection.query(utilisateur_model.que_add_historique_utilisateur,[
                        user.id_utilisateur   , 
                        "Authentification"
                    ], (err, result) => {
                        if(!err){
                            const token = jwt.sign(user, process.env.JWT_ENCRYPTION, {expiresIn: "8h"});
                            res.json({
                                user            ,
                                token           ,
                                validation: true
                            });
                        }
                        else{
                            return res.status(500).json(err);
                        }
                    })
                }
            }
        })(req, res, next);
    },

    validation_token: (req, res, next) => {
        try {
            // verify a token symmetric
            const token = req.header('Authorization').split(' ');
            // set the token 
            req.jwtPayload = jwt.verify(token[1].trim().toString(), process.env.JWT_ENCRYPTION);

            connection.query(authentification_model.que_activation_utilisateur, [(jwt_decode(token[1])).id_utilisateur],(err, result) => {
                if(err || result[result.length-1].code_statut_utilisateur == 'DESA'){
                    const error = {
                        statusCode: 401,
                        message: 'The Token provided is invalid'
                    };
                    return res.status(401).json(error);
                }
                else{
                    return res.status(200).send();
                }
            })
        } catch (err) {
            const error = {
                statusCode: 401,
                message: 'The Token provided is invalid'
            };
            return res.status(500).json(error);
        }
    },

    deconnexion: (req, res, next) => {
        const bearer = req.headers.authorization.split(' ')[1];
        let bearer_content = {};
        try {
            bearer_content = jwt_decode(bearer);
        } catch {
            return res.status(400).json({
                error: 'the token is not valid'
            });
        }

        connection.query(utilisateur_model.que_add_historique_utilisateur,[
            bearer_content.id_utilisateur   , 
            "Deconnexion"
        ], (err, result) => {
            if(!err){
                return res.status(200).json({msg : "done"});            
            } else{
                // return res.status(500).json(err);
                return res.status(200).json({msg : "done"});
            }
        })
    },
};
