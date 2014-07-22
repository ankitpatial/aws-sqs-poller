var Poller = require('../lib/poller'),
    logger = require('../lib/logger'),
    options = {
        name: "img-jobs",
        accessKeyId: "AKIAJTEWTJNW25QOFYGQ",
        secretAccessKey: "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"
    };

logger.level("debug");

var poll1 = new Poller(options);

poll1.start();
poll1.on('message', function (msg) {
    logger.info('msg: %s', msg.data);
    msg.remove();
    poll1.next();
});

