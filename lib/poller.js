'use strict';

var Queue = require('aws-sqs-promises'),
    EventEmitter = require('events').EventEmitter,
    util = require('util'),
    logger = require('./logger'),
    Message = require('./message');

/***
 * Poll AWS SimpleQueue
 * Events
 *  - message
 * @param options : {
 * name: <require>,
 * useIAMRole: <optional>
 * accessKeyId: "<required if useIAMRole = false>",
 * secretAccessKey: "<required if useIAMRole = false>",
 * region: "<default: us-east-1>",
 * apiVersion: <default: '2012-11-05',
 * maxMessages: <default: 10>>}
 * @constructor
 * @constructor
 */
function Poller(options) {

    options = options || {};

    this._scheduler = {
        interval: 100,
        intervalObject: null,
        emitterIntervalObject: null
    };
    this._queue = new Queue(options);
    this._messages = [];

    this._triggerPollMessageCount = 0;

    this._isClientWaitingForMsg = false; // flag to tell if client is out of messages and waiting for a new message to process.
    this._isActive = false; // flag to tell if poller is started.
    this._isPullingMessages = false; // flag to tell if receiveMessage is in progress.
}

util.inherits(Poller, EventEmitter);

module.exports = Poller;

Poller.prototype.start = function () {
    var self = this;

    self._queue
        .getQueueUrl()
        .then(function (queueUrl) {
            self._isActive = true;
            self._isClientWaitingForMsg = true;

            // start interval
            self._scheduler.intervalObject = setInterval(function () {

                if (self._isPullingMessages) { // return if receiveMessage is already in flight
                    return;
                }

                if (self._messages.length <= self._triggerPollMessageCount) {
                    logger.log('Fetching messages');
                    self._receiveMessages();
                }

            }, self._scheduler.interval);

            self._scheduler.emitterIntervalObject = setInterval(function () {
                if (self._isClientWaitingForMsg) {
                    self._emitMessages();
                }
            }, 100);

            self._scheduler.emitterIntervalObject.unref();

            logger.log('Started poller: ', queueUrl);
        })
        .catch(function (err) {
            logger.error('Unable to start poller', err);
        });


};

Poller.prototype.stop = function () {

    var self = this;
    self._isActive = false;
    self._isClientWaitingForMsg = false;

    clearInterval(self._scheduler.intervalObject);
    clearInterval(self._scheduler.emitterIntervalObject);

    logger.log('Stoped');
};

Poller.prototype.next = function () {
    this._emitMessages();
};

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
        .fin(function () {
            self._isPullingMessages = false;
        });
};

Poller.prototype._emitMessages = function () {
    var self = this;

    if (self._isActive && self._messages && self._messages.length > 0) {

        self._isClientWaitingForMsg = false;

        var rawData = self._messages.shift(),// shift to make array behave like queue.
            msgToEmit = new Message(rawData, self._queue);

        self.emit('message', msgToEmit);
    } else {
        self._isClientWaitingForMsg = true;
    }
};


