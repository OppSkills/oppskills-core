# Media API

This document explains how to upload files (images and documents) to OppSkills and how to dynamically resize images for social media previews.

## Overview

To save server bandwidth, OppSkills **does not** accept direct file uploads to our API. Instead, we use a two-step "presigned URL" process:

1. Your frontend asks the OppSkills backend for permission to upload a file.
2. The backend returns a temporary, secure Amazon S3 URL.
3. Your frontend uploads the file directly to Amazon S3 using that URL.

---

## 1. Requesting Upload URLs

### Upload an Image

- **Endpoint:** `POST /media/presign-image`
- **Usage:** Call this when a user wants to upload an avatar, banner, or any other image.
- **Body:**
  ```json
  {
    "purpose": "HACKATHON_BANNER", // What is this image for? (e.g., AVATAR, EVENT_THUMBNAIL)
    "mimeType": "image/jpeg" // The file format (e.g., image/png)
  }
  ```
- **Response:** Returns an `uploadUrl` (where to send the file), `fields` (security tokens), and a `publicUrl` (the final URL you will save to the database).

### Upload a Document

- **Endpoint:** `POST /media/presign-document`
- **Usage:** Call this when a user wants to upload a PDF or Word document (e.g., for a hackathon problem statement).
- **Body:**
  ```json
  {
    "purpose": "HACKATHON_ATTACHMENT",
    "mimeType": "application/pdf",
    "fileName": "problem_statement.pdf" // Required for documents
  }
  ```

---

## 2. Frontend Implementation Examples

Here is how you execute the two-step upload process on the frontend.

### Web (Next.js / React)

```javascript
// 1. Ask backend for permission
const response = await fetch("https://api.oppskills.com/media/presign-image", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ purpose: "AVATAR", mimeType: file.type }),
});
const { uploadUrl, fields, publicUrl } = await response.json();

// 2. Attach security fields and the file itself
const formData = new FormData();
Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
formData.append("file", file);

// 3. Upload directly to S3
await fetch(uploadUrl, { method: "POST", body: formData });

// 4. Save the final publicUrl to your database!
```

### Mobile (React Native / Expo)

In React Native, you use `expo-image-picker` to select the file, then format the `FormData` object slightly differently than on the web.

```typescript
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "@clerk/clerk-expo";

export function useS3Uploader() {
  const { getToken } = useAuth();

  const uploadImage = async () => {
    // 1. Pick an image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) return null;

    const asset = result.assets[0];
    const mimeType = asset.mimeType || "image/jpeg";

    // 2. Ask backend for permission
    const token = await getToken();
    const backendResponse = await fetch(
      "https://api.oppskills.com/media/presign-image",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ purpose: "HACKATHON_BANNER", mimeType }),
      },
    );

    if (!backendResponse.ok) throw new Error("Failed to get upload URL");
    const { uploadUrl, fields, publicUrl } = await backendResponse.json();

    // 3. Attach security fields and the file
    const formData = new FormData();
    Object.keys(fields).forEach((key) => formData.append(key, fields[key]));

    // React Native requires this specific object structure for files
    const filename =
      asset.fileName || asset.uri.split("/").pop() || "upload.jpg";
    formData.append("file", {
      uri: asset.uri,
      type: mimeType,
      name: filename,
    } as any);

    // 4. Upload directly to S3
    const s3Response = await fetch(uploadUrl, {
      method: "POST",
      body: formData, // Do NOT manually set Content-Type header here
    });

    if (!s3Response.ok) throw new Error("S3 Upload failed");

    // 5. Save the final publicUrl to your database!
    return publicUrl;
  };

  return { uploadImage };
}
```

---

## 3. Dynamic Image Resizing

- **Endpoint:** `GET /image/serve?url=<raw_s3_url>`
- **Usage:** Use this when generating Open Graph (OG) meta tags for social media sharing.
- **What it does:** It takes a raw, potentially massive S3 image URL and instantly serves a compressed, perfectly sized (1200x630) JPEG version optimized for Twitter, LinkedIn, and iMessage previews.
