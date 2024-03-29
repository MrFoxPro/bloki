export const ELEMENT_PER_VERTEX_POS = 2
export const ELEMENT_PER_VERTEX_COLOR = 4
export const ELEMENT_PER_VERTEX = ELEMENT_PER_VERTEX_POS
export const INDICES_PER_TRIANGLE = 3
export const VBO_ARRAY = Float32Array
export const IBO_ARRAY = Uint32Array
export const UBO_ARRAY = Float32Array
export const CMD_ARRAY = Uint32Array
export const INDEX_FORMAT: GPUIndexFormat = 'uint32'
export const VBO_CHUNK_LENGTH = 200 * ELEMENT_PER_VERTEX
export const IBO_CHUNK_LENGTH = 200 * INDICES_PER_TRIANGLE

// https://www.w3.org/TR/webgpu/#dom-gpurendercommandsmixin-drawindexedindirect
export const CMD_CHUNK_LENGTH = 5

export type TypedArrayConstructor = typeof VBO_ARRAY | typeof IBO_ARRAY | typeof UBO_ARRAY | typeof CMD_ARRAY
export type TypedArray = InstanceType<TypedArrayConstructor>
