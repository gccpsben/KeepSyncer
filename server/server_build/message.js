"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = exports.filesUploaded = exports.FileUploadedEntry = void 0;
var auth_1 = require("./auth");
var FileUploadedEntry = /** @class */ (function () {
    function FileUploadedEntry(fileName, fromSocketID) {
        this.fileName = "";
        this.fromSocketID = "";
        this.fileName = fileName;
        this.fromSocketID = fromSocketID;
    }
    return FileUploadedEntry;
}());
exports.FileUploadedEntry = FileUploadedEntry;
exports.filesUploaded = [];
function init(socketIOInstance, expressInstance) {
    expressInstance.get("/api/download", function (req, res) {
        try {
            if ((0, auth_1.checkForPermissionREST)(req, res)) {
                var fileNameRequested = req.query["filename"].toString();
                res.download("./".concat(fileNameRequested), fileNameRequested, { root: "./temp/" });
            }
        }
        catch (error) {
            res
                .status(400)
                .json({ error: "Invalid request." });
        }
    });
    socketIOInstance.on("connection", function (socket) {
        socket.on("message", function (data) {
            if ((0, auth_1.checkForPermission)(socket)) {
                for (var _i = 0, sockets_1 = auth_1.sockets; _i < sockets_1.length; _i++) {
                    var soc = sockets_1[_i];
                    if (!soc.isLoggedIn)
                        continue;
                    // Send "new message" event to all sockets except this socket.
                    soc.socket.emit("new message", { message: data.message, from: socket.id });
                }
                console.log("".concat(socket.id, " sent ").concat(data.message));
            }
        });
    });
}
exports.init = init;
