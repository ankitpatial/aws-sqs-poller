var Poller = require('../lib/poller'),
    logger = require('../lib/logger'),
    options = {
        name: "",
        accessKeyId: "",
        secretAccessKey: ""
    };

logger.level("info");

var poll1 = new Poller(options);

poll1.start();
poll1.on('message', function (msg) {
    logger.info('msg: %s', msg.data);
    msg.remove();
    poll1.next();
});

