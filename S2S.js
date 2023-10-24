var https = require('https');
var config = require('./config.js');

const APP_ID = config.appId;  // Fill in the appId
const SERVER_NAME = config.serverName;
const SERVER_SECRET = config.serverSecret; // Fill in the server secret

const SERVER_SESSION_EXPIRED = 40365;

var authenticated = false;
var packetId = 0;
var sessionId = "";
var heartbeatIntervalSec = 60 * 5;
var heartbeatInternalId = null;

function s2sRequest(json, callback)
{
    var postData = JSON.stringify(json);

    console.log("[S2S SEND] " + postData);

    var options = {
        host: 'api.internal.braincloudservers.com',
        path: '/s2sdispatcher',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': postData.length
        }
    };

    var req = https.request(options, res =>
    {
        var data = '';
        
        // A chunk of data has been recieved.
        res.on('data', chunk =>
        {
            data += chunk;
        });
        
        // The whole response has been received. Print out the result.
        res.on('end', () =>
        {
            console.log("[S2S RECV] " + data);
            if (callback)
            {
                if (data)
                {
                    let dataJson = JSON.parse(data);
                    callback(dataJson);
                }
                else
                {
                    callback(null);
                }
            }
        });
    }).on("error", err =>
    {
        console.log("Error: " + err.message);
        if (callback) callback(null);
    });

    // write data to request body
    req.write(postData);
    req.end();
}

function startHeartbeat()
{
    stopHeartbeat();
    heartbeatInternalId = setInterval(() =>
    {
        request({
            service: "heartbeat",
            operation: "HEARTBEAT",
            data: null
        }, data =>
        {
            if (!(data && data.status === 200))
            {
                disconnect();
            }
        });
    }, heartbeatIntervalSec * 1000);
}

function stopHeartbeat()
{
    if (heartbeatInternalId)
    {
        clearInterval(heartbeatInternalId);
        heartbeatInternalId = null;
    }
}

function authenticate(callback)
{
    packetId = 0;

    let json = {
        packetId: packetId,
        messages: [
            {
                service: "authenticationV2",
                operation: "AUTHENTICATE",
                data: {
                    appId: APP_ID,
                    serverName: SERVER_NAME,
                    serverSecret: SERVER_SECRET
                }
            }
        ]
    };

    s2sRequest(json, data =>
    {
        if (data && data.messageResponses && data.messageResponses.length > 0 && data.messageResponses[0].status === 200)
        {
            let message = data.messageResponses[0];

            authenticated = true;
            packetId = data.packetId + 1;
            sessionId = message.data.sessionId;

            // Start heartbeat
            heartbeatIntervalSec = 60 * 30; //message.data.heartbeatSeconds;
            startHeartbeat();

            callback(message);
        }
        else
        {
            disconnect();
            callback(null);
        }
    });
}

function disconnect()
{
    stopHeartbeat();
    authenticated = false;
}

function request(json, callback)
{
    let packet = {
        packetId: packetId,
        sessionId: sessionId,
        messages: [json]
    }

    ++packetId;

    s2sRequest(packet, data =>
    {
        if (data && data.status != 200 && data.reason_code === SERVER_SESSION_EXPIRED)
        {
            disconnect();
            exports.request(json, callback); // Redo the request, it will try to authenticate again
            return;
        }

        if (callback)
        {
            callback(data.messageResponses[0]);
        }
    });
}

exports.request = function(json, callback)
{
    if (authenticated)
    {
        request(json, callback);
    }
    else
    {
        authenticate(data =>
        {
            if (data)
            {
                request(json, callback);
            }
            else if (callback)
            {
                callback(null);
            }
        })
    }
}