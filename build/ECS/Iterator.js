"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Itr = void 0;
/** @internal */
var Itr = /** @class */ (function () {
    function Itr() {
    }
    Itr.every = function (target, callBack) {
        if (Array.isArray(target)) {
            return target.every(callBack);
        }
        else if (typeof target === 'object' && target !== null) {
            return Object.keys(target).every(function (key) { return callBack(target[key]); });
        }
    };
    Itr.forEach = function (target, callBack) {
        if (Array.isArray(target)) {
            return target.forEach(function (Ctor, idx) { callBack(Ctor, function (value) { target[idx] = value; }); });
        }
        else if (typeof target === 'object' && target !== null) {
            return Object.keys(target).forEach(function (key) { callBack(target[key], function (value) { target[key] = value; }); });
        }
    };
    Itr.map = function (target, callBack) {
        var returnObj;
        if (Array.isArray(target)) {
            returnObj = target.map(callBack);
            return returnObj;
        }
        else if (typeof target === 'object' && target !== null) {
            returnObj = {};
            Object.keys(target).forEach(function (key) { returnObj[key] = callBack(target[key]); });
            return returnObj;
        }
    };
    Itr.some = function (target, callBack) {
        if (Array.isArray(target)) {
            return target.some(callBack);
        }
        else if (typeof target === 'object' && target !== null) {
            return Object.keys(target).some(function (key) { callBack(target[key]); });
        }
    };
    Itr.len = function (target) {
        if (Array.isArray(target)) {
            return target.length;
        }
        else if (typeof target === 'object' && target !== null) {
            return Object.keys(target).length;
        }
    };
    Itr.filterToArray = function (target) {
        var narrowedComponents;
        if (typeof target === 'object' && target !== null) {
            narrowedComponents = Object.keys(target).map(function (key) {
                return target[key];
            });
        }
        else if (Array.isArray(target)) {
            narrowedComponents = target;
        }
        return narrowedComponents;
    };
    return Itr;
}());
exports.Itr = Itr;
