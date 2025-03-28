/**
 * Atualiza o pedido no servidor com base no conector_benova e wake_order fornecidos.
 * Utiliza jQuery para melhor compatibilidade e confiabilidade.
 */
(function WakeOrderModule($) {
  'use strict';
  
  // Configurações
  const config = {
    apiUrl: 'https://api-dev.benova.com.br/cart/update-wake-order',
    checkInterval: 500,
    maxAttempts: 20,
    debug: true       // Habilita logs para depuração
  };
  
  // Função para log condicional
  function log(message, data) {
    if (config.debug && console) {
      if (data) {
        console.log(`[WakeOrder] ${message}`, data);
      } else {
        console.log(`[WakeOrder] ${message}`);
      }
    }
  }
  
  // Envia a requisição para atualizar o pedido
  async function updateWakeOrder(wake_cart_id, wake_order) {
    try {
      log('Enviando requisição com:', { wake_cart_id, wake_order });
      
      const response = await $.ajax({
        url: config.apiUrl,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ wake_cart_id, wake_order })
      });
      
      log('Resposta recebida:', response);
      return response;
    } catch (error) {
      log('Erro na requisição:', error);
      throw error;
    }
  }
  
  // Verifica se o objeto Fbits existe e tem as propriedades necessárias
  function checkFbitsReady() {
    try {
      // Verifica se o objeto Fbits e o Carrinho existem
      if (typeof Fbits === 'undefined' || !Fbits.Carrinho) {
        return false;
      }
      
      // Verifica se o Metadados existe
      if (!Fbits.Carrinho.Metadados) {
        return false;
      }
      
      // Verifica se tem o conector_benova
      if (!Fbits.Carrinho.Metadados.conector_benova) {
        log('Metadados encontrados, mas sem conector_benova:', Fbits.Carrinho.Metadados);
        return false;
      }
      
      // Verifica se tem o ID do pedido
      if (!Fbits.Carrinho.PedidoId) {
        log('Carrinho encontrado, mas sem PedidoId');
        return false;
      }
      
      return true;
    } catch (error) {
      log('Erro ao verificar Fbits:', error);
      return false;
    }
  }
  
  // Função principal que tentará processar o pedido
  function processOrder() {
    let attempts = 0;
    
    function tryProcess() {
      attempts++;
      
      // Verifica se excedeu o número máximo de tentativas
      if (attempts > config.maxAttempts) {
        log(`Número máximo de tentativas (${config.maxAttempts}) excedido. Desistindo.`);
        return;
      }
      
      log(`Tentativa ${attempts}/${config.maxAttempts} de verificar o Fbits...`);
      
      // Verifica se o Fbits está pronto para uso
      if (checkFbitsReady()) {
        // Extrai o conector_benova para usar como wake_cart_id
        const wake_cart_id = Fbits.Carrinho.Metadados.conector_benova;
        const wake_order = Fbits.Carrinho.PedidoId;
        
        log('Fbits pronto! Dados encontrados:', { 
          wake_cart_id, 
          wake_order,
          metadados: Fbits.Carrinho.Metadados
        });
        
        // Envia a requisição
        updateWakeOrder(wake_cart_id, wake_order)
          .then(response => {
            log('Pedido atualizado com sucesso:', response);
          })
          .catch(error => {
            log('Falha ao atualizar pedido:', error);
          });
      } else {
        // Agenda uma nova tentativa
        log('Fbits ainda não está pronto, tentando novamente em breve...');
        setTimeout(tryProcess, config.checkInterval);
      }
    }
    
    // Inicia o processo
    tryProcess();
  }
  
  // Inicia o módulo quando o DOM estiver pronto
  $(document).ready(function() {
    log('DOM carregado, aguardando o Fbits...');
    processOrder();
  });
  
  // Fallback: também inicia quando a janela estiver totalmente carregada
  $(window).on('load', function() {
    log('Janela totalmente carregada, verificando novamente o Fbits...');
    processOrder();
  });
  
})(jQuery || window.jQuery);
