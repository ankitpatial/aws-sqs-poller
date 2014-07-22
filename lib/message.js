var logger = require('./logger');

function Message(data, queue) {
    this._queue         = queue;

    this.receiptHandle  = data.ReceiptHandle;
    this.md5OfBody      = data.MD5OfBody;

    try {
        this.data = JSON.parse(data.Body);
        logger.debug('json data');
    } catch (e) {
        this.data = data.Body;
        logger.debug('string data');
    }
}

module.exports = Message;

Message.prototype.remove = function () {
    var self = this;
    self._queue.deleteMessage(self.receiptHandle)
        .then(function () {
            logger.debug('Removed message');
        })
        .catch(function (err) {
            logger.err('Error on removing message: %s', err);
        });
}