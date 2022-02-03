"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.System = void 0;
var System = /** @class */ (function () {
    function System() {
    }
    //abstract readonly filter: Filter;
    System.prototype.onRegister = function () {
    };
    System.prototype.update = function (dt) {
    };
    System.prototype.lateUpdate = function (dt) {
    };
    return System;
}());
exports.System = System;
