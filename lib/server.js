/* eslint-disable quotes */
/* eslint-disable prettier/prettier */
/*
/*
 * Title: Server library
 * Desc: Server Related file
 */

// dependencies
const http = require("http");

const { handleReqRes } = require("../helpers/handleReqRes");

const environment = require("../helpers/environments");

// server object - module scaffolding
const server = {};

// create server
server.createServer = () => {
  const createServerVariable = http.createServer(server.handleReqRes);

  createServerVariable.listen(environment.port, () => {
    console.log(`Listening to port ${environment.port}`);
  });
};

// handle Request and Response
server.handleReqRes = handleReqRes;

server.init = () => {
    server.createServer();
};

// export
module.exports = server;
