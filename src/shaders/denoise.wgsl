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
    let pixel = pixel_to_vec4f(input[pixel_index]);
    var color = vec4(0.0);
    var total = 0.0;
    for (var x = -4.0; x <= 4.0; x += 1.0)
    {
        for (var y = -4.0; y <= 4.0; y += 1.0)
        {
            let sample_coord = pixel_coord + vec2<f32>(x, y) / vec2<f32>(params[0], params[1]);
            let sample_index = u32(sample_coord.x + sample_coord.y * params[0]);

            let sample = pixel_to_vec4f(input[sample_index]);

            var weight = 1.0 - abs(dot(sample.rgb - pixel.rgb, vec3(0.25)));
            weight = pow(weight, params[2]);
            color += sample * weight;
            total += weight;
        }
    }
    let final_color = vec4<u32>((color/total) * 255);
    output[pixel_index] = (final_color.r << 24) | (final_color.g << 16) | (final_color.b << 8) | (final_color.a);
}
