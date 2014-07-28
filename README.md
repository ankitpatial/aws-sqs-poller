aws-sqs-poller
==============

A simple sqs message poller.

### What it does ?
It provides the functionality to call receiveMessage() on aws.sqs after short interval of time and put then in internal 
messages list and emit them one by one, when internal messages list is empty it pulls messages again and so on, 
Idea is to pull message only if we are done processing the already pulled messages. This can help in distributed apps where 
we don't to pull more message than app can process at a time.

### Events
    - message
 
### Sample Code
```
var Poller  = require('aws-sqs-poller'),
    options = {
        name            : "your-queue",
        accessKeyId     : "your-key",
        secretAccessKey : "your-secret"
    };

var myQueue = new Poller(options);

myQueue.start();                        // calling this will start the poller
myQueue.on('message', function (msg) {  // will emitted on first message or on calling mqQueue.next()
    
    /*
    * Your business logix
    */
   
    
    msg.remove();                       // in case you want to remove the current message from queue.
    myQueue.next();                     // move to next message
});

```