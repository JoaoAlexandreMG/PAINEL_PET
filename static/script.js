function showAddUserPopup() {
  document.getElementById("addUserPopup").style.display = "flex";
}

function hidePopup() {
  document.getElementById("addUserPopup").style.display = "none";
}

function addUser() {
  const cpf = document.getElementById("cpf").value;
  const nome = document.getElementById("nome").value;
  const curso = document.getElementById("curso").value;
  const telefone = document.getElementById("telefone").value;
  const email = document.getElementById("email").value;

  fetch("/add_user", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      cpf: cpf,
      nome: nome,
      curso: curso,
      email: email,
      telefone: telefone,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        alert("Usuário Adicionado com sucesso!");
        hidePopup();
        searchItems();
        if (document.getElementById("userSection").style.display === "block") {
          searchUsers();
        }
      } else {
        alert(data.message);
      }
    });
}
function formatarData(dataString) {
  // Cria um objeto Date a partir da string de data
  const data = new Date(dataString);

  // Verifica se a data é válida
  if (isNaN(data)) {
      return "Data inválida";
  }

  // Formata a data usando o método toLocaleDateString com a localização pt-BR
  const dataFormatada = data.toLocaleDateString('pt-BR', {
      weekday: 'long',    // Nome completo do dia da semana
      day: 'numeric',     // Dia do mês
      month: 'numeric',      // Nome completo do mês
      year: 'numeric'     // Ano com 4 dígitos
  });

  return dataFormatada;
}
// function formatLocation(location) {
//   location = Number(location);

//   switch (location) {
//     case 1:
//       return "Armário 1";
//     case 2:
//       return "Armário 2";
//     case 3:
//       return "Armário 3";
//     case 4:
//       return "Armário 4";
//     case 5:
//       return "Armário 5";
//     case 6:
//       return "Armário 6";
//     case 7:
//       return "Mezanino";
//     default:
//       return "Desconhecido";
//   }
// }

function formatPhone(phone) {
  phone = phone.replace(/\D/g, "");
  if (phone.length === 11) {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } else if (phone.length === 10) {
    return phone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  } else {
    return phone;
  }
}

function searchItems() {
  const search = document.getElementById("itemSearch").value.toLowerCase(); // Pega o valor da barra de pesquisa e converte para minúsculas

  fetch(`/get_items?search=${search}`) // Passa o termo de pesquisa para o backend
    .then((response) => response.json())
    .then((items) => {
      const itemResults = document.getElementById("itemResults");

      // Limpa os resultados anteriores
      itemResults.innerHTML = '';

      // Filtrar itens com base no termo de pesquisa
      const filteredItems = items.filter((item) =>
        item[1].toLowerCase().includes(search)
      );

      // Verifica se há itens filtrados
      if (filteredItems.length > 0) {
        filteredItems.forEach((item) => {
          const row = `
            <tr>
              <th >${item[0]}</th>
              <td>${item[1]}</td>
              <td style="text-align: center;">${item[2]}</td>
              <td style="text-align: center;">${item[3]}</td>
              <td style="text-align: center;">
                <button class="btn btn-primary btn-sm" onclick="openEditItemPopup(${item[0]}, '${item[1]}', ${item[3]}, '${item[2]}')">Editar</button>
              </td>
            </tr>
          `;
          itemResults.insertAdjacentHTML('beforeend', row);
        });
      } else {
        itemResults.innerHTML = `<tr><td colspan="5">Nenhum item encontrado.</td></tr>`;
      }
    })
    .catch((error) => {
      console.error("Erro ao carregar itens:", error);
    });
}

// Adiciona um event listener para o campo de pesquisa de itens
document.getElementById("itemSearch").addEventListener("input", searchItems);

function showUsers() {
  document.getElementById("userSection").style.display = "block";
  document.getElementById("itemSection").style.display = "none";
  searchUsers();
}

