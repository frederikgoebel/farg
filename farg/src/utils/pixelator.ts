import RgbQuant from "rgbquant";
import getProminentColor from "./colorDifference";
import {
  getHairBB,
  getFaceBB,
  getUpperBodyBB,
  getLowerBodyBB,
  getThighsBB,
  getFeetBB,
  BoundingBox
} from "./getBoundingBoxes";

export type Swatch = string[];

// options with defaults (not required)
const options = {
  colors: 7, // desired palette size
  method: 2, // histogram method, 2: min-population threshold within subregions; 1: global top-population
  boxSize: [64, 64], // subregion dims (if method = 2)
  boxPxls: 2, // min-population threshold (if method = 2)
  initColors: 4096, // # of top-occurring colors  to start with (if method = 1)
  minHueCols: 256, // # of colors per hue group to evaluate regardless of counts, to retain low-count hues
  dithKern: null, // dithering kernel name, see available kernels in docs below
  dithDelta: 0, // dithering threshhold (0-1) e.g: 0.05 will not dither colors with <= 5% difference
  dithSerp: false, // enable serpentine pattern dithering
  palette: [], // a predefined palette to start with in r,g,b tuple format: [[r,g,b],[r,g,b]...]
  reIndex: false, // affects predefined palettes only. if true, allows compacting of sparsed palette once target palette size is reached. also enables palette sorting.
  useCache: true, // enables caching for perf usually, but can reduce perf in some cases, like pre-def palettes
  cacheFreq: 10, // min color occurance count needed to qualify for caching
  colorDist: "euclidean" // method used to determine color distance, can also be "manhattan"
};

// Retrieve palette and most prominent color from a specific area using BBs
export type ColorSample = {
  palette: string[];
  prominentColor: string;
};

const getColorSamples = (
  imageCanvas,
  { startX, startY, endX, endY }
): ColorSample => {
  const imgCtx = imageCanvas.getContext("2d");
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (ctx === null) {
    console.error("No context.");
    return { palette: [], prominentColor: "" };
  }
  const width = Math.abs(startX - endX);
  const height = Math.abs(startY - endY);
  canvas.width = width;
  canvas.height = height;
  const imageData = imgCtx.getImageData(startX, startY, width, height);
  ctx.putImageData(imageData, 0, 0);
  const q = new RgbQuant(options);
  q.sample(canvas);
  const swatches = q.palette();
  const div = document.createElement("div");
  div.style.display = "flex";
  div.style.border = "1px solid yellow";
  const sampledColors: ColorSample = { palette: [], prominentColor: "" };

  for (let i = 0; i < swatches.length; i += 4) {
    const [red, green, blue, alpha] = swatches.slice(i, i + 4);
    const colorDiv = document.createElement("div");
    colorDiv.style.width = "33px";
    colorDiv.style.height = "33px";
    colorDiv.style.background = `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    div.append(colorDiv);
    sampledColors.palette.push(`rgba(${red}, ${green}, ${blue}, ${alpha})`);
  }

  const imageLoader = document.getElementById("image-loader");
  if (imageLoader === null) {
    console.error("No context.");
    return { palette: [], prominentColor: "" };
  }
  imageLoader.append(canvas);
  imageLoader.append(div);

  const [red, green, blue, alpha] = getProminentColor(swatches, canvas);
  sampledColors["prominentColor"] = `rgba(${red}, ${green}, ${blue}, ${alpha})`;

  return sampledColors;
};

export const mockSwatch: ColorSample = {
  palette: ["#000000", "#111111", "#222222", "#333333", "#444444", "#555555"],
  prominentColor: "#444444"
};

export const generateSwatches = (
  imageCanvas,
  boundingBoxes: BoundingBox[]
): ColorSample[] => {
  const hairBB = boundingBoxes[0];
  const faceBB = boundingBoxes[1];
  const upperBodyBB = boundingBoxes[2];
  const lowerBodyBB = boundingBoxes[3];
  const thighsBB = boundingBoxes[4];
  const feetBB = boundingBoxes[5];

  const hairBox = getColorSamples(imageCanvas, hairBB);
  const skinBox = getColorSamples(imageCanvas, faceBB);
  const upperBodyBox = getColorSamples(imageCanvas, upperBodyBB);
  const lowerBodyBox = getColorSamples(imageCanvas, lowerBodyBB);
  const thighsBox = getColorSamples(imageCanvas, thighsBB);
  const feetBox = getColorSamples(imageCanvas, feetBB);

  return [hairBox, skinBox, upperBodyBox, lowerBodyBox, thighsBox, feetBox];
};

export default generateSwatches;
