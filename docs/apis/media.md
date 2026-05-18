# Media API

API reference for handling secure media uploads using presigned S3 URLs and dynamic image serving.

## Overview

OppSkills does not accept direct `multipart/form-data` uploads to its backend to save bandwidth. Instead, it generates a presigned Amazon S3 POST URL, allowing the client to upload files directly to S3.

**Base Paths**: `/media`, `/image`

---

## 1. Direct S3 Uploads (Presigned URLs)

### Get Presigned URL for Image (`POST /media/presign-image`)
**Method**: `POST`
**Description**: Creates a presigned POST policy for uploading an image directly to S3. 
**Request Body**:
```json
{
  "purpose": "HACKATHON_BANNER",
  "mimeType": "image/jpeg"
}
```
**Response**: Returns the `uploadUrl` (S3 Bucket URL) and necessary `fields` (like signature, policy, key) to be included in the client-side FormData request to S3. It also returns the final `publicUrl`.

### Get Presigned URL for Document (`POST /media/presign-document`)
**Method**: `POST`
**Description**: Creates a presigned POST policy for uploading documents (PDF, DOCX) directly to S3.
**Request Body**:
```json
{
  "purpose": "HACKATHON_ATTACHMENT",
  "mimeType": "application/pdf",
  "fileName": "problem_statement.pdf"
}
```

**UI Integration Guide**:
In Next.js/React, you would fetch the presigned URL from our backend, and then do a `fetch` directly to S3:
```javascript
const { uploadUrl, fields, publicUrl } = await getPresignedImage({ purpose: "AVATAR", mimeType: file.type });
const formData = new FormData();
Object.entries(fields).forEach(([k, v]) => formData.append(k, v));
formData.append("file", file);
await fetch(uploadUrl, { method: "POST", body: formData });
// Now save publicUrl to the database
```

**Flutter Integration Guide (using `http` / `http.MultipartRequest`)**:
```dart
// 1. Fetch presigned details from backend
final response = await http.post(
  Uri.parse('https://api.oppskills.com/media/presign-image'),
  headers: {'Authorization': 'Bearer $token', 'Content-Type': 'application/json'},
  body: jsonEncode({"purpose": "HACKATHON_BANNER", "mimeType": "image/jpeg"}),
);
final data = jsonDecode(response.body);

// 2. Upload directly to S3
var request = http.MultipartRequest('POST', Uri.parse(data['uploadUrl']));
data['fields'].forEach((key, value) {
  request.fields[key] = value;
});
request.files.add(await http.MultipartFile.fromPath('file', localImagePath));
var uploadResponse = await request.send();

// 3. Save data['publicUrl'] to database
```

---

## 2. Dynamic Image Resizing

### Serve Resized Image (`GET /image/serve`)
**Method**: `GET`
**Description**: Takes a raw S3 image URL and serves a dynamically resized (1200x630), compressed JPEG version for Open Graph (OG) tags.
**Query Parameters**:
- `url`: The raw `assets.oppskills.com` image URL to fetch and resize.
