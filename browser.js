var inherits = require('inherits');
var EventEmitter = require('events').EventEmitter;
var url = require('url');

var canPush = Boolean(window.history.pushState);

module.exports = Tabby;
inherits(Tabby, EventEmitter);

function Tabby (element) {
    if (!(this instanceof Tabby)) return new Tabby(element);
    var self = this;
    
    if (typeof element === 'string') {
        element = document.querySelector(element);
    }
    self.element = element;
    
    var meta = document.querySelector('meta[type=tabby-regex]');
    
    if (meta) {
        self._regex = RegExp(meta.getAttribute('value'));
        self._scan(document.body);
    }
    if (canPush) window.addEventListener('popstate', function (ev) {
        if (ev.state && ev.state.href) {
            self.show(ev.state.href, { speed: 0 });
        }
    });
}

Tabby.prototype._scan = function (elem) {
    var self = this;
    if (!self._regex) return;
    if (!canPush) return;
    
    var links = elem.querySelectorAll('a[href]');
    for (var i = 0; i < links.length; i++) (function (link) {
        var href = url.resolve(location.href, link.getAttribute('href'));
        var u = url.parse(href);
        if (location.host === u.host && self._regex.test(u.pathname)) {
            link.addEventListener('click', function (ev) {
                ev.preventDefault();
                
                if (!self.show(u.pathname)) return;
                window.history.pushState({ href: u.pathname }, '', u.pathname);
            });
        }
    })(links[i]);
};

Tabby.prototype.show = function (href, opts) {
    var self = this;
    if (!opts) opts = {};
    
    var speed = opts.speed === undefined ? 500 : opts.speed
    
    clearInterval(self._animation);
    if (speed) {
        self._animation = fadeOut(self.element, speed);
    }
    else self.element.style.opacity = 0;
    
    var prevented = false;
    self.emit('show', href, {
        preventDefault: function () { prevented: true }
    });
    if (prevented) return false;
    
    get(href + '.html', function (err, body) {
        if (err) location.href = href;
        self.element.style.opacity = 0;
        self.element.innerHTML = body;
        self._scan(self.element);
        
        clearInterval(self._animation);
        if (speed) {
            self._animation = fadeIn(self.element, speed);
        }
        else self.element.style.opacity = 1;
    });
    return true;
};

function get (href, cb) {
    var xhr = new XMLHttpRequest;
    xhr.open('GET', href, true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState !== 4) return;
        if (xhr.error) cb(xhr.error)
        else cb(null, xhr.responseText)
    };
    xhr.send();
}

function fadeOut (elem, speed) {
    var opacity = parseInt(window.getComputedStyle(elem).opacity || '1');
    
    var iv = setInterval(function () {
        opacity -= 1000 / speed / 10;
        if (opacity <= 0) opacity = 0;
        elem.style.opacity = opacity;
        if (opacity === 0) clearInterval(iv);
    }, 10);
    return iv;
}

function fadeIn (elem, speed) {
    var opacity = parseInt(window.getComputedStyle(elem).opacity || '1');
    
    var iv = setInterval(function () {
        opacity += 1000 / speed / 10;
        if (opacity >= 1) opacity = 1;
        elem.style.opacity = opacity;
        if (opacity === 1) clearInterval(iv);
    }, 10);
    return iv;
}
