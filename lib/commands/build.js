var tasks = require('../tasks');

exports.desc = 'Build the current project';

exports.args = {
};

// export runner
exports.run = function(opts, callback) {
    tasks.run(['package'], process.cwd());
};