function showItems() {
  document.getElementById("userSection").style.display = "none";
  document.getElementById("itemSection").style.display = "block";
  searchItems();
}
function searchUsers() {
  const search = document.getElementById("userSearch").value;

  fetch(`/get_users?search=${search}`)
    .then((response) => response.json())
    .then((users) => {
      // Ordenar usuários por ID (menor para maior)
      users.sort((a, b) => a[0] - b[0]);

      const userResults = document.getElementById("userResults");
      let html = "";

      users.forEach((user) => {
        html += `
        <tr>
        
        <th>${user[0]}</th>
        <td>${user[2]}</td>
        <td style="text-align: center;">${ocultarCPF(user[1])}</td>
        <td style="text-align: center;"><button class="btn btn-primary btn-sm" onclick="showUserItemsPopup(${user[0]})">Ver Empréstimos</button> </td>
<td style="text-align: center;">
  <button class="btn btn-primary btn-sm" 
          onclick="showBorrowItemPopup(${user[0]});">
    Emprestar Item
  </button>
</td>
        <td style="text-align: center;"><button class="btn btn-primary btn-sm" onclick="openEditUserPopup(${user[0]}, '${user[2]}', '${user[1]}', '${user[3]}', '${user[5]}', '${user[6]}')">Editar</button></td>
      
        <tr>
        `;
      });
      userResults.innerHTML = html;
    })
    .catch((error) => {
      console.error("Erro ao carregar usuários:", error);
    });
}
document.getElementById("itemSelect").addEventListener("change", function() {
  GetEstoque();
});

function GetEstoque() {
  const content = document.getElementById("itemQuantityInput"); // Pegando o elemento da lista de opções
  const itemId = document.getElementById("itemSelect").value; // Pegando o ID do item selecionado
  
  let html = ""; // Variável para armazenar o HTML das opções
  if (itemId){
  // Fazendo a requisição para buscar o estoque do item
  fetch(`/get_estoque?item_id=${itemId}`)
    .then((response) => response.json())
    .then((data) => {
      // Iterar de 1 até o valor de 'data', criando opções
      for (let i = 1; i <= data; i++) {
        html += `<option>${i}</option>`;
      }
      // Atualizando o conteúdo do select com as novas opções
      content.innerHTML = html;
    })
    .catch((error) => {
      console.error("Erro ao carregar estoque:", error);
    })}
}

function showUserItemsPopup(userId) {
  fetch(`/get_user_items?user_id=${userId}`)
    .then((response) => response.json())
    .then((data) => {
      const content = document.getElementById("userItemsContent");
      let html = "";

      // Verifique se os arrays existem e têm a propriedade length
      if (
        Array.isArray(data.itensEmprestados) &&
        data.itensEmprestados.length > 0
      ) {
        html += `<h3>Itens Emprestados:</h3><ul>`;
        data.itensEmprestados.forEach((item) => {
          const dataPrevistaDevolucao = formatarData(adicionarUmDia(item.dataPrevistaDevolucao));
          html += `<li>${item.nome} | Devolução prevista: ${dataPrevistaDevolucao} 
                    <button class="btn btn-primary btn-sm" onclick="showReturnItemPopup('${userId}', '${item.nome}')">Devolver</button></li>`;
        });
        html += `</ul>`;
      } else {
        html += `<p>Não há itens emprestados atualmente.</p>`;
      }

      if (
        Array.isArray(data.historicoItens) &&
        data.historicoItens.length > 0
      ) {
        html += `<h3>Histórico de Empréstimos:</h3><ul>`;
        data.historicoItens.forEach((item) => {
          const dataEmprestimo = new Date(
            item.dataEmprestimo
          ).toLocaleDateString();
          const dataDevolucao = item.dataDevolucao
            ? new Date(item.dataDevolucao).toLocaleDateString()
            : "Não devolvido";
          html += `<li>${item.nome} - Emprestado em: ${dataEmprestimo} - Devolvido em: ${dataDevolucao}</li>`;
        });
        html += `</ul>`;
      } else {
        html += `<p>Não há histórico de empréstimos para este usuário.</p>`;
      }

      content.innerHTML = html;
      document.getElementById("userItemsPopup").style.display = "block";
    })
    .catch((error) => console.error("Erro ao buscar itens do usuário:", error));
}

