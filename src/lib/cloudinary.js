const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

/**
 * Uploads a single image file to Cloudinary using an unsigned upload preset.
 * Returns the Cloudinary secure URL on success.
 *
 * @param {File} file - image file from an <input type="file">
 * @param {(percent: number) => void} [onProgress] - optional progress callback (0-100)
 * @returns {Promise<string>} secure_url of the uploaded image
 */
export function uploadImage(file, onProgress) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    return Promise.reject(
      new Error(
        "Cloudinary is not configured -- check VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env"
      )
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`);

    xhr.upload.onprogress = (event) => {
      if (onProgress && event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && response.secure_url) {
          resolve(response.secure_url);
        } else {
          reject(new Error(response.error?.message || "Cloudinary upload failed"));
        }
      } catch {
        reject(new Error("Cloudinary returned an unexpected response"));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during Cloudinary upload"));
    xhr.send(formData);
  });
}

/**
 * Uploads multiple image files in parallel (e.g. a solution's gallery).
 * @param {File[]} files
 * @returns {Promise<string[]>} secure_urls in the same order as files
 */
export function uploadImages(files) {
  return Promise.all(files.map((file) => uploadImage(file)));
}

/**
 * Appends f_auto,q_auto to a Cloudinary URL for automatic format/quality
 * optimization on delivery. Safe to call on any Cloudinary /upload/ URL.
 */
export function optimizedUrl(url) {
  if (!url || !url.includes("/upload/")) return url;
  return url.replace("/upload/", "/upload/f_auto,q_auto/");
}