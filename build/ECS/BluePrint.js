"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Blueprint = void 0;
var Iterator_1 = require("./Iterator");
var Blueprint = /** @class */ (function () {
    function Blueprint(components, initCB, opts) {
        this.pool = 0;
        if (Iterator_1.Itr.len(components) < 1) {
            throw new Error("[ECS] can not create a Blueprint without components");
        }
        this.filter = components;
        this.initCB = initCB;
        this.signals = opts.signals;
        this.pool = opts.pool;
    }
    Blueprint.prototype.initChainCB = function (components, entityID) {
        this.initCB(components);
        if (this.overrideCB) {
            this.overrideCB(components);
        }
    };
    return Blueprint;
}());
exports.Blueprint = Blueprint;
