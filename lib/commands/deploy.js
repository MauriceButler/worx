var tasks = require('../tasks'),
    out = require('out');

exports.desc = 'Deploy previously generated output files to the device';

exports.args = {};

// export runner
exports.run = function(opts, callback) {
    tasks.run(['deploy'], process.cwd()).on('complete', function(err) {
        if (err) return out.error(err);

    });
};