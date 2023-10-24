const PORT = 3000;
const hostname = "0.0.0.0";

var config = require('./config.js');
const express = require('express');
const bodyParser = require('body-parser');
const app = express ();
const Docker = require('dockerode');
const docker = new Docker();
var S2S = require('./S2S.js');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true}));

app.post("/requestRoomServer", (req,res) => {
    const payload = req.body;
    console.log('Received request for room server: ', payload);

    const result = {
        connectInfo:{
            address: "127.0.0.1",
            ports: {
                '7777/tcp':9000,
                '7777/udp':9000
            }
        }
    };

    startContainer(req.body.id);

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
            "7777/udp": [{ HostPort: "9000"}],
            "7777/tcp": [{ HostPort: "9000"}]
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