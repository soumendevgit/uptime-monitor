/* eslint-disable no-underscore-dangle */
/* eslint-disable prettier/prettier */
/*
/**
 * Title: Check Handlers
 */

// dependencies
const data = require('../../lib/data');
const { createRandomString } = require('../../helpers/utilities');
const { parseJSON } = require('../../helpers/utilities');
const tokenHandler = require('./tokenHandler');
const { maxChecks } = require('../../helpers/environments');

const handler = {};

handler.checkHandler = (requestProperties, callback) => {
    // console.log(requestProperties);
    const acceptedMethods = ['get', 'post', 'put', 'delete'];

    if (acceptedMethods.indexOf(requestProperties.method) > -1) {
        handler._check[requestProperties.method](requestProperties, callback);
    } else {
        callback(405);
    }
};

handler._check = {};

handler._check.post = (requestProperties, callback) => {
    // validate inputs
    const rbq = requestProperties.body;

    const protocol = typeof rbq.protocol === 'string' && ['http', 'https'].indexOf(rbq.protocol) > -1 ? rbq.protocol : false;
    const url = typeof rbq.url === 'string' && rbq.url.trim().length > 0 ? rbq.url : false;
    const method = typeof rbq.method === 'string' && ['GET', 'POST', 'PUT', 'DELETE'].indexOf(rbq.method) > -1 ? rbq.method : false;
    const successCodes = typeof rbq.successCodes === 'object' && rbq.successCodes instanceof Array ? rbq.successCodes : false;
    const timeoutSeconds = typeof rbq.timeoutSeconds === 'number' && rbq.timeoutSeconds % 1 === 0 && rbq.timeoutSeconds >= 1 && rbq.timeoutSeconds <= 5 ? rbq.timeoutSeconds : false;

    if (protocol && url && method && successCodes && timeoutSeconds) {
        // verify token
        const token = typeof requestProperties.headersObject.token === 'string' && requestProperties.headersObject.token.trim().length === 20 ? requestProperties.headersObject.token : false;
        // lookup the user phone by reading the token
        data.read('tokens', token, (err1, tokenData) => {
            if (!err1 && tokenData) {
                const userPhone = parseJSON(tokenData).phone;

                data.read('users', userPhone, (err2, userData) => {
                    if (!err2 && userData) {
                        tokenHandler._token.verify(token, userPhone, (tokenIsvalid) => {
                            if (tokenIsvalid) {
                                const userObject = parseJSON(userData);
                                const userChecks = typeof (userObject.checks) === 'object' && userObject.checks instanceof Array ? userObject.checks : [];

                                if (userChecks.length < maxChecks) {
                                    const checkId = createRandomString(20);
                                    const checkObject = {
                                        id: checkId,
                                        userPhone,
                                        protocol,
                                        url,
                                        method,
                                        successCodes,
                                        timeoutSeconds,
                                    };

                                    // Save the object
                                    data.create('checks', checkId, checkObject, (err3) => {
                                        if (!err3) {
                                            // add cheak id to the user object
                                            userObject.checks = userChecks;
                                            userObject.checks.push(checkId);

                                            // save the new user data
                                            data.update('users', userPhone, userObject, (err4) => {
                                                if (!err4) {
                                                    // return the data about new check
                                                    callback(200, checkObject);
                                                } else {
                                                    callback(500, {
                                                        error: 'There was a problem in the server side',
                                                    });
                                                }
                                            });
                                        } else {
                                            callback(500, {
                                                error: 'There was a problem in the server side',
                                            });
                                        }
                                    });
                                } else {
                                    callback(401, {
                                        error: 'User Already reached max check limit',
                                    });
                                }
                            } else {
                                callback(403, {
                                    error: 'Authentication Problem',
                                });
                            }
                        });
                    } else {
                        callback(403, {
                            error: 'User not found',
                        });
                    }
                });
            } else {
                callback(403, {
                    error: 'Authentication Problem',
                });
            }
        });
    } else {
        callback(400, {
            error: 'you have a problem in your request',
        });
    }
};

handler._check.get = (requestProperties, callback) => {
    const rbq = requestProperties.queryStringObject;

    const id = typeof rbq.id === 'string' && rbq.id.trim().length === 20 ? rbq.id : false;

    if (id) {
        // lookup the token
        data.read('checks', id, (err, checkData) => {
            if (!err && checkData) {
                const token = typeof requestProperties.headersObject.token === 'string' && requestProperties.headersObject.token.trim().length === 20 ? requestProperties.headersObject.token : false;

                const { userPhone } = parseJSON(checkData);
                tokenHandler._token.verify(token, userPhone, (tokenIsvalid) => {
                    if (tokenIsvalid) {
                        callback(200, parseJSON(checkData));
                    } else {
                        callback(403, {
                            error: 'Authentication failure!',
                        });
                    }
                });
            } else {
                callback(500, { error: 'There was a problem in the server side' });
            }
        });
    } else {
        callback(400, { error: 'You have a problem in your request' });
    }
};

