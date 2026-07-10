// NHentai Downloader - Background Script (Manifest V3 Service Worker)
// Updated for API v2 and modern Chrome extension standards

importScripts('js/parsing.js', 'js/jszip/dist/jszip.min.js', 'js/FileSaver.js/dist/FileSaver.min.js');

let progressFunction;
let doujinshiName;
let currProgress = 100;
let names = [];
let isDownloading = false;

// Clean name function
function cleanName(name) {
    let cleaned = "";
    name.split("").forEach(function(char) {
        if (char === " ") {
            cleaned += "_";
        } else if (char !== "/" && char !== "\\" && char !== "?" && char !== "%" && 
                   char !== "*" && char !== ":" && char !== "|" && char !== '"' && 
                   char !== "<" && char !== ">" && char !== ".") {
            cleaned += char;
        }
    });
    return cleaned.replace(/_+/g, "_");
}

// Helper to get number with leading zeros
function getNumberWithZeros(num) {
    if (num < 10) return "00" + num;
    if (num < 100) return "0" + num;
    return "" + num;
}

// Fetch image as blob with retry logic
async function fetchImage(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return await response.blob();
        } catch (error) {
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

// Download single page in RAW mode
async function downloadPageRaw(folderName, mediaId, pageIndex, pageInfo, errorCb) {
    const ext = pageInfo.t === 'j' ? 'jpg' : pageInfo.t === 'p' ? 'png' : 'gif';
    const pageNum = getNumberWithZeros(pageIndex + 1);
    const imageUrl = `https://i${(pageIndex % 4) + 1}.nhentai.net/galleries/${mediaId}/${pageIndex + 1}.${ext}`;
    
    try {
        chrome.downloads.download({
            url: imageUrl,
            filename: folderName + "/" + pageNum + "." + ext,
            saveAs: false
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                if (errorCb) errorCb("Download failed: " + chrome.runtime.lastError.message);
            }
        });
    } catch (error) {
        console.error(`Failed to download page ${pageIndex + 1}:`, error);
        if (errorCb) errorCb(error.message);
    }
}

// Download all pages for a gallery
async function downloadPages(galleryData, folderName, errorCb, mediaId, useZip = true, displayName = "") {
    const pages = galleryData.images.pages;
    const totalPages = pages.length;
    
    const settings = await new Promise(resolve => {
        chrome.storage.sync.get({ useZip: "zip" }, resolve);
    });
    
    const useZipFile = settings.useZip === "zip" || settings.useZip === "cbz";
    
    if (!useZipFile) {
        // RAW mode - download each page separately
        currProgress = 100;
        if (progressFunction) {
            progressFunction(currProgress, doujinshiName, false);
        }
        
        for (let i = 0; i < totalPages; i++) {
            await downloadPageRaw(folderName, mediaId, i, pages[i], errorCb);
        }
        
        if (progressFunction) {
            progressFunction(100, null, true);
        }
        return;
    }
    
    // ZIP mode - create archive
    const zip = new JSZip();
    const folder = zip.folder(folderName);
    
    for (let i = 0; i < totalPages; i++) {
        const pageNum = getNumberWithZeros(i + 1);
        const page = pages[i];
        const ext = page.t === 'j' ? 'jpg' : page.t === 'p' ? 'png' : 'gif';
        const filename = pageNum + "." + ext;
        
        try {
            const imageUrl = `https://i${(i % 4) + 1}.nhentai.net/galleries/${mediaId}/${i + 1}.${ext}`;
            const blob = await fetchImage(imageUrl);
            folder.file(filename, blob);
            
            // Update progress
            currProgress = Math.round(((i + 1) / totalPages) * 90);
            if (progressFunction) {
                progressFunction(currProgress, doujinshiName + "/" + filename, false);
            }
        } catch (error) {
            console.error(`Failed to download page ${i + 1}:`, error);
            if (errorCb) errorCb(`Failed to download page ${i + 1}: ${error.message}`);
        }
    }
    
    // Generate and save ZIP
    try {
        if (progressFunction) {
            progressFunction(90, "Creating ZIP archive...", false);
        }
        
        const content = await zip.generateAsync({ type: "blob" }, (metadata) => {
            if (progressFunction) {
                const zipProgress = 90 + (metadata.percent / 100) * 10;
                progressFunction(Math.round(zipProgress), metadata.currentFile || "Compressing...", true);
            }
        });
        
        const fileExt = settings.useZip === "cbz" ? "cbz" : "zip";
        const fileName = folderName + "." + fileExt;
        
        saveAs(content, fileName);
        
        currProgress = 100;
        if (progressFunction) {
            progressFunction(100, null, true);
        }
    } catch (error) {
        console.error("Failed to create ZIP:", error);
        if (errorCb) errorCb("Failed to create ZIP: " + error.message);
    }
}

// Main download function for single gallery
async function downloadDoujinshi(galleryData, galleryId, customName, displayName, mediaId) {
    if (isDownloading) {
        return { error: "Already downloading" };
    }
    
    isDownloading = true;
    currProgress = 0;
    doujinshiName = displayName || customName;
    names = [doujinshiName];
    
    try {
        await downloadPages(galleryData, cleanName(customName), (err) => {
            console.error("Download error:", err);
        }, mediaId, true, displayName);
        
        isDownloading = false;
        return { success: true };
    } catch (error) {
        console.error("Download failed:", error);
        isDownloading = false;
        currProgress = 100;
        return { error: error.message };
    }
}

// Message handler for communication with popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
        try {
            switch (message.action) {
                case "downloadDoujinshi":
                    const result = await downloadDoujinshi(
                        message.galleryData,
                        message.galleryId,
                        message.customName,
                        message.displayName,
                        message.mediaId
                    );
                    sendResponse(result);
                    break;
                    
                case "goBack":
                    currProgress = -1;
                    sendResponse({ success: true });
                    break;
                    
                case "checkDownloadStatus":
                    sendResponse({ isFinished: !isDownloading });
                    break;
                    
                case "getProgress":
                    sendResponse({ 
                        percent: currProgress, 
                        filename: doujinshiName,
                        isComplete: currProgress === 100 || currProgress === -1
                    });
                    break;
                    
                default:
                    sendResponse({ error: "Unknown action" });
            }
        } catch (error) {
            console.error("Message handler error:", error);
            sendResponse({ error: error.message });
        }
    })();
    
    return true; // Keep channel open for async response
});

// Export functions for legacy compatibility
window.downloadDoujinshi = downloadDoujinshi;
window.goBack = () => { currProgress = -1; };
window.isDownloadFinished = () => currProgress === 100 || currProgress === -1;
window.updateProgress = (fn) => { progressFunction = fn; };
