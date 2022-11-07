import { onFileUpload } from "./image-upload";
import { createGUI, createFolder, createRadioGroup } from "./gui";
import { encodeImage, decodeImage } from "./image-coder";
import { GPUComputeImage } from "./image-processing";
import { shader } from "./shaders";

await GPUComputeImage.loadDevice();

const fileUploadElement = document.getElementById(
  "fileinput"
) as HTMLInputElement;

const inputimageElement = document.getElementById(
  "inputimage"
) as HTMLImageElement;

const arrayReader = new FileReader();

fileUploadElement.onchange = (event) => {
  const files = fileUploadElement.files;
  if (files === null || files[0] === null) {
    return;
  }
  onFileUpload(files[0], (loadedSrc) => {
    inputimageElement.src = loadedSrc;
    const imageFile = files[0];
    console.log(imageFile);
    arrayReader.readAsArrayBuffer(imageFile);
  });
};

arrayReader.addEventListener("load", async () => {

  if (arrayReader?.result) {

    const image = decodeImage(arrayReader?.result);
    const gpuComputeImage = new GPUComputeImage(image.data);

    createGUI(); 

    createFolder("Denoise", {
      exponent: 10
    }, 0, 100, function (value) {
      onApplyFilter(shader("Denoise"), [value]);
    });

    // 0 to 1 (0 for no effect, 1 for full sepia coloring)
    createFolder("Sepia", {
      amount: 0
    }, 0, 1, function (value) {
      onApplyFilter(shader("Sepia"), [value]);
    });

    createFolder("Bulge / Pinch", {
      strength: 0,
    }, -1, 1, function (value) {
      // params are [strength, radius (fixed), center x (fixed), center y (fixed)]
      onApplyFilter(shader("Bulge / Pinch"), [value, Math.min(image.width, image.height) / 2, image.width / 2, image.height / 2]);
    });
    /**
     * @param  {} "Colors"
     * @param  {false}} {"Invert"
     * @param  {} (selectedFilterName
     * @param  {} value
     * @param  {} =>{onApplyFilter(shader(selectedFilterName
     * @param  {0]} [value?1
     */
    createRadioGroup("Colors", {
      "Invert": false
    }, (selectedFilterName, value) => {
      // value is the checkbox value and it is true (checked) or false (unchecked)
      onApplyFilter(shader(selectedFilterName), [value ? 1 : 0]);
    });

    async function onApplyFilter(filter: string, filterParams: number[]) {

      const params = [image.width, image.height]
      params.push(...filterParams);

      const data = await gpuComputeImage.process(filter, params);
      inputimageElement.src = encodeImage({
        data: data,
        width: image.width,
        height: image.height,
      });
    };
  }
});


