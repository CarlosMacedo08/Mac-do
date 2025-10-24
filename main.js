document.addEventListener('DOMContentLoaded', function () {
    // elementos (podem ser nulos se não existir na página)
    const sacolaQuantidade = document.getElementById('sacola-quantidade');
    const sacolaItens = document.getElementById('sacola-itens');
    const enviarWhatsapp = document.getElementById('enviar-whatsapp');
    const abrirSacola = document.getElementById('abrir-sacola');
    const sacolaEl = document.getElementById('sacola');
    const verTodosBtn = document.getElementById('ver-todos-produtos');
    const parcelamentoOpcoes = document.getElementById('parcelamento-opcoes');
    const parcelamentoInfo = document.getElementById('parcelamento-info');
    const valorParcelaEl = document.getElementById('valor-parcela');
    const metodoPagamento = document.getElementById('metodo-pagamento');
    const favoritosBtn = document.getElementById('favoritos-btn'); // botão no menu para ver favoritos
    const contatoBtn = document.getElementById('contato-btn');
    const contatoInfo = document.getElementById('contato-info');

    // estado
    let sacola = JSON.parse(localStorage.getItem('sacola')) || [];
    let parcelasSelecionadas = 5;

    // util: converte "R$ 1.234,56" => 1234.56
    function parsePreco(text) {
        if (!text) return 0;
        const num = String(text).replace(/\s/g,'').replace('R$','').replace(/\./g,'').replace(',','.');
        return parseFloat(num) || 0;
    }
    function formatBRL(v) {
        return Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    function getTotal() {
        return sacola.reduce((s,i)=> s + (Number(i.preco) * i.quantidade), 0);
    }

    // Atualiza a exibição da informação de parcelamento (texto que mostra Xx de R$ Y)
    function atualizarParcelamentoInfo(total) {
        const parcelamentoInfo = document.getElementById('parcelamento-info');
        if (!parcelamentoInfo) return;
        const parcelas = (typeof parcelasSelecionadas !== 'undefined') ? parcelasSelecionadas : 1;
        const valorParcela = (parcelas > 0) ? (total / parcelas) : total;
        // Usa formato BRL já existente (formatBRL)
        const valorFormatado = (typeof formatBRL === 'function') ? formatBRL(valorParcela) : valorParcela.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        parcelamentoInfo.innerHTML = `Parcele em <strong style="color:#e6007e;">${parcelas}x</strong> de <span id="valor-parcela">${valorFormatado}</span> sem juros no cartão!`;
    }

    // Renderiza as opções (1x..5x) e atualiza seleção
    function renderParcelamentoOpcoes(total) {
        const parcelamentoOpcoes = document.getElementById('parcelamento-opcoes');
        if (!parcelamentoOpcoes) return;
        const metodoPagamento = document.getElementById('metodo-pagamento');
        // se PIX, esconder opções de parcelas
        if (metodoPagamento && metodoPagamento.value === 'pix') {
            parcelamentoOpcoes.innerHTML = '<div style="color:#1949ce;font-weight:bold;">Pagamento via PIX não permite parcelamento.</div>';
            // atualizar info para PIX
            const parcelamentoInfo = document.getElementById('parcelamento-info');
            if (parcelamentoInfo) parcelamentoInfo.innerHTML = 'Pagamento via PIX selecionado.';
            return;
        }

        let html = '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;">';
        for (let i = 1; i <= 5; i++) {
            const valor = total / i || 0;
            const selectedClass = (typeof parcelasSelecionadas !== 'undefined' && parcelasSelecionadas === i) ? 'selected' : '';
            html += `<button class="parcelar-btn ${selectedClass}" data-parcelas="${i}" aria-pressed="${selectedClass ? 'true' : 'false'}" style="padding:6px 12px;border-radius:8px;border:1px solid #e6e6e6;background:#fff;cursor:pointer;">${i}x ${ (typeof formatBRL === 'function') ? formatBRL(valor) : valor.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) }</button>`;
        }
        html += '</div>';
        parcelamentoOpcoes.innerHTML = html;

        // eventos dos botões
        parcelamentoOpcoes.querySelectorAll('.parcelar-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const n = parseInt(this.getAttribute('data-parcelas')) || 1;
                parcelasSelecionadas = n;
                // atualiza UI (re-render das opções e da info)
                renderParcelamentoOpcoes(total);
                atualizarParcelamentoInfo(total);
            });
        });

        // atualiza texto principal também
        atualizarParcelamentoInfo(total);
    }

    function atualizarSacola() {
        if (!sacolaItens) return;
        sacolaItens.innerHTML = '';
        let total = 0;
        sacola.forEach((item, idx) => {
            total += Number(item.preco) * item.quantidade;
            const div = document.createElement('div');
            div.className = 'item-sacola';
            div.innerHTML = `
                <div style="display:flex;flex-direction:column;gap:8px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
                        <strong class="item-nome">${item.nome}</strong>
                        <button class="remover-btn" data-idx="${idx}" title="Remover">×</button>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
                        <div class="item-quant-wrap" style="display:flex;align-items:center;gap:8px;">
                            <button class="qtd-btn diminuir" data-idx="${idx}" aria-label="Diminuir" style="padding:6px 10px;border-radius:8px;border:1px solid #e6e6e6;background:#fff;cursor:pointer;">−</button>
                            <input class="qtd-input" data-idx="${idx}" type="number" min="1" max="5" value="${item.quantidade}" style="width:64px;text-align:center;border-radius:8px;border:1px solid #e6e6e6;padding:6px;" />
                            <button class="qtd-btn aumentar" data-idx="${idx}" aria-label="Aumentar" style="padding:6px 10px;border-radius:8px;border:1px solid #e6e6e6;background:#fff;cursor:pointer;">+</button>
                        </div>
                        <span class="item-preco">${formatBRL(Number(item.preco) * item.quantidade)}</span>
                    </div>
                </div>
            `;
            sacolaItens.appendChild(div);
        });

        if (sacolaQuantidade) sacolaQuantidade.innerText = sacola.reduce((s,i)=>s+i.quantidade,0);

        const totalNum = total;
        if (parcelamentoInfo && valorParcelaEl) {
            const parcelaValor = totalNum / parcelasSelecionadas || 0;
            valorParcelaEl.innerText = formatBRL(parcelaValor);
            if (sacola.length === 0) {
                parcelamentoInfo.style.display = 'none';
                if (enviarWhatsapp) enviarWhatsapp.style.display = 'none';
            } else {
                parcelamentoInfo.style.display = '';
                if (enviarWhatsapp) enviarWhatsapp.style.display = '';
            }
        }

        localStorage.setItem('sacola', JSON.stringify(sacola));
        atualizarParcelamentoInfo(totalNum);
        renderParcelamentoOpcoes(totalNum);
    }

    // inicia sacola fechada (usuário pode abrir)
    if (sacolaEl && !sacolaEl.classList.contains('sacola-aberta')) {
        sacolaEl.classList.add('sacola-fechada');
    }

    // função para controlar visual da sacola
    function setSacolaAberta(aberta) {
        if (!sacolaEl) return;
        if (aberta) {
            sacolaEl.classList.remove('sacola-fechada');
            sacolaEl.classList.add('sacola-aberta');
            // garante que itens fiquem visíveis
            if (sacolaItens) sacolaItens.style.display = '';
        } else {
            sacolaEl.classList.remove('sacola-aberta');
            sacolaEl.classList.add('sacola-fechada');
        }
    }

    // toggle ao clicar no botão de abrir/fechar
    if (abrirSacola) {
        abrirSacola.addEventListener('click', function () {
            const aberto = !sacolaEl.classList.contains('sacola-aberta');
            setSacolaAberta(aberto);
        });
    }

    // cria botão de fechar dentro da sacola (se não existir)
    if (sacolaEl && !sacolaEl.querySelector('.fechar-sacola')) {
        const btn = document.createElement('button');
        btn.className = 'fechar-sacola';
        btn.title = 'Fechar sacola';
        btn.innerText = '✕';
        btn.addEventListener('click', function () { setSacolaAberta(false); });
        sacolaEl.appendChild(btn);
    }

    // ao adicionar produto, abrir automaticamente a sacola
    function abrirSacolaAoAdicionar() {
        setSacolaAberta(true);
        // opcional: fechar automaticamente após X segundos (comente se não quiser)
        // setTimeout(()=> setSacolaAberta(false), 7000);
    }

    // Delegation: adicionar (botão .adicionar-btn e .comprar-btn), remover (.remover-btn) e controlar quantidade (.qtd-btn, .qtd-input)
    document.body.addEventListener('click', function (e) {
        const addBtn = e.target.closest('.adicionar-btn');
        const comprarBtn = e.target.closest('.comprar-btn');
        // Adicionar produto ao clicar em "Adicionar" ou "Comprar"
        if (addBtn || comprarBtn) {
            const btn = addBtn || comprarBtn;
            const produto = btn.closest('.produto');
            if (produto) {
                const nome = produto.querySelector('h3')?.innerText?.trim() || 'Produto';
                const precoText = produto.querySelector('.preco')?.innerText
                    || produto.querySelector('.preco-antigo')?.innerText
                    || 'R$ 0,00';
                const preco = parsePreco(precoText);
                const idx = sacola.findIndex(i => i.nome === nome && Number(i.preco) === preco);
                if (idx > -1) {
                    // limita a quantidade máxima a 5
                    if (sacola[idx].quantidade < 5) {
                        sacola[idx].quantidade += 1;
                    } else {
                        // feedback simples
                        alert('Quantidade máxima por produto: 5 unidades.');
                    }
                } else {
                    sacola.push({ nome, preco, quantidade: 1 });
                }
                atualizarSacola();
                abrirSacolaAoAdicionar();
            }
            return;
        }

        // remover via botão dentro da sacola
        const rem = e.target.closest('.remover-btn');
        if (rem) {
            const idx = parseInt(rem.getAttribute('data-idx'));
            if (!isNaN(idx)) {
                sacola.splice(idx,1);
                atualizarSacola();
            }
            return;
        }

        // aumentar/diminuir quantidade via botões + / -
        const qtdBtn = e.target.closest('.qtd-btn');
        if (qtdBtn) {
            const idx = parseInt(qtdBtn.getAttribute('data-idx'));
            if (isNaN(idx)) return;
            if (!sacola[idx]) return;
            if (qtdBtn.classList.contains('aumentar')) {
                if (sacola[idx].quantidade < 5) sacola[idx].quantidade += 1;
                else alert('Quantidade máxima por produto: 5 unidades.');
            } else if (qtdBtn.classList.contains('diminuir')) {
                sacola[idx].quantidade = Math.max(1, sacola[idx].quantidade - 1);
            }
            atualizarSacola();
            return;
        }
    });

    // input number change (delegation usando evento 'input' no document)
    document.addEventListener('input', function (e) {
        const input = e.target.closest && e.target.closest('.qtd-input');
        if (input) {
            const idx = parseInt(input.getAttribute('data-idx'));
            if (isNaN(idx)) return;
            let v = parseInt(input.value) || 1;
            if (v < 1) v = 1;
            if (v > 5) {
                v = 5;
                // feedback simples
                alert('Quantidade máxima por produto: 5 unidades.');
            }
            if (!sacola[idx]) return;
            sacola[idx].quantidade = v;
            atualizarSacola();
        }
    });

    // método de pagamento: atualizar UI quando trocar
    if (metodoPagamento) {
        metodoPagamento.addEventListener('change', function(){
            renderParcelamentoOpcoes( getTotal() );
        });
    }

    // enviar WhatsApp
    if (enviarWhatsapp) {
        enviarWhatsapp.addEventListener('click', function(){
            if (sacola.length === 0) return alert('A sacola está vazia.');
            const metodo = metodoPagamento ? metodoPagamento.value : 'cartao';
            const parcelas = parcelasSelecionadas || 1;
            const total = getTotal();
            const textoItens = sacola.map(i=> `${i.quantidade}x ${i.nome} - ${formatBRL(Number(i.preco) * i.quantidade)}`).join('%0A');
            const valorParcela = formatBRL(total / parcelas);
            let detalhesPagamento = '';
            if (metodo === 'pix') {
                detalhesPagamento = `Pagamento: PIX%0AChave PIX: (89) 981512060`;
            } else {
                detalhesPagamento = `Pagamento: Cartão%0AParcelas: ${parcelas}x de ${valorParcela} sem juros`;
            }
            const mensagem = `Olá,%0A%0AVou fazer o pedido:%0A${textoItens}%0A%0ATotal: ${formatBRL(total)}%0A${detalhesPagamento}`;
            const numero = '5589981512060';
            const url = `https://wa.me/${numero}?text=${mensagem}`;
            window.open(url, '_blank');
        });
    }

    // favoritos
    function atualizarFavoritosUI() {
        let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
        document.querySelectorAll('.produto').forEach(produto => {
            const nome = produto.querySelector('h3')?.innerText;
            const favBtn = produto.querySelector('.favorito-btn');
            if (favBtn && nome) {
                if (favoritos.includes(nome)) {
                    favBtn.classList.add('favoritado');
                    favBtn.innerText = '❤';
                } else {
                    favBtn.classList.remove('favoritado');
                    favBtn.innerText = '♡';
                }
            }
        });
    }
    function ativarFavoritos() {
        document.querySelectorAll('.favorito-btn').forEach(btn => {
            btn.onclick = function(e){
                e.stopPropagation();
                const produto = this.closest('.produto');
                const nome = produto.querySelector('h3')?.innerText;
                if (!nome) return;
                let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
                if (favoritos.includes(nome)) favoritos = favoritos.filter(f=>f!==nome);
                else favoritos.push(nome);
                localStorage.setItem('favoritos', JSON.stringify(favoritos));
                atualizarFavoritosUI();
            };
        });
    }

    // mostra apenas os produtos favoritados
    function mostrarSomenteFavoritos() {
        const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
        document.querySelectorAll('.produto').forEach(produto => {
            const nome = produto.querySelector('h3')?.innerText || '';
            produto.style.display = favoritos.includes(nome) ? '' : 'none';
        });
        // cria botão "Ver todos" para voltar à lista completa
        if (!document.getElementById('ver-todos-favoritos')) {
            const verTodos = document.createElement('button');
            verTodos.id = 'ver-todos-favoritos';
            verTodos.innerText = 'Ver todos';
            verTodos.style.cssText = 'margin:12px auto 20px; display:block; background:#e6007e; color:#fff; border:none; border-radius:8px; padding:8px 18px; cursor:pointer;';
            const mainEl = document.querySelector('main') || document.body;
            mainEl.prepend(verTodos);
            verTodos.addEventListener('click', function () {
                mostrarTodosProdutos();
            });
        }
    }

    // restaura exibição de todos os produtos
    function mostrarTodosProdutos() {
        document.querySelectorAll('.produto').forEach(produto => produto.style.display = '');
        const verTodos = document.getElementById('ver-todos-favoritos');
        if (verTodos) verTodos.remove();
    }

    // conecta botão do menu "Favoritos"
    if (favoritosBtn) {
        favoritosBtn.addEventListener('click', function (e) {
            e.preventDefault();
            mostrarSomenteFavoritos();
        });
    }

    // conteúdo do contato (ajuste o telefone se necessário)
    if (contatoInfo) {
        contatoInfo.innerHTML = '<strong>Telefone:</strong> (89) 98151-2060<br><strong>E-mail:</strong> macedodesac@gmail.com';
        contatoInfo.style.display = contatoInfo.style.display || 'none';
    }

    // alterna exibição ao clicar no botão "Contato"
    if (contatoBtn && contatoInfo) {
        contatoBtn.addEventListener('click', function(e) {
            e.preventDefault();
            contatoInfo.style.display = contatoInfo.style.display === 'none' ? 'block' : 'none';
        });
    }

    // inicialização
    ativarFavoritos();
    atualizarFavoritosUI();
    atualizarSacola();
});
