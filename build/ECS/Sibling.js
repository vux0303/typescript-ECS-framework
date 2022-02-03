"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sibling = void 0;
var Component_1 = require("./Component");
var Sibling = /** @class */ (function (_super) {
    __extends(Sibling, _super);
    function Sibling() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        /** @internal */
        _this.readingRowIdx = -1;
        return _this;
    }
    Sibling.prototype.get = function (Ctor) {
        // if (!this.archetype.isContainSignal(Ctor) || this.readingRowIdx < 0) {
        //     return null;
        // }
        if (!this.archetype.components.has(Ctor) || this.readingRowIdx < 0) {
            return null;
        }
        var component = this.archetype.components.get(Ctor)[this.readingRowIdx];
        //if (!component.ecsActive) {
        return component;
        //} else {
        //    return null;
        //}
    };
    Sibling.prototype.all = function () {
        var _this = this;
        var comps = [];
        this.archetype.components.forEach(function (pool, Ctor) {
            comps.push(pool[_this.readingRowIdx]);
        });
        return comps;
    };
    return Sibling;
}(Component_1.Component));
exports.Sibling = Sibling;
