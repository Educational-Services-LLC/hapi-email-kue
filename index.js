'use strict';

const SynapseEmail = require('./src/email');

exports.name = 'hapi-email-kue';

exports.register = function (server, options) {
    server.expose(new SynapseEmail(options));
};

exports.register.attributes = {
    pkg : require('./package.json')
};

exports.process = function (options) {

    new SynapseEmail(options).process();
};
