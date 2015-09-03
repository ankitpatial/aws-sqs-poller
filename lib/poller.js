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
    this.name = options.name || '';
    this._scheduler = {
        interval: 100,
        intervalObject: null,
        emitterIntervalObject: null
    };
    this._queue = new Queue(options);
    this._messages = [];

    this._isClientWaitingForMsg = true; // flag to tell if client is out of messages and waiting for a new message to process.
    this._isPullingMessages = false; // flag to tell if receiveMessage is in progress.
}

util.inherits(Poller, EventEmitter);

module.exports = Poller;

Poller.prototype.start = function () {
    var self = this;
    self._queue
        .getQueueUrl()
        .then(function () {

            // start interval
            self._scheduler.intervalObject = setInterval(function () {
                self._receiveMessages();
            }, self._scheduler.interval);

            // emitter
            self._scheduler.emitterIntervalObject = setInterval(function () {
                self._emitMessages();
            }, self._scheduler.interval);

            self._scheduler.emitterIntervalObject.unref();

            logger.log('Started poller ' + self.name);
        })
        .catch(function (err) {
            logger.error('Unable to start poller ' + self.name, err);
        });
};

Poller.prototype.stop = function () {
    this._isClientWaitingForMsg = false;
    clearInterval(this._scheduler.intervalObject);
    clearInterval(this._scheduler.emitterIntervalObject);
    logger.log(this.name + ' Stoped');
};

Poller.prototype.next = function () {
    this._isClientWaitingForMsg = true;
};

Poller.prototype._receiveMessages = function () {
    var self = this;

    if (self._isPullingMessages || self._messages.length > 0) { // return if receiveMessage is already in flight
        return;
    }

    logger.log(self.name + ' pull new messages');

    self._isPullingMessages = true;

    self._queue
        .receiveMessage()
        .then(function (data) {
            self._isPullingMessages = false;

            if (!data || !util.isArray(data) || data.length === 0) {
                return;
            }

            data.forEach(function (msg) {
                self._messages.push(new Message(msg, self._queue));
            });

            logger.log(self.name + ' pulled ' + data.length + ' message(s)');
        })
        .catch(function (err) {
            self._isPullingMessages = false;
            logger.error(self.name + ' receiveMessage', err);
        });
};

Poller.prototype._emitMessages = function () {
    var self = this;

    if (self._isClientWaitingForMsg && self._messages && self._messages.length > 0) {
        self._isClientWaitingForMsg = false;

        var msg = self._messages.shift();// shift to make array behave like queue.

        logger.log(self.name + ' emit message ');
        self.emit('message', msg);

    }
};