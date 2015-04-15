var logger = require('./logger');

function Message(data, queue) {
    this._queue = queue;

    this.receiptHandle = data.ReceiptHandle;
    this.md5OfBody = data.MD5OfBody;

    try {
        this.data = JSON.parse(data.Body);
    } catch (e) {
        this.data = data.Body;
    }
}

module.exports = Message;

Message.prototype.remove = function () {
    var self = this;
    self._queue.deleteMessage(self.receiptHandle)
        .then(function () {
            logger.log('Removed message: ' + self.receiptHandle);
        })
        .catch(function (err) {
            logger.err('remove message' + self.receiptHandle, err);
        });
}