function showDelayedItems() {
  fetch(`/get_delayeds`)
    .then((response) => response.json())
    .then((data) => {
      const content = document.getElementById("itemsDelayedContent");
      let html = "";

      // Verifica se os dados retornados são um array e possuem elementos
      if (Array.isArray(data) && data.length > 0) {
        html += `<h3>Itens com Atraso:</h3><ul>`;
        data.forEach((item) => {
          const nomePessoa = item.nome_pessoa;
          const nomeItem = item.nome_item;
          const tempoAtraso = item.tempo_atraso;
          if (tempoAtraso > 1) {
            html += `<li>${nomePessoa} | ${nomeItem} | ${tempoAtraso} dias de atraso!</li>`;
          } else {
            html += `<li>${nomePessoa} | ${nomeItem} | ${tempoAtraso} dia de atraso!</li>`;
          }
        });
        html += `</ul>`;
      } else {
        html += `<p>Não há itens atrasados no momento.</p>`;
      }

      // Atualiza o conteúdo do popup com os itens atrasados
      content.innerHTML = html;

      // Exibe o popup
      document.getElementById("itemsDelayedPopup").style.display = "block";
    })
    .catch((error) => console.error("Erro ao buscar itens atrasados:", error));
}

function showReturnItemPopup(userId, itemName) {
  const returnItemPopup = document.getElementById("returnItemPopup");
  returnItemPopup.dataset.userId = userId;
  returnItemPopup.dataset.itemName = itemName;
  returnItemPopup.style.display = "flex";
}

function hideReturnItemPopup() {
  document.getElementById("returnItemPopup").style.display = "none";
}

function returnItem() {
  const userId = document.getElementById("returnItemPopup").dataset.userId;
  const itemName = document.getElementById("returnItemPopup").dataset.itemName;

  fetch("/return_item", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      user_id: userId,
      item_name: itemName,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        alert("Devolução feita com sucesso!");
        hideReturnItemPopup();

        showUserItemsPopup(userId);
      } else {
        alert(data.message);
      }
    });
}

function hideUserItemsPopup() {
  document.getElementById("userItemsPopup").style.display = "none";
}

function formatCPF(cpf) {
  cpf = cpf.replace(/\D/g, "");
  if (cpf.length === 11) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  } else {
    return cpf;
  }
}
function ocultarCPF(cpf) {
  cpf = cpf.replace(/\D/g, "");
  if (cpf.length === 11) {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.***-**");
  } else {
    return cpf;
  }
}


// Exibir popup para emprestar item
function showBorrowItemPopup(userId) {
  fetch("/get_items")
    .then((response) => response.json())
    .then((items) => {
      const itemSelect = document.getElementById("itemSelect");
      itemSelect.innerHTML = items
        .map(
          (item) =>
            `<option value="${item[0]}">${item[1]} (ID: ${item[0]})</option>`
        )
        .join("");

      // Resetar o valor da data prevista de devolução
      document.getElementById("DevolucaoPrevistaInput").value = "";
      document.getElementById("searchItemInput").value = "";
      GetEstoque();

      document.getElementById("borrowItemPopup").style.display = "flex";
      document.getElementById("borrowItemPopup").dataset.userId = userId;
    });
}

// Esconder popup de emprestar item
function hideBorrowItemPopup() {
  document.getElementById("borrowItemPopup").style.display = "none";
}
// Função para pesquisar itens no popup
function searchItemsInPopup() {
  const search = document.getElementById("searchItemInput").value.toLowerCase();
  const itemSelect = document.getElementById("itemSelect");

  fetch(`/get_items?search=${search}`)
    .then((response) => response.json())
    .then((items) => {
      // Gerar o HTML das opções ordenadas
      itemSelect.innerHTML = items
        .map(
          (item) =>
            `<option value="${item[0]}">${item[1]} (ID: ${item[0]})</option>`
        )
        .join("");
    });
    GetEstoque();
}

