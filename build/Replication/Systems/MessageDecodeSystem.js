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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageDecodeSystem = void 0;
var index_1 = require("../../index");
var ReceivingMessageComponent_1 = __importDefault(require("../Components/ReceivingMessageComponent"));
var ReplicationComponent_1 = __importDefault(require("../Components/ReplicationComponent"));
var ReplicationConfig_1 = require("../ReplicationConfig");
var RepUtils_1 = require("../RepUtils");
var MessageDecodeSystem = /** @class */ (function (_super) {
    __extends(MessageDecodeSystem, _super);
    function MessageDecodeSystem() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MessageDecodeSystem.prototype.update = function (dt) {
        this.admin.queryAll([ReceivingMessageComponent_1.default, ReplicationComponent_1.default], function (_a) {
            var _b = __read(_a, 2), receivingMsg = _b[0], repInfo = _b[1];
            var contentKeys = Object.keys(receivingMsg.content);
            if (contentKeys.length > 0) {
                console.log("Decode msg");
                contentKeys.forEach(function (key) {
                    var keyAddress = RepUtils_1.RepUtils.decodeKey(key, ReplicationConfig_1.repConfig.debug);
                    var repAttachment = repInfo.repAttachmentMapID.get(keyAddress.repAttachmentID);
                    receivingMsg.keyAddress[key] = keyAddress;
                    receivingMsg.processor[key] = repAttachment.keyProcessors[keyAddress.aliasKey];
                });
            }
        });
    };
    return MessageDecodeSystem;
}(index_1.ecs.System));
exports.MessageDecodeSystem = MessageDecodeSystem;
