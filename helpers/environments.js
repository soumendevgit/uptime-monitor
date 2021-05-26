/* eslint-disable no-multi-spaces */
/* eslint-disable prettier/prettier */
/*
 * Title: Environments
 * Description: Handle all environment related things
 * Author: Sumit Saha ( Learn with Sumit )
 * Date: 11/20/2020
 *
 */

// dependencies

// module scaffolding
const environments = {};

// staging environment
environments.staging = {
    port: 3000,
    envName: 'staging',
    secretkey: 'djfheyiuyeuhdjfhuifyf',
    maxChecks: 5,
    twilio: {
        fromPhone: '+12408337759',
        accountSid: 'AC5fbf0e107c232e1b07891192d5b0695b',
        authToken: 'e591645afc283b3173f8d6ce8eb57d5b',
    },
};

// production environment
environments.production = {
    port: 5000,
    envName: 'production',
    secretkey: 'fdfd4f5454fdsdfsdfery',
    maxChecks: 5,
    twilio: {
        fromPhone: '+12408337759',
        accountSid: 'AC5fbf0e107c232e1b07891192d5b0695b',
        authToken: 'e591645afc283b3173f8d6ce8eb57d5b',
    },
};

// determine which environment was passed
const currentEnvironment =    typeof process.env.NODE_ENV === 'string' ? process.env.NODE_ENV : 'staging';

// export corresponding environment object
const environmentToExport =    typeof environments[currentEnvironment] === 'object'
        ? environments[currentEnvironment]
        : environments.staging;

// export module
module.exports = environmentToExport;
