"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RepUtils = void 0;
var RepUtils = /** @class */ (function () {
    function RepUtils() {
    }
    RepUtils.decodeKey = function (key, debug) {
        var keyAddress = {
            repAttachmentID: null,
            aliasKey: null
        };
        if (debug) {
            var info = key.split('/');
            keyAddress.aliasKey = info[0];
            keyAddress.repAttachmentID = +info[1];
        }
        else {
            keyAddress.aliasKey = key.charAt(0);
            keyAddress.repAttachmentID = +key.substring(1);
        }
        return keyAddress;
    };
    return RepUtils;
}());
exports.RepUtils = RepUtils;
