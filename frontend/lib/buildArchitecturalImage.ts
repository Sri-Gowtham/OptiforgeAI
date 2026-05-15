export function buildArchitecturalImage(prompt: string): string {
  // Sanitize prompt
  const clean = prompt
    .trim()
    .replace(/["']/g, '') // remove quotes
    .replace(/[\r\n]+/g, ' ') // remove newline chars
    .replace(/\s+/g, ' ') // collapse multiple spaces
    .slice(0, 180); // limit to 180 chars

  // Detection logic
  const lower = clean.toLowerCase();

  const isStructural =
    /(footing|foundation|column|beam|slab|truss|steel frame|rcc|concrete|retaining wall|pile)/i.test(lower);

  const isInterior =
    /(bedroom|kitchen|apartment|villa|house|office|layout|floor plan|living room)/i.test(lower);

  let finalPrompt = '';

  if (isStructural) {
    finalPrompt =
      `structural engineering blueprint drawing of ${clean}, ` +
      `technical CAD drawing, engineering drafting style, ` +
      `concrete structural detail, dimensions, annotations, ` +
      `cross-section markings, blueprint rendering, ` +
      `white lines on dark navy background, ISO engineering drawing`;
  } else if (isInterior) {
    finalPrompt =
      `architectural floor plan blueprint of ${clean}, ` +
      `top-down layout, rooms labeled, dimensions, ` +
      `north arrow, title block, scale bar, ` +
      `clean CAD blueprint style, white lines on dark navy background`;
  } else {
    finalPrompt =
      `technical architectural engineering drawing of ${clean}, ` +
      `professional CAD blueprint rendering, dimension annotations, ` +
      `clean engineering linework, white lines on dark background`;
  }

  const seed = Math.floor(Math.random() * 999999);
  const realPollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(finalPrompt)}?width=1024&height=768&seed=${seed}&model=flux&nologo=true`;
  
  console.log('[ARCH IMG PROXY]', realPollinationsUrl);
  
  return `http://localhost:5000/api/images/architectural?url=${encodeURIComponent(realPollinationsUrl)}`;
}
