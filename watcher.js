var fs = require('fs'),
    PATH = require('path'),
    _ = require('underscore'),
    rebuilder = require('./rebuilder'),
    crawler = require('./crawler'),
    EventEmitter = require('events').EventEmitter,
    watchers = {};

function watch(path, listener) {
    listener = listener || new EventEmitter();
    if (watchers[path]) {
        watchers[path].close();
        delete watchers[path];
    }
    try {
        var watcher = watchers[path] = fs
            .watch(path)
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
                        rebuilder.fileAddedCallback();
                    }
                })
            });
        }
    });
}

exports.watch = function (path) {
    var filesAndDirs = crawler.findBlocksFilesAndDirs(path);
    filesAndDirs.files.forEach(watchFile);
    filesAndDirs.dirs.forEach(watchDir);
};
