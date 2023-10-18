"use strict";
exports.__esModule = true;
exports.init = exports.allMessages = void 0;
var auth_1 = require("./auth");
var test_1 = require("./shared/test");
exports.allMessages = [];
function init(socketIOInstance, expressInstance) {
    expressInstance.get("/api/refreshMessages", function (req, res) {
        try {
            if ((0, auth_1.checkForPermissionREST)(req, res))
                res.json(exports.allMessages);
        }
        catch (error) {
            res.status(500).json({});
        }
    });
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
    expressInstance.get("/api/view", function (req, res) {
        try {
            if ((0, auth_1.checkForPermissionREST)(req, res)) {
                var fileNameRequested = req.query["filename"].toString();
                res.sendFile("./".concat(fileNameRequested), { root: "./temp/" });
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
                var entry = new test_1.StringMessageEntry(socket.id, data.message);
                for (var _i = 0, sockets_1 = auth_1.sockets; _i < sockets_1.length; _i++) {
                    var soc = sockets_1[_i];
                    if (!soc.isLoggedIn)
                        continue;
                    // Send "new message" event to all sockets except this socket.
                    soc.socket.emit("new message", entry);
                }
                exports.allMessages.push(entry);
            }
        });
    });
}
exports.init = init;