// Adiciona um event listener para o campo de pesquisa no popup
document
  .getElementById("searchItemInput")
  .addEventListener("input", searchItemsInPopup);

  function generateLoanPDF(userId, itens, loanDate, expectedReturnDate) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
  
    // Busca os dados do usuário usando o userId
    fetch(`/get_user?user_id=${userId}`)
      .then((response) => response.json())
      .then((userData) => {
        // Preenchimento das informações do usuário
        doc.setFontSize(18);
        doc.setFont("helvetica", "bold");
        doc.text("TERMO DE EMPRÉSTIMO", 105, 20, { align: "center" });
  
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text("Nome do Requisitante:", 20, 40);
        doc.text(userData.nome, 80, 40);
        doc.line(78, 41, 200, 41); // Linha para o nome
  
        doc.text("CPF:", 20, 50);
        doc.text(formatCPF(userData.cpf), 80, 50);
        doc.line(78, 51, 200, 51); // Linha para o CPF
  
        doc.text("Curso:", 20, 60);
        doc.text(userData.curso, 80, 60);
        doc.line(78, 61, 200, 61); // Linha para o curso
  
        doc.text("Telefone:", 20, 70);
        doc.text(formatPhone(userData.telefone), 80, 70);
        doc.line(78, 71, 200, 71); // Linha para o telefone
  
        doc.text("Email:", 20, 80);
        doc.text(userData.email, 80, 80);
        doc.line(78, 81, 200, 81); // Linha para o email
  
        doc.text("Data Prevista para Devolução:", 20, 90);
        doc.text(expectedReturnDate, 80, 90);
        doc.line(78, 91, 200, 91); // Linha para a data prevista
  
        // Descrição do material
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("DESCRIÇÃO DO MATERIAL", 20, 110);
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
  
        // Variável para acompanhar a posição vertical
        let yPosition = 120;
  
        // Atualização para incluir a quantidade
        const fetchPromises = itens.map((item, index) => {
          const item_id = item[0];
          const quantity = item[1];
  
          return fetch(`/get_item?item_id=${item_id}`)
            .then((response) => response.json())
            .then((data) => {
              const itemName = data.nome;
              const itemDescription = `${itemName} (${quantity} unidade(s))`;
  
              // Adiciona a descrição do item ao PDF
              doc.text(itemDescription, 20, yPosition);
              doc.line(20, yPosition + 1, 200, yPosition + 1); // Linha para o material
              yPosition += 10; // Ajusta a posição para o próximo item
            })
            .catch((error) => {
              console.error("Erro ao obter item:", error);
            });
        });
  
        // Executa todos os fetches antes de salvar o PDF
        Promise.all(fetchPromises).then(() => {
          // Garante que o "TERMO DE RESPONSABILIDADE" esteja abaixo da lista de itens
          yPosition += 10; // Espaçamento adicional antes do termo
  
          // // Termo de responsabilidade
          // doc.setFontSize(14);
          // doc.setFont("helvetica", "bold");
          // doc.text("TERMO DE RESPONSABILIDADE", 20, yPosition);
  
          // doc.setFontSize(12);
          // doc.setFont("helvetica", "normal");
          // const responsText = [
          //   "Pelo presente Termo de Entrega e Responsabilidade, o requisitante acima qualificado declara que",
          //   "recebeu o(s) equipamento(s) e acessório(s) acima especificados, entregues pelo PET Engenharia",
          //   "Elétrica, assumindo o compromisso de manter a guarda pessoal sobre os mesmos, ficando a seu",
          //   "cargo:",
          //   "• Adequada utilização, de acordo com as recomendações;",
          //   "• Comunicar, imediatamente, qualquer incidente e ocorrência com o equipamento sob sua",
          //   "  guarda e responsabilidade;",
          //   "• Indenizar os danos causados por negligência, má utilização, guarda inadequada, desleixo ou",
          //   "  outro dano que possa decorrer, direta ou indiretamente, de sua ação ou omissão.",
          // ];
          // yPosition += 10;
          // doc.text(responsText, 20, yPosition);
  
          // Continue o restante do PDF, ajustando a posição conforme necessário
  
          // Campos para assinatura na retirada
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text("Assinatura na Retirada", 20, yPosition);
          yPosition += 10;
  
          doc.setFontSize(12);
          doc.setFont("helvetica", "normal");
          doc.text("Data de Retirada: " + loanDate, 20, yPosition);
          yPosition += 10;
          doc.text("Assinatura do Requisitante:", 20, yPosition);
          doc.line(78, yPosition + 1, 200, yPosition + 1); // Linha para a assinatura do requisitante
          yPosition += 10;
  
          doc.text("Assinatura do Petiano:", 20, yPosition);
          doc.line(78, yPosition + 1, 200, yPosition + 1); // Linha para a assinatura do petiano
  
          // Campos para assinatura na devolução
          yPosition += 20;
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.text("Assinatura na Devolução", 20, yPosition);
          yPosition += 10;
  
          doc.setFontSize(12);
          doc.setFont("helvetica", "normal");
          doc.text("Data de Devolução:", 20, yPosition);
          doc.line(60, yPosition + 1, 90, yPosition + 1); // Linha para a data de devolução
          yPosition += 10;
  
          doc.text("Assinatura do Requisitante:", 20, yPosition);
          doc.line(78, yPosition + 1, 200, yPosition + 1); // Linha para a assinatura do requisitante
          yPosition += 10;
  
          doc.text("Assinatura do Petiano:", 20, yPosition);
          doc.line(78, yPosition + 1, 200, yPosition + 1); // Linha para a assinatura do petiano
  
          // Salvar o PDF com o nome "Termo_Emprestimo.pdf"
          doc.save(`Termo_Emprestimo_${userData.nome.replace(/\s+/g, "_")}.pdf`);
        });
      })
      .catch((error) => {
        console.error("Erro ao obter usuário:", error);
      });
  }
  

  
