// Minimal boot check
if(window.legacyErrors) window.legacyErrors.push("INFO: Minimal Script Loaded");

window.onload = function() {
    try {
        if(window.legacyErrors) window.legacyErrors.push("INFO: Minimal Window Loaded");
        document.getElementById('clock').innerHTML = "Loaded!";
    } catch(e) {
        if(window.legacyErrors) window.legacyErrors.push("ERR: " + e.message);
    }
};
