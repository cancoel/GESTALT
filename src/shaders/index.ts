import invertColors from "./invert_colors.wgsl?raw"
import denoise from "./denoise.wgsl?raw"
import sepia from "./sepia.wgsl?raw"
import invert from "./invert_colors.wgsl?raw"
import bulgepinch from "./bulgepinch.wgsl?raw"

/**
 * Returns the code for a WGSL shader for a given filter name.
 * @param {string} shaderName The filter name.
 * @throws When there is no shader with the given filter name.
 * @returns The shader code.
 */
export const shader = (shaderName: string): string => {
  switch (shaderName) {
    case "Noise":
      return invertColors
    case "Denoise":
      return denoise
    case "Sepia":
      return sepia
    case "Invert":
      return invert
    case "Bulge / Pinch":
      return bulgepinch
    default:
      throw Error(`Unexpectedly found invalid shader name '${shaderName}'.`)
  }
}