function adicionarUmDia(dataString) {
  // Cria um objeto Date a partir da string de data
  const data = new Date(dataString);

  // Verifica se a data é válida
  if (isNaN(data)) {
      return "Data inválida";
  }

  // Adiciona 1 dia à data
  data.setDate(data.getDate() + 1);

  return data;
}
function EnviarMSG(name, item, time) {
  fetch(`/get_phone_by_name?user_name=${encodeURIComponent(name)}`)
    .then(response => response.json()) // Converta a resposta para JSON
    .then(data => {
      if (data.telefone) {     
        const msg = `Olá, *${name}*. Nosso sistema detectou um atraso de *${time} dia(s)* no item *${item}* em relação à data prevista de devolução. Caso já tenha devolvido o item, pedimos desculpas pelo incômodo. Caso contrário, solicitamos que faça a devolução do item.`;
        const url = `https://wa.me/${data.telefone}?text=${msg}`
        window.open(url, '_blank');
      } else {
        console.error('Telefone não encontrado ou erro na solicitação');
      }
    })
    .catch(error => {
      console.error('Erro ao buscar telefone:', error);
    });
}


function showDelayedItems() {
  fetch(`/get_delayeds`)
    .then((response) => response.json())
    .then((data) => {
      const content = document.getElementById("itemsDelayedContent");
      let html = "";

      // Verifica se os dados retornados são um array e possuem elementos
      if (Array.isArray(data) && data.length > 0) {
        html += `<h3>Itens com Atraso:</h3><ul>`;
        data.forEach((item) => {
          const nomePessoa = item.nome_pessoa;
          const nomeItem = item.nome_item;
          const tempoAtraso = item.tempo_atraso;
          if (tempoAtraso > 1) {
            html += `<li>${nomePessoa} | ${nomeItem} | ${tempoAtraso} dias de atraso! <button class="btn btn-primary btn-sm" onClick="EnviarMSG('${nomePessoa}', '${nomeItem}', '${tempoAtraso}')">Enviar Mensagem</button></li>`;
          } else {
            html += `<li>${nomePessoa} | ${nomeItem} | ${tempoAtraso} dia de atraso! <button class="btn btn-primary btn-sm" onClick="EnviarMSG('${nomePessoa}', '${nomeItem}', '${tempoAtraso}')">Enviar Mensagem</button></li>`;

          }
        });
        html += `</ul>`;
      } else {
        html += `<p>Não há itens atrasados no momento.</p>`;
      }

      // Atualiza o conteúdo do popup com os itens atrasados
      content.innerHTML = html;

      // Exibe o popup
      document.getElementById("itemsDelayedPopup").style.display = "block";
    })
    .catch((error) => console.error("Erro ao buscar itens atrasados:", error));
}

