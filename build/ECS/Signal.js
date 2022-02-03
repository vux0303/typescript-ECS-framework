"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Signal = void 0;
var Iterator_1 = require("./Iterator");
var Signal = /** @class */ (function () {
    function Signal(signals, initCB, isActiveByAll) {
        if (isActiveByAll === void 0) { isActiveByAll = false; }
        if (Iterator_1.Itr.len(signals) < 1) {
            throw new Error("[ECS] can not create a Signal without components");
        }
        this.components = signals;
        this.initCB = initCB;
        this.isActiveByAll = isActiveByAll;
    }
    Signal.prototype.initChainCB = function (components, entityID) {
        this.initCB(components);
        if (this.overrideCB) {
            this.overrideCB(components);
        }
    };
    return Signal;
}());
exports.Signal = Signal;
