// Signed and Unsigned LEB128 Decoder / Encoder
export class LEB128 {
    static decodeULEB128(bytes, offset = 0) {
        let result = 0;
        let shift = 0;
        let count = 0;
        while (offset < bytes.length) {
            const byte = bytes[offset++];
            count++;
            result |= (byte & 0x7f) << shift;
            if ((byte & 0x80) === 0) break;
            shift += 7;
        }
        return { value: result, bytesRead: count };
    }

    static decodeSLEB128(bytes, offset = 0) {
        let result = 0;
        let shift = 0;
        let count = 0;
        let byte = 0;
        while (offset < bytes.length) {
            byte = bytes[offset++];
            count++;
            result |= (byte & 0x7f) << shift;
            shift += 7;
            if ((byte & 0x80) === 0) break;
        }
        if (shift < 32 && (byte & 0x40) !== 0) {
            result |= (~0 << shift);
        }
        return { value: result, bytesRead: count };
    }
}
