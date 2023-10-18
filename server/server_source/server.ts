'use strict'

import { CookieOptions, Request, Response } from "express";
import { logGreen, logRed, log, logBlue, getLog } from "./extendedLog";
import * as fs from 'fs';

const Express = require("express");
require('dotenv-expand').expand(require('dotenv').config()); // load env and expand using dotenv-expand

// #region SSL
var isSSLDefined = process.env.SSL_KEY_PATH != undefined && process.env.SSL_PEM_PATH != undefined;
var sslKey, sslCert;
if (!isSSLDefined) console.log("SSL_KEY_PATH or SSL_PEM_PATH isn't defined in the env file. Running in HTTP mode.");
else 
{ 
    sslKey = fs.readFileSync(process.cwd() + process.env.SSL_KEY_PATH);
    sslCert = fs.readFileSync(process.cwd() + process.env.SSL_PEM_PATH);
    console.log(`Running in HTTPS mode. ${process.cwd() + process.env.SSL_KEY_PATH}`);
}
// #endregion 

var app = Express();
var server = isSSLDefined ? require('https').createServer({ key:sslKey, cert:sslCert }, app) : require('http').createServer(app);
var port = process.env.PORT || 55562;
var systemLaunchTime = new Date();
var distFolderLocation = require('node:path').resolve(process.env.DIST_FOLDER ?? "./dist/");
const { Server } = require("socket.io");
const io = new Server(server);
const auth = (require("./auth"));
const message = (require("./message"));
const compression = require('compression');
const siofu = require("socketio-file-upload");
const cookieParser = require("cookie-parser");

// initialization
(async function () 
{
    console.log(`Static folder set to ${distFolderLocation}`);
    
    // Router definitions
    (function()
    {
        app.get("/api/", (req:any, res:any) => { res.json({message:"welcome to the entry API"}); });
    })();

    app.use(cookieParser());
    app.use(Express.json());
    app.use(compression());
    app.use(siofu.router);

    server.listen(port, () => { logGreen(`Started listening on ${port}`); });

    auth.init(io, app, isSSLDefined);
    message.init(io, app);

    // Catching signals and logging them
    (function()
    {
        ['SIG', 'SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT','SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGTERM'].forEach(sig =>
        {
            process.on(sig, () =>
            {
                logRed('Server shutting down with signal=' + sig);

                setTimeout(() => { process.exit(1); }, 100);
            });
        });
    })();

    app.use(Express.static(distFolderLocation));
    expressRouterGet("/assets/*", (req, res, next) => { res.sendFile(req.path, { root: distFolderLocation }); }, false);
    expressRouterGet("/*", (req, res, next) => { res.sendFile("index.html", { root: distFolderLocation }); }, false);

})();

// Methods definitions
function expressRouterGet(path: string, callback: any, requireLocalhost: any)
{
    if (!callback) { console.warn("callback is null."); return; }
    if (!path) { console.warn("path is null."); return; }

    app.get(path, function (req, res, next)
    {
        var acceptedSource = 
        [
            "::1",
            "::ffff:127.0.0.1",
            "localhost"
        ];

        // Handle access of local resources from remote.
        if (!acceptedSource.includes(req.connection.remoteAddress) && requireLocalhost)
        {
            logRed(`Requests of "${path}" from ${req.connection.remoteAddress} was rejected.`);
            res.status(403).send(`<html><body>Access denied. Access must originate from <a href='http://localhost:${port}/accessRecordRaw'>localhost</a>. Current source: ${req.connection.remoteAddress}</body></html>`); 
        }
        else 
        {
            callback(req, res, next); 
        }
    });
}