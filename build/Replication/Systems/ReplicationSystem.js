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
var RepAttachmentComponent_1 = __importDefault(require("../Components/RepAttachmentComponent"));
var ReplicationComponent_1 = __importDefault(require("../Components/ReplicationComponent"));
var Decorator_1 = require("../Decorator");
var ReplicationConfig_1 = require("../ReplicationConfig");
var MessageApplySystem_1 = require("./MessageApplySystem");
var MessageDecodeSystem_1 = require("./MessageDecodeSystem");
var ReplicationSystem = /** @class */ (function (_super) {
    __extends(ReplicationSystem, _super);
    function ReplicationSystem() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.singletonAttachments = [];
        return _this;
    }
    ReplicationSystem.prototype.onRegister = function () {
        //create entity
        //this.config = this.admin.addSingleton(ReplicationConfig);
        this.deliveringMsg = this.admin.addSingleton(DeliveringMessageComponent_1.default);
        this.admin.addSingleton(ReceivingMessageComponent_1.default);
        this.repInfo = this.admin.addSingleton(ReplicationComponent_1.default);
        this.registerSubSystem();
        this.scanSingleton();
        this.scanNetEntities();
    };
    ReplicationSystem.prototype.registerSubSystem = function () {
        var _this = this;
        this.admin.registerSystem(new MessageDecodeSystem_1.MessageDecodeSystem());
        var reuseSystem = new Map();
        Decorator_1.g_messageProcessorCtors.forEach(function (systemCtor) {
            if (reuseSystem.has(systemCtor)) {
                _this.admin.registerSystem(reuseSystem.get(systemCtor));
            }
            else {
                var sys = new systemCtor();
                reuseSystem.set(systemCtor, sys);
                _this.admin.registerSystem(sys);
            }
        });
        //this.admin.queryAll([ReplicationConfig], ([config]) => {
        if (ReplicationConfig_1.repConfig.repEnv == ReplicationConfig_1.RepEnv.client) {
            if (ReplicationConfig_1.repConfig.clientShipSystem) {
                this.admin.registerSystem(new ReplicationConfig_1.repConfig.clientShipSystem());
            }
            else {
                console.warn("[REP] clientShipSystem is undefined");
            }
        }
        else {
            if (ReplicationConfig_1.repConfig.serverShipSystem) {
                this.admin.registerSystem(new ReplicationConfig_1.repConfig.clientShipSystem());
            }
            else {
                console.warn("[REP] serverShipSystem is undefined");
            }
        }
        //})
        this.admin.registerSystem(new MessageApplySystem_1.MessageApplySystem());
    };
    ReplicationSystem.prototype.scanSingleton = function () {
        var _this = this;
        var singletonInst;
        Decorator_1.g_repMetaData.forEach(function (keyMap, ctorName) {
            singletonInst = _this.admin.getSingleton(ctorName);
            if (singletonInst) {
                _this.admin.createEntity([], function () { }, {
                    signals: new index_1.ecs.Signal([RepAttachmentComponent_1.default], function (_a) {
                        var _b = __read(_a, 1), attachment = _b[0];
                        _this.attachToNetComponent(singletonInst, attachment);
                        _this.assignAttachmentID(attachment);
                        attachment.isAssocciateWithSingleton = true;
                    })
                });
            }
        });
    };
    ReplicationSystem.prototype.scanNetEntities = function () {
        var _this = this;
        this.admin.queryAll([RepAttachmentComponent_1.default, index_1.ecs.Sibling], function (_a) {
            var _b = __read(_a, 2), repAttachment = _b[0], sibling = _b[1];
            _this.lookForDecoratedComponent(repAttachment, sibling);
        });
    };
    ReplicationSystem.prototype.lookForDecoratedComponent = function (repAttachment, sibling) {
        var _this = this;
        if (repAttachment.isAssocciateWithSingleton) { //these rep already took care by scanSingleton
            return;
        }
        if (ReplicationConfig_1.repConfig.useNumericAliasKey) {
            repAttachment.aliasKeyIndex = 0;
        }
        else {
            repAttachment.aliasKeyIndex = 32; //first ascii character
        }
        //check for each component if they contain decorated properties
        var hasNetComponent = false;
        sibling.all().forEach(function (component) {
            if (Decorator_1.g_repMetaData.has(component.constructor.name)) {
                _this.attachToNetComponent(component, repAttachment);
                hasNetComponent = true;
            }
        });
        if (hasNetComponent) {
            this.assignAttachmentID(repAttachment);
        }
        else {
            console.warn("[REP] using RepAttachmentComponent on entity with no decorated key");
        }
    };
    ReplicationSystem.prototype.assignAttachmentID = function (attachment) {
        attachment.repID = this.repInfo.repID;
        attachment.isValid = true;
        this.repInfo.repAttachmentMapID.set(this.repInfo.repID, attachment);
        this.repInfo.repID++;
    };
    //to watch for changes and notify our replication attachment
    ReplicationSystem.prototype.attachToNetComponent = function (component, attachment) {
        var _this = this;
        Object.keys(Decorator_1.g_repMetaData.get(component.constructor.name)).forEach(function (key) {
            var aliasKey = _this.generateAliasKey(component.constructor.name, key, attachment);
            var keyInfo = Decorator_1.g_repMetaData.get(component.constructor.name)[key];
            //for delivering side
            if (ReplicationConfig_1.repConfig.repEnv == ReplicationConfig_1.RepEnv.client && keyInfo.type == Decorator_1.KeyRepDirection.clientToServer
                || ReplicationConfig_1.repConfig.repEnv == ReplicationConfig_1.RepEnv.server && keyInfo.type == Decorator_1.KeyRepDirection.serverToClient) {
                Object.defineProperty(attachment, aliasKey, {
                    value: component[key],
                    enumerable: true,
                    configurable: true,
                    writable: true,
                });
                attachment[aliasKey] = component[key];
                var singletonAttachments_1 = _this.singletonAttachments;
                //this can be trouble if remove the repAttachment
                Object.defineProperty(component, key, {
                    set: function (value) {
                        var prevValue = component[key];
                        attachment[aliasKey] = value;
                        if (prevValue != value) { //only send key changed in value
                            attachment.activeKey.push(aliasKey);
                            singletonAttachments_1.push(attachment);
                        }
                    },
                    get: function () {
                        return attachment[aliasKey];
                    }
                });
                attachment.keyProcessors[aliasKey] = Decorator_1.g_repMetaData.get(component.constructor.name)[key].deliverData.processors;
                attachment.keyBroadcastIndex[aliasKey] = Decorator_1.g_repMetaData.get(component.constructor.name)[key].deliverData.isBroadcast;
            }
            else { //for processing side
                Object.defineProperty(attachment, aliasKey, {
                    set: function (value) {
                        component[key] = value;
                    },
                    get: function () {
                        return component[key];
                    }
                });
                attachment.keyProcessors[aliasKey] = Decorator_1.g_repMetaData.get(component.constructor.name)[key].receiveData.processors;
            }
        });
    };
    ReplicationSystem.prototype.generateAliasKey = function (component, key, attachment) {
        if (ReplicationConfig_1.repConfig.debug) {
            return component + "_" + key;
        }
        else {
            var aliasKey = void 0;
            if (ReplicationConfig_1.repConfig.useNumericAliasKey) {
                aliasKey = attachment.aliasKeyIndex.toString();
            }
            else {
                if (attachment.aliasKeyIndex > 126) { //last ascii character
                    throw new Error("[REP] exceeded maximum ascii character for alias key, use useNumericAliasKey config instead");
                }
                aliasKey = String.fromCharCode(attachment.aliasKeyIndex);
            }
            attachment.aliasKeyIndex += 1;
            return aliasKey;
        }
    };
    ReplicationSystem.prototype.encodeMessageKey = function (repKey, repID) {
        if (ReplicationConfig_1.repConfig.debug) {
            return repKey + "/" + repID.toString();
        }
        else {
            return repKey + repID.toString();
        }
    };
    ReplicationSystem.prototype.updateDeliveringMessage = function (attachment) {
        var _this = this;
        var msgKey;
        attachment.activeKey.forEach(function (key) {
            msgKey = _this.encodeMessageKey(key, attachment.repID);
            _this.deliveringMsg.content[msgKey] = attachment[key];
            _this.deliveringMsg.processor[msgKey] = Object.assign([], attachment.keyProcessors[key]);
            if (!attachment.keyBroadcastIndex[key] && attachment.targetClientID) {
                _this.deliveringMsg.targetClient[msgKey] = attachment.targetClientID;
            }
        });
    };
    ReplicationSystem.prototype.update = function () {
        var _this = this;
        this.admin.queryActive([RepAttachmentComponent_1.default, index_1.ecs.Sibling], function (_a) {
            var _b = __read(_a, 2), attachment = _b[0], sibling = _b[1];
            if (attachment.repID == -1) { //if this entity is added later on and have not been check for rep keys
                _this.lookForDecoratedComponent(attachment, sibling);
            }
            else {
                _this.updateDeliveringMessage(attachment);
                // let msgKey: string;
                // attachment.activeKey.forEach((key) => {
                //     msgKey = this.encodeMessageKey(key, attachment.repID, config);
                //     message.content[msgKey] = attachment[key];
                //     message.processor[msgKey] = Object.assign([], attachment.keyProcessors[key]);
                //     if (!attachment.keyBroadcastIndex[key] && attachment.targetClientID) {
                //         message.targetClient[msgKey] = attachment.targetClientID;
                //     }
                // })
            }
        });
        this.singletonAttachments.forEach(function (attachment) {
            if (attachment.activeKey.length > 0) {
                _this.updateDeliveringMessage(attachment);
            }
        });
    };
    ReplicationSystem.prototype.lateUpdate = function () {
        this.admin.queryActive([DeliveringMessageComponent_1.default, ReceivingMessageComponent_1.default], function (_a) {
            var _b = __read(_a, 2), deliveringMessage = _b[0], receivedMessage = _b[1];
            if (deliveringMessage.isReadyToShip) {
                deliveringMessage.isReadyToShip = false;
                deliveringMessage.content = {};
                deliveringMessage.processor = {};
            }
            if (receivedMessage.isReadyToApply) {
                receivedMessage.keyAddress = {};
                receivedMessage.content = {};
                receivedMessage.processor = {};
                receivedMessage.isReadyToApply = false;
            }
        });
        this.singletonAttachments.length = 0;
    };
    return ReplicationSystem;
}(index_1.ecs.System));
exports.default = ReplicationSystem;
