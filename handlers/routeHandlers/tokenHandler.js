/* eslint-disable no-underscore-dangle */
/* eslint-disable prettier/prettier */
/*
/**
 * Title: Token Handlers
 */

// dependencies
const data = require('../../lib/data');
const { hash } = require('../../helpers/utilities');
const { createRandomString } = require('../../helpers/utilities');
const { parseJSON } = require('../../helpers/utilities');

const handler = {};

handler.tokenHandler = (requestProperties, callback) => {
    // console.log(requestProperties);
    const acceptedMethods = ['get', 'post', 'put', 'delete'];

    if (acceptedMethods.indexOf(requestProperties.method) > -1) {
        handler._token[requestProperties.method](requestProperties, callback);
    } else {
        callback(405);
    }
};

handler._token = {};

handler._token.post = (requestProperties, callback) => {
    const rbq = requestProperties.body;

    const phone = typeof rbq.phone === 'string' && rbq.phone.trim().length === 10 ? rbq.phone : false;
    const password = typeof rbq.password === 'string' && rbq.password.trim().length > 8 ? rbq.password : false;

    if (phone && password) {
        data.read('users', phone, (err1, userData) => {
            const hashedPassword = hash(password);
            const uData = { ...parseJSON(userData) };
            if (hashedPassword === uData.password) {
                const tokenId = createRandomString(20);
                const expires = Date.now() + 60 * 60 * 1000;
                const tokenObject = {
                    phone,
                    id: tokenId,
                    expires,
                };

                // store the token
                data.create('tokens', tokenId, tokenObject, (err2) => {
                    if (!err2) {
                        callback(200, tokenObject);
                    } else {
                        callback(500, {
                            error: 'There was a problem in server side!',
                        });
                    }
                });
            } else {
                callback(400, {
                    error: 'Password is not valid',
                });
            }
        });
    } else {
        callback(400, {
            error: 'You have a problem in your request',
        });
    }
};

handler._token.get = (requestProperties, callback) => {
    const rbq = requestProperties.queryStringObject;

    const id = typeof rbq.id === 'string' && rbq.id.trim().length === 20 ? rbq.id : false;

    if (id) {
        // lookup the token
        data.read('tokens', id, (err, tokenData) => {
            const token = { ...parseJSON(tokenData) };
            if (!err && token) {
                callback(200, token);
            } else {
                callback(404, { error: 'Requested token was not found' });
            }
        });
    } else {
        callback(404, { error: 'Requested token was not found' });
    }
};

handler._token.put = (requestProperties, callback) => {
    const rbq = requestProperties.body;

    const id = typeof rbq.id === 'string' && rbq.id.trim().length === 20 ? rbq.id : false;
    const extend = typeof rbq.extend === 'boolean' && rbq.extend === true ? rbq.extend : false;

    if (id && extend) {
        // lookup the token
        data.read('tokens', id, (err, tokenData) => {
            const tokenObject = { ...parseJSON(tokenData) };
            if (tokenObject.expires > Date.now()) {
                tokenObject.expires = Date.now() + 60 * 60 * 1000;

                // Store the updated token
                data.update('tokens', id, tokenObject, (err2) => {
                    if (!err2) {
                        callback(200, {
                            message: 'Token was updated successfully',
                        });
                    } else {
                        callback(500, { error: 'There was serverside error' });
                    }
                });
            } else {
                callback(400, { error: 'Token Already expired' });
            }
        });
    } else {
        callback(404, { error: 'Requested token was not found' });
    }
};
handler._token.delete = (requestProperties, callback) => {
    // Check the token if valid
    const rbq = requestProperties.queryStringObject;

    const id = typeof rbq.id === 'string' && rbq.id.trim().length === 20 ? rbq.id : false;

    if (id) {
        // lookup the user
        data.read('tokens', id, (err, tokenData) => {
            const tokenObject = { ...parseJSON(tokenData) };
            if (!err && tokenObject) {
                data.delete('tokens', id, (err2) => {
                    if (!err2) {
                        callback(500, {
                            message: 'token deleted successfully',
                        });
                    } else {
                        callback(500, { error: 'There is a server side error!' });
                    }
                });
            } else {
                callback(404, { error: 'There is a server side error!' });
            }
        });
    } else {
        callback(404, { error: 'There is a problem in your request' });
    }
};

handler._token.verify = (id, phone, callback) => {
    data.read('tokens', id, (err, tokenData) => {
        if (!err && tokenData) {
            const tokenDetails = { ...parseJSON(tokenData) };
            if (tokenDetails.phone === phone && tokenDetails.expires > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
};

module.exports = handler;
