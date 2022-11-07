// Converts pixel from u32 to vec4 of floats (vec4<f32>) as this filter uses rgba expressed as value between 0 and 1
fn pixel_to_vec4f(pixel: u32) -> vec4<f32> {
    return vec4<f32>(
        f32(((pixel >> 24) & 0xff)) / 255.0,
        f32(((pixel >> 16) & 0xff)) / 255.0,
        f32(((pixel >> 8) & 0xff)) / 255.0,
        f32((pixel & 0xff)) / 255.0);
}

// input image is an array of u32
@group(0) @binding(0) var<storage,read> input: array<u32>;
// using a generic array of float as params. Used as common interface to all fxs. In this case params has [width, height, exponent]
@group(0) @binding(1) var<storage,read> params: array<f32>;
// output image is an array of u32
@group(0) @binding(2) var<storage,read_write> output: array<u32>;

@compute @workgroup_size(__WORKGROUP_SIZE_X__, __WORKGROUP_SIZE_Y__)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>)
{

    let pixel_index = global_id.x + global_id.y * u32(params[0]);
    if (pixel_index >= u32(params[0] * params[1])) {
        return;
    }


    let pixel_coord = vec2<f32>(f32(global_id.x), f32(global_id.y));
    var pixel = pixel_to_vec4f(input[pixel_index]);

    pixel.r = (pixel.r * (1.0 - (0.607 * params[2]))) + (pixel.g * (0.769 * params[2])) + (pixel.b * (0.189 * params[2]));
    pixel.g = (pixel.r * 0.349 * params[2]) + (pixel.g * (1.0 - (0.314 * params[2]))) + (pixel.b * 0.168 * params[2]);
    pixel.b = (pixel.r * 0.272 * params[2]) + (pixel.g * 0.534 * params[2]) + (pixel.b * (1.0 - (0.869 * params[2])));
    let res = min(vec4<u32>(255), vec4<u32>(pixel * 255));
    output[pixel_index] = (res.r << 24) | (res.g << 16) | (res.b << 8) | (res.a);
}