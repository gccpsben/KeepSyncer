import { Socket } from "socket.io";
import { checkForPermission, checkForPermissionREST, sockets } from "./auth";
import { Request, Response } from "express";
import { FileMessageEntry, MessageEntry, MessageType, StringMessageEntry } from './shared/test';
import * as fs from 'fs';
import * as fsp from 'fs/promises';

export var allMessages = [] as Array<MessageEntry>;

export function init(socketIOInstance: Socket, expressInstance: any)
{
    expressInstance.get("/api/refreshMessages", (req:Request, res:Response) => 
    {
        try
        {
            if (checkForPermissionREST(req,res)) res.json(allMessages);
        }
        catch(error) { res.status(500).json({}); }
    });

    expressInstance.get("/api/download", (req:Request, res:Response) => 
    {
        try
        {
            if (checkForPermissionREST(req,res))
            {
                let fileNameRequested = req.query["filename"]!.toString();
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

    expressInstance.get("/api/view", (req:Request, res:Response) => 
    {
        try
        {
            if (checkForPermissionREST(req,res))
            {
                let fileNameRequested = req.query["filename"]!.toString();
                res.sendFile(`./${fileNameRequested}` , { root: "./temp/" });
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
                var entry = new StringMessageEntry(socket.id, data.message);
                for (var soc of sockets)
                {
                    if (!soc.isLoggedIn) continue;
                    // Send "new message" event to all sockets except this socket.
                    soc.socket.emit("new message", entry);
                }
                allMessages.push(entry);
            } 
        });
    });
}