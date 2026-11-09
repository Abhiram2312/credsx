export function skinIndex(index: number) {
  return ((index % 3) + 3) % 3;
}

export function bladeSize(stageWidth: number, stageHeight: number) {
  const reach = Math.min(stageWidth, stageHeight) / 2 - 16;
  const width = Math.max(110, Math.min(300, reach / 1.24));
  return { width, hub: width * 0.2 };
}
