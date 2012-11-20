var fs = require('fs'),
    PATH = require('path'),
    _ = require('underscore'),
    rebuilder = require('./rebuilder'),
    crawler = require('./crawler'),
    EventEmitter = require('events').EventEmitter,
    watchers = {};

function delWatcher(path) {
    if (watchers[path]) {
        watchers[path].close();
        delete watchers[path];
    }
}

function getWatcher(path) {
    watchers[path] = fs.watch(path);
    return watchers[path];
}

function watch(path, listener) {
    listener = listener || new EventEmitter();
    delWatcher(path);
    try {
        var watcher = getWatcher(path)
            .on('change', _.debounce(function () {
                watcher.close();
                listener.emit('change', path);
                setTimeout(function () {
                    watch(path, listener);
                }, 1000);
            },
            500))
            .on('error', function (e) {
                listener.emit('error', e, path);
            });
    } catch (e) {
        setTimeout(function () {
            watch(path, listener);
        }, 1000);
    }
    return listener;
}

var lastChangedFileDir;
function watchFile(file) {
    watch(file).on('change', function (file) {
        lastChangedFileDir = PATH.dirname(file);
        rebuilder.fileChangesCallback(file);
    });
}

function watchDir(path) {
    watch(path).on('change', function (path) {
        if (path === lastChangedFileDir) {
            lastChangedFileDir = undefined;
            return;
        }
        var dirStructure = fs.readdirSync(path),
            diff = _.difference(dirStructure, crawler.getDirStructure(path));
        crawler.setDirStructure(path, dirStructure);
        if (diff.length) {
            diff.forEach(function (fileName) {
                var fullFileName = PATH.join(path, fileName);
                console.log(fullFileName);
                fs.stat(fullFileName, function (e, stat) {
                    if (e) {
                        console.log(e);
                        return;
                    }
                    if (stat.isFile()) {
                        watchFile(fullFileName);
                        rebuilder.fileAddedCallback(fullFileName);
                    }
                })
            });
        }
    });
}

function findBemjsonAndWatchIt(path, newDirStructure) {
    var dirStructure = newDirStructure || fs.readdirSync(path),
        bemjsonFile = dirStructure.filter(function (file) {
            return file.match(/bemjson\.js$/);
        })[0];
    if (bemjsonFile) {
        watchFile(PATH.join(path, bemjsonFile));
    } else {
        watch(path).on('change', function (path) {
            var newDirStructure = fs.readdirSync(path),
                diff = _.difference(newDirStructure, dirStructure);
            if (diff.length) {
                findBemjsonAndWatchIt(path, newDirStructure);
            }
        });
    }
}

exports.watch = function (opts) {
    var filesAndDirs = crawler.findBlocksFilesAndDirs(opts.root);
    filesAndDirs.files.forEach(watchFile);
    filesAndDirs.dirs.forEach(watchDir);
    findBemjsonAndWatchIt(PATH.join(opts.root, opts.directory));
};
