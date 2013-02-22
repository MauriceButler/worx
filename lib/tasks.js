var async = require('async'),
    fs = require('fs'),
    path = require('path'),
    mkdirp = require('mkdirp'),
    fstream = require('fstream'),
    task = require('taskify'),
    out = require('out'),
    spawn = require('child_process').spawn,
    config = require('./config'),
    _ = require('underscore'),
    commandExt = process.platform == 'win32' ? '.bat' : '',
    reIgnoreFiles = /^(\.git|node_modules|Jakefile|\.DS_Store|template|output|lib|package.json)/,
    ignoreExtensions = ['.DS_Store', '.bar', '.zip'],
    procOpts = {
        detached: true,
        stdio: 'inherit'
    },
    projectFiles = [];

// discover the nature of the project through 
task('discovery', ['prepare'], function(targetPath) {
    var reader = fstream.Reader({
            path: targetPath,
            filter: function(entry) {
                var testPath = entry.path.slice(targetPath.length + 1),
                    shouldIgnore = reIgnoreFiles.test(testPath);

                return ! (shouldIgnore || ignoreExtensions.indexOf(path.extname(entry.path)) >= 0);
            }
        });
        
    reader.on('child', function(entry) {
        if (entry.type === 'File') {
            projectFiles.push(entry.path);
        }
    });
    
    reader.on('end', this.async());
    out('!{bold}analyzing project structure');
});

task('loadConfig', function(targetPath) {
    var done = this.async();

    // load the tool config
    config.load(function(cfg) {
        // load the local config
        config.loadLocal(targetPath, function(localConfig) {
            done(null, _.extend({}, cfg, localConfig));
        });
    });
});

task('checkConfig', ['loadConfig'], function(targetPath) {
    var done = this.async(),
        cfg = this.context.results.loadConfig;

    if (! cfg.sdkpath) return done(new Error('sdkpath setting not configured, cannot continue'));

    // ensure we have the bbwp command available
    fs.exists(path.resolve(cfg.sdkpath, 'bbwp'), function(exists) {
        if (! exists) return done(new Error('Unable to find the bbwp command, ensure sdkpath configuration settings has been configured'));

        done();
    });
});

task('prepare', ['loadConfig', 'checkConfig'], function(targetPath) {
    mkdirp(path.resolve(targetPath, 'output'), this.async());
});

task('package', ['discovery', 'prepare'], function(targetPath) {
    var done = this.async(),
        cfg = _.clone(this.context.results.loadConfig),
        basePath = path.resolve(targetPath),
        relativeFiles, proc,
        targetFile = path.join('output', cfg.projectName + '.zip'),
        args = [targetFile];

    relativeFiles = projectFiles.map(function(filename) {
        return filename.slice(basePath.length + 1);
    });

    proc = spawn('zip', args.concat(relativeFiles), {
        cwd: path.resolve(targetPath)
    });

    proc.stdout.on('data', function(buffer) {
        console.log(buffer.toString());
    });
    proc.on('exit', function(code) {
        out('!{bold}zip completed with exit code: ' + code);
        done();
    });

    out('!{bold}creating archive');
});

task('build', ['package', 'prepare'], function(targetPath) {
    var cfg = _.clone(this.context.results.loadConfig),
        args = [
            path.resolve(targetPath, 'output', cfg.projectName + '.zip'),
            '-o',
            path.resolve('output')
        ];

    if (config.signingPass) {
        args = args.concat(['-g', config.signingPass]);
    }
    else {
        args.push('-d');
    }

    out('!{bold}building bar file');
    spawn(
        path.resolve(cfg.sdkpath, 'bbwp' + commandExt),
        args, 
        procOpts
    ).on('exit', this.async());
});

exports.run = task.run;