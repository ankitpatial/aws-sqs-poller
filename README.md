aws-sqs-poller
==============

A simple sqs message poller.

### What it does ?
It provides the functionality to call receiveMessage() on AWS::SQS after short interval of time and put them in internal 
messages list and emit them one by one, when internal messages list is empty it pulls messages again from SQS and so on. 
Idea is to pull next messages batch only when we are done processing the previous one. This can help scaling certain areas of your app
that are using same message queue.

### Events
    - message
 
### Sample Code
```
var Poller  = require('aws-sqs-poller'),
    options = {
        name            : "your-queue",             // required
        useIAMRole      : true                      // optional
        accessKeyId     : 'aws-key',                // required if useIAMRole = false 
        secretAccessKey : 'aws-secret-access-key',  // required if useIAMRole = false
        region          : 'us-west-1',              // optional, default is 'us-east-1'
        maxMessages     : 4,                        // optional, default is 10, must be between 1-10 
    };

var myQueue = new Poller(options);

myQueue.start();                        // calling this will start the poller
myQueue.on('message', function (msg) {  // will emitted on first message or on calling mqQueue.next()
    
    console.log('handle: ', msg.receiptHandle);
    console.log('data: ', msg.body); // internally will try parese it as JSON
    console.log('md5: ', msg.md5OfBody); 
    
    /*
    * Your business logix
    */
      
    // Want to delete message from SQS.
    msg.remove();
                           
    // Move to next message
    myQueue.next();                     
});

```

### Change List
#### 0.2.0
- Bumped version. Added log process.pid as log prefix
#### 0.1.8 - 0.1.12
- code refactoring
#### 0.1.7
- log message change
#### 0.1.6
- bug fix
#### 0.1.4
- bug fix, unable to pull message in some cases.
#### 0.1.0
- not to start poller if there is problem talking to Queue.
#### 0.0.9
- README changes
#### 0.0.8
- new option.useIAMRole for production use
- Upgrade packages
- Removed incomplete test cases and unwanted packages, package is much leaner now