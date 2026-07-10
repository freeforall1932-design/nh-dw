// Updated for nhentai.net API v2 (April 2025)
var ParsingApi = {
    GetJson: function(responseText) {
        try {
            const data = JSON.parse(responseText);
            // Transform v2 API response to legacy format expected by background.js
            // API v2 structure: { pages: [{number, path, width, height}, ...] }
            if (data && data.pages && Array.isArray(data.pages)) {
                return JSON.stringify({
                    title: data.title || {},
                    media_id: data.media_id,
                    images: {
                        pages: data.pages.map(page => {
                            // Extract extension from path (e.g., "galleries/9/1.jpg" -> "jpg")
                            const ext = (page.path || '').split('.').pop().toLowerCase();
                            // Map extension to single char type
                            let typeChar = 'j'; // default
                            if (ext === 'png') typeChar = 'p';
                            else if (ext === 'gif') typeChar = 'g';
                            else if (ext === 'webp') typeChar = 'w';
                            
                            return {
                                t: typeChar,
                                w: page.width || 0,
                                h: page.height || 0
                            };
                        })
                    }
                });
            }
            return responseText;
        } catch (e) {
            console.error("Failed to parse API response:", e);
            return responseText;
        }
    },
    GetUrl: function(id) {
        // Updated to use API v2 endpoint
        return "https://nhentai.net/api/v2/galleries/" + id;
    }
};

// HTML parsing fallback (deprecated due to Cloudflare)
var ParsingHtml = {
    GetJson: function(responseText) {
        try {
            // Try multiple patterns for robustness
            let match = responseText.match(/gallery:\s*({[^}]+(?:{[^}]*}[^}]*)*}),?\s*start_page:/);
            if (!match) {
                match = responseText.match(/"gallery":\s*({[^}]+(?:{[^}]*}[^}]*)*})/);
            }
            if (match) {
                return match[1];
            }
            throw new Error("Could not find gallery data in HTML");
        } catch (e) {
            console.error("HTML parsing failed:", e);
            return "{}";
        }
    },
    GetUrl: function(id) {
        return "https://nhentai.net/g/" + id + "/1/";
    }
};

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
