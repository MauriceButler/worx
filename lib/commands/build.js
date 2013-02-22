var tasks = require('../tasks'),
    out = require('out');

exports.desc = 'Build the current project';

exports.args = {
    deploy: 'Deploy the build to the device'
};

// export runner
exports.run = function(opts, callback) {
    tasks.run(['build'], process.cwd()).on('complete', function(err) {
        if (err) return out.error(err);

    });
};