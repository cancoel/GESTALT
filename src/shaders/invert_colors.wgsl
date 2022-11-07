@group(0) @binding(0) var<storage,read> input: array<u32>;
@group(0) @binding(1) var<storage,read> params: array<f32>;
@group(0) @binding(2) var<storage,read_write> output: array<u32>;

@compute @workgroup_size(__WORKGROUP_SIZE_X__, __WORKGROUP_SIZE_Y__)
fn main (@builtin(global_invocation_id) global_id: vec3<u32>) {

    let pixel_index = global_id.x + global_id.y * u32(params[0]);
    // Due to the size of workgroup, it's possibile that some indices are out of range. In this case the shader does nothing.
    if (pixel_index >= u32(params[0] * params[1])) {
        return;
    }

    if (params[2] == 1){
        // invert
        output[pixel_index] = 4294967295u - input[pixel_index];
    }
    else {
        // no invert
        output[pixel_index] = input[pixel_index];
    }
}

