const passport                  = require('passport')                               ;
const passportJWT               = require("passport-jwt")                           ;
const {CONFIG}                  = require('../_config/env-config')                  ;
const ExtractJWT                = passportJWT.ExtractJwt                            ;
const LocalStrategy             = require('passport-local').Strategy                ;
const JWTStrategy               = passportJWT.Strategy                              ;
const { que_authentification }  = require('../main/models/authentification.model')  ;


passport.use('authentification', new LocalStrategy({
        usernameField: 'login',
        passwordField: 'password'
    },
    (login, password, done) => {
        connection.query(que_authentification, [login, password], async (err, rows) => {
            if (err)
                done(err);
            if (rows)
                if (rows.length === 0) {
                    return done(null, rows, {message: 'Incorrect authentication or password.'});
                } else {
                    return done(null, rows, {message: 'Logged In Successfully'});
                }
        });
    }
));

passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: CONFIG.jwt_encryption
}, function (jwtPayload, done) {
    return done(null, jwtPayload, {message: 'all good.'});
}));
