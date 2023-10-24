# Room Server Manager example for brainCloud

This is an example of how you can run your own room server manager to launch your own dedicated room servers for your brainCloud application/game. 
In this example, it is assumed that you have a docker image of your server, this uses the Dockerode node.js package to create a container for your server image and run it locally.

This tool is ideal for development use, it enables the developer to have immediate access to the room server logs and to debug and test any issues with room servers more easily.

## Setup

First, you need to create a Room Server Manager type server in your apps dashboard in the brainCloud portal, then point the IP address of this room server manager to the IP of the machine that will run this Room Server Manager.

Then you must create a new lobby type which uses this room server manager.

You also need to have a Docker image of your server built, if you want to run your server through other means, there are many ways you can run and manage it through node.js

Make sure to modify the config.js file to input your brainCloud credentials, as well as the image identifier for the Docker image you want to run.

## Running

To run, simply call `node app.js` in a command prompt in the projects folder.

## Testing

To test, have your project create a lobby of the lobby type you created earlier that uses the room server manager, then start that lobby and it should connect to your Room Server Manager and request a room server.




