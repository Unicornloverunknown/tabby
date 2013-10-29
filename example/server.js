var http = require('http');
var fs = require('fs');
var ecstatic = require('ecstatic')(__dirname + '/static');
var trumpet = require('trumpet');
var duplexer = require('duplexer');

var sub = require('level-sublevel');
var db = sub(require('level')(__dirname + '/test.db', { encoding: 'json' }));

db.batch(require('./data.json'));

var tabby = require('../')(function (page) {
    var tr = trumpet();
    return duplexer(
        tr.createStream('#content'),
        readStream('index.html').pipe(tr)
    );
});

tabby.add('/cats', {
    data: function () {
        return db.createReadStream({ start: 'pet-cat-', end: 'pet-cat-~' })
    },
    render: require('./render/cat.js')
});

tabby.add('/cats/:cat', {
    data: function (name, cb) {
        db.get('pet-cat-' + name, function (err, cat) {
            if (err) return cb(err);
            db.get(cat.value.owner, function (err, owner) {
                if (err) return cb(err);
                cat.value.owner = owner;
                cb(null, cat.value);
            });
        });
    },
    render: require('./render/cat_full.js')
});

tabby.add('/dogs', {
    data: function () {
        return db.createReadStream({ start: 'pet-dog-', end: 'pet-dog-~' })
    },
    render: require('./render/dog.js')
});

tabby.add('/parrots', {
    data: function () {
        return db.createReadStream({ start: 'pet-dog-', end: 'pet-dog-~' })
    },
    render: require('./render/dog.js')
});

var server = http.createServer(function (req, res) {
    if (tabby.test(req)) {
        tabby.handle(req, res);
    }
    else ecstatic(req, res);
});
server.listen(5000);

function readStream (p) {
    return fs.createReadStream(__dirname + '/static/' + p);
}