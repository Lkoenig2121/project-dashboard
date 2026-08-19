export type PromptImage = {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
};

export const MAX_PROMPT_IMAGES = 4;
const MAX_EDGE = 1280;
const ACCEPT = ["image/png", "image/jpeg", "image/webp", "image/gif"];

export function isImageFile(file: File) {
  return ACCEPT.includes(file.type) || file.type.startsWith("image/");
}

export function parsePromptImages(value: unknown): PromptImage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is PromptImage => {
      if (!item || typeof item !== "object") return false;
      const image = item as PromptImage;
      return (
        typeof image.id === "string" &&
        typeof image.name === "string" &&
        typeof image.mimeType === "string" &&
        typeof image.dataUrl === "string" &&
        image.dataUrl.startsWith("data:image/") &&
        image.dataUrl.length < 1_800_000
      );
    })
    .slice(0, MAX_PROMPT_IMAGES);
}

function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read that image"));
    image.src = url;
  });
}

export async function fileToPromptImage(file: File): Promise<PromptImage> {
  if (!isImageFile(file)) {
    throw new Error("Use a PNG, JPEG, WebP, or GIF");
  }

  const sourceUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Could not read that image"));
    };
    reader.onerror = () => reject(new Error("Could not read that image"));
    reader.readAsDataURL(file);
  });

  const image = await loadImage(sourceUrl);
  const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not process that image");
  }
  context.drawImage(image, 0, 0, width, height);
  const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const dataUrl =
    mimeType === "image/png"
      ? canvas.toDataURL("image/png")
      : canvas.toDataURL("image/jpeg", 0.82);

  return {
    id: crypto.randomUUID(),
    name: file.name || "image",
    mimeType,
    dataUrl,
  };
}

export async function filesToPromptImages(
  files: File[],
  currentCount: number,
): Promise<PromptImage[]> {
  const room = Math.max(0, MAX_PROMPT_IMAGES - currentCount);
  const selected = files.filter(isImageFile).slice(0, room);
  return Promise.all(selected.map(fileToPromptImage));
}
