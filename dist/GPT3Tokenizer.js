"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GPT3Tokenizer = void 0;
const gpt_tokenizer_1 = require("gpt-tokenizer");
class GPT3Tokenizer {
    decode(tokens) {
        return (0, gpt_tokenizer_1.decode)(tokens);
    }
    encode(text) {
        return (0, gpt_tokenizer_1.encode)(text);
    }
}
exports.GPT3Tokenizer = GPT3Tokenizer;
