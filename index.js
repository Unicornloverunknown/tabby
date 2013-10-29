var quotemeta = require('quotemeta');

module.exports = Tabby;

function Tabby () {
    if (!(this instanceof Tabby)) return new Tabby;
    this._routes = [];
    this._groups = [];
    this._regexp = { test: function () { return false } };
}

Tabby.prototype._recreateRegexp = function () {
    var self = this;
    self._groups = [];
    var parts = self._routes.map(function (r) {
        var groups = [];
        var pattern = ('(' + quotemeta(r.pattern) + ')')
            .replace(/\\:([\w-]+)/g, function (_, x) {
                groups.push(x);
                return '([\\w-]+)';
            })
        ;
        self._groups.push({
            route: r,
            groups: groups
        });
        
        return pattern;
    });
    self._regexp = RegExp('^(?:' + parts.join('|') + ')(?:[/?]|$)');
};

Tabby.prototype.add = function (pattern, params) {
    if (pattern && typeof pattern === 'object') {
        params = pattern;
    }
    else {
        params.pattern = pattern;
    }
    
    for (var i = 0; i < this._routes.length; i++) {
        if (this._routes[i].pattern.length < params.pattern.length) {
            this._routes.splice(i, 0, params);
            break;
        }
    }
    if (i === this._routes.length) this._routes.push(params);
    
    this._recreateRegexp();
};

Tabby.prototype.test = function (req) {
    if (req && typeof req === 'object') {
        if (req.method !== 'GET') return false;
        return this._regexp.test(req.url);
    }
    return this._regexp.test(req);
};

Tabby.prototype.handle = function (req, res) {
    var m = this._regexp.exec(req.url);
    var vars = {};
    var route;
    
    for (var i = 0, j = 1; i < this._groups.length; i++) {
        var g = this._groups[i];
        if (m[j] !== undefined) {
            route = g.route;
            for (var k = 0; k < g.groups.length; k++) {
                vars[g.groups[k]] = m[j + k + 1];
            }
            break;
        }
        j += 1 + g.groups.length;
    }
    if (!route) {
        res.statusCode = 404;
        res.end('not found\n');
        return;
    }
    console.log(route, vars);
    
    res.end('TODO!\n');
};