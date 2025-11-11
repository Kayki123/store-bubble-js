const API_URL = "https://fakestoreapi.com/products";
const container = document.getElementById("produtos");
const searchInput = document.getElementById("searchInput");
let todosProdutos = [];
let carrinho = [];
let freteValor = 0;
const botaoCarrinho = document.createElement("button");
botaoCarrinho.id = "abrirCarrinho";
botaoCarrinho.textContent = "🛒 Carrinho (0)";
document.body.appendChild(botaoCarrinho);

const abaCarrinho = document.createElement("div");
abaCarrinho.id = "carrinhoAba";
abaCarrinho.innerHTML = `
  <h2>🧾 Seu Carrinho</h2>
  <ul id="listaCarrinho"></ul>
  <p id="totalCarrinho">Total: R$ 0.00</p>

  <div id="freteContainer">
    <input type="text" id="cep" placeholder="Digite seu CEP" />
    <button id="btnFrete">Calcular Frete</button>
    <p id="freteTexto"></p>
  </div>

  <button id="fecharCarrinho">Fechar</button>
`;
document.body.appendChild(abaCarrinho);
async function carregarProdutos() {
  try {
    const resposta = await fetch(API_URL);
    if (!resposta.ok) throw new Error("Erro ao buscar produtos da API");
    const produtos = await resposta.json();

    todosProdutos = produtos;
    exibirProdutos(todosProdutos);
  } catch (erro) {
    container.innerHTML = `<p>Erro ao carregar produtos 😢</p>`;
    console.error(erro);
  }
}
carregarProdutos();
function exibirProdutos(lista) {
  container.innerHTML = "";
  lista.forEach((produto) => {
    const card = document.createElement("div");
    card.classList.add("produto");

    card.innerHTML = `
      <img src="${produto.image}" alt="${produto.title}">
      <h2>${produto.title}</h2>
      <p>${produto.description.substring(0, 100)}...</p>
      <p class="price">💲${produto.price.toFixed(2)}</p>
      <p>⭐ ${produto.rating.rate} (${produto.rating.count} avaliações)</p>
      <button class="btn-Buy">Buy</button>
    `;

    card.querySelector(".btn-Buy").addEventListener("click", () => {
      adicionarAoCarrinho(produto);
    });

    container.appendChild(card);
  });
}
function ordenarNome() {
  todosProdutos.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
  exibirProdutos(todosProdutos);
}
function ordenarPreco() {
  const produtos = [...todosProdutos]; // cópia
  for (let i = 0; i < produtos.length - 1; i++) {
    for (let j = 0; j < produtos.length - i - 1; j++) {
      if (produtos[j].price > produtos[j + 1].price) {
        const temp = produtos[j];
        produtos[j] = produtos[j + 1];
        produtos[j + 1] = temp;
      }
    }
  }
  todosProdutos = produtos;
  exibirProdutos(todosProdutos);
}

if (searchInput) {
  searchInput.addEventListener("input", () => {
    const termo = searchInput.value.toLowerCase();
    const filtrados = todosProdutos.filter((p) =>
      p.title.toLowerCase().includes(termo)
    );
    exibirProdutos(filtrados);
  });
}

// ==== Funções do Carrinho ====
function adicionarAoCarrinho(produto) {
  carrinho.push(produto);
  atualizarCarrinho();
  botaoCarrinho.textContent = `🛒 Carrinho (${carrinho.length})`;
  abrirCarrinho();
}

function atualizarCarrinho() {
  const lista = document.getElementById("listaCarrinho");
  const totalElement = document.getElementById("totalCarrinho");

  lista.innerHTML = "";
  let total = 0;

  carrinho.forEach((p, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${p.title} - R$ ${p.price.toFixed(2)}
      <button class="remover" data-index="${index}">❌</button>
    `;
    lista.appendChild(li);
    total += p.price;
  });

  totalElement.textContent = `Total: R$ ${(total + freteValor).toFixed(2)}`;

  document.querySelectorAll(".remover").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const i = e.target.dataset.index;
      carrinho.splice(i, 1);
      atualizarCarrinho();
      botaoCarrinho.textContent = `🛒 Carrinho (${carrinho.length})`;
    });
  });
}

function abrirCarrinho() {
  abaCarrinho.classList.add("aberto");
}
function fecharCarrinho() {
  abaCarrinho.classList.remove("aberto");
}
botaoCarrinho.addEventListener("click", abrirCarrinho);
document.getElementById("fecharCarrinho").addEventListener("click", fecharCarrinho);
document.getElementById("btnFrete").addEventListener("click", calcularFrete);

async function calcularFrete() {
  const cep = document.getElementById("cep").value.trim();
  const freteTexto = document.getElementById("freteTexto");

  if (!cep) {
    freteTexto.textContent = "Digite um CEP válido!";
    return;
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&countrycodes=BR&postalcode=${cep}`
    );
    const data = await response.json();

    if (data.length === 0) {
      freteTexto.textContent = "CEP não encontrado!";
      return;
    }

    const destino = {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
    };

    const origem = { lat: -10.906436, lon: -37.067231 }; // Loja padrão (Aracaju)
    const distancia = calcularDistancia(
      origem.lat,
      origem.lon,
      destino.lat,
      destino.lon
    );

    freteValor = distancia * 1; 
    freteTexto.textContent = `Distância: ${distancia.toFixed(
      1
    )} km | Frete: R$ ${freteValor.toFixed(2)}`;
    atualizarCarrinho();
  } catch (erro) {
    console.error(erro);
    freteTexto.textContent = "Erro ao calcular frete!";
  }
}

function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function loadMap() {
  const map = L.map("map").setView([-10.906436, -37.067231], 13);
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  L.marker([-10.906436, -37.067231])
    .addTo(map)
    .bindPopup("🏪 Chicken Store - Aracaju")
    .openPopup();
}
