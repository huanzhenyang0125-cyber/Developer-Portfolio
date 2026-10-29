import { pipeline, env } from '@huggingface/transformers';
import ortModuleURL from '../../node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.mjs?url';
import ortWasmURL from '../../node_modules/@huggingface/transformers/dist/ort-wasm-simd-threaded.jsep.wasm?url';
env.allowLocalModels = false;
if (env.backends.onnx.wasm)
  env.backends.onnx.wasm.wasmPaths = {
    mjs: new URL(ortModuleURL, import.meta.url).href,
    wasm: new URL(ortWasmURL, import.meta.url).href,
  };
if (env.backends.onnx.wasm) env.backends.onnx.wasm.numThreads = 1;
type Classifier = (image: string, labels: string[]) => Promise<{ label: string; score: number }[]>;
type Factory = (
  task: 'zero-shot-image-classification',
  model: string,
  options: { dtype: 'q8'; progress_callback: (progress: unknown) => void },
) => Promise<Classifier>;
const createClassifier = pipeline as unknown as Factory;
let classifier: Promise<Classifier> | undefined;
self.onmessage = async (e: MessageEvent<{ image: string; labels: string[] }>) => {
  try {
    classifier ??= createClassifier(
      'zero-shot-image-classification',
      'Xenova/clip-vit-base-patch32',
      {
        dtype: 'q8',
        progress_callback: (p: unknown) => {
          const progress = p as { status: string; progress?: number };
          self.postMessage({
            type: 'progress',
            status: progress.status,
            progress: progress.progress,
          });
        },
      },
    );
    const model = await classifier;
    const result = await model(e.data.image, e.data.labels);
    self.postMessage({ type: 'result', result });
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : '识别未完成',
    });
  }
};
