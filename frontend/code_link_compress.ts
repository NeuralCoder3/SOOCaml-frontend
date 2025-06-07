const { compress, decompress } = require("lzw-compressor");

// const input = 'let x = 42 in print_endline ("The answer is " ^ string_of_int x)';
const input = 'let x = 42 in let x = 42 in let x in 42 in let x = 42 in let x = 42 in let x in 42 in x';

const compressed = compress(input);

// Convert 16-bit code units string to a Buffer by taking char codes
const bytes = [];
for (let i = 0; i < compressed.length; i++) {
  const code = compressed.charCodeAt(i);
  // assuming code < 65536, store as two bytes (big endian)
  bytes.push(code >> 8);
  bytes.push(code & 0xff);
}

const compressedBuffer = Buffer.from(bytes);
const encoded = compressedBuffer.toString('base64');
console.log("lzw:" + encoded);

// Decode
const decodedBuffer = Buffer.from(encoded, 'base64');
let decodedStr = '';
for (let i = 0; i < decodedBuffer.length; i += 2) {
  decodedStr += String.fromCharCode(
    (decodedBuffer[i] << 8) + decodedBuffer[i + 1]
  );
}

const text = decompress(decodedStr);
console.log(text);
