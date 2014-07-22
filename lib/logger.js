var bunyan  = require('bunyan'),
    appName = require('../package.json').name;

module.exports =  bunyan.createLogger({name: appName});