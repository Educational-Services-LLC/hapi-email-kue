var kue = require('kue');

module.exports = function(options) {
    var queue     = kue.createQueue(options.kueConfig);
    var queueName = 'email';

    return {
        enqueue : function(title, emailObject) {
            return new Promise(function(resolve, reject) {
                queue.create(queueName, {
                    title       : title,
                    emailObject : emailObject
                })
                .removeOnComplete(true)
                .save(function (err) {
                    if (err) reject(err);
                    resolve();
                });
            });
        },

        process : function() {
            console.log('Starting email queue processor.');

            var synapseEmail = this;
            queue.process(queueName, function(job, done) {
                synapseEmail.send(job.data.emailObject)
                    .then(function () {
                        console.log('Successfully sent email job id ' + job.id);
                        done();
                    }, function(err) {
                        console.log('Failed to send email with job id ' + job.id);
                        done(new Error(err));
                    }).catch(function(err) {
                        console.log('Failed to send email with job id ' + job.id);
                        done(err);
                    });
            });
        },

        send : function(emailObject) {
            var driver = new require('./drivers/' + options.driver)(options.driverConfig);
            return driver.send(emailObject);
        }
    };
};
