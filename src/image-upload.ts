import * as buffer from "buffer";
(window as any).Buffer = buffer.Buffer;


/**
 * Read input files and complete with img src
 * @param  {Blob} file uploaded image als BLOB
 * @param  {(src:string)=>void} onUploadFinished function which is called when upload finished
 */
export const onFileUpload = (
  file: Blob,
  onUploadFinished: (src: string) => void
) => {
  if (file.type != "image/jpeg") {
    console.log("file is not a jpeg!");
    return;
  }
  const fileReader = new FileReader();
  fileReader.addEventListener("load", function () {
    onUploadFinished(fileReader.result as string);
  });
  fileReader.readAsDataURL(file);
};