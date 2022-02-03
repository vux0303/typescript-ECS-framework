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
var index_1 = require("../../index");
var RepAttachmentComponent = /** @class */ (function (_super) {
    __extends(RepAttachmentComponent, _super);
    function RepAttachmentComponent() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.activeOnCreation = true;
        _this.repID = -1;
        _this.isValid = false; //invalid if attach to entity with no decorated key
        _this.isAssocciateWithSingleton = false;
        _this.aliasKeyIndex = 32;
        _this.keyBroadcastIndex = {};
        _this.keyProcessors = {};
        _this.activeKey = [];
        return _this;
    }
    return RepAttachmentComponent;
}(index_1.ecs.Component));
exports.default = RepAttachmentComponent;
