
export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert Int16 (-32768 to 32767) back to Float32 (-1.0 to 1.0)
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Downsamples audio data from a source rate to a target rate (e.g. 44100 -> 16000)
 */
function downsampleBuffer(buffer: Float32Array, inputRate: number, outputRate: number): Float32Array {
  if (outputRate === inputRate) {
    return buffer;
  }
  
  const sampleRatio = inputRate / outputRate;
  const newLength = Math.round(buffer.length / sampleRatio);
  const result = new Float32Array(newLength);
  
  for (let i = 0; i < newLength; i++) {
    // Simple decimation/nearest neighbor is often sufficient for speech recognition
    // but linear interpolation is slightly better. Using nearest for performance here.
    const index = Math.floor(i * sampleRatio);
    result[i] = buffer[index];
  }
  return result;
}

export function createBlob(data: Float32Array, inputSampleRate: number, targetSampleRate: number = 16000): { data: string; mimeType: string } {
  // 1. Downsample if necessary
  const processedData = downsampleBuffer(data, inputSampleRate, targetSampleRate);
  
  // 2. Convert Float32 (-1.0 to 1.0) to Int16 (-32768 to 32767)
  const l = processedData.length;
  const int16 = new Int16Array(l);
  
  for (let i = 0; i < l; i++) {
    // Clamp values to prevent distortion/wrapping
    const s = Math.max(-1, Math.min(1, processedData[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: `audio/pcm;rate=${targetSampleRate}`,
  };
}
