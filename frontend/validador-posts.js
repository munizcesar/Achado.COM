/**
 * 🔴 VALIDADOR AUTOMÁTICO DE POSTS
 * 
 * FUNÇÃO: Verifica AUTOMATICAMENTE se o post está correto
 * SEM ERROS = Pronto para publicar
 * COM ERROS = Lista exata do que corrigir
 * 
 * EM DESENVOLVIMENTO: Mostra badge visual no topo
 * EM PRODUÇÃO: Roda silenciosamente (apenas console)
 */

// Detectar ambiente
const isDevelopment = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname === '';

function validarPost() {
    // Seleciona elementos do documento atual
    const titulo = document.querySelector('.materia-header h1')?.textContent || '';
    const metaDescription = document.querySelector('meta[name="description"]')?.content || '';
    const metaKeywords = document.querySelector('meta[name="keywords"]')?.content || '';
    const imagemPrincipal = document.querySelector('.materia-img-principal');
    const linkCanonical = document.querySelector('link[rel="canonical"]')?.href || '';
    const ogTitle = document.querySelector('meta[property="og:title"]')?.content || '';
    const ogImage = document.querySelector('meta[property="og:image"]')?.content || '';
    const ogUrl = document.querySelector('meta[property="og:url"]')?.content || '';
    const botaoOferta = document.querySelector('.botao-oferta-vip');
    const botaoShare = document.querySelectorAll('.share-btn').length;
    
    const erros = [];
    const avisos = [];
    const sucessos = [];
    
    // ========== VALIDAÇÕES CRÍTICAS ==========
    
    // 1️⃣ TÍTULO
    if (titulo.includes('🔴')) {
        erros.push('❌ Título não foi preenchido (contém "🔴")');
    } else if (titulo.length < 20) {
        avisos.push('⚠️ Título muito curto (menos de 20 caracteres)');
    } else if (titulo.length > 120) {
        avisos.push('⚠️ Título muito longo (mais de 120 caracteres)');
    } else {
        sucessos.push('✅ Título correto: "' + titulo + '"');
    }
    
    // 2️⃣ META DESCRIPTION
    if (metaDescription.includes('🔴')) {
        erros.push('❌ Descrição meta não foi preenchida (contém "🔴")');
    } else if (metaDescription.length < 80) {
        avisos.push('⚠️ Descrição meta muito curta (menos de 80 caracteres)');
    } else if (metaDescription.length > 160) {
        avisos.push('⚠️ Descrição meta muito longa (mais de 160 caracteres)');
    } else {
        sucessos.push('✅ Meta description: "' + metaDescription.substring(0, 50) + '..."');
    }
    
    // 3️⃣ KEYWORDS
    if (metaKeywords.includes('🔴')) {
        erros.push('❌ Keywords não foram preenchidas (contém "🔴")');
    } else {
        const palavras = metaKeywords.split(' ').filter(p => p.length > 0);
        if (palavras.length < 10) {
            avisos.push('⚠️ Keywords insuficientes (' + palavras.length + '/10 palavras)');
        } else {
            sucessos.push('✅ Keywords: ' + palavras.length + ' palavras');
        }
    }
    
    // 4️⃣ IMAGEM PRINCIPAL
    if (!imagemPrincipal) {
        erros.push('❌ Imagem principal não encontrada (classe .materia-img-principal)');
    } else if (imagemPrincipal.src.includes('🔴')) {
        erros.push('❌ Imagem principal não foi preenchida (contém "🔴")');
    } else {
        sucessos.push('✅ Imagem principal: ' + imagemPrincipal.src.split('/').pop());
    }
    
    // 5️⃣ CANONICAL URL
    if (linkCanonical.includes('🔴') || !linkCanonical) {
        erros.push('❌ Canonical URL não foi preenchida corretamente');
    } else {
        sucessos.push('✅ Canonical URL: ' + linkCanonical.split('/').pop());
    }
    
    // 6️⃣ OPEN GRAPH (Compartilhamento Social)
    if (ogTitle.includes('🔴') || !ogTitle) {
        erros.push('❌ OG:TITLE não foi preenchido (essencial para WhatsApp/Facebook)');
    } else {
        sucessos.push('✅ OG:Title preenchido');
    }
    
    if (ogImage.includes('🔴') || !ogImage) {
        erros.push('❌ OG:IMAGE não foi preenchida (necessária para compartilhamento)');
    } else {
        sucessos.push('✅ OG:Image preenchida');
    }
    
    if (ogUrl.includes('🔴') || !ogUrl) {
        erros.push('❌ OG:URL não foi preenchida');
    } else {
        sucessos.push('✅ OG:Url preenchida');
    }
    
    // 7️⃣ BOX DE OFERTA
    if (!botaoOferta) {
        avisos.push('⚠️ Box de oferta não encontrada');
    } else if (botaoOferta.href.includes('🔴')) {
        erros.push('❌ Link de oferta não foi preenchido (contém "🔴")');
    } else {
        sucessos.push('✅ Link de oferta: ' + botaoOferta.href);
    }
    
    // 8️⃣ BOTÕES DE COMPARTILHAMENTO
    if (botaoShare < 4) {
        avisos.push('⚠️ Faltam botões de compartilhamento (tem ' + botaoShare + '/4)');
    } else {
        sucessos.push('✅ Todos os 4 botões de compartilhamento presentes');
    }
    
    // ========== RELATÓRIO CONSOLE ==========
    
    console.clear();
    console.log('%c📋 VALIDADOR AUTOMÁTICO DE POSTS - AchadoCerto.VIP', 'color: #D4AF37; font-size: 16px; font-weight: bold;');
    console.log('═'.repeat(60));
    
    if (erros.length === 0 && avisos.length === 0) {
        console.log('%c✅ TUDO PERFEITO! Post pronto para publicar!', 'color: #2ecc71; font-size: 14px; font-weight: bold;');
        console.log('');
        sucessos.forEach(s => console.log('%c' + s, 'color: #2ecc71;'));
        console.log('');
        console.log('%c🚀 Próximos passos:', 'color: #D4AF37; font-weight: bold;');
        console.log('1. Salve o arquivo HTML');
        console.log('2. Adicione a entrada em posts.js (no INÍCIO da array)');
        console.log('3. Teste no navegador (F5)');
        console.log('4. Compartilhe no Facebook Debugger: https://developers.facebook.com/tools/debug/');
    } else {
        if (erros.length > 0) {
            console.log('%c❌ ERROS CRÍTICOS (Deve corrigir antes de publicar):', 'color: #ff6b6b; font-size: 13px; font-weight: bold;');
            erros.forEach(e => console.log('%c' + e, 'color: #ff6b6b;'));
            console.log('');
        }
        
        if (avisos.length > 0) {
            console.log('%c⚠️ AVISOS (Recomendado corrigir):', 'color: #ffc107; font-size: 13px; font-weight: bold;');
            avisos.forEach(a => console.log('%c' + a, 'color: #ffc107;'));
            console.log('');
        }
        
        if (sucessos.length > 0) {
            console.log('%c✅ Correto:', 'color: #2ecc71; font-size: 13px; font-weight: bold;');
            sucessos.forEach(s => console.log('%c' + s, 'color: #2ecc71;'));
            console.log('');
        }
        
        console.log('%c📝 Instruções de Correção:', 'color: #D4AF37; font-weight: bold;');
        console.log('Procure por "🔴" no código HTML - todos os campos que precisam ser preenchidos estão marcados');
    }
    
    console.log('═'.repeat(60));
    
    // ========== BADGE VISUAL (APENAS EM DESENVOLVIMENTO) ==========
    if (isDevelopment) {
        mostrarBadgeValidacao(erros.length, avisos.length, sucessos.length);
    }
    
    // ========== RETORNA RESULTADO ==========
    return {
        erros: erros.length,
        avisos: avisos.length,
        valido: erros.length === 0
    };
}

