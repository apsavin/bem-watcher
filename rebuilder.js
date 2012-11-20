var fs = require('fs'),
    PATH = require('path'),
    http = require('http'),
    _ = require('underscore'),
    borschik = require('borschik').api,
    URL = require('url'),
    root = '',
    urlObject = {
        protocol: 'http',
        hostname: 'localhost'
    };

function getBemServerUrl(path) {
    var concreteUrlObject = _.clone(urlObject),
        ext = PATH.extname(path);
    if (urlObject.pathname !== 'pages' && ext) {
        concreteUrlObject.pathname = PATH.join(urlObject.pathname, (ext === '.html' ? '' : '_') + PATH.basename(urlObject.pathname) + ext);
    }
    return URL.format(concreteUrlObject);
}

function getBorschikParams(file) {
    var suffixes = getTechSuffixes(file),
        tech = suffixes[1] === 'css' ? 'css-fast' : suffixes[1];
    return {
        tech: tech,
        input: PATH.join(root, urlObject.pathname, PATH.basename(urlObject.pathname) + suffixes[0]),
        output: PATH.join(root, urlObject.pathname, '_' + PATH.basename(urlObject.pathname) + suffixes[0])
    }
}

function getTechSuffixes(path) {
    return path.match(/\.(.*)/);
}

exports.fileChangesCallback = function (path) {
    switch (getTechSuffixes(path)[0]) {
        case '.js':
        case '.css':
        case '.ie.css':
            console.log('updated ' + path);
            borschik(getBorschikParams(path));
            break;
        case '.html.php':
            break;
        case '.bemjson.js':
            path = '';
        default:
            http.get(getBemServerUrl(path)).on('error', function (err) {
                console.log(err);
            });
    }
};

exports.fileAddedCallback = function (path) {
    http.get(getBemServerUrl(path)).on('error', function (err) {
        console.log(err);
    });
};

exports.setEnv = function (opts) {
    urlObject.port = opts.port;
    urlObject.hostname = opts.host || urlObject.hostname;
    urlObject.pathname = opts.directory;
    root = opts.root;
};