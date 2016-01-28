var SynapseEmail = require('./src/email');

exports.register = function(server, options, next) {
    server.expose(new SynapseEmail(options));
    next();
};

exports.register.attributes = {
    pkg : require('./package.json')
};
