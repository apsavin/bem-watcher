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
    return path.match(/\.(.*)/) || [''];
}

exports.fileChangesCallback = function (path) {
    var suffix = getTechSuffixes(path)[0];
    switch (suffix) {
        case '.js':
        case '.css':
        case '.ie.css':
            console.log('updated ' + path);
            borschik(getBorschikParams(path));
            break;
        case '':
            break;
        default:
            processPathThrowBemServer(path, suffix);
    }
};

function processPathThrowBemServer(path, suffix) {
    suffix = suffix || getTechSuffixes(path)[0];
    switch (suffix) {
        case '.html.php':
            break;
        case '.bemjson.js':
        case '.bemdecl.js':
        case '.deps.js':
            path = '';
        case '.bemhtml':
            path = path.replace(suffix, '.html');
        default:
            http.get(getBemServerUrl(path)).on('error', function (err) {
                console.log(err);
            });
    }
}

exports.fileAddedCallback = function (path) {
    processPathThrowBemServer(path);
};

exports.setEnv = function (opts) {
    urlObject.port = opts.port;
    urlObject.hostname = opts.host || urlObject.hostname;
    urlObject.pathname = opts.directory;
    root = opts.root;
};