// Função para esconder o popup
function hideitemsDelayedPopup() {
  document.getElementById("itemsDelayedPopup").style.display = "none";
}
let itens = [];
function borrowItemList() {
  const userId = document.getElementById("borrowItemPopup").dataset.userId;
  const item_id = document.getElementById("itemSelect").value;
  const quantity = document.getElementById("itemQuantityInput").value;
  const content = document.getElementById("lista_de_itens");
  for (let item of itens) {
    if (item[0] === item_id) {
      alert("Item já adicionado à lista: [ " + itens + " ]");
      return;
    }
  }
  fetch(
    `/get_item_qtd?userId=${userId}&item_id=${item_id}&quantity=${quantity}`
  )
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        itens.push([item_id, quantity]);
        content.style.display = "flex";
        fetch(`/get_item?item_id=${item_id}`)
          .then((response) => response.json())
          .then((data) => {
            content.innerHTML += `<li>${quantity} x ${data.nome}<button class="btn btn-primary btn-sm" onClick="deleteItemInList(${item_id})" id="deleteItemList"> 🗑️</button></li>`;
          })
          .catch((error) => {
            console.error("Erro ao adicionar item:", error);
          });
      } else {
        alert(data.message);
      }
    })
    .catch((error) => {
      console.error("Erro ao adicionar item:", error);
    });
}
function limparLista() {
  itens = [];
  document.getElementById("lista_de_itens").innerHTML = "";
}
function deleteItemInList(item_id) {
  // Converte o item_id para um número
  const itemIdNumber = Number(item_id);

  // Encontra o índice do item na lista 'itens'
  const itemIndex = itens.findIndex((item) => Number(item[0]) === itemIdNumber);

  // Remove o item da lista 'itens'
  itens.splice(itemIndex, 1);

  // Atualiza a lista na interface do usuário
  const itemList = document.getElementById("lista_de_itens");
  itemList.innerHTML = ""; // Limpa a lista atual

  // Reconstroi a lista atualizada buscando os nomes dos itens
  itens.forEach((item) => {
    const item_id = item[0];
    const quantity = item[1];

    // Busca o nome do item antes de adicioná-lo à lista
    fetch(`/get_item?item_id=${item_id}`)
      .then((response) => response.json())
      .then((data) => {
        // Adiciona o item com o nome correto na lista
        itemList.innerHTML += `<li>${quantity} x ${data.nome}<button class="btn btn-primary btn-sm" onClick="deleteItemInList(${item_id})" id="deleteItemList"> 🗑️</button></li>`;
      })
      .catch((error) => {
        console.error("Erro ao buscar o item:", error);
      });
  });
}

function borrowItem() {
  if (!itens || itens.length === 0) {
    alert("Não há itens na lista!");
    return;
  }
  const userId = document.getElementById("borrowItemPopup").dataset.userId;
  const DevolucaoPrevista = document.getElementById("DevolucaoPrevistaInput").value;

  // Verificar se todos os campos foram preenchidos
  if (!DevolucaoPrevista) {
    alert("Por favor, coloque a data prevista para devolução.");
    return;
  }

  fetch("/borrow_item", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      user_id: userId,
      items_id: itens,
      DevolucaoPrevista: DevolucaoPrevista,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.status === "success") {
        alert("Item emprestado com sucesso!");
        hideBorrowItemPopup();
        const loanDate = new Date().toLocaleDateString();
        const expectedReturnDate = new Date(DevolucaoPrevista).toLocaleDateString();
        generateLoanPDF(userId, itens, loanDate, expectedReturnDate);
        itens = [];
      } else {
        alert(data.message);
      }
    })
    .catch((error) => {
      console.error("Erro ao emprestar item:", error);
    });
}


