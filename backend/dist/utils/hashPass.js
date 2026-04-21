"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPass = hashPass;
const bcrypt_1 = __importDefault(require("bcrypt"));
async function hashPass(pass) {
    return await bcrypt_1.default.hash(pass, 10);
}