handler._check.put = (requestProperties, callback) => {
    const rbq = requestProperties.body;

    const id = typeof rbq.id === 'string' && rbq.id.trim().length === 20 ? rbq.id : false;

    const protocol = typeof rbq.protocol === 'string' && ['http', 'https'].indexOf(rbq.protocol) > -1 ? rbq.protocol : false;
    const url = typeof rbq.url === 'string' && rbq.url.trim().length > 0 ? rbq.url : false;
    const method = typeof rbq.method === 'string' && ['GET', 'POST', 'PUT', 'DELETE'].indexOf(rbq.method) > -1 ? rbq.method : false;
    const successCodes = typeof rbq.successCodes === 'object' && rbq.successCodes instanceof Array ? rbq.successCodes : false;
    const timeoutSeconds = typeof rbq.timeoutSeconds === 'number' && rbq.timeoutSeconds % 1 === 0 && rbq.timeoutSeconds >= 1 && rbq.timeoutSeconds <= 5 ? rbq.timeoutSeconds : false;

    if (id) {
        if (protocol || url || method || successCodes || timeoutSeconds) {
            data.read('checks', id, (err1, checkData) => {
                if (!err1) {
                    const checkObject = parseJSON(checkData);

                    const token = typeof requestProperties.headersObject.token === 'string' && requestProperties.headersObject.token.trim().length === 20 ? requestProperties.headersObject.token : false;

                    tokenHandler._token.verify(token, checkObject.userPhone, (tokenIsvalid) => {
                        if (tokenIsvalid) {
                            if (protocol) {
                                checkObject.protocol = protocol;
                            }
                            if (url) {
                                checkObject.url = url;
                            }
                            if (method) {
                                checkObject.method = method;
                            }
                            if (successCodes) {
                                checkObject.successCodes = successCodes;
                            }
                            if (timeoutSeconds) {
                                checkObject.timeoutSeconds = timeoutSeconds;
                            }

                            // store the check objects
                            data.update('checks', id, checkObject, (err2) => {
                                if (!err2) {
                                    callback(200, { message: 'Success' });
                                } else {
                                    callback(500, { error: 'There was a problem in the server side' });
                                }
                            });
                        } else {
                            callback(403, {
                                error: 'Authentication failure!',
                            });
                        }
                    });
                } else {
                    callback(500, { error: 'There was a problem in the server side' });
                }
            });
        } else {
            callback(400, { error: 'You must provide at least one field ro update' });
        }
    } else {
        callback(400, { error: 'You have a problem in your request.' });
    }
};

handler._check.delete = (requestProperties, callback) => {
    const rbq = requestProperties.queryStringObject;

    const id = typeof rbq.id === 'string' && rbq.id.trim().length === 20 ? rbq.id : false;

    if (id) {
        // lookup the token
        data.read('checks', id, (err1, checkData) => {
            if (!err1 && checkData) {
                const token = typeof requestProperties.headersObject.token === 'string' && requestProperties.headersObject.token.trim().length === 20 ? requestProperties.headersObject.token : false;

                const { userPhone } = parseJSON(checkData);
                tokenHandler._token.verify(token, userPhone, (tokenIsvalid) => {
                    if (tokenIsvalid) {
                        data.delete('checks', id, (err2) => {
                            if (!err2) {
                                data.read('users', userPhone, (err3, userData) => {
                                    const userObject = parseJSON(userData);
                                    if (!err3 && userData) {
                                        const userChecks = typeof (userObject.checks) === 'object' && userObject.checks instanceof Array ? userObject.checks : [];

                                        // remove the deleted checks id from user's list of checks
                                        const checkPosition = userChecks.indexOf(id);

                                        if (checkPosition > -1) {
                                            userChecks.splice(checkPosition, 1);

                                            // save the user data
                                            userObject.checks = userChecks;

                                            data.update('users', userPhone, userObject, (err4) => {
                                                if (!err4) {
                                                    callback(200);
                                                } else {
                                                    callback(500, { error: 'There was a problem in the server side' });
                                                }
                                            });
                                        } else {
                                            callback(500, { error: 'The Check id that you are trying to remove is not found in user' });
                                        }
                                    } else {
                                        callback(500, { error: 'There was a problem in the server side' });
                                    }
                                });
                            } else {
                                callback(500, { error: 'There was a problem in the server side' });
                            }
                        });
                    } else {
                        callback(403, {
                            error: 'Authentication failure!',
                        });
                    }
                });
            } else {
                callback(500, { error: 'There was a problem in the server side' });
            }
        });
    } else {
        callback(400, { error: 'You have a problem in your request' });
    }
};

module.exports = handler;