// Abrir Popup de Edição de Item
function openEditItemPopup(itemId, itemName, itemQuantity, itemLocation) {
  document.getElementById("editItemId").value = itemId;
  document.getElementById("editItemName").value = itemName;
  document.getElementById("editItemQuantity").value = itemQuantity;
  document.getElementById("editItemLocation").value = itemLocation;
  document.getElementById("editItemPopup").style.display = "block";
}

// Fechar Popup de Edição de Item
function closeEditItemPopup() {
  document.getElementById("editItemPopup").style.display = "none";
}

// Submeter Edição de Item
document
  .getElementById("editItemForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const itemId = document.getElementById("editItemId").value;
    const itemName = document.getElementById("editItemName").value;
    const itemQuantity = document.getElementById("editItemQuantity").value;
    const itemLocation = document.getElementById("editItemLocation").value;

    fetch("/edit_item", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `item_id=${itemId}&item_name=${itemName}&item_quantity=${itemQuantity}&item_location=${itemLocation}`,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          closeEditItemPopup();
          searchItems();
        } else {
          alert("Erro ao editar o item: " + data.message);
        }
      })
      .catch((error) => {
        alert("Erro ao editar o item: " + error);
      });
  });

// Função para deletar item
function deleteItem() {
  const itemId = document.getElementById("editItemId").value;

  if (confirm("Tem certeza que deseja excluir este item?")) {
    fetch("/delete_item", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        item_id: itemId,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          alert("Item excluído com sucesso!");
          closeEditItemPopup();
          searchItems(); // Atualiza a lista de itens
        } else {
          alert(data.message);
        }
      })
      .catch((error) => {
        console.error("Erro ao excluir item:", error);
      });
  }
}

function openEditUserPopup(userId, nome, cpf, telefone, curso, email) {
  document.getElementById("editUserId").value = userId;
  document.getElementById("editUserCPF").value = cpf;
  document.getElementById("editUserName").value = nome;
  document.getElementById("editUserCourse").value = curso; // Verifique se o ID está correto aqui
  document.getElementById("editUserEmail").value = email; // Verifique se o ID está correto aqui
  document.getElementById("editUserPhone").value = telefone;
  document.getElementById("editUserPopup").style.display = "block";
}

// Fechar Popup de Edição de Usuário
function closeEditUserPopup() {
  document.getElementById("editUserPopup").style.display = "none";
}

// Submeter Edição de Usuário
document
  .getElementById("editUserForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const userId = document.getElementById("editUserId").value;
    const cpf = document.getElementById("editUserCPF").value;
    const nome = document.getElementById("editUserName").value;
    const curso = document.getElementById("editUserCourse").value;
    const email = document.getElementById("editUserEmail").value;
    const telefone = document.getElementById("editUserPhone").value;

    fetch("/edit_user", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        user_id: userId,
        cpf: cpf,
        nome: nome,
        curso: curso,
        email: email,
        telefone: telefone,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          closeEditUserPopup();
          searchUsers(); // Atualiza a lista de usuários após a edição
        } else {
          alert("Erro ao editar o usuário: " + data.message);
        }
      })
      .catch((error) => {
        alert("Erro ao editar o usuário: " + error);
      });
  });
// Mostrar popup de adicionar item
function showAddItemPopup() {
  document.getElementById("addItemPopup").style.display = "flex";
}
// Esconder popup de adicionar item
function hideAddItemPopup() {
  document.getElementById("addItemPopup").style.display = "none";
}
// Função para esconder o popup
function hideitemsDelayedPopup() {
  document.getElementById("itemsDelayedPopup").style.display = "none";
}

// Adicionar evento de submissão para o formulário de adicionar item
document
  .getElementById("addItemForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const itemName = document.getElementById("addItemName").value;
    const itemQuantity = document.getElementById("addItemQuantity").value;
    const itemLocation = document.getElementById("addItemLocation").value;

    fetch("/add_item", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        item_name: itemName,
        item_quantity: itemQuantity,
        item_location: itemLocation,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === "success") {
          alert("Item adicionado com sucesso!");
          hideAddItemPopup();
          searchItems(); // Atualiza a lista de itens
        } else {
          alert(data.message);
        }
      })
      .catch((error) => {
        console.error("Erro ao adicionar item:", error);
      });
  });