function mostrarBadgeValidacao(totalErros, totalAvisos, totalSucessos) {
    // Verifica se badge já existe
    if (document.getElementById('validador-badge')) {
        document.getElementById('validador-badge').remove();
    }
    
    const badge = document.createElement('div');
    badge.id = 'validador-badge';
    
    let html = '';
    let cor = '';
    let mensagem = '';
    
    if (totalErros > 0) {
        cor = '#ff6b6b';
        mensagem = `🔴 ${totalErros} ERRO(S) ENCONTRADO(S)`;
        badge.className = 'validador-error';
    } else if (totalAvisos > 0) {
        cor = '#ffc107';
        mensagem = `⚠️ ${totalAvisos} AVISO(S)`;
        badge.className = 'validador-warning';
    } else {
        cor = '#2ecc71';
        mensagem = `✅ POST VALIDADO - PRONTO PARA PUBLICAR`;
        badge.className = 'validador-success';
    }
    
    badge.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: ${cor};
        color: white;
        padding: 15px 20px;
        text-align: center;
        font-weight: bold;
        font-size: 14px;
        z-index: 99999;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border-bottom: 3px solid rgba(0,0,0,0.2);
        cursor: pointer;
        animation: slideDown 0.3s ease;
    `;
    
    badge.innerHTML = `
        ${mensagem}
        <span style="margin-left: 20px; font-size: 12px; opacity: 0.9;">
            (Clique para fechar | Abra F12 para ver detalhes)
        </span>
    `;
    
    badge.onclick = () => badge.remove();
    
    document.body.insertBefore(badge, document.body.firstChild);
    
    // Criar animação
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideDown {
            from { transform: translateY(-100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        #validador-badge {
            animation: slideDown 0.3s ease;
        }
        
        #validador-badge:hover {
            opacity: 0.95;
        }
    `;
    document.head.appendChild(style);
}

// Executa automaticamente quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    validarPost();
    
    if (!isDevelopment) {
        console.log('💡 Post em produção - validação silenciosa ativa');
    }
});

// ========== FUNÇÃO DE TESTE ==========
function testarCompartilhamento() {
    const url = window.location.href;
    const titulo = document.querySelector('.materia-header h1')?.textContent || 'Post';
    
    console.log('%c📱 TESTE DE COMPARTILHAMENTO', 'color: #D4AF37; font-size: 14px; font-weight: bold;');
    console.log('🔗 URL:', url);
    console.log('📝 Título:', titulo);
    console.log('');
    console.log('Teste em:');
    console.log('WhatsApp: https://web.whatsapp.com/ (compartilhe o link)');
    console.log('Facebook: https://developers.facebook.com/tools/debug/ (paste ' + url + ')');
    console.log('Twitter: https://twitter.com/intent/tweet?url=' + encodeURIComponent(url));
}
