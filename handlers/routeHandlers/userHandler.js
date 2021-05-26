/* eslint-disable no-underscore-dangle */
/* eslint-disable prettier/prettier */
/*
/**
 * Title: User Handlers
 */

// dependencies
const data = require('../../lib/data');
const { hash } = require('../../helpers/utilities');
const { parseJSON } = require('../../helpers/utilities');
const tokenHandler = require('./tokenHandler');

const handler = {};

handler.userHandler = (requestProperties, callback) => {
    // console.log(requestProperties);
    const acceptedMethods = ['get', 'post', 'put', 'delete'];

    if (acceptedMethods.indexOf(requestProperties.method) > -1) {
        handler._users[requestProperties.method](requestProperties, callback);
    } else {
        callback(405);
    }
};

handler._users = {};

handler._users.post = (requestProperties, callback) => {
    const rbq = requestProperties.body;

    const firstName = typeof rbq.firstName === 'string' && rbq.firstName.trim().length > 0 ? rbq.firstName : false;
    const lastName = typeof rbq.lastName === 'string' && rbq.lastName.trim().length > 0 ? rbq.lastName : false;
    const phone = typeof rbq.phone === 'string' && rbq.phone.trim().length === 10 ? rbq.phone : false;
    const password = typeof rbq.password === 'string' && rbq.password.trim().length > 8 ? rbq.password : false;
    const tosAgreement = typeof rbq.tosAgreement === 'boolean' ? rbq.tosAgreement : false;

    if (firstName && lastName && phone && password && tosAgreement) {
        // make sure that the user doesn't already exist
        data.read('users', phone, (err1) => {
            if (err1) {
                const userObject = {
                    firstName,
                    lastName,
                    phone,
                    password: hash(password),
                    tosAgreement,
                };

                // store the user to db
                data.create('users', phone, userObject, (err2) => {
                    if (!err2) {
                        callback(200, { message: 'User created successfully' });
                    } else {
                        callback(500, { error: 'Could not create user' });
                    }
                });
            } else {
                callback(500, {
                    error: 'User Already exists',
                });
            }
        });
    } else {
        callback(400, {
            error: 'you have a problem in your request',
        });
    }
};

handler._users.get = (requestProperties, callback) => {
    const rbq = requestProperties.queryStringObject;

    const phone = typeof rbq.phone === 'string' && rbq.phone.trim().length === 10 ? rbq.phone : false;

    if (phone) {
        // verify token
        const token = typeof requestProperties.headersObject.token === 'string' && requestProperties.headersObject.token.trim().length === 20 ? requestProperties.headersObject.token : false;

        tokenHandler._token.verify(token, phone, (tokenId) => {
            if (tokenId) {
                // lookup the user
                data.read('users', phone, (err, u) => {
                    const user = { ...parseJSON(u) };
                    if (!err && user) {
                        delete user.password;
                        callback(200, user);
                    } else {
                        callback(404, { error: 'Requested user was not found' });
                    }
                });
            } else {
                callback(403, { error: 'Authentication failed' });
            }
        });
    } else {
        callback(404, { error: 'Requested user was not found' });
    }
};

handler._users.put = (requestProperties, callback) => {
    const rbq = requestProperties.body;

    const firstName = typeof rbq.firstName === 'string' && rbq.firstName.trim().length > 0 ? rbq.firstName : false;
    const lastName = typeof rbq.lastName === 'string' && rbq.lastName.trim().length > 0 ? rbq.lastName : false;
    const phone = typeof rbq.phone === 'string' && rbq.phone.trim().length === 10 ? rbq.phone : false;
    const password = typeof rbq.password === 'string' && rbq.password.trim().length > 8 ? rbq.password : false;
    // const tosAgreement = typeof rbq.tosAgreement === 'boolean' ? rbq.tosAgreement : false;

    if (phone) {
        // verify token
        const token = typeof requestProperties.headersObject.token === 'string' && requestProperties.headersObject.token.trim().length === 20 ? requestProperties.headersObject.token : false;

        tokenHandler._token.verify(token, phone, (tokenId) => {
            if (tokenId) {
                // lookup the user
                if (firstName || lastName || password) {
                    // lookup the user
                    data.read('users', phone, (err1, uData) => {
                        const userData = { ...parseJSON(uData) };
                        if (!err1 && userData) {
                            if (firstName) {
                                userData.firstName = firstName;
                            }
                            if (lastName) {
                                userData.lastName = lastName;
                            }
                            if (password) {
                                userData.password = hash(password);
                            }

                            // store to database
                            data.update('users', phone, userData, (err2) => {
                                if (!err2) {
                                    callback(200, {
                                        message: 'User was updated successfully',
                                    });
                                } else {
                                    callback(500, { error: 'There is a problem in server side' });
                                }
                            });
                        } else {
                            callback(400, { error: 'You have a problem in your request.' });
                        }
                    });
                } else {
                    callback(400, { error: 'You have a problem in your request' });
                }
            } else {
                callback(403, { error: 'Authentication failed' });
            }
        });
    } else {
        callback(404, { error: 'Invalid phone number, Please try again!' });
    }
};

handler._users.delete = (requestProperties, callback) => {
    const rbq = requestProperties.queryStringObject;

    const phone = typeof rbq.phone === 'string' && rbq.phone.trim().length === 10 ? rbq.phone : false;

    if (phone) {
         // verify token
         const token = typeof requestProperties.headersObject.token === 'string' && requestProperties.headersObject.token.trim().length === 20 ? requestProperties.headersObject.token : false;

         tokenHandler._token.verify(token, phone, (tokenId) => {
             if (tokenId) {
                 // lookup the user
                data.read('users', phone, (err, u) => {
                    const user = { ...parseJSON(u) };
                    if (!err && user) {
                        data.delete('users', phone, (err2) => {
                            if (!err2) {
                                callback(500, {
                                    message: 'User deleted successfully',
                                });
                            } else {
                                callback(500, { error: 'There is a server side error!' });
                            }
                        });
                        // delete user.password;
                        // callback(200, user);
                    } else {
                        callback(404, { error: 'There is a server side error!' });
                    }
                });
             } else {
                 callback(403, { error: 'Authentication failed' });
             }
         });

        // lookup the user
    } else {
        callback(404, { error: 'There is a problem in your request' });
    }
};

module.exports = handler;
