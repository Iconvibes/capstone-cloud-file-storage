const cloudinary = require("../config/cloudinary");

const uploadToCloudinary = (fileBuffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: "auto", ...options },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    stream.end(fileBuffer);
  });
};

const getCloudinaryResourceType = (file) => {
  if (file.cloudUrl && file.cloudUrl.includes("/raw/")) return "raw";
  if (file.cloudUrl && file.cloudUrl.includes("/video/")) return "video";
  if (file.cloudUrl && file.cloudUrl.includes("/image/")) return "image";
  if (file.fileType === "image") return "image";
  return "raw";
};

const getCloudinaryStream = async (file, rangeHeader) => {
  const upstreamHeaders = {};
  if (rangeHeader) {
    upstreamHeaders.Range = rangeHeader;
  }

  // 1. Direct fetch from cloudUrl
  let upstream = await fetch(file.cloudUrl, {
    redirect: "follow",
    headers: upstreamHeaders,
  }).catch((err) => {
    console.error("Direct Cloudinary fetch network error:", err.message);
    return null;
  });

  // 2. If direct fetch was denied (401/403 due to Cloudinary ACL on PDF/ZIP) or failed,
  // authenticate with Cloudinary API credentials to generate a secure private download stream
  if (!upstream || upstream.status === 401 || upstream.status === 403) {
    if (file.cloudPublicId) {
      const resourceType = getCloudinaryResourceType(file);
      const ext = file.displayName && file.displayName.includes(".")
        ? file.displayName.split(".").pop()
        : (file.originalName && file.originalName.includes(".") ? file.originalName.split(".").pop() : "");

      try {
        const privateUrl = cloudinary.utils.private_download_url(
          file.cloudPublicId,
          ext,
          {
            resource_type: resourceType,
            type: "upload",
            attachment: true,
          }
        );

        upstream = await fetch(privateUrl, {
          redirect: "follow",
          headers: upstreamHeaders,
        }).catch((err) => {
          console.error("Authenticated Cloudinary fetch error:", err.message);
          return null;
        });
      } catch (signErr) {
        console.error("Error generating Cloudinary signed download URL:", signErr.message);
      }
    }
  }

  return upstream;
};

module.exports = { uploadToCloudinary, getCloudinaryResourceType, getCloudinaryStream };