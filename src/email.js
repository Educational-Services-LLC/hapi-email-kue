'use strict';

const Kue = require('kue');

module.exports = function (options) {

    let queue;
    const queueName = 'email';

    queue = Kue.createQueue(options.kueConfig);
    queue.on('error', function (err) {
        console.error(err);
    });

    return {
        enqueue : function (title, emailObject) {

            return new Promise((resolve, reject) => {

                queue.create(queueName, {
                    title       : title,
                    emailObject : emailObject
                })
                .removeOnComplete(true)
                .save((err) => {

                    if (err) {
                        reject(err);
                    }
                    resolve();
                });
            });
        },

        process : function () {

            console.log('Starting email queue processor.');

            queue.process(queueName, (job, done) => {

                this.send(job.data.emailObject)
                    .then(() => {

                        console.log('Successfully sent email job id ' + job.id);
                        done();
                    }, (err) => {

                        console.log('Failed to send email with job id ' + job.id);
                        console.log(err);
                        done(new Error(err));
                    }).catch((err) => {

                        console.log('Failed to send email with job id ' + job.id);
                        console.log(err.message);
                        done(err);
                    });
            });
        },

        send: function (emailObject) {

            const driver = require('./drivers/' + options.driver)(options.driverConfig);
            return driver.send(emailObject);
        }
    };
};
