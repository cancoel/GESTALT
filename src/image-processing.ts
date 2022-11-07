
export class GPUComputeImage {

  // one device for all instances
  static #device: GPUDevice;
  // the GPUBuffer that holds image data
  #gpuInputBuffer: GPUBuffer;
  // image data
  #array: Uint8Array;


  constructor(array: Uint8Array) {
    this.#array = array;
    this.#gpuInputBuffer = this.#createInputImageBuffer();
  }

  #createParamsBuffer(params: number[]) {

    const paramsArray = new Float32Array(params);
    const paramsBuffer = GPUComputeImage.#device?.createBuffer({
      mappedAtCreation: true,
      size: paramsArray.byteLength,
      usage: GPUBufferUsage.STORAGE,
    });
    new Float32Array((paramsBuffer as GPUBuffer).getMappedRange()).set(paramsArray);
    paramsBuffer?.unmap();

    return paramsBuffer;
  }

  #createInputImageBuffer() {
    const gpuInputBuffer = GPUComputeImage.#device?.createBuffer({
      mappedAtCreation: true,
      size: this.#array.byteLength,
      usage: GPUBufferUsage.STORAGE,
    });

    // "possibly null" -> ? setzen
    // "possibly undefined" -> as ...
    new Uint8Array((gpuInputBuffer as GPUBuffer).getMappedRange()).set(this.#array);
    gpuInputBuffer?.unmap();

    return gpuInputBuffer;
  }

  #createOutputImageBuffer() {
    const gpuResultBuffer = GPUComputeImage.#device?.createBuffer({
      size: this.#array.byteLength,
      usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC
    });

    return gpuResultBuffer;
  }

  #createReadBuffer() {
    const gpuReadBuffer = GPUComputeImage.#device?.createBuffer({
      size: this.#array.byteLength,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
    });
    return gpuReadBuffer;
  }

  static async loadDevice() {
    if (GPUComputeImage.#device) return;
    if (!navigator.gpu) {
      throw Error("WebGPU not supported")
    }
    const adapter = await navigator.gpu.requestAdapter();

    if (!adapter) {
      throw Error("Couldn't request WebGPU Adapter")
    }
    GPUComputeImage.#device = await adapter?.requestDevice();

    if (!GPUComputeImage.#device) {
      throw Error("Couldn't request WebGPU logical device")
    }
  }

  async process(shader: string, params: number[]): Promise<Uint8Array> {

    return new Promise(resolve => {

      const width = params[0];
      const height = params[1];

      // compute the best workgroup size and job dimension (num of workgroups) for processing the image loaded
      const workgroupSize = GPUComputeImage.#device.limits.maxComputeInvocationsPerWorkgroup;
      const workgroupSizeX = Math.sqrt(workgroupSize);
      const workgroupSizeY = Math.sqrt(workgroupSize);
      const numWorkgroupX = Math.ceil(width/workgroupSizeX);
      const numWorkgroupY = Math.ceil(height/workgroupSizeY);
      // set computed values in the shader
      shader = shader.replace("__WORKGROUP_SIZE_X__", String(workgroupSizeX)).replace("__WORKGROUP_SIZE_Y__", String(workgroupSizeY));

      const module = GPUComputeImage.#device?.createShaderModule({ code: shader })

      const computePipeline = GPUComputeImage.#device?.createComputePipeline({
        layout: 'auto',
        compute: {
          module,
          entryPoint: "main"
        }
      });


      const paramsBuffer = this.#createParamsBuffer(params);
      const gpuResultBuffer = this.#createOutputImageBuffer();
      const gpuReadBuffer = this.#createReadBuffer();

      const bindGroup = GPUComputeImage.#device?.createBindGroup({
        layout: computePipeline.getBindGroupLayout(0) as GPUBindGroupLayout,
        entries: [
          {
            binding: 0,
            resource: {
              buffer: this.#gpuInputBuffer as GPUBuffer
            }
          },
          {
            binding: 1,
            resource: {
              buffer: paramsBuffer as GPUBuffer
            }
          },
          {
            binding: 2,
            resource: {
              buffer: gpuResultBuffer as GPUBuffer
            }
          }
        ]
      });

      const commandEncoder = GPUComputeImage.#device?.createCommandEncoder();
      const passEncoder = commandEncoder?.beginComputePass();
      passEncoder?.setPipeline(computePipeline as GPUComputePipeline);
      passEncoder?.setBindGroup(0, bindGroup as GPUBindGroup);
      passEncoder?.dispatchWorkgroups(numWorkgroupX, numWorkgroupY);
      passEncoder?.end();

      commandEncoder?.copyBufferToBuffer(
        gpuResultBuffer as GPUBuffer,
        0,
        gpuReadBuffer as GPUBuffer,
        0,
        this.#array.byteLength
      );
      GPUComputeImage.#device?.queue.submit([commandEncoder?.finish() as GPUCommandBuffer]);

      gpuReadBuffer?.mapAsync(GPUMapMode.READ).then(() => {
        resolve(new Uint8Array(gpuReadBuffer.getMappedRange()));
      });
    });
  }
}