/* eslint-disable prettier/prettier */
/*
/*
 * Title: Worker library
 * Desc: worker related files
 */

// dependencies
const url = require('url');

const http = require('http');
const https = require('https');
const data = require('./data');

const { parseJSON } = require('../helpers/utilities');
const { sendTwilioSms } = require('../helpers/notifications');

// const { handleReqRes } = require("./helpers/handleReqRes");

// const environment = require("./helpers/environments");

// const { sendTwilioSms } = require('./helpers/notifications');

// worker object - module scaffolding
const worker = {};

// lookup all the checks
worker.gatherAllChecks = () => {
    // get all the checks
  data.list('checks', (err1, checks) => {
    if (!err1 && checks && checks.length > 0) {
      checks.forEach((check) => {
        // read the check data
        data.read('checks', check, (err2, originalCheckData) => {
          if (!err2 && originalCheckData) {
            // pass the data to the check validator
            worker.validateCheckData(parseJSON(originalCheckData));
          } else {
            console.log('Error: reading on of the check data!');
          }
        });
      });
    } else {
      console.log('Error: Could not found any checks to process');
    }
  });
};

// Validate Individual check data
worker.validateCheckData = (originalCheckData) => {
  const originalData = originalCheckData;
  if (originalCheckData && originalCheckData.id) {
      originalData.state = typeof (originalCheckData.state) === 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down';
      originalData.lastChecked = typeof (originalCheckData.lastChecked) === 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;

      // pass to the next process
      worker.performCheck(originalData);
  } else {
    console.log('Error: Check was invalid or not properly formatted!');
  }
};

// perform check
worker.performCheck = (originalCheckData) => {
  // prepare the initial check outcome
  let checkOutCome = {
    error: false,
    responseCode: false,
  };

  // mark the outcome has not been sent yet
  let outcomeSent = false;

  // parse the hostname and full url from original data
  const parsedUrl = url.parse(`${originalCheckData.protocol}://${originalCheckData.url}`, true);
  const hostName = parsedUrl.hostname;
  const { path } = parsedUrl;

  // construct the request
  const requestDetails = {
    protocol: `${originalCheckData.protocol}:`,
    hostname: hostName,
    method: originalCheckData.method.toUpperCase(),
    path,
    timeout: originalCheckData.timeoutSeconds * 1000,
  };

  const protocolToUse = originalCheckData.protocol === 'http' ? http : https;

  const req = protocolToUse.request(requestDetails, (res) => {
    // grab the status of the response
    const status = res.statusCode;
    // console.log(status);
    // update the check out come and parse to the next process
    checkOutCome.responseCode = status;
    if (!outcomeSent) {
      worker.processCheckOutcome(originalCheckData, checkOutCome);
      outcomeSent = true;
    }
  });

  req.on('error', (e) => {
    checkOutCome = {
      error: true,
      value: e,
    };
    // update the check out come and parse to the next process
    if (!outcomeSent) {
      worker.processCheckOutcome(originalCheckData, checkOutCome);
      outcomeSent = true;
    }
  });

  req.on('timeout', (e) => {
    checkOutCome = {
      error: true,
      value: 'timeout',
    };
    // update the check out come and parse to the next process
    if (!outcomeSent) {
      worker.processCheckOutcome(originalCheckData, checkOutCome);
      outcomeSent = true;
    }
  });

  // req end
  req.end();
};

// Save Check outcome to database and send to the next process
worker.processCheckOutcome = (originalCheckData, checkOutCome) => {
  // check if the checkoutcome is up or down
  const state = !checkOutCome.error && checkOutCome.responseCode && originalCheckData.successCodes.indexOf(checkOutCome.responseCode) > -1 ? 'up' : 'down';

  // decide whether we should alert user or not
  const alertWanted = !!(originalCheckData.lastChecked && originalCheckData.state !== state);

  // update the checkdata
  const newCheckData = originalCheckData;

  newCheckData.state = state;
  newCheckData.lastChecked = Date.now();

  // update the check to disk
  data.update('checks', newCheckData.id, newCheckData, (err) => {
    if (!err) {
      if (alertWanted) {
        // send the check data to next process
        worker.alertUserToStatusChange(newCheckData);
      } else {
        console.log('Alert is not needed as there is no state change!');
      }
    } else {
        console.log('Error: trying to save check data one of the checks!');
    }
  });
};

// send notification sms to user if state changes
worker.alertUserToStatusChange = (newCheckData) => {
  const msg = `Alert: Your Check for ${newCheckData.method.toUpperCase()} ${newCheckData.protocol}://${newCheckData.url} is currently ${newCheckData.state} `;

  sendTwilioSms(newCheckData.userPhone, msg, (err) => {
    if (!err) {
      console.log(`User was alerted to a status change via SMS: ${msg}`);
    } else {
      console.log('There was a problem sending sms to one of the user!');
    }
  });
};

// Timer to execute the worker process once per minute
worker.loop = () => {
    setInterval(() => { worker.gatherAllChecks(); }, 1000 * 60 * 5);
};

// start the worker
worker.init = () => {
    // execute all the checks
    worker.gatherAllChecks();

    // call the loop so that checks continue
    worker.loop();
};

module.exports = worker;
