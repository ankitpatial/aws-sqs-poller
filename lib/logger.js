'use strict';
module.exports = {
    log: function (msg) {
        console.log('[aws-sqs-poller] ', msg);
    },
    error: function (msg, err) {
        console.error('[aws-sqs-poller] Error ', msg, err || '');
    }
};