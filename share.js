// Share buttons functionality
document.addEventListener('DOMContentLoaded', function() {
    
    // Get page info
    const pageTitle = document.title || 'AchadoCerto.VIP';
    const pageUrl = window.location.href;
    const pageDescription = document.querySelector('meta[name="description"]')?.content || 'Descubra os melhores achados e ofertas verificadas em AchadoCerto.VIP';
    
    // Setup share button handlers
    const shareButtons = document.querySelectorAll('.share-btn');
    
    shareButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const network = this.dataset.network;
            shareContent(network, pageTitle, pageUrl, pageDescription);
        });
    });
    
    function shareContent(network, title, url, description) {
        let shareUrl = '';
        const encodedUrl = encodeURIComponent(url);
        const encodedTitle = encodeURIComponent(title);
        const encodedDesc = encodeURIComponent(description);
        
        // Get OG image from meta tag
        const ogImage = document.querySelector('meta[property="og:image"]')?.content || '';
        const encodedImage = encodeURIComponent(ogImage);
        
        switch(network) {
            case 'whatsapp':
                const whatsappText = encodeURIComponent(`${title}\n${url}`);
                shareUrl = `https://wa.me/?text=${whatsappText}`;
                break;
                
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&via=AchadoCertoVIP`;
                break;
                
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
                break;
                
            case 'telegram':
                shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`;
                break;
                
            case 'pinterest':
                shareUrl = `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedTitle}&media=${encodedImage}`;
                break;
                
            case 'copy-link':
                copyToClipboard(url);
                return;
        }
        
        if(shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }
    }
    
    function copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            // Show feedback
            const notification = document.createElement('div');
            notification.textContent = 'Link copiado!';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #25D366;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                font-weight: 600;
                z-index: 10000;
                animation: slideIn 0.3s ease;
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        });
    }
});

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOut {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }
`;
document.head.appendChild(style);
