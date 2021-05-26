/* eslint-disable quotes */
/* eslint-disable prettier/prettier */
/*
/*
 * Title: (Project Initial File) Uptime Monitoring Application
 * Desc: Initial file to start the node server and workers
 */

// dependencies
const server = require("./lib/server");
const worker = require("./lib/worker");

// app object - module scaffolding
const app = {};

app.init = () => {
    // start the server
    server.init();

    // start the workers
    worker.init();
};

app.init();

// export the app
module.exports = app;
