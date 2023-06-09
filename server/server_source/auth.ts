import { Socket } from "socket.io";
import { logGreen } from "./extendedLog";
import { v4 as uuidv4 } from 'uuid';
import { CookieOptions, Request, Response } from "express";
import * as jwt from 'jsonwebtoken';
var cookie = require('cookie');

class SocketEntry
{
    socket: Socket;
    isLoggedIn: boolean = false;
    constructor(socket:Socket) { this.socket = socket; }
}

class TokenEntry
{
    token: string;
    expireDate: Date;
    
    constructor(token:string, expireInMS: number) { this.token = token; this.expireDate = new Date(Date.now() + expireInMS); }
    isValid(): boolean { return Date.now() < this.expireDate.getTime(); }
}

class AcceptTokenEntry
{
    token: string;
    expireDate: Date;
    newClientSocketID: string;
    
    constructor(token:string, newClientSocketID: string, expireInMS: number) { this.token = token; this.newClientSocketID = newClientSocketID; this.expireDate = new Date(Date.now() + expireInMS); }
    isValid(): boolean { return Date.now() < this.expireDate.getTime(); }
}

// The name of the cookie that will be set via POST request in the browser:
var jwtCookieName = "keeper_jwt";
var jwtCookieAvailabliltyName = "keeper_jwt_presence";

export var sockets: Array<SocketEntry> = [];

// Token distributed in "device-token-granted" socket event.
var acceptTokens: Array<AcceptTokenEntry> = [];

// Tokens that are generated by this server.
var generatedTokens: Array<TokenEntry> = [];

// Tokens that are already confirmed to be logged-in
var validatedTokens: Array<TokenEntry> = [];

// Not for production:
// Only for dev:
const correctPassword = "123";
const correctUsername = "123";

const siofu = require("socketio-file-upload");
import * as message from './message';

export function checkForPermission(socketInstance: Socket)
{
    if (socketInstance?.request?.headers?.cookie == undefined) 
    {
        socketInstance.emit(`unauthorized`, {error: `Missing cookie`});
        return false;
    }
    var authToken = cookie.parse(socketInstance?.request?.headers?.cookie)[jwtCookieName];
    if (validatedTokens.find(x => x.token == authToken) == undefined) 
    {
        socketInstance.emit(`unauthorized`, {error: `Invalid token`});
        return false;
    }
    if (!validatedTokens.find(x => x.token == authToken).isValid)
    {
        socketInstance.emit(`unauthorized`, {error: `Invalid token`});
        return false;
    }
    return true;
}

export function checkForPermissionREST(request:Request, response:Response)
{
    if (validatedTokens.find(x => x.token == request.cookies[jwtCookieName]) == undefined) 
    {
        response.status(401).json({error: `Invalid token`});
        return false;
    }
    return true;
}

export function setResponseCookie(res: Response, jwtToken: string, isSecure:boolean)
{
    // Set cookie in browser:
    return res

    .cookie(jwtCookieName, jwtToken, 
    {
        maxAge: 8.64e+7, secure: isSecure,
        sameSite: true, httpOnly: true,
    } as CookieOptions)

    // This cookie is for the client to check if jwt is presence, 
    // since the above cookie is not accessible by JS
    .cookie(jwtCookieAvailabliltyName, "true", 
    {
        maxAge: 8.64e+7, secure: isSecure,
        sameSite: true, httpOnly: false,
    });
}

export function isSocketAuthenticated(socketInstance: Socket): boolean
{
    var socketEntry = sockets.find(x => x.socket.id == socketInstance.id);
    if (socketEntry == undefined) return false;
    return socketEntry.isLoggedIn;
}

