export enum MessageType
{
    string,
    file
}

export abstract class MessageEntry
{
    time: string;
    senderID: string = "";
    constructor(senderID: string) 
    { 
        this.senderID = senderID; 
        this.time = new Date().toISOString();
    }
}

export class StringMessageEntry implements MessageEntry
{
    time: string;
    senderID: string = "";
    message: string = "";
    type: MessageType = MessageType.string;
    constructor(senderID: string, message:string, time: string|undefined=undefined) 
    { 
        this.time = new Date().toISOString(); 
        if (time != undefined) this.time = time;
        this.senderID = senderID; 
        this.message = `wrapped_${message}_wrapped`; 
    }
}

export class FileMessageEntry implements MessageEntry
{
    time: string;
    senderID: string = "";
    fileName: string = "";
    fileSize: number = 0;
    downloadLink: string = "";
    type: MessageType = MessageType.file;
    constructor(senderID: string, fileName:string, fileSize: number, time: string|undefined=undefined) 
    { 
        this.time = new Date().toISOString(); 
        if (time != undefined) this.time = time;
        this.senderID = senderID; this.fileName = fileName; this.fileSize = fileSize; 
        this.downloadLink = `./api/download?filename=${this.fileName}`;
    }
}