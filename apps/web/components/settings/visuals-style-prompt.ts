export type BackgroundStyle = "neutral" | "bokeh" | "dark" | "keep";
export type LightingStyle = "natural" | "studio" | "moody" | "bright";
export type PerspectiveStyle = "angle_45" | "top_down" | "table_level";
export type CameraStyle = "smartphone" | "dslr" | "macro";

export type VisualStyleConfig = {
  background: BackgroundStyle;
  lighting: LightingStyle;
  perspective: PerspectiveStyle;
  camera: CameraStyle;
  textureBoost: boolean;
  consistentMenu: boolean;
};

export function labelBackground(value: VisualStyleConfig["background"]) {
  switch (value) {
    case "neutral":
      return "neutre";
    case "bokeh":
      return "bokeh";
    case "dark":
      return "fosc";
    case "keep":
      return "original";
    default:
      return value;
  }
}

export function labelLighting(value: VisualStyleConfig["lighting"]) {
  switch (value) {
    case "natural":
      return "natural";
    case "studio":
      return "estudi";
    case "moody":
      return "moody";
    case "bright":
      return "bright";
    default:
      return value;
  }
}

export function labelPerspective(value: VisualStyleConfig["perspective"]) {
  switch (value) {
    case "angle_45":
      return "45°";
    case "top_down":
      return "zenital";
    case "table_level":
      return "taula";
    default:
      return value;
  }
}

export function buildPromptFromStyle(style: VisualStyleConfig) {
  const safetyBlock =
    "Preserve the exact dish, ingredients, portion size, plating, and arrangement. Do not add, remove, or replace any ingredients or garnishes. Keep the same plate/bowl and tableware. Photorealistic. No stylization. No text. No logos. No watermark.";

  const backgroundBlock = (() => {
    switch (style.background) {
      case "neutral":
        return "Use a clean, neutral background. Remove distracting clutter.";
      case "bokeh":
        return "Keep a subtle restaurant background with gentle bokeh. Avoid clutter.";
      case "dark":
        return "Use a dark, elegant background. Keep it clean and minimal.";
      case "keep":
        return "Preserve the original background as much as possible, only removing small distractions.";
      default:
        return "Use a clean, neutral background.";
    }
  })();

  const lightingBlock = (() => {
    switch (style.lighting) {
      case "natural":
        return "Natural soft lighting, balanced and flattering. Avoid harsh shadows.";
      case "studio":
        return "Soft studio lighting (softbox), even exposure, accurate whites.";
      case "moody":
        return "Moody low-key lighting, controlled contrast, still photorealistic.";
      case "bright":
        return "Bright high-key lighting, clean whites, vibrant yet realistic colors.";
      default:
        return "Natural soft lighting.";
    }
  })();

  const perspectiveBlock = (() => {
    switch (style.perspective) {
      case "angle_45":
        return "Shot at a classic 45-degree angle.";
      case "top_down":
        return "Shot from a top-down (overhead) perspective.";
      case "table_level":
        return "Shot at table level, slightly above the plate.";
      default:
        return "Shot at a classic 45-degree angle.";
    }
  })();

  const cameraBlock = (() => {
    switch (style.camera) {
      case "smartphone":
        return "Looks like a premium smartphone photo, crisp and clean.";
      case "dslr":
        return "Looks like a professional DSLR editorial food photo with gentle depth of field.";
      case "macro":
        return "Macro food photo emphasizing ingredient textures with shallow depth of field.";
      default:
        return "Looks like a premium smartphone photo.";
    }
  })();

  const textureBlock = style.textureBoost
    ? "Enhance textures (crispy, juicy, creamy) without changing ingredients."
    : "";

  const consistencyBlock = style.consistentMenu
    ? "Keep a consistent lighting, background, color temperature, and exposure across all images in this menu set."
    : "";

  const parts = [
    "Enhance this dish photo into professional food photography.",
    safetyBlock,
    backgroundBlock,
    lightingBlock,
    perspectiveBlock,
    cameraBlock,
    textureBlock,
    consistencyBlock,
    "Improve lighting, color balance, texture, and sharpness to look appetizing yet photorealistic.",
  ].filter((part) => part.trim().length > 0);

  return parts.join(" ");
}