export function onNewSocketConnected(socketInstance: Socket)
{
    socketInstance.on(`authentication`, () =>
    {
        console.log(`${socketInstance.id} trying to log in.`);
        if (socketInstance?.request?.headers?.cookie == undefined) return socketInstance.emit(`unauthorized`, {error: `Missing cookie`});

        var token = cookie.parse(socketInstance.request.headers.cookie)[jwtCookieName];
            
        if (validatedTokens.find(x => x.token == token) != undefined)
        {
            sockets.find(x => x.socket.id == socketInstance.id).isLoggedIn = true;
            console.log(`socket ${socketInstance.id} logged-in.`);

            // Broadcast connect event to all other sockets
            sockets.forEach(soc => 
            {
                if (soc.socket.id == socketInstance.id) return; // Don't notify the newly joined socket itself
                soc.socket.emit(`socket connect`, { socketConnectedID: socketInstance.id }); 
            });

            // Allow file upload after successful login
            var uploader = new siofu();
            uploader.uploadValidator = (event, callback) => 
            {
                if (checkForPermission(socketInstance)) callback(true);
                else 
                { 
                    callback(false);
                    console.log(`${socketInstance.id} tried to upload file while not logged-in.`);
                }
            };
            uploader.on("saved", event => 
            {
                /* 
                    Properties of event:
                    {
                        file: 
                        {
                            name: 'scores.db',
                            mtime: 2023-06-08T10:25:23.660Z,
                            encoding: 'octet',
                            clientDetail: {},
                            meta: {},
                            id: 0,
                            size: 3177524,
                            bytesLoaded: 3177524,
                            success: true,
                            base: 'scores',
                            pathName: 'temp\\scores.db',
                            writeStream: WriteStream 
                            {
                                fd: 3,
                                path: 'temp\\scores.db',
                                flags: 'w',
                                mode: '0666',
                                start: undefined,
                                pos: undefined,
                                bytesWritten: 3177524,
                                _writableState: [WritableState],
                                _events: [Object: null prototype],
                                _eventsCount: 2,
                                _maxListeners: undefined,
                                [Symbol(kFs)]: [Object],
                                [Symbol(kIsPerformingIO)]: false,
                                [Symbol(kCapture)]: false
                            }
                        }
                    }
                */

                // Broadcast connect event to all other sockets
                var fileUploadedName = event.file.pathName.split("\\").at(-1);
                sockets.forEach(soc => 
                {
                    soc.socket.emit(`file uploaded`, 
                    { 
                        from: socketInstance.id,
                        fileName: fileUploadedName,
                        fileSize: event.file.size,
                        mtime: event.file.mtime
                    }); 
                });
                console.log(`File ${fileUploadedName} uploaded`);
                message.filesUploaded.push(new message.FileUploadedEntry(fileUploadedName, socketInstance.id));
            })
            uploader.dir = "./temp";
            uploader.listen(socketInstance);

            return socketInstance.emit(`authenticated`);
        }
        else return socketInstance.emit(`unauthorized`, {error: `Token invalid`});
    });

    socketInstance.on("disconnect", () => 
    {
        console.log(`A socket ${socketInstance.id} disconnected.`);
        sockets = sockets.filter(x => x.socket.id != socketInstance.id);

        // Broadcast disconnect event to all sockets
        sockets.forEach(soc => { soc.socket.emit(`socket disconnect`, { socketDisconnectedID: socketInstance.id }); });
    });

    // When the logged-in client accepts/scan the auth token.
    socketInstance.on("auth-device-token", (data) => 
    {
        try 
        {
            if (socketInstance?.request?.headers?.cookie == undefined) throw new Error(`The original account is not logged-in, thus cannot link new device.`);

            if (checkForPermission(socketInstance))
            {
                var jwtReceived = data.token;
                var payload = jwt.verify(jwtReceived, process.env.JWT_SECRET) as 
                {
                    clientSocketID: string,
                    clientUserAgent: string,
                    iat: number, exp: number
                };

                var acceptToken = uuidv4();
                acceptTokens.push(new AcceptTokenEntry(acceptToken, payload.clientSocketID, 60000));
                socketInstance.to(payload.clientSocketID).emit(`device-token-granted`, { token: acceptToken });
            }
        }
        catch(error) 
        {
            console.log(`Invalid JWT token received, error: ${error}.`);
        }
    });

    socketInstance.on("request-device-token", (data) => 
    {
        var jwtPayload = 
        {
            clientSocketID: socketInstance.id,
            clientUserAgent: socketInstance.request.headers['user-agent'],
            salt: uuidv4()
        };

        var jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, 
        {
            expiresIn: 60, // seconds
        });
        socketInstance.emit(`response request-device-token`, {token: jwtToken});
        // jwt.sign({});
    });
}

export function init (socketIOInstance: Socket, expressInstance: any, isRunningHTTPS: boolean)
{
    socketIOInstance.on('connection', (socket:Socket) => 
    { 
        onNewSocketConnected(socket);
        sockets.push(new SocketEntry(socket));
        console.log(`new socket ${socket.id} connected, ${sockets.length}`); 
    });

    expressInstance.post("/api/reset", (req:Request, res:Response) => 
    {
        try
        {
            res.clearCookie(jwtCookieAvailabliltyName);
            res.clearCookie(jwtCookieName);
            res.status(200).json({});
        }
        catch(error) { res.status(500).json({}); }
    });

    expressInstance.post("/api/accept-auth", (req: Request, res:Response) => 
    {
        try
        {
            var acceptToken = req.body.token;
            var corrAcceptToken = acceptTokens.find(x => x.token == acceptToken);
            if (corrAcceptToken == undefined) res.status(401).json({});
            else if (!corrAcceptToken.isValid()) res.status(401).json({}); // token expired / invalid
            else // granted
            {
                var newToken = generateToken(true); // this token can be used to access protected resources
                setResponseCookie(res, newToken, isRunningHTTPS).status(200).json({});
            }
        }
        catch(error) { res.status(500).json({}); }
    });

    expressInstance.post("/api/login/", (req:Request, res:Response) => 
    {
        var username = req.body.username;
        var password = req.body.password;

        if (username !== correctUsername || password !== correctPassword) 
        {
            res.status(401);
            res.json({});
        }
        else 
        {
            var newToken = generateToken(true);
            setResponseCookie(res, newToken, isRunningHTTPS).status(200).json({});
        }
    });

    logGreen(`Injected auth socket events.`);
}

function generateToken(isValidated:boolean=false)
{
    var newToken = uuidv4();
    generatedTokens.push(new TokenEntry(newToken, 60000));
    if (isValidated) validatedTokens.push(new TokenEntry(newToken, 60000));
    return newToken;
}