// translator.js - Shared translator functions for all pages

class VaultTranslator {
    constructor() {
        this.initialized = false;
        this.userLanguage = null;
        this.supportedLanguages = [
            'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko',
            'ar', 'hi', 'bn', 'tr', 'vi', 'th', 'nl', 'pl', 'uk', 'fa'
        ];
    }

    // Initialize translator on any page
    init() {
        if (this.initialized) return;

        // Check if Google Translate is already loaded
        if (!window.google || !window.google.translate) {
            this.loadGoogleTranslate();
        } else {
            this.setupTranslator();
        }

        this.initialized = true;
    }

    loadGoogleTranslate() {
        const script = document.createElement('script');
        script.src = '//translate.google.com/translate_a/element.js?cb=vaultTranslateInit';
        script.type = 'text/javascript';
        document.head.appendChild(script);

        // Global callback
        window.vaultTranslateInit = () => {
            this.setupTranslator();
        };
    }

    setupTranslator() {
        // Create translator element if it doesn't exist
        if (!document.getElementById('google_translate_element')) {
            const div = document.createElement('div');
            div.id = 'google_translate_element';
            div.style.display = 'none';
            document.body.appendChild(div);
        }

        // Initialize Google Translate
        new google.translate.TranslateElement({
            pageLanguage: 'en',
            includedLanguages: this.supportedLanguages.join(','),
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false
        }, 'google_translate_element');

        // Apply custom styles
        this.applyCustomStyles();

        // Apply saved language preference
        this.applySavedLanguage();

        // Setup language change listener
        this.setupLanguageListener();
    }

    applyCustomStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Hide Google branding */
            .goog-te-banner-frame, .skiptranslate {
                display: none !important;
            }
            
            /* Fix body positioning */
            body {
                top: 0 !important;
            }
            
            /* Better dropdown */
            .goog-te-combo {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif !important;
                border: 2px solid #eaeaea !important;
                border-radius: 8px !important;
                padding: 8px 35px 8px 15px !important;
                background: white !important;
                color: #333 !important;
            }
        `;
        document.head.appendChild(style);
    }

    setupLanguageListener() {
        const combo = document.querySelector('.goog-te-combo');
        if (combo) {
            combo.addEventListener('change', (e) => {
                const lang = e.target.value;
                this.saveLanguagePreference(lang);
                this.showTranslationNotification(lang);
            });
        }
    }

    saveLanguagePreference(lang) {
        localStorage.setItem('vault_translate_lang', lang);
        // Set cookie for server-side if needed
        document.cookie = `vault_lang=${lang}; path=/; max-age=31536000`;
    }

    applySavedLanguage() {
        const savedLang = localStorage.getItem('vault_translate_lang');
        if (savedLang && this.supportedLanguages.includes(savedLang)) {
            const combo = document.querySelector('.goog-te-combo');
            if (combo) {
                setTimeout(() => {
                    combo.value = savedLang;
                    combo.dispatchEvent(new Event('change'));
                }, 500);
            }
        }
    }

    showTranslationNotification(lang) {
        const langNames = {
            'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
            'it': 'Italian', 'pt': 'Portuguese', 'ru': 'Russian', 'zh': 'Chinese',
            'ja': 'Japanese', 'ko': 'Korean', 'ar': 'Arabic', 'hi': 'Hindi',
            'bn': 'Bengali', 'tr': 'Turkish', 'vi': 'Vietnamese', 'th': 'Thai'
        };

        // Remove existing notification
        const existing = document.querySelector('.translation-notification');
        if (existing) existing.remove();

        const notification = document.createElement('div');
        notification.className = 'translation-notification';
        notification.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>Site translated to ${langNames[lang] || lang.toUpperCase()}</span>
            <button onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add styles if not already present
        if (!document.querySelector('#translation-notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'translation-notification-styles';
            styles.textContent = `
                .translation-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.1);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    z-index: 10000;
                    animation: slideInRight 0.3s ease;
                    border-left: 4px solid #4cc9f0;
                }
                
                .translation-notification i:first-child {
                    color: #4cc9f0;
                }
                
                .translation-notification span {
                    color: #333;
                    font-weight: 500;
                }
                
                .translation-notification button {
                    background: none;
                    border: none;
                    color: #999;
                    cursor: pointer;
                    padding: 0;
                }
                
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @media (prefers-color-scheme: dark) {
                    .translation-notification {
                        background: #1a1a2e;
                        border-left-color: #4cc9f0;
                    }
                    
                    .translation-notification span {
                        color: #e1e1e1;
                    }
                }
            `;
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    // Get current language
    getCurrentLanguage() {
        const combo = document.querySelector('.goog-te-combo');
        return combo ? combo.value : 'en';
    }

    // Translate specific text (manual translation)
    async translateText(text, targetLang) {
        // This would require Google Cloud Translation API
        // For now, we'll use Google Translate widget
        console.log('Manual translation requires API setup');
        return text;
    }

    // Detect user's language
    detectUserLanguage() {
        const browserLang = navigator.language || navigator.userLanguage;
        const primaryLang = browserLang.split('-')[0];

        // Check if supported
        if (this.supportedLanguages.includes(primaryLang) && primaryLang !== 'en') {
            return primaryLang;
        }
        return 'en';
    }

    // Suggest translation to user
    suggestTranslation() {
        if (localStorage.getItem('vault_lang_suggested')) return;

        const userLang = this.detectUserLanguage();
        if (userLang !== 'en') {
            this.showLanguageSuggestion(userLang);
        }
    }

    showLanguageSuggestion(lang) {
        // Implementation similar to the one in index.html
        // You can reuse the same suggestion popup logic
    }
}

// Create global instance
window.VaultTranslator = new VaultTranslator();

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.VaultTranslator.init();
    window.VaultTranslator.suggestTranslation();
});