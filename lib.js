/*!
 * ShangHai rigelCRM global javascript
 * Copyright 2012 Baidu Inc. All rights reserved.
 *
 * path:    rigel.js
 * desc:    新代理商前端框架
 * author:  nqliujiangtao@gmail.com
 * date:    $Date$
 */
var define, require;

;(function (exports) {
    
    var depended = {}, //模块文件路径对应关系
        needpaths = [], //当前需要加载的文件队列
        callbacks = [], //需要执行的回调函数队列
        loading = false, //当前是否正在加载文件
        rootPath = "./",
        loadedpackages = []; //已加载完成的文件队列
    /**
     * @private
     *
     * Through the package name defines this package for JS path
     * @param {string} packages the packages name.
     */
    var __getScriptPath = function(packages) {
        var path = null;
        if (path = depended[packages]) {
            return path;
        }
        return exports.router(packages); //router it.
    };

    /**
     * @public
     *
     * router the package to real .js path
     * router modules to url
     */
    exports.router = function(packages) {
        // packages = packages.split(":"); //portal:index/menuModule
        var url = rootPath + packages.replace(/:/, "/") + ".js";
        return url;
    }

    /**
     * @private
     *
     * Parsing module definition in the dependence
     * Search in the define function for implementation dependent modules
     */
    function __getDependency(code) {
        var pattern = /\brequire\s*\(\s*['"]?([^'")]*)/g;
        var ret = [],
            match;
        while ((match = pattern.exec(code))) {
            if (match[1]) {
                ret.push(match[1]);
            }
        }
        return ret;
    }

    /**
     * 加载script脚本
     * 通过在head中插入script标签的形式加载脚本文件
     *
     * @private
     */
    function __loadScript() {
        var path, callback, key;
        if (0 == needpaths.length) {
            while (callback = callbacks.pop()) {
                var apply = [];
                while (key = callback.name.shift()) {
                    apply.push(__getModule(key));
                }
                callback.fn.apply(null, apply);
            }
            return null;
        }
        path = needpaths.shift();
        loading = true;
        __getScript(path, __loadScript);
    };

    /**
     * load package
     *
     * @private
     * @param {Array} packages models Array
     * @param {Function} callback the callback After loaded
     */
    function __loadPackage(packages, callback) {
        var i, item, paths = [],
            path;

        for (i = 0; item = packages[i]; i++) {
            if (loadedpackages.indexOf(item) > -1) continue;
            path = __getScriptPath(item);
            paths.push(path);
        }
        var __loadScripts = function(paths, callback) {
            var path, i;

            // Check whether need to load the file loaded or in the queue.
            for (i = 0; path = paths[i]; i++) {
                if (needpaths.indexOf(path) == -1) {
                    needpaths.push(path);
                }
            }
            callbacks.push({
                fn: callback,
                name: packages
            });
            if (!loading) {
                __loadScript();
            }
        };
        __loadScripts(paths, callback);
    };

    /**
     * @private
     *
     * get Module
     * named by |packages|.
     */
    function __getModule(packages) {
        var levels = packages.split('/'),
            reference = window,
            i = 0;
        while (i < levels.length) {
            reference = reference[levels[i++]];
            if (!reference) {
                break;
            }
        };
        return reference;
    };

    /**
     * @public non-blocking script loader
     * @param {string}
     * @param {!Function} callback callback function
     */
    function __getScript(src, callback) {
        var el = document.createElement('script');
        var head = document.getElementsByTagName('head')[0];
        el.type = 'text/javascript';
        el.async = 'async';
        //for firefox3.6
        el.charset = 'utf-8';

        el.onload = el.onreadystatechange = function(event, isAbort) {
            if (isAbort || !el.readyState || /loaded|complete/.test(el.readyState)) {
                el.parentNode && head.removeChild(el);
                callback && callback.call(this);
            }
        };
        el.src = src;
        head.insertBefore(el, head.firstChild);
    };
    /**
     * Calls |fun| and adds all the fields of the returned object to the object
     * named by |packages|.
     * @param {string} packages The name of the object that we are adding fields to.
     * @param {!Function} fun The function that will return an object containing
     *     the names and values of the new fields.
     */
    exports.define = function(packages, deps, define) {
        var temporary = {}, key, toString = Object.prototype.toString;
        if ("undefined" == typeof define && toString.call(deps) != "[object Array]") {
            return exports.define(packages, [], deps);
        }
        var levels = packages.split('/'),
            i, item, ref = window,
            depends;

        for (i = 0; item = levels[i]; i++) {
            if (!ref[item]) {
                ref[item] = {};
            }
            ref = ref[item];
        };
        loadedpackages.push(packages);
        if (define) {
            depends = __getDependency(define.toString());
            if (depends.length > 0 || deps.length > 0) {
                __loadPackage(depends.concat(deps), function() {
                    var args = [ref];
                    while (key = deps.shift()) {
                        args.push(__getModule(key));
                    }
                    define.apply(null, args);
                });
            } else {
                define.call(null, ref);
            }
        } else if (define) {
            define.call(null, ref);
        }
        return ref;
    };
    exports.require.config = function(map) {
        for (var key in map) {
            if(key == 'root') {
                rootPath = root;
            } else {
                depended[key] = map[key];
            }
        }
    };
    /**
     * 加载模块 返回模块的引用
     * 如果不是在define函数中使用require 请使用callback参数或者将require语句放在单独的script标签中
     * 以保证后续代码在模块加载完成后执行
     *
     * @public
     * @param {String} packageName 模块名称(define函数定义的模块)
     * @param {Function} callback 模块加载解析完成后的回调函数
     */
    exports.require = function(packageName, callback) {
        var levels = packageName.split('/'),
            ref = window,
            i = 0,
            callback = callback || function(){};

        while (i < levels.length) {
            ref = ref[levels[i++]];
            if (!ref) {
                break;
            }
        }
        if (!ref) {
            __loadPackage([packageName], callback);
        } else {
            callback.call(null, __getModule(packageName));
        }

        return ref;
    };
})(this);