const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const ROOT_FOLDER = "TensoCraft";
const NO_CATEGORY_FOLDER = "uncategorized"; // only ever used as a Cloudinary folder name, never shown in the UI

export function slugify(text = "") {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Cloudinary reserves folder segments that look like a version ("v" + digits).
function folderSegment(text) {
  const slug = slugify(text);
  return /^v\d/.test(slug) ? `p-${slug}` : slug;
}

// TensoCraft/<category>/<solution-slug>
// No category -> TensoCraft/uncategorized/<solution-slug>
export function buildSolutionFolder(category, solutionSlug) {
  const categorySegment = folderSegment(category) || NO_CATEGORY_FOLDER;
  const productSegment = folderSegment(solutionSlug) || "untitled";
  return `${ROOT_FOLDER}/${categorySegment}/${productSegment}`;
}

// Unsigned upload straight from the browser. Resolves to the secure_url.
export async function uploadToFolder(file, folder) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary is not configured (VITE_CLOUDINARY_CLOUD_NAME / VITE_CLOUDINARY_UPLOAD_PRESET)."
    );
  }

  const body = new FormData();
  body.append("file", file);
  body.append("upload_preset", UPLOAD_PRESET);
  body.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body }
  );
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.error?.message || `Upload failed (HTTP ${res.status}).`);
  }
  if (!data.secure_url) {
    throw new Error("Upload finished but Cloudinary returned no image URL.");
  }
  return data.secure_url;
}