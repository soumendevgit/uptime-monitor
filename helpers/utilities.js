/* eslint-disable no-plusplus */
/* eslint-disable no-multi-spaces */
/* eslint-disable prettier/prettier */
/*
 * Title: Utilities
 * Description: Handle all utility related things
 * Author: Sumit Saha ( Learn with Sumit )
 * Date: 11/20/2020
 *
 */

// dependencies
const crypto = require('crypto');
const environments = require('./environments');
// module scaffolding
const utilities = {};

// parse JSON string to object
utilities.parseJSON = (jsonString) => {
    let output;
    try {
        output = JSON.parse(jsonString);
    } catch (error) {
        output = {};
    }

    return output;
};

// hash string
utilities.hash = (str) => {
    if (typeof (str) === 'string' && str.length > 0) {
        const hash = crypto.createHmac('sha256', environments.secretkey).update(str).digest('hex');
        return hash;
    }
        return false;
};

// Create random String
utilities.createRandomString = (strlength) => {
    let length = strlength;

    length = typeof (strlength) === 'number' && strlength > 0 ? strlength : false;

    if (length) {
        const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz123456789';
        let output = '';
        for (let i = 0; i < length; i++) {
            const  randomCharacter = possibleCharacters.charAt(
                Math.floor(Math.random() * possibleCharacters.length),
            );
            output += randomCharacter;
        }

    return output;
    }
        return false;
};

// export module
module.exports = utilities;
