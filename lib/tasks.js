var async = require('async'),
    debug = require('debug')('worx'),
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
    requiredSettings = ['sdkpath'],
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
    debug('loading the config');
    config.load(function(cfg) {
        // load the local config
        config.loadLocal(targetPath, function(localConfig) {
            var finalConfig = _.extend({}, cfg, localConfig);

            // initialise the toolsPath
            finalConfig.toolsPath = path.resolve(finalConfig.sdkpath, 'dependencies', 'tools', 'bin');

            // send the results into the taskify context
            done(null, finalConfig);
        });
    });
});

task('checkConfig', ['loadConfig'], function(targetPath) {
    var done = this.async(),
        cfg = this.context.results.loadConfig,
        missingSettings = requiredSettings.filter(function(setting) {
            return typeof cfg[setting] == 'undefined';
        });

    // if we have missing settings, then abort
    if (missingSettings.length > 0) {
        return done(new Error('Missing settings: "' + missingSettings.join(', ') + '" please update worx configuration'));
    }

    // ensure we have the bbwp command available
    debug('checking bbwp exists within sdk path: ' + cfg.sdkpath);
    fs.exists(path.resolve(cfg.sdkpath, 'bbwp'), function(exists) {
        if (! exists) return done(new Error('Unable to find the bbwp command, ensure sdkpath configuration settings has been configured'));

        done();
    });
});

task('prepare', ['loadConfig', 'checkConfig'], function(targetPath) {
    var outputPath = path.resolve(targetPath, 'output');

    debug('preparing, creating output path: ' + outputPath);
    mkdirp(outputPath, this.async());
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

task('build', ['package', 'prepare'], function(targetPath, opts) {
    var cfg = _.clone(this.context.results.loadConfig),
        args = [
            path.resolve(targetPath, 'output', cfg.projectName + '.zip'),
            '-o',
            path.resolve('output')
        ];

    if (opts.signingPass) {
        args = args.concat(['-g', opts.signingPass]);
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

task('deploy', ['prepare'], function(targetPath, opts) {
    var cfg = this.context.results.loadConfig,
        barFile = path.resolve(targetPath, 'output', 'device', cfg.projectName + '.bar')

    out('!{bold}pushing to the device');
    blackberryDeploy(this, targetPath, opts, ['-installApp'], [barFile]);
});

task('install-debugtoken', ['prepare'], function(targetPath, opts) {
    var tokenFile = opts.argv.remain[0];

    // if we have no token file raise an exception
    if (! tokenFile) throw new Error('token file required');

    out('!{bold}installing debug token to device');
    blackberryDeploy(this, targetPath, opts, ['-installDebugToken', tokenFile]);
});

/* internal helpers */

function blackberryDeploy(task, targetPath, opts, args, endArgs) {
    var cfg = task.context.results.loadConfig,
        done = task.async(),
        deviceCfg,
        args, 
        proc;

    // ensure we have opts
    opts = opts || {};

    // use 'default' if the device name is not specified
    deviceName = opts.device || 'default';

    // check that we have a device configuration
    deviceCfg = cfg.devices[deviceName];
    debug('using device configuration: ' + deviceName, deviceCfg);

    // if we have no device config then error out
    if (! deviceCfg) return done(new Error('Device configuration not found for "' + deviceName + '", use the register-device command to supply details'));

    args = args.concat([
        '-device',
        deviceCfg.ip,
        '-password',
        deviceCfg.password
    ]).concat(endArgs || []);
    
    // console.log(args);
    // console.log(targetPath, cfg.toolsPath);

    // start the deploy process    
    proc = spawn(path.resolve(cfg.toolsPath, 'blackberry-deploy' + commandExt), args, procOpts);
    
    proc.on('exit', done);
}

exports.run = task.run;