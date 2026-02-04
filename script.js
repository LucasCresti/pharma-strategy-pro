let estoque = JSON.parse(localStorage.getItem("pharma_v2_data")) || [];
let meuGrafico;

function salvar() {
    const editIndex = document.getElementById("editIndex").value;
    
    const item = {
        nome: document.getElementById("nome").value,
        tipo: document.getElementById("tipo").value,
        lab: document.getElementById("lab").value,
        lote: document.getElementById("lote").value || "S/L",
        qtd: parseInt(document.getElementById("qtd").value) || 0,
        custo: parseFloat(document.getElementById("custo").value) || 0,
        venda: parseFloat(document.getElementById("venda").value) || 0,
        validade: document.getElementById("validade").value
    };

    if (!item.nome || !item.validade) return alert("Nome e Validade são obrigatórios!");

    if (editIndex === "-1") {
        estoque.push(item);
    } else {
        estoque[editIndex] = item;
        cancelarEdicao();
    }

    localStorage.setItem("pharma_v2_data", JSON.stringify(estoque));
    atualizarTela();
    limparCampos();
}

function prepararEdicao(index) {
    const it = estoque[index];
    document.getElementById("nome").value = it.nome;
    document.getElementById("tipo").value = it.tipo;
    document.getElementById("lab").value = it.lab;
    document.getElementById("lote").value = it.lote === "S/L" ? "" : it.lote;
    document.getElementById("qtd").value = it.qtd;
    document.getElementById("custo").value = it.custo;
    document.getElementById("venda").value = it.venda;
    document.getElementById("validade").value = it.validade;
    
    document.getElementById("editIndex").value = index;
    document.getElementById("formTitulo").innerText = "Editar Medicamento";
    document.getElementById("btnSalvar").innerText = "Atualizar Registro";
    document.getElementById("btnCancelar").style.display = "inline-block";
}

function cancelarEdicao() {
    document.getElementById("editIndex").value = "-1";
    document.getElementById("formTitulo").innerText = "Novo Cadastro";
    document.getElementById("btnSalvar").innerText = "Salvar Medicamento";
    document.getElementById("btnCancelar").style.display = "none";
    limparCampos();
}

function gerarOferta(custo, venda, dias) {
    if (dias <= 0) return `<span style="color:red">PRODUTO VENCIDO</span>`;
    
    let precoSug = venda;
    let label = "";

    if (dias <= 30) {
        precoSug = custo * 1.05; // Margem de 5%
        label = "LIQUIDAÇÃO";
    } else if (dias <= 60) {
        precoSug = venda * 0.80;
        label = "20% OFF";
    } else if (dias <= 90) {
        precoSug = venda * 0.90;
        label = "10% OFF";
    } else {
        return `R$ ${venda.toFixed(2)}<br><small style="color:gray">Preço Normal</small>`;
    }

    return `<div class="oferta-tag">R$ ${precoSug.toFixed(2)}<br><small>${label}</small></div>`;
}

function atualizarTela() {
    const corpo = document.getElementById("corpoTabela");
    corpo.innerHTML = "";
    let financeiroRisco = 0;
    let chartData = { ok: 0, alerta: 0, vencido: 0 };

    estoque.forEach((it, i) => {
        const dias = Math.ceil((new Date(it.validade) - new Date()) / (1000 * 60 * 60 * 24));
        
        // Cores das tags de tipo
        const classeTipo = it.tipo === "Genérico" ? "tipo-generico" : (it.tipo === "Ético" ? "tipo-etico" : "tipo-similar");

        if (dias <= 30) {
            financeiroRisco += (it.custo * it.qtd);
            dias <= 0 ? chartData.vencido++ : chartData.alerta++;
        } else if (dias <= 90) {
            chartData.alerta++;
        } else {
            chartData.ok++;
        }

        corpo.innerHTML += `
            <tr>
                <td><strong>${it.nome}</strong><br><small class="badge-lab">${it.lab}</small></td>
                <td><span class="badge-tipo ${classeTipo}">${it.tipo}</span></td>
                <td><small>${it.lote}</small></td>
                <td>${it.qtd} cx</td>
                <td>${it.validade}</td>
                <td>${gerarOferta(it.custo, it.venda, dias)}</td>
                <td>
                    <button class="btn-edit" onclick="prepararEdicao(${i})">✏️</button>
                    <button class="btn-del" onclick="remover(${i})">🗑️</button>
                </td>
            </tr>
        `;
    });

    document.getElementById("valorRisco").innerText = `R$ ${financeiroRisco.toFixed(2)}`;
    renderGrafico(chartData);
}

function renderGrafico(d) {
    const ctx = document.getElementById('graficoVencimento').getContext('2d');
    if (meuGrafico) meuGrafico.destroy();
    meuGrafico = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Seguro', 'Alerta (90d)', 'Vencido'],
            datasets: [{ label: 'Itens', data: [d.ok, d.alerta, d.vencido], backgroundColor: ['#2ecc71', '#f39c12', '#e74c3c'] }]
        },
        options: { maintainAspectRatio: false }
    });
}

function remover(i) {
    if(confirm("Excluir este medicamento?")) {
        estoque.splice(i, 1);
        localStorage.setItem("pharma_v2_data", JSON.stringify(estoque));
        atualizarTela();
    }
}

function buscar() {
    let t = document.getElementById("busca").value.toLowerCase();
    document.querySelectorAll("#corpoTabela tr").forEach(tr => {
        tr.style.display = tr.innerText.toLowerCase().includes(t) ? "" : "none";
    });
}

function limparCampos() {
    document.querySelectorAll(".grid-form input").forEach(i => i.value = "");
}

atualizarTela();