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
var index_1 = require("../../index");
var DeliveringMessageComponent_1 = __importDefault(require("../Components/DeliveringMessageComponent"));
var ReceivingMessageComponent_1 = __importDefault(require("../Components/ReceivingMessageComponent"));
var ReplicationComponent_1 = __importDefault(require("../Components/ReplicationComponent"));
var ReplicationConfig_1 = require("../ReplicationConfig");
var RepUtils_1 = require("../RepUtils");
var MessageProcessSystem = /** @class */ (function (_super) {
    __extends(MessageProcessSystem, _super);
    function MessageProcessSystem() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    MessageProcessSystem.prototype.onRegister = function () {
        var _this = this;
        this.admin.queryAll([ReplicationComponent_1.default], function (_a) {
            var _b = __read(_a, 1), repInfo = _b[0];
            _this.repInfo = repInfo;
        });
    };
    MessageProcessSystem.prototype.update = function () {
        var _this = this;
        this.admin.queryActive([DeliveringMessageComponent_1.default], function (_a) {
            var _b = __read(_a, 1), deliveringMessage = _b[0];
            _this.checkUpDeliveringMessage(deliveringMessage);
        });
        this.admin.queryActive([ReceivingMessageComponent_1.default], function (_a) {
            var _b = __read(_a, 1), receivingMessage = _b[0];
            _this.checkUpReceivingMessage(receivingMessage);
        });
    };
    MessageProcessSystem.prototype.checkUpDeliveringMessage = function (deliveringMessage) {
        var _this = this;
        var contentKeys = Object.keys(deliveringMessage.content);
        if (contentKeys.length == 0) {
            return;
        }
        if (deliveringMessage.isReadyToShip) {
            this._shipMessage(deliveringMessage);
            return;
        }
        var matchedKeys = [];
        var lastIdx;
        var numCompletedKey = 0;
        contentKeys.forEach(function (key) {
            if (deliveringMessage.processor[key].length == 0) {
                numCompletedKey++;
                return;
            }
            lastIdx = deliveringMessage.processor[key].length - 1;
            if (deliveringMessage.processor[key][lastIdx] == _this.constructor.name) { //check if this key will be process by this system
                matchedKeys.push(key);
                //remove the processor so it won't guess process again
                deliveringMessage.processor[key].pop();
                if (deliveringMessage.processor[key].length == 0) {
                    numCompletedKey++;
                    if (numCompletedKey == contentKeys.length) {
                        deliveringMessage.isReadyToShip = true;
                        console.log("READY to ship");
                    }
                }
            }
        });
        if (matchedKeys.length > 0) {
            this._process(deliveringMessage.content, matchedKeys);
        }
    };
    MessageProcessSystem.prototype.checkUpReceivingMessage = function (receivingMessage) {
        var _this = this;
        var contentKeys = Object.keys(receivingMessage.processor);
        if (contentKeys.length == 0) {
            return;
        }
        if (receivingMessage.isReadyToApply) {
            this.applyMessage();
            //this._resetReceivedMessage(receivingMessage);
            return;
        }
        var matchedKeys = [];
        var lastIdx;
        var numCompletedKey = 0;
        contentKeys.forEach(function (key) {
            if (receivingMessage.processor[key].length == 0) {
                numCompletedKey++;
                return;
            }
            lastIdx = receivingMessage.processor[key].length - 1;
            if (receivingMessage.processor[key][lastIdx] == _this.constructor.name) { //check if this key will be process by this system
                matchedKeys.push(key);
                //remove the processor so it won't guess process again
                receivingMessage.processor[key].pop();
                if (receivingMessage.processor[key].length == 0) {
                    numCompletedKey++;
                    if (numCompletedKey == contentKeys.length) {
                        receivingMessage.isReadyToApply = true;
                        console.log("READY to apply");
                    }
                }
            }
        });
        if (matchedKeys.length > 0) {
            this._process(receivingMessage.content, matchedKeys);
        }
    };
    MessageProcessSystem.prototype._shipMessage = function (deliveringMessage) {
        if (ReplicationConfig_1.repConfig.repEnv == ReplicationConfig_1.RepEnv.client) {
            this.shipMessageAtClient(deliveringMessage.content);
        }
        else { //server
            var personalMsg_1 = {};
            var broadcastContent_1 = {};
            Object.keys(deliveringMessage.content).forEach(function (key) {
                var clientID = deliveringMessage.targetClient[key];
                if (clientID) {
                    if (!personalMsg_1[clientID]) {
                        personalMsg_1[clientID] = {};
                    }
                    personalMsg_1[clientID][key] = deliveringMessage.content[key];
                }
                else { //no client mean this key will be broadcast
                    broadcastContent_1[key] = deliveringMessage.content[key];
                }
            });
            this.shipMessageAtServer(personalMsg_1, broadcastContent_1);
        }
    };
    ;
    MessageProcessSystem.prototype.shipMessageAtClient = function (content) {
    };
    ;
    MessageProcessSystem.prototype.shipMessageAtServer = function (personalMsg, broadcastContent) {
    };
    MessageProcessSystem.prototype.applyMessage = function () {
    };
    MessageProcessSystem.prototype._process = function (content, matchedKeys) {
        var matchedContent = {};
        matchedKeys.forEach(function (key) {
            matchedContent[key] = content[key];
        });
        this.process(matchedContent);
        matchedKeys.forEach(function (key) {
            content[key] = matchedContent[key];
        });
    };
    ;
    MessageProcessSystem.prototype.process = function (content) {
    };
    MessageProcessSystem.prototype.getKeyCurrentValue = function (key) {
        var keyAddress = RepUtils_1.RepUtils.decodeKey(key, ReplicationConfig_1.repConfig.debug);
        var repAttachment = this.repInfo.repAttachmentMapID.get(keyAddress.repAttachmentID);
        return repAttachment[keyAddress.aliasKey];
    };
    return MessageProcessSystem;
}(index_1.ecs.System));
exports.default = MessageProcessSystem;
