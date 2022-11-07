import { decode, encode, RawImageData, BufferLike } from "jpeg-js";
/**
 * function for decoding jpeg data into an array with red, green, blue and alpha values for all pixels
 * @param  {BufferLike} data
 * @returns decodedInfo
 */

// es kommt der Parameter data als BufferLike und hat Rückgabetyp RawImageData von Bufferlike.
export const decodeImage = (data: BufferLike): RawImageData<BufferLike> => {
  const decodedInfo = decode(data);
  return {
    data: new Uint8Array(decodedInfo.data),
    width: decodedInfo.width,
    height: decodedInfo.height,
  };
};

/**
 * function to encode array with red, green, blue and alpha values to jpeg
 * @param  {RawImageData<BufferLike>} image
 */
export const encodeImage = (image: RawImageData<BufferLike>): string => {
  //console.log(image.data);
  const encoded = encode(image, 100);
  let binary = "";
  var bytes = new Uint8Array(encoded.data);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return "data:string;base64," + window.btoa(binary);
};
