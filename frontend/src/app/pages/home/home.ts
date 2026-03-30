import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class HomeComponent {
  novaMensagem: string = '';

  mensagensChat: { autor: 'user' | 'bot'; texto: string }[] = [
    {
      autor: 'bot',
      texto: 'Olá. Sou o Assistente Jurídico. Posso dar orientação inicial sobre direitos, denúncia, proteção e apoio jurídico.'
    }
  ];

  enviarMensagem() {
  const texto = this.novaMensagem.trim();
  if (!texto) return;

  this.mensagensChat.push({ autor: 'user', texto });

  const resposta = this.gerarResposta(texto);

  this.mensagensChat.push({ autor: 'bot', texto: resposta });

  this.novaMensagem = '';
}

  enviarMensagemRapida(texto: string) {
  this.mensagensChat.push({ autor: 'user', texto });

  const resposta = this.gerarRespostaRapida(texto);

  this.mensagensChat.push({ autor: 'bot', texto: resposta });
}

  gerarResposta(mensagem: string): string {
  const msg = mensagem.toLowerCase().trim();

  if (
    msg.includes('direito') ||
    msg.includes('direitos')
  ) {
    return `Como vítima, poderá ter direito a proteção, informação, apoio jurídico e encaminhamento para serviços especializados. Esses direitos podem variar conforme a situação, mas o mais importante é saber que não precisa enfrentar isto sozinha.`;
  }

  if (
    msg.includes('denunciar') ||
    msg.includes('denúncia') ||
    msg.includes('queixa')
  ) {
    return `A denúncia pode ser apresentada junto das autoridades competentes. Procurar apoio jurídico antes ou depois desse passo pode ajudar a compreender melhor os seus direitos, os procedimentos e as medidas de proteção disponíveis.`;
  }

  if (
    msg.includes('proteção') ||
    msg.includes('segurança')
  ) {
    return `A proteção da vítima deve ser uma prioridade, sobretudo quando existe medo, ameaça ou risco. Nesses casos, é importante procurar apoio o quanto antes e utilizar os recursos de segurança e emergência disponíveis.`;
  }

  if (
    msg.includes('jurídico') ||
    msg.includes('juridico') ||
    msg.includes('advogado')
  ) {
    return `O apoio jurídico pode ajudar a esclarecer direitos, opções legais e próximos passos. Dependendo do caso, poderá existir acompanhamento por entidades especializadas ou acesso a orientação adequada à sua situação.`;
  }

  if (
    msg.includes('perigo') ||
    msg.includes('urgente') ||
    msg.includes('emergência') ||
    msg.includes('emergencia')
  ) {
    return `Se estiver em perigo imediato, a sua segurança vem primeiro. Nessa situação, deve procurar ajuda urgente através do 112 ou de contactos de apoio imediato. Sempre que possível, tente dirigir-se para um local seguro.`;
  }

  if (
    msg.includes('ajuda') ||
    msg.includes('contacto') ||
    msg.includes('contato') ||
    msg.includes('apoio')
  ) {
    return `Existem linhas de apoio, recursos especializados e entidades preparadas para orientar e acompanhar situações de maior vulnerabilidade. Se desejar, pode também entrar na plataforma para fazer um pedido de ajuda mais específico.`;
  }

  if (
    msg.includes('abrigo') ||
    msg.includes('casa') ||
    msg.includes('onde ficar')
  ) {
    return `Em situações de vulnerabilidade, poderá ser importante procurar uma solução segura de acolhimento ou abrigo. A plataforma pode ajudar a identificar recursos e contactos que orientem esse encaminhamento.`;
  }

  if (
    msg.includes('filho') ||
    msg.includes('filhos') ||
    msg.includes('criança') ||
    msg.includes('crianças')
  ) {
    return `Quando existem crianças envolvidas, a proteção e o acompanhamento tornam-se ainda mais importantes. Procurar apoio jurídico e recursos especializados pode ajudar a perceber quais são as medidas mais adequadas para garantir segurança e estabilidade.`;
  }

  return `Posso ajudar com orientação inicial sobre direitos, denúncia, proteção, apoio jurídico e situações de urgência. Pode escrever a sua dúvida de forma mais direta, por exemplo: "Quais são os meus direitos?" ou "Estou em perigo".`;
}

gerarRespostaRapida(texto: string): string {
  const msg = texto.toLowerCase();

  if (msg.includes('direitos')) {
    return `Como vítima, tem direito a proteção, informação, apoio jurídico e encaminhamento.

 Estes direitos existem para garantir a sua segurança e apoio ao longo do processo.

Se quiser, pode ver recursos disponíveis ou fazer um pedido de ajuda.`;
  }

  if (msg.includes('denunciar')) {
    return `A denúncia pode ser feita junto das autoridades competentes.

 Antes ou depois, pode procurar apoio jurídico para perceber melhor os seus direitos e os próximos passos.

A decisão deve ser tomada com segurança e apoio.`;
  }

  if (msg.includes('proteção')) {
    return `A proteção é um dos direitos mais importantes.

 Pode ter acesso a medidas de segurança e apoio especializado.

Se houver risco, não hesite em procurar ajuda imediata.`;
  }

  if (msg.includes('perigo')) {
    return `Se estiver em perigo imediato:

Ligue 112 agora

A sua segurança é a prioridade absoluta.
Tente dirigir-se para um local seguro.

Depois, poderá procurar apoio através da plataforma.`;
  }

  return this.gerarResposta(texto);
}

direitoSelecionado: string | null = null;

toggleDireito(direito: string) {
  if (this.direitoSelecionado === direito) {
    this.direitoSelecionado = null;
  } else {
    this.direitoSelecionado = direito;
  }
}

}