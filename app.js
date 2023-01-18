'use strict';


//Every single one of those needs to be install with npm except folders. You don't install folders.
const express = require("express"),
    bodyParser = require("body-parser"),
    app = express(),
    compression = require('compression'),
    helmet = require('helmet'),
    morgan = require("morgan"),
    cors = require("cors"),
    fs = require('fs'),
    mainRouter = require("./api/routes/main.router");
require('./api/_config/db-config')

//Testing the connection to the server, you can delete this when you push to a server since it is useless to console it there.
connection.query('SELECT 1', (err, result, next) => {
    console.log({ error: err, ok: result })
    if (err) {
        next(err)
    }
})

app.use(bodyParser.json({ limit: '50mb' })); // You need this if you ever need to read a json request.. do not remove this please.

//These next 2 lines are GOOD for production, but are not a necessity. read about them individually
app.use(compression()); //Compress all routes
app.use(helmet());


//middlewares
app.use(cors()); ///!\ For the love of God do not remove this. /!\ if you're clueless about cors read about it here : https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS

app.use(morgan("dev")); // you can remove this for production

//This encodes the data coming in to a readable data format, YOU NEED THIS.
app.use(bodyParser.urlencoded({
    limit: '50mb',
    extended: true
}));

//Calling route folders using CORS DO NOT REMOVE CORS.
app.use("/main", cors(), mainRouter);

// Declaring what to do when uncaught exception happens.
process.on('uncaughtException', (error) => {
    if (error.code === 'PROTOCOL_ENQUEUE_AFTER_DESTROY' || error.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
        console.log('here ', error, error.code)
        return
    }
    console.log(error);
    console.log(error.code);

    fs.appendFile("./_log/_log.txt", '\n' + new Date() + ' : -- ' + error.code + '-------> ' + error, function (err) {

        if (err) {
            return console.log(err);
        }

        console.log("The file was saved!");
    });
});

// Declaring what to do on an unknown error.
connection.on('error', async (err) => {
    console.log('there has been an error on the database connection side', err)
});


// // making the public directory accessible
app.use('/public', express.static(__dirname + '/public'));


// catch 404 and forward to error handler
app.use((req, res, next) => {
    let _not_found_body = require('./api/_views/404_not_found.js')._not_found_render
    let err = new Error("Not Found");
    err.status = 404;
    return res.status(404).send(_not_found_body).end()
});


// error handler
app.use((err, req, res) => {

    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = err;
    // render the error page
    res.status(err.status || 401);
    // render the error page
    if (err.status === '404' && err.html)
        return res.send(err.html).end();
    else res.json({
        message: err.message
    });
});


//This is here to handle all the uncaught promise rejections
process.on("unhandledRejection", error => {
    console.error("Uncaught Error : ", error);

});
module.exports = app;
