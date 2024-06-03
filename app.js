//import { WebSocketServer } from 'ws';

const PORT = 3000;
const hostname = "0.0.0.0";

var config = require('./config.js');
const express = require('express');
const bodyParser = require('body-parser');
const app = express ();
const Docker = require('dockerode');
const docker = new Docker();
const wss = require('ws');
var S2S = require('./S2S.js');



const wsServer = new wss.WebSocketServer({ port: 8888});
var currentConnection;

wsServer.on('connection', function connection(ws) {
    ws.on('error', console.error);

    ws.on('message', function message(data, isBinary) {
        console.log("Received message: " + data);
    });

    ws.on('close', function onClose(code, reason){
      currentConnection = null;
      console.log("websocket connection closed");
    });

    console.log("Received websocket connection");
    //send data on connection
    var initS2Scommand = `{"op": "InitS2S", "data": { "appId":"${config.appId}", "serverName":"${config.serverName}", "serverSecret":"${config.serverSecret}"}}`;
    console.log("Sending " + initS2Scommand);
    ws.send(initS2Scommand, (err, obj) => {
      console.log("ws send: " + err);
      if(obj != null){
        console.log("ws obj: " + obj);
      }
    });

    currentConnection = ws;
});

function assignLobbyToServer(lobbyId) {
  currentConnection.send(`{"op": "AssignLobby", "data": { "lobbyId": "${lobbyId}"}}`);
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

app.post("/requestRoomServer", (req,res) => {
    const payload = req.body;
    console.log('Received request for room server: ', payload);

    var port = 7777;
    if(config.debug) port = 17777;

    const result = {
        connectInfo:{
            address: "127.0.0.1",
            ports: {
              "7777/udp": port
            }
        }
    };

    if(config.debug){
      //send websocket message to assign lobbyId
      assignLobbyToServer(req.body.id);
    }else{
      startContainer(req.body.id);
    }

    res.send(result);
});

app.listen(PORT, hostname, () => {
    console.log(`Server listening on ${hostname}:${PORT}`);
});


function startContainer(lobbyId){
    docker.createContainer({
      Image: config.dockerImage,
      Env: [
        `APP_ID=${config.appId}`,
        `SERVER_NAME=${config.serverName}`,
        `SERVER_SECRET=${config.serverSecret}`,
        `LOBBY_ID=${lobbyId}`
      ],
      HostConfig: {
        PortBindings: {
            "7777/udp": [{ HostPort: "7777"}],
            "7777/tcp": [{ HostPort: "7777"}]
        }
      },
      ExposedPorts: {
        "7777/udp": {},
        "7777/tcp": {}
      }
    }, 
    function(err, container) {
      if (err) {
        console.log(err);
      } else {
        container.start(function(err, data) {
          if (err) {
            console.log(err);
          } else {
            console.log(data);
          }
        });
      }
    });
  }