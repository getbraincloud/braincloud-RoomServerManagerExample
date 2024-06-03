//import { WebSocketServer } from 'ws';
require('ws').WebSocketServer;


var config = require('./config.js');
const wss = new WebSocketServer({ port: 8888});

wss.on('connection', function connection(ws) {
    ws.on('error', console.error);

    ws.on('message', function message(data, isBinary) {
        
    });

    console.log("Received websocket connection from " + ws.url);
    //send data on connection
    ws.send(`{op: 'InitS2S', data: { appId:${config.appId}, serverName:${config.serverName}, serverSecret:${config.serverSecret}}}`);
});

exports.assignLobbyToServer = function (lobbyId) {

    ws.send(`{op: 'AssignLobby', data: { lobbyId: ${lobbyId}}}`);
}

module.exports = wss;