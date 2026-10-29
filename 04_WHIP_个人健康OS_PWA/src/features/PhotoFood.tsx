import { useEffect, useRef, useState } from 'react';
import { Camera, Upload, ImageOff, ScanLine, ArrowUpRight } from 'lucide-react';
import { CustomDish } from './DishMenu';
import type { Dish } from '../lib/dishes';
import { allDishes as dishes, isRecipe } from '../lib/recipes';
import { RecipeDetail } from './FoodLibrary';
import { db } from '../lib/db';
import { useUI, attempt } from '../lib/store';
export function PhotoFood() {
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null);
  const [image, setImage] = useState(''),
    [busy, setBusy] = useState(false),
    [status, setStatus] = useState(''),
    [error, setError] = useState(''),
    [results, setResults] = useState<{ label: string; score: number }[]>([]);
  const worker = useRef<Worker | null>(null),
    input = useRef<HTMLInputElement>(null);
  useEffect(() => () => worker.current?.terminate(), []);
  function cancel() {
    worker.current?.terminate();
    worker.current = null;
    setBusy(false);
    setStatus('识别已停止。仍可从菜单手动选择。');
  }
  async function load(file: File) {
    setError('');
    setResults([]);
    cancel();
    if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type)) {
      setError('请选择 JPEG、PNG 或 WebP 照片；HEIC 可先导出为 JPEG。');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('照片超过 20 MB，请选择较小的图片。');
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement('canvas');
      const ratio = Math.min(1, 768 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.round(bitmap.width * ratio);
      canvas.height = Math.round(bitmap.height * ratio);
      canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      setImage(canvas.toDataURL('image/jpeg', 0.85));
      setStatus('照片准备好了。');
    } catch {
      setError('浏览器无法解码这张照片，请改用 JPEG 或 PNG。');
    }
  }
  function recognize() {
    if (!image || busy) return;
    setBusy(true);
    setError('');
    setResults([]);
    setStatus('首次使用正在下载本地识别模型，可能需要几分钟…');
    try {
      worker.current ??= new Worker(new URL('../workers/food.worker.ts', import.meta.url), {
        type: 'module',
      });
      worker.current.onmessage = (e) => {
        if (e.data.type === 'progress') {
          setStatus(
            e.data.status === 'progress'
              ? `正在下载模型文件${e.data.progress == null ? '' : ` ${Math.round(e.data.progress)}%`}…`
              : '正在准备本地识别模型…',
          );
        } else if (e.data.type === 'result') {
          setBusy(false);
          setStatus('识别完成，请你确认菜品。');
          setResults(e.data.result);
        } else {
          setBusy(false);
          setError('模型暂时无法加载或运行。请检查网络，或直接使用菜品菜单。');
          worker.current?.terminate();
          worker.current = null;
        }
      };
      worker.current.onerror = () => {
        setBusy(false);
        setError('当前浏览器无法运行本地识别。请直接使用菜单选择。');
      };
      worker.current.postMessage({
        image,
        labels: [
          ...dishes.map((d) => d.photoLabel),
          'a photograph of a non-food object',
          'a photograph of a person',
          'a photograph of a landscape',
        ],
      });
    } catch {
      setBusy(false);
      setError('当前浏览器不支持此识别模型，请使用菜单选择。');
    }
  }
  const candidates = results
      .filter((r) => dishes.some((d) => d.photoLabel === r.label))
      .slice(0, 3),
    isFood = results.length && dishes.some((d) => d.photoLabel === results[0].label);
  if (selectedDish && isRecipe(selectedDish))
    return <RecipeDetail recipe={selectedDish} onBack={() => setSelectedDish(null)} />;
  if (selectedDish) return <CustomDish dish={selectedDish} onBack={() => setSelectedDish(null)} />;
  return (
    <div className="photo-food">
      <div className="dish-introduction">
        <ScanLine size={26} />
        <div>
          <h3>拍下这一餐，先认菜，再记量。</h3>
          <p>照片在设备内处理，不上传到识别服务器。</p>
        </div>
      </div>
      <input
        ref={input}
        className="sr-only"
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="选择或拍摄餐食照片"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void load(f);
          e.target.value = '';
        }}
      />
      {image ? (
        <div className="food-photo-preview">
          <img src={image} alt="待识别的餐食" />
          <button
            disabled={busy}
            className="button secondary"
            onClick={() => input.current?.click()}
          >
            <Camera size={17} />
            重新选择
          </button>
        </div>
      ) : (
        <button className="photo-dropzone" onClick={() => input.current?.click()}>
          <Camera size={38} />
          <strong>选择或拍摄一张餐食照片</strong>
          <span>桌面可选择图片 · 手机可调用相机</span>
          <small>JPEG / PNG / WebP · 最大 20 MB</small>
        </button>
      )}
      <div className="callout">
        <strong>设备内辅助识别 · 实验功能</strong>
        <p>
          首次需联网下载 CLIP 量化模型（约 150
          MB，具体以下载为准），之后由浏览器缓存。会联网获取公开模型文件，照片留在本机。桌面选择图片，手机可拍照。
        </p>
        <p>
          照片无法测量克数、食用油或隐藏配料。结果只用于匹配菜单，热量必须由你确认菜品和份量后计算。
        </p>
      </div>
      {image && (
        <button disabled={busy} className="button primary full-width" onClick={recognize}>
          <ScanLine size={18} />
          {busy ? '正在设备内处理…' : '同意下载模型，开始辅助识别'}
        </button>
      )}
      {busy && (
        <>
          <div className="skeleton skeleton-line" />
          <button className="text-button" onClick={cancel}>
            停止识别，手动选择
          </button>
        </>
      )}
      {status && (
        <p className="muted text-sm" role="status">
          {status}
        </p>
      )}
      {error && (
        <p className="inline-error" role="alert">
          <ImageOff size={18} />
          {error}
        </p>
      )}
      {results.length > 0 &&
        (!isFood ? (
          <div className="callout">
            这张图片未匹配为菜单中的食物。请换一张，或手动选择；不会自动生成热量。
          </div>
        ) : (
          <div className="photo-candidates">
            <h4>可能是这些菜，请确认</h4>
            {candidates.map((r) => {
              const d = dishes.find((x) => x.photoLabel === r.label)!;
              return (
                <button
                  key={d.id}
                  className="food-result candidate"
                  onClick={() =>
                    void attempt(async () => {
                      if (d.food) {
                        if (!(await db.foods.get(d.food.id))) await db.foods.put(d.food);
                        useUI.getState().selectFood(d.food.id, d.defaultGrams);
                      } else setSelectedDish(d);
                    })
                  }
                >
                  <span>
                    <strong>{d.name}</strong>
                    <small>菜单相对匹配分数 {(r.score * 100).toFixed(0)}% · 非可靠度概率</small>
                  </span>
                  <ArrowUpRight size={18} />
                </button>
              );
            })}
          </div>
        ))}
      <button
        className="button secondary full-width"
        onClick={() => useUI.getState().open('dishes')}
      >
        <Upload size={17} />
        直接从菜品菜单选择
      </button>
      <p className="source-note">
        模型：Xenova / CLIP
        ViT-B/32。当前仅匹配菜单中的候选菜品，不能识别所有餐食；浏览器内存或网络不足时可随时手动记录。
      </p>
    </div>
  );
}
