var fs = require('fs'),
    PATH = require('path'),
    _ = require('underscore'),
    DIRSMAP = require('./dirsMap.js'),
    EventEmitter = require('events').EventEmitter;

/**
 * @class Watcher
 * @extends EventEmitter
 * @constructor
 */
function Watcher () {
    EventEmitter.call(this);
    this.watchers = {};
    this._lastChangedFileDir = '';
}

Watcher.prototype = new EventEmitter();

/**
 * @param {String} path
 * @private
 */
Watcher.prototype._delWatcher = function (path) {
    if (this.watchers[path]) {
        this.watchers[path].close();
        delete this.watchers[path];
    }
};

/**
 * @param {String} path
 * @returns {FSWatcher|null}
 * @private
 */
Watcher.prototype._getWatcher = function (path) {
    if (fs.existsSync(path)) {
        this.watchers[path] = fs.watch(path);
        return this.watchers[path];
    } else {
        return null;
    }
};

/**
 * @param {String} path
 * @param {EventEmitter} [listener]
 * @returns {EventEmitter|null}
 */
Watcher.prototype.watch = function (path, listener) {
    listener = listener || new EventEmitter();
    this._delWatcher(path);
    var _this = this;
    try {
        var watcher = this._getWatcher(path);
        if (!watcher) {
            return null;
        }

        watcher.on('change', _.debounce(function () {
                    watcher.close();
                    listener.emit('change', path);
                    setTimeout(function () {
                        _this.watch(path, listener);
                    }, 1000);
                },
                500))
            .on('error', function (e) {
                console.log(e);
                listener.emit('error', e, path);
            });
    } catch (e) {
        console.log(e);
        setTimeout(function () {
            _this.watch(path, listener);
        }, 1000);
    }
    return listener;
};

/**
 * @param {String} path
 */
Watcher.prototype.watchFile = function (path) {
    var fsListener = this.watch(path);
    if (fsListener) {
        fsListener.on('change', function (path) {
            this._lastChangedFileDir = PATH.dirname(path);
            if (fs.existsSync(path)) {
                this.emit('changed', path);
            } else {
                this.emit('removed', path);
            }
        }.bind(this));
    }
};

/**
 * @param {String} path
 */
Watcher.prototype.watchDir = function (path) {
    var _this = this;
    var fsListener = this.watch(path);
    if (fsListener) {
        fsListener.on('change', function (path) {
            if (path === _this._lastChangedFileDir) {
                _this._lastChangedFileDir = '';
                return;
            }
            var dirStructure = fs.readdirSync(path),
                diff = _.difference(dirStructure, DIRSMAP.getDirStructure(path));
            DIRSMAP.setDirStructure(path, dirStructure);
            if (diff.length) {
                diff.forEach(function (fileName) {
                    var fullFileName = PATH.join(path, fileName);
                    fs.stat(fullFileName, function (e, stat) {
                        if (e) {
                            console.log(e);
                            return;
                        }
                        if (stat.isFile()) {
                            _this.watchFile(fullFileName);
                            _this.emit('added', fullFileName);
                        }
                    });

                });
            }
        });
    }
};

/**
 * @param  {String[]} files
 */
Watcher.prototype.watchFiles = function (files) {
    files.forEach(this.watchFile, this);
};

/**
 * @param  {String[]} dirs
 */
Watcher.prototype.watchDirs = function (dirs) {
    dirs.forEach(this.watchDir, this);
};


exports.Watcher = Watcher;
