'use strict';

var scriptName = process.pid + ' - [aws-sqs-poller]';

module.exports = {
    log: function (msg) {
        console.log(scriptName, 'INFO', msg);
    },
    error: function (msg, err) {
        console.error(scriptName, 'ERROR', msg, err ? err.stack : '');
    }
};