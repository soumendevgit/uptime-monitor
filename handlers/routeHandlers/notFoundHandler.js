/*
/**
 * Title: Not Found Handlers
 */

const handler = {};

handler.notFoundHandler = (requestProperties, callback) => {
    console.log('Not Found');

    callback(404, {
        message: 'Your requested URL was not found!',
    });
};

module.exports = handler;
