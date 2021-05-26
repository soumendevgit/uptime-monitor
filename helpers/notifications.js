/* eslint-disable no-plusplus */
/* eslint-disable no-multi-spaces */
/* eslint-disable prettier/prettier */
/*
 * Title: Notification
 * Description: Important function to notify users
 * Author: Sumit Saha ( Learn with Sumit )
 * Date: 11/20/2020
 *
 */

// dependencies
const https = require('https');
const querystring = require('querystring');
const { twilio } = require('./environments');
// module scaffolding
const notifications = {};

// send sms to user using twilio api
notifications.sendTwilioSms = (phone, msg, callback) => {
    const userPhone = typeof (phone) === 'string' && phone.trim().length === 10 ? phone.trim() : false;
    const userMsg = typeof (msg) === 'string' && msg.trim().length > 0 && msg.trim().length <= 1600  ? msg.trim() : false;

    if (userPhone && userMsg) {
        // configure the request payload
        const  payload = {
            From: twilio.fromPhone,
            To: `+91${userPhone}`,
            Body: userMsg,
        };

        // stringify the payload
        const stringifyPayload = querystring.stringify(payload);

        // configure the request details
        const requestDetails = {
            hostname: 'api.twilio.com',
            method: 'POST',
            path: `/2010-04-01/Accounts/${twilio.accountSid}/Messages.json`,
            auth: `${twilio.accountSid}:${twilio.authToken}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        };

        // Instantiate the request object
        const req = https.request(requestDetails, (res) => {
            const status = res.statusCode;

            // callback successfully if the request went through
            if (status === 200 || status === 201) {
                callback(false);
            } else {
                // const responseString = querystring.stringify(res);
                callback(`Status code returned was ${status}`);
            }
        });

        req.on('error', (e) => {
            callback(e);
        });

        req.write(stringifyPayload);
        req.end();
    } else {
        callback('Given parameters were missing or invalid');
    }
};

// export module
module.exports = notifications;
