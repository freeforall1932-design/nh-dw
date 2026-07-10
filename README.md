# NH DW (NHentai Downloader) - Repository Structure

## 📁 Directory Overview

### `/DISTRIBUTION/` - Ready-to-Install Extensions
Contains pre-built ZIP files ready for direct installation in Chrome.

- **`nh_dw_v3.0.0_mv3.zip`** (45KB) - ✅ **LATEST VERSION**
  - Version: 3.0.0
  - Manifest: V3 (Chrome Web Store compliant)
  - Features: API v2 support, concurrent downloads, bulk operations
  - Status: Ready for deployment
  
- **`NHDW CHROME EXTENSION V1.7.0 dcpdhacgmnhbfaebkcagkakpcighmeol.zip`** (43KB)
  - Version: 1.7.0 (Legacy)
  - Manifest: V2 (Deprecated)
  - Status: Historical archive only

### `/SOURCE_CODE/` - Development Source Files
Contains all source code for building and modifying the extension.

- **`nh_dw_source_v3.0.0/`** - ✅ **LATEST SOURCE**
  - Updated TypeScript/JavaScript source
  - API v2 integration
  - Manifest V3 compatible
  - Build-ready with webpack configuration
  
- **`original_nhdw_source_v2.2.0/`** - Original Reference
  - Original TypeScript source (v2.2.0)
  - Used as reference for porting
  
- **`NHDW source code-2.2.0.zip`** - Archived Source
  - Compressed archive of original v2.2.0 source

---

## 🚀 Installation (Latest Version v3.0.0)

### Quick Install
1. Download `DISTRIBUTION/nh_dw_v3.0.0_mv3.zip`
2. Extract to a folder
3. Open Chrome → `chrome://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked" → Select extracted folder
6. Visit `https://nhentai.net/` to use

---

## 🔧 Building from Source

### Prerequisites
- Node.js 16+
- npm or yarn

### Build Steps
```bash
cd SOURCE_CODE/nh_dw_source_v3.0.0/NHentaiDownloader-2.2.0/
npm install
npm run build
```

Built files will be available in the `js/` directory.

---

## 📋 Version History

| Version | Date | Manifest | Status | Notes |
|---------|------|----------|--------|-------|
| 3.0.0 | Apr 2025 | V3 | ✅ Current | API v2, MV3, bug fixes |
| 2.2.0 | Original | N/A | Reference | TypeScript source |
| 1.7.0 | Legacy | V2 | ⚠️ Deprecated | Lost source, binary only |

---

## 🐛 Known Issues & Fixes in v3.0.0

### Fixed:
- ✅ API endpoint updated to `/api/v2/galleries/{id}`
- ✅ Response structure parsing corrected (`data.pages` vs `data.images.pages`)
- ✅ Image URL construction using media_id correctly
- ✅ Extension naming shortened to "NH DW"
- ✅ Manifest V2 → V3 migration complete
- ✅ Service worker implementation for background scripts

### Requirements:
- Chrome 88+ (for Manifest V3 support)
- Internet connection for API access
- Cloudflare challenge may occasionally appear

---

## 📝 How to Delete Uploaded/Merged Files from Repository

If you need to remove files from Git history:

### Remove from Working Directory Only
```bash
git rm --cached filename.zip
git commit -m "Remove file from tracking"
git push
```

### Remove from Git History Completely (BFG recommended)
```bash
# Install BFG Repo-Cleaner
java -jar bfg.jar --delete-files filename.zip .
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

### Simple File Deletion
```bash
rm filename.zip
git add -A
git commit -m "Delete filename.zip"
git push
```

⚠️ **Warning**: Force pushing rewrites history. Coordinate with collaborators.

---

## 📄 License
See LICENSE file in root directory.
