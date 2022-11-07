// Converts pixel from u32 to vec4 of floats (vec4<f32>) as this filter uses rgba expressed as value between 0 and 1
fn pixel_to_vec4f(pixel: u32) -> vec4<f32>
{
    return vec4<f32>(
        f32(((pixel >> 24) & 0xff)) / 255.0,
        f32(((pixel >> 16) & 0xff)) / 255.0,
        f32(((pixel >> 8) & 0xff)) / 255.0,
        f32((pixel & 0xff)) / 255.0);
}

// input image is an array of u32
@group(0) @binding(0) var<storage, read> input : array<u32>;
// using a generic array of float as params. Used as common interface to all fxs. In this case params has [width, height, exponent]
@group(0) @binding(1) var<storage, read> params : array<f32>;
// output image is an array of u32
@group(0) @binding(2) var<storage, read_write> output : array<u32>;

@compute @workgroup_size(__WORKGROUP_SIZE_X__, __WORKGROUP_SIZE_Y__)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>)
{

    let pixel_index_output = global_id.x + global_id.y * u32(params[0]);
    if (pixel_index_output >= u32(params[0] * params[1])) {
        return;
    }

    var pixel_coord = vec2<f32>(f32(global_id.x), f32(global_id.y));
    let strength = params[2];
    let radius = params[3];
    let center = vec2<f32>(params[4], params[5]);
    // difference vector
    pixel_coord -= center;

    // the distance of pixel_coord from center

    // Überprüfen der Länge der Pixel, als erste Bedingung muss die Länge der Pixel kleiner sein als der Radius, um die Operation für die Bestimmung der zukünftigen Pixel auszuführen. Zusätzlich wird, um die Operation in einem angemessenen Modus auszuführen, ein prozentualer Wert mit der Distanz und dem Radius bestimmt. Der Prozentsatz wird aus dem Quotientenverhältnis der Größen, Distanz als den Dividend und dem Radius als Divisor, bestimmt. Sobald die angegebene Stärke > 0 ist, wird als erstes mit der Hermiteschen Funktion und den dazugehörigen Parametern die Interpolation bestimmt. Zweitens wird mit der bestimmten Interpolation die jeweilige Pixelkoordinate mittels einer weiteren Interpolation auf lineaer Basis ausgeführt.

    let distance = length(pixel_coord);
    if (distance < radius)
    {
        let percent = distance / radius;
        if (strength > 0.0)
        {
            pixel_coord *= mix(1.0, smoothstep(0.0, radius / distance, percent), strength * 0.75);
        }
        // Wenn die Stärke 0 ist
        else
        {
            pixel_coord *= mix(1.0, pow(percent, 1.0 + strength * 0.75) * radius / distance, 1.0 - percent);
        }
    }
    // pixel_coord back to image space
    pixel_coord += center;
    
    let pixel_index_input = u32(pixel_coord.x + pixel_coord.y * params[0]);
    let clamped_coord = clamp(pixel_coord, vec2<f32>(0.0), vec2<f32>(params[0], params[1]));

    if (pixel_coord.x != clamped_coord.x || pixel_coord.y != clamped_coord.y)  {
        // fade to transparent if outside of image
        output[pixel_index_output] = (input[pixel_index_input] & 0xffffff00) | u32(f32((input[pixel_index_input] & 0xff)) * max(0.0, 1.0 - length(pixel_coord - clamped_coord)));
    }
    else {
        output[pixel_index_output] = input[pixel_index_input];
    }
}
