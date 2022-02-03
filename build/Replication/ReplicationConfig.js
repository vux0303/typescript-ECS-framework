"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repConfig = exports.RepEnv = void 0;
var RepEnv;
(function (RepEnv) {
    RepEnv[RepEnv["client"] = 0] = "client";
    RepEnv[RepEnv["server"] = 1] = "server";
})(RepEnv = exports.RepEnv || (exports.RepEnv = {}));
exports.repConfig = {
    repEnv: RepEnv.client,
    debug: true,
    useNumericAliasKey: false,
    clientShipSystem: undefined,
    serverShipSystem: undefined,
};
