var Queue           = require('aws-sqs-promises'),
    EventEmitter	= require('events').EventEmitter,
    util            = require('util'),
    logger          = require('./logger'),
    Message         = require('./message');

/***
 * Poll AWS SimpleQueue
 * Events
 *  - message
 * @param options: {name: <require>, accessKeyId: "<required>", secretAccessKey: "<required>", region: "<default: us-east-1>", apiVersion: <default: '2012-11-05', maxMessages: <default: 10>}
 * @constructor
 */
function Poller(options) {
    logger.debug('init Poller');

    options = options || {};

    this._scheduler = {
        interval                : 500,
        intervalObject          : null,
        emitterIntervalObject   : null
    };
    this._queue                     = new Queue(options);
    this._messages                  = [];

    this._triggerPollMessageCount   = 0;

    this._isClientWaitingForMsg     = false; // flag to tell if client is out of messages and waiting for a new message to process.
    this._isActive                  = false; // flag to tell if poller is started.
    this._isPullingMessages         = false; // flag to tell if receiveMessage is in progress.
}

util.inherits(Poller, EventEmitter);

module.exports = Poller;

Poller.prototype.start = function () {
    logger.debug('Start scheduler');

    var self = this;
    self._isActive              = true;
    self._isClientWaitingForMsg = true;

    // start interval
    self._scheduler.intervalObject = setInterval(function () {

        if (self._isPullingMessages) { // return if receiveMessage is already in flight
            return;
        }

        if (self._messages.length <=  self._triggerPollMessageCount) {
            logger.debug('Message list is low, receive more messages');
            self._receiveMessages();
        }

    }, self._scheduler.interval);

    self._scheduler.emitterIntervalObject = setInterval(function () {
        if (self._isClientWaitingForMsg) {
            self._emitMessages();
        }
    }, 100);

    self._scheduler.emitterIntervalObject.unref();
}

Poller.prototype.stop = function () {
    logger.debug('Stop scheduler')

    var self = this;
    self._isActive              = false;
    self._isClientWaitingForMsg = false;

    clearInterval(self._scheduler.intervalObject);
    clearInterval(self._scheduler.emitterIntervalObject);
}

Poller.prototype._receiveMessages = function () {
    var self = this;

    self._isPullingMessages = true;

    self._queue.receiveMessage()
        .then(function (data) {

            if (!data && data.length === 0) {
                return;
            }

            self._messages = self._messages.concat(data);
        })
        .fin(function() {
            self._isPullingMessages = false;
        });
}

Poller.prototype._emitMessages = function () {
    var self = this;

    if (self._isActive && self._messages && self._messages.length > 0) {

        self._isClientWaitingForMsg = false;

        var rawData     = self._messages.shift(),// shift to make array behave like queue.
            msgToEmit   = new Message(rawData, self._queue);

        self.emit('message', msgToEmit);
    } else {
        self._isClientWaitingForMsg = true;
    }
}

Poller.prototype.next = function () {
    this._emitMessages();
}
