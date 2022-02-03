"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Component = void 0;
var Component = /** @class */ (function () {
    function Component() {
        /** @internal */
        this.internal = {
            ecsActive: false,
            dirtyProperties: null,
        };
    }
    return Component;
}());
exports.Component = Component;
