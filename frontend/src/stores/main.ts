import axios from 'axios';
import { defineStore } from 'pinia'
import { io, type Socket } from 'socket.io-client';
import { useRouter } from 'vue-router';
import { FileMessageEntry, MessageEntry, MessageType, StringMessageEntry } from '../shared/test';

export declare class SocketIOFileUpload
{
    constructor(socket:any)
    listenOnInput(socket:any):any
}

export const useMainStore = defineStore(
{
    id: 'mainStore',
    state: () =>
    {
        var data = 
        {
            socketClient: undefined as Socket | undefined,
            socketConnected: false,
            socketLoggedIn: false,
            socketID: undefined as string | undefined,
            authToken: undefined as string | undefined,
            authTokenExpireDate: undefined as Date | undefined,
            authTokenCreationDate: undefined as Date | undefined,
            router: useRouter(),
            messages: [] as Array<StringMessageEntry|FileMessageEntry>
        };
        return data;
    },
    actions:
    {
        async login(username:string, password:string)
        {
            try
            {
                await axios.post("/api/login", { username: username, password:password });
                return true;
            }
            catch(error:any)
            {
                console.log(`Login failed with code=${error.response.status}`);
                return false;
            }
        },
        async connectSocket()
        {
            return new Promise<void>((resolve, reject) => 
            {
                var self = this;

                // disconnect previous socket (if any)
                if (self.socketClient) self.socketClient.disconnect();

                self.socketLoggedIn = false;
                self.socketClient = io();
                self.socketClient.on('connect', () => 
                {
                    if (self.socketClient == undefined) return;
                    self.socketConnected = true;
                    self.socketID = self.socketClient.id;

                    self.socketClient.on('authenticated', () => 
                    {
                        self.socketLoggedIn = true; 
                        self.authTokenCreationDate = undefined;
                        self.authTokenExpireDate = undefined;
                        self.authToken = undefined;
                        self.router.push("/home");
                    });

                    self.socketClient.on(`unauthorized`, async data => 
                    { 
                        await axios.post("/api/reset");
                        console.error(`Unable to authenticate, reason: ${JSON.stringify(data)}`); 
                        self.router.push("./auth");
                    });

                    self.socketClient.on('response request-device-token', function(data) 
                    {
                        try
                        {
                            self.authToken = data.token;
                            var jwtPayload = JSON.parse(atob(data.token.split(".")[1]));
                            self.authTokenExpireDate = new Date(Number.parseFloat(jwtPayload["exp"]) * 1000);
                            self.authTokenCreationDate = new Date(Number.parseFloat(jwtPayload["iat"]) * 1000);
                            console.log(`Token received: ${data.token}`);
                        }
                        catch(error) { alert(`Invalid JWT token received.`); }
                    });

                    self.socketClient.on('device-token-granted', async (data) =>
                    {
                        var acceptToken = data.token;
                        alert("Linkage granted");
                        await axios.post("/api/accept-auth", {token: acceptToken});
                        self.socketLoggedIn = true; 
                        self.authTokenCreationDate = undefined;
                        self.authTokenExpireDate = undefined;
                        self.authToken = undefined;
                        await this.authenticateSocket();
                        self.router.push("/home");
                    });

                    self.socketClient.on("new message", data => 
                    {
                        self.messages.push(new StringMessageEntry(data.senderID, data.message, data.time));
                    });

                    self.socketClient.on("file uploaded", data => 
                    {
                        var messageEntry = new FileMessageEntry(data.senderID, data.fileName, data.fileSize, data.time);
                        self.messages.push(messageEntry);
                    });
                    
                    resolve();
                });
            });
        },
        async authenticateSocket()
        {
            if (this.socketClient == undefined) console.warn(`SocketClient is undefined while trying to authenticateSocket().`);
            else 
            { 
                // Since newly-created httponly cookies will NOT be sent in the current socket, disconnect the current socket
                // and open a new socket, so that the newly received cookies can be sent along with the events.
                this.socketClient?.disconnect();
                await this.connectSocket();
                this.socketClient.emit('authentication', {}); 
            }
        },
        requestQRCode()
        {
            if (this.socketClient == undefined) console.warn(`QRCode requested in socket but socket is not connected.`);
            else this.socketClient.emit("request-device-token");
        },
        enableFileUpload()
        {
            var uploader = new SocketIOFileUpload(this.socketClient);
            var inputElement = document.getElementById("siofu_input");
            if (inputElement == undefined) console.warn("There's no siofu_input element.");
            else 
            {
                uploader.listenOnInput(document.getElementById("siofu_input"));
                console.log("File input ready");
            }
        }
    }
})
