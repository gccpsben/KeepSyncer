"use strict";
exports.__esModule = true;
exports.FileMessageEntry = exports.StringMessageEntry = exports.MessageEntry = exports.MessageType = void 0;
var MessageType;
(function (MessageType) {
    MessageType[MessageType["string"] = 0] = "string";
    MessageType[MessageType["file"] = 1] = "file";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
var MessageEntry = /** @class */ (function () {
    function MessageEntry(senderID) {
        this.senderID = "";
        this.senderID = senderID;
        this.time = new Date().toISOString();
    }
    return MessageEntry;
}());
exports.MessageEntry = MessageEntry;
var StringMessageEntry = /** @class */ (function () {
    function StringMessageEntry(senderID, message, time) {
        if (time === void 0) { time = undefined; }
        this.senderID = "";
        this.message = "";
        this.type = MessageType.string;
        this.time = new Date().toISOString();
        if (time != undefined)
            this.time = time;
        this.senderID = senderID;
        this.message = message;
    }
    return StringMessageEntry;
}());
exports.StringMessageEntry = StringMessageEntry;
var FileMessageEntry = /** @class */ (function () {
    function FileMessageEntry(senderID, fileName, fileSize, time) {
        if (time === void 0) { time = undefined; }
        this.senderID = "";
        this.fileName = "";
        this.fileSize = 0;
        this.downloadLink = "";
        this.viewLink = "";
        this.type = MessageType.file;
        this.time = new Date().toISOString();
        if (time != undefined)
            this.time = time;
        this.senderID = senderID;
        this.fileName = fileName;
        this.fileSize = fileSize;
        this.downloadLink = "./api/download?filename=".concat(this.fileName);
        this.viewLink = "./api/view?filename=".concat(this.fileName);
    }
    return FileMessageEntry;
}());
exports.FileMessageEntry = FileMessageEntry;
