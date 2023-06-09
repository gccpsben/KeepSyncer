import { Socket } from "socket.io";
import { checkForPermission, checkForPermissionREST, sockets } from "./auth";
import { Request, Response } from "express";
import * as fs from 'fs';

export class FileUploadedEntry
{
    fileName: string = "";
    fromSocketID: string = "";
    constructor(fileName:string, fromSocketID: string) 
    {
        this.fileName = fileName;
        this.fromSocketID = fromSocketID;
    }
}

export var filesUploaded = [] as Array<FileUploadedEntry>;

export function init(socketIOInstance: Socket, expressInstance: any)
{
    expressInstance.get("/api/download", (req:Request, res:Response) => 
    {
        try
        {
            if (checkForPermissionREST(req,res))
            {
                var fileNameRequested = req.query["filename"].toString();
                res.download(`./${fileNameRequested}`, fileNameRequested, { root: "./temp/" });
            }
        }
        catch(error) 
        { 
            res
            .status(400)
            .json({ error:"Invalid request." }); 
        }
    });

    socketIOInstance.on("connection", (socket:Socket) => 
    {
        socket.on("message", data => 
        {
            if (checkForPermission(socket))
            {
                for (var soc of sockets)
                {
                    if (!soc.isLoggedIn) continue;
                    // Send "new message" event to all sockets except this socket.
                    soc.socket.emit("new message", {message: data.message, from: socket.id});
                }
                console.log(`${socket.id} sent ${data.message}`);
            } 
        });
    });
}