var SynapseEmail = require('./src/email');
var config       = require('../../../config');

exports.register = function(server, options, next) {
    server.expose(new SynapseEmail(config('/email')));
    next();
};

exports.register.attributes = {
    name    : 'synapseEmail',
    version : '1.0.0'
};
