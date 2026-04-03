import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { SaudacaoPipe } from '../../saudacao-pipe';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, SaudacaoPipe],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  nomeutilizador = 'Utilizador';
  isAdmin = false;
  activeSection = 'info';

  isDarkMode = false;

  pedidos: any[] = [];
  recursosPendentes: any[] = [];
  recursosAprovados: any[] = [];

  private authSubscription: any;

  recursoSelecionadoPorPedido: Record<number, number | null> = {};

  pedidoEmEdicaoId: number | null = null;
  pedidoEditando: any = null;
  pedidoEditandoSubmitting = false;

  novoPedido = {
    email: '',
    tipo_pedido: '',
    contacto: '',
    distrito: '',
    descricao: ''
  };

  tiposPedido: string[] = [
    'Violência doméstica',
    'Apoio psicológico',
    'Apoio jurídico',
    'Emergência',
    'Informação geral',
    'Outro'
  ];

  distritos: string[] = [
    'Aveiro', 'Beja', 'Braga', 'Bragança', 'Castelo Branco', 'Coimbra',
    'Évora', 'Faro', 'Guarda', 'Leiria', 'Lisboa', 'Portalegre',
    'Porto', 'Santarém', 'Setúbal', 'Viana do Castelo', 'Vila Real', 'Viseu'
  ];

  statusOptions: string[] = [
    'Pendente',
    'Em análise',
    'Encaminhado',
    'Concluído'
  ];

  direitosCards = [
    {
      titulo: 'Direito à Proteção',
      texto: 'A vítima poderá ter direito a medidas de proteção adequadas à sua segurança, especialmente em situações de risco, ameaça ou vulnerabilidade. (artigo 20 da lei 112/2009).'
    },
    {
      titulo: 'Direito à Informação',
      texto: 'A vítima deverá poder receber informação clara sobre os seus direitos, os recursos disponíveis e os passos que poderá seguir. (artigo 15 da lei 112/2009)'
    },
    {
      titulo: 'Direito a Apoio Jurídico',
      texto: 'Poderá existir acesso a orientação jurídica para compreender melhor a situação, os direitos e as opções legais disponíveis. (artigo 18 da lei 112/2009).'
    },
    {
      titulo: 'Direito a Encaminhamento',
      texto: 'A vítima pode ser encaminhada para serviços especializados de apoio, proteção e acompanhamento adequado à sua situação. (artigo 18 da lei 112/2009).'
    }
  ];

  guiaAberto: string | null = null;

  guiaAjuda = [
    {
      id: 'perigo',
      titulo: ' Estou em perigo',
      texto: 'Se estiver em perigo imediato, ligue para o 112. Procure um local seguro e, se possível, contacte alguém de confiança. A sua segurança deve ser a prioridade.',
      acaoPrimaria: 'Fazer pedido de ajuda',
      acaoSecundaria: 'Ver recursos disponíveis'
    },
    {
      id: 'pedido',
      titulo: ' Como pedir ajuda',
      texto: 'Pode utilizar o formulário de pedido de ajuda nesta plataforma ou procurar apoio através dos recursos disponíveis por distrito. Quanto mais clara for a descrição, mais fácil será o encaminhamento.',
      acaoPrimaria: 'Ir para pedido',
      acaoSecundaria: 'Ver recursos disponíveis'
    },
    {
      id: 'legal',
      titulo: ' O que posso fazer legalmente',
      texto: 'Pode apresentar denúncia às autoridades competentes e procurar apoio jurídico para compreender melhor os seus direitos, os procedimentos e eventuais medidas de proteção.',
      acaoPrimaria: 'Ver direitos',
      acaoSecundaria: 'Fazer pedido de ajuda'
    },
    {
      id: 'emocional',
      titulo: ' Apoio emocional',
      texto: 'O apoio emocional e psicológico pode ser essencial. Existem entidades e serviços especializados que podem acompanhar a vítima de forma segura e confidencial.',
      acaoPrimaria: 'Ver recursos disponíveis',
      acaoSecundaria: 'Fazer pedido de ajuda'
    }
  ];

  pedidoSubmitting = false;
  readonly contactoPattern = '^[0-9]{9,15}$';

  modalOpen = false;
  modalTitle = '';
  modalMessage = '';
  modalMode: 'alert' | 'confirm' = 'alert';
  private modalResolver: ((value: boolean) => void) | null = null;

  constructor(
    private supabaseService: SupabaseService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  async ngOnInit() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      document.body.classList.add('dark-mode');
    }

    await this.supabaseService.garantirSessaoPronta();
    await this.inicializarDashboard();

    const { data } = this.supabaseService.supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await this.inicializarDashboard();
      } else if (event === 'SIGNED_OUT') {
        this.nomeutilizador = 'Utilizador';
        this.isAdmin = false;
        this.pedidos = [];
        this.recursosPendentes = [];
        this.recursosAprovados = [];
        this.recursoSelecionadoPorPedido = {};
        this.cancelarEdicaoPedido(false);
      }

      this.cdr.detectChanges();
    });

    this.authSubscription = data.subscription;
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;

    if (this.isDarkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }

    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  async inicializarDashboard() {
    await this.carregarUsuario();
    await this.carregarPedidos();

    if (this.isAdmin) {
      await this.carregarRecursosPendentes();
      await this.carregarRecursosAprovados();
    }

    this.cdr.detectChanges();
  }

  async carregarUsuario() {
    const user = await this.supabaseService.getUser();

    if (!user) {
      return;
    }

    const metadata = user.user_metadata || {};
    console.log('USER METADATA:', metadata);
    console.log('ROLE:', metadata['role']);

    this.nomeutilizador = metadata['full_name'] || user.email || 'Utilizador';
    this.isAdmin = (metadata['role'] ?? '') === 'admin';

    if (!this.novoPedido.email) {
      this.novoPedido.email = user.email || '';
    }
  }

  async carregarPedidos() {
    const pedidos = await this.supabaseService.obterPedidos();

    if (!Array.isArray(pedidos)) {
      return;
    }

    this.pedidos = pedidos.map((pedido: any) => ({
      ...pedido,
      status: pedido.status || 'Pendente'
    }));

    this.recursoSelecionadoPorPedido = {};

    this.pedidos.forEach((pedido: any) => {
      this.recursoSelecionadoPorPedido[pedido.id] = pedido.recurso_id || null;
    });

    if (this.pedidoEmEdicaoId) {
      const pedidoAtualizado = this.pedidos.find((p: any) => p.id === this.pedidoEmEdicaoId);

      if (!pedidoAtualizado || !this.podeEditarPedido(pedidoAtualizado)) {
        this.cancelarEdicaoPedido(false);
      }
    }
  }

  async carregarRecursosPendentes() {
    const recursos = await this.supabaseService.obterRecursosPendentes();

    if (!Array.isArray(recursos)) {
      return;
    }

    this.recursosPendentes = recursos;
  }

  async carregarRecursosAprovados() {
    const recursos = await this.supabaseService.obterRecursos();

    if (!Array.isArray(recursos)) {
      return;
    }

    this.recursosAprovados = recursos;
  }

  setSection(section: string) {
  if (this.isAdmin && section === 'meus-pedidos') {
    this.activeSection = 'todos-pedidos';
    return;
  }

  this.activeSection = section;


    if (section === 'meus-pedidos' || section === 'todos-pedidos' || section === 'status') {
      this.carregarPedidos().then(() => this.cdr.detectChanges());
    }

    if (section === 'recursos-pendentes' && this.isAdmin) {
      this.carregarRecursosPendentes().then(() => this.cdr.detectChanges());
    }

    if ((section === 'todos-pedidos' || section === 'status') && this.isAdmin) {
      this.carregarRecursosAprovados().then(() => this.cdr.detectChanges());
    }
  }

  abrirModalAlerta(titulo: string, mensagem: string) {
    this.modalTitle = titulo;
    this.modalMessage = mensagem;
    this.modalMode = 'alert';
    this.modalOpen = true;
  }

  abrirModalConfirmacao(titulo: string, mensagem: string): Promise<boolean> {
    this.modalTitle = titulo;
    this.modalMessage = mensagem;
    this.modalMode = 'confirm';
    this.modalOpen = true;

    return new Promise((resolve) => {
      this.modalResolver = resolve;
    });
  }

  fecharModal() {
    this.modalOpen = false;
    this.modalTitle = '';
    this.modalMessage = '';
    this.modalMode = 'alert';

    if (this.modalResolver) {
      this.modalResolver(false);
      this.modalResolver = null;
    }
  }

  confirmarModal() {
    this.modalOpen = false;

    if (this.modalResolver) {
      this.modalResolver(true);
      this.modalResolver = null;
    }
  }

  async enviarPedido(form?: NgForm) {
  if (this.isAdmin) {
  this.abrirModalAlerta('Ação não permitida', 'Administradores não podem criar pedidos.');
  return;
}

  const { email, tipo_pedido, contacto, distrito, descricao } = this.novoPedido;
  const emailLimpo = (email || '').trim();
  const tipoLimpo = (tipo_pedido || '').trim();
  const contactoLimpo = (contacto || '').trim();
  const descricaoLimpa = (descricao || '').trim();

  if (!emailLimpo || !tipoLimpo || !contactoLimpo || !distrito || !descricaoLimpa) {
    this.abrirModalAlerta('Campos obrigatórios', 'Preencha todos os campos do pedido de ajuda.');
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
    this.abrirModalAlerta('Email inválido', 'Introduza um email válido.');
    return;
  }

  if (!/^[0-9]{9,15}$/.test(contactoLimpo)) {
    this.abrirModalAlerta('Contacto inválido', 'O contacto deve conter apenas números e ter pelo menos 9 dígitos.');
    return;
  }

  if (descricaoLimpa.length < 10) {
    this.abrirModalAlerta('Descrição inválida', 'A descrição deve ter no mínimo 10 caracteres.');
    return;
  }

  this.pedidoSubmitting = true;

  try {
    const user = await this.supabaseService.getUser();

    if (!user) {
      this.abrirModalAlerta('Sessão inválida', 'Tem de iniciar sessão para enviar um pedido.');
      return;
    }

    const { data, error } = await this.supabaseService.criarPedido({
      user_id: user.id,
      email: emailLimpo,
      tipo_pedido: tipoLimpo,
      contacto: contactoLimpo,
      distrito,
      descricao: descricaoLimpa
    });

    if (error) {
      this.abrirModalAlerta('Erro ao enviar pedido', error.message);
      return;
    }

    const pedidoCriado = Array.isArray(data) ? data[0] : null;

    if (pedidoCriado) {
      this.pedidos = [
        { ...pedidoCriado, status: pedidoCriado.status || 'Pendente' },
        ...this.pedidos
      ];
      this.recursoSelecionadoPorPedido[pedidoCriado.id] = pedidoCriado.recurso_id || null;
    } else {
      await this.carregarPedidos();
    }

    this.novoPedido = {
      email: emailLimpo,
      tipo_pedido: '',
      contacto: '',
      distrito: '',
      descricao: ''
    };

    if (form) {
      form.resetForm({ email: emailLimpo });
    }

    this.activeSection = 'meus-pedidos';
    this.cdr.detectChanges();
    this.abrirModalAlerta('Sucesso', 'Pedido enviado com sucesso!');
  } finally {
    this.pedidoSubmitting = false;
  }
}

  verDetalhePedido(pedido: any) {
    this.router.navigate(['/pedido', pedido.id]);
  }

  async fazerLogout(event?: Event) {
  event?.preventDefault();

  const confirmar = await this.abrirModalConfirmacao(
    'Confirmar logout',
    'Tem a certeza que deseja terminar a sessão?'
  );

  if (!confirmar) return;

  const resultado = await this.supabaseService.signOut();

  if (resultado?.error) {
    await this.abrirModalAlerta(
      'Erro ao terminar sessão',
      resultado.error.message || 'Não foi possível terminar a sessão.'
    );
    return;
  }

  this.nomeutilizador = 'Utilizador';
  this.isAdmin = false;
  this.pedidos = [];
  this.recursosPendentes = [];
  this.recursosAprovados = [];
  this.recursoSelecionadoPorPedido = {};
  this.cancelarEdicaoPedido(false);
  this.activeSection = 'info';

  await this.router.navigate(['/login']);
}

  saidaRapida(event: Event) {
    event.preventDefault();
    window.location.replace('https://www.google.pt');
  }

  podeEditarPedido(pedido: any): boolean {
    if (!pedido) return false;
    if (this.isAdmin) return false;

    return (pedido.status || '').trim().toLowerCase() === 'pendente';
  }

  iniciarEdicaoPedido(pedido: any) {
    if (!this.podeEditarPedido(pedido)) return;

    this.pedidoEmEdicaoId = pedido.id;
    this.pedidoEditando = {
      id: pedido.id,
      email: pedido.email || '',
      tipo_pedido: pedido.tipo_pedido || '',
      contacto: pedido.contacto || '',
      distrito: pedido.distrito || '',
      descricao: pedido.descricao || ''
    };

    this.cdr.detectChanges();
  }

  cancelarEdicaoPedido(confirmarCancelamento = true) {
    if (confirmarCancelamento && this.pedidoEmEdicaoId) {
      this.abrirModalAlerta('Edição cancelada', 'As alterações não guardadas foram descartadas.');
    }

    this.pedidoEmEdicaoId = null;
    this.pedidoEditando = null;
    this.pedidoEditandoSubmitting = false;
    this.cdr.detectChanges();
  }

  async guardarEdicaoPedido() {
    if (!this.pedidoEditando || !this.pedidoEmEdicaoId) return;
    if (this.pedidoEditandoSubmitting) return;

    const emailLimpo = (this.pedidoEditando.email || '').trim();
    const tipoLimpo = (this.pedidoEditando.tipo_pedido || '').trim();
    const contactoLimpo = (this.pedidoEditando.contacto || '').trim();
    const distritoLimpo = (this.pedidoEditando.distrito || '').trim();
    const descricaoLimpa = (this.pedidoEditando.descricao || '').trim();

    if (!emailLimpo || !tipoLimpo || !contactoLimpo || !distritoLimpo || !descricaoLimpa) {
      this.abrirModalAlerta('Campos obrigatórios', 'Preencha todos os campos do pedido.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) {
      this.abrirModalAlerta('Email inválido', 'Introduza um email válido.');
      return;
    }

    if (!/^[0-9]{9,15}$/.test(contactoLimpo)) {
      this.abrirModalAlerta('Contacto inválido', 'O contacto deve conter apenas números e ter entre 9 e 15 dígitos.');
      return;
    }

    if (descricaoLimpa.length < 10) {
      this.abrirModalAlerta('Descrição inválida', 'A descrição deve ter no mínimo 10 caracteres.');
      return;
    }

    const pedidoOriginal = this.pedidos.find((p: any) => p.id === this.pedidoEmEdicaoId);

    if (!pedidoOriginal || !this.podeEditarPedido(pedidoOriginal)) {
      this.abrirModalAlerta('Edição não permitida', 'Este pedido já não pode ser editado.');
      this.cancelarEdicaoPedido(false);
      return;
    }

    this.pedidoEditandoSubmitting = true;

    try {
      const { error } = await this.supabaseService.atualizarPedidoUtilizador(String(this.pedidoEmEdicaoId), {
        email: emailLimpo,
        tipo_pedido: tipoLimpo,
        contacto: contactoLimpo,
        distrito: distritoLimpo,
        descricao: descricaoLimpa
      });

      if (error) {
        this.abrirModalAlerta('Erro ao editar pedido', error.message);
        return;
      }

      await this.carregarPedidos();
      this.cancelarEdicaoPedido(false);
      this.abrirModalAlerta('Sucesso', 'Pedido atualizado com sucesso!');
    } finally {
      this.pedidoEditandoSubmitting = false;
      this.cdr.detectChanges();
    }
  }

 async apagarPedido(pedidoOuId: any) {
  const id =
    typeof pedidoOuId === 'object' && pedidoOuId !== null
      ? pedidoOuId.id
      : pedidoOuId;

  console.log('ID recebido para apagar:', id, 'valor original:', pedidoOuId);

  const confirmar = await this.abrirModalConfirmacao(
    'Apagar pedido',
    'Tem a certeza que deseja apagar este pedido?'
  );

  if (!confirmar) return;

  const resultado = await this.supabaseService.apagarPedido(id);

  console.log('Resultado do apagar:', resultado);

  if (resultado?.error) {
    this.abrirModalAlerta(
      'Erro ao apagar pedido',
      resultado.error.message || 'Não foi possível apagar o pedido.'
    );
    return;
  }

  this.pedidos = this.pedidos.filter((p: any) => String(p.id) !== String(id));
  this.cdr.detectChanges();

  this.abrirModalAlerta('Sucesso', 'Pedido apagado com sucesso.');
}

  async atualizarStatusPedido(pedido: any, novoStatus: string) {
  const resultado = await this.supabaseService.atualizarStatusPedido(
    pedido.id,
    novoStatus
  );

  if (resultado?.error) {
    await this.abrirModalAlerta(
      'Erro ao atualizar pedido',
      resultado.error.message || 'Não foi possível atualizar o pedido.'
    );
    return;
  }

  await this.abrirModalAlerta(
  'Status atualizado',
  'O status do pedido foi atualizado com sucesso.'
);

  pedido.status = novoStatus;
  await this.carregarPedidos();
}

  async encaminharPedido(pedido: any) {
    if (!this.isAdmin) return;

    const recursoId = this.recursoSelecionadoPorPedido[pedido.id];

    if (!recursoId) {
      this.abrirModalAlerta('Recurso obrigatório', 'Selecione um recurso antes de encaminhar.');
      return;
    }

    const recurso = this.recursosAprovados.find((r: any) => r.id === Number(recursoId));

    if (!recurso) {
      this.abrirModalAlerta('Erro', 'Recurso não encontrado.');
      return;
    }

    const mensagem = `O seu pedido foi encaminhado para ${recurso.nome}. Contacto: ${recurso.contacto}. Website: ${recurso.website || 'Não disponível'}.`;

    const { error } = await this.supabaseService.encaminharPedido(pedido.id, {
      recurso_id: recurso.id,
      recurso_nome: recurso.nome,
      recurso_contacto: recurso.contacto,
      recurso_website: recurso.website || null,
      mensagem_encaminhamento: mensagem
    });

    if (error) {
      this.abrirModalAlerta('Erro ao encaminhar pedido', error.message);
      return;
    }

    await this.carregarPedidos();
    this.cdr.detectChanges();
    this.abrirModalAlerta('Sucesso', 'Pedido encaminhado com sucesso!');
  }

  obterLinkEmailSimulado(pedido: any): string {
    const assunto = encodeURIComponent('Encaminhamento de pedido de apoio');
    const corpo = encodeURIComponent(
      pedido.mensagem_encaminhamento ||
      `O seu pedido foi encaminhado para ${pedido.recurso_nome || 'um recurso de apoio'}.`
    );

    return `mailto:${pedido.email}?subject=${assunto}&body=${corpo}`;
  }

  verMensagemEmail(pedido: any) {
    const mensagem =
      pedido.mensagem_encaminhamento ||
      `O seu pedido foi encaminhado para ${pedido.recurso_nome || 'um recurso de apoio'}.`;

    this.abrirModalAlerta(
      'Mensagem de email',
      `ASSUNTO: Encaminhamento de pedido de apoio\n\n${mensagem}\n\nEste email é apenas preparado, não é enviado automaticamente.`
    );
  }

  isStatusBloqueado(pedido: any): boolean {
    return pedido.status === 'Concluído';
  }

  async aprovarRecurso(recurso: any) {
    if (!this.isAdmin) return;

    const confirmar = await this.abrirModalConfirmacao(
      'Aprovar recurso',
      `Deseja aprovar o recurso "${recurso.nome}"?`
    );
    if (!confirmar) return;

    const { error } = await this.supabaseService.aprovarRecurso(recurso.id);

    if (error) {
      this.abrirModalAlerta('Erro ao aprovar recurso', error.message);
      return;
    }

    await this.carregarRecursosPendentes();
    await this.carregarRecursosAprovados();
    this.cdr.detectChanges();
    this.abrirModalAlerta('Sucesso', 'Recurso aprovado com sucesso!');
  }

  async rejeitarRecurso(recurso: any) {
    if (!this.isAdmin) return;

    const confirmar = await this.abrirModalConfirmacao(
      'Rejeitar recurso',
      `Deseja rejeitar/apagar o recurso "${recurso.nome}"?`
    );
    if (!confirmar) return;

    const { error } = await this.supabaseService.apagarRecursoPendente(recurso.id);

    if (error) {
      this.abrirModalAlerta('Erro ao rejeitar recurso', error.message);
      return;
    }

    await this.carregarRecursosPendentes();
    await this.carregarRecursosAprovados();
    this.cdr.detectChanges();
    this.abrirModalAlerta('Sucesso', 'Recurso rejeitado com sucesso!');
  }

  toggleGuia(itemId: string) {
    this.guiaAberto = this.guiaAberto === itemId ? null : itemId;
  }

  executarAcaoGuia(acao: string) {
    if (acao === 'Fazer pedido de ajuda' || acao === 'Ir para pedido') {
      this.setSection('info');
      this.cdr.detectChanges();
      return;
    }

    if (acao === 'Ver recursos disponíveis') {
      this.router.navigate(['/apoio']);
      return;
    }

    if (acao === 'Ver direitos') {
      this.setSection('direitos');
      this.cdr.detectChanges();
      return;
    }
  }

  getStatusClass(status: string): string {
    if (!status) return 'status-pendente';

    const valor = status.toLowerCase().trim();

    if (valor.includes('pendente')) return 'status-pendente';

    if (
      valor.includes('andamento') ||
      valor.includes('análise') ||
      valor.includes('analise') ||
      valor.includes('encaminhado')
    ) {
      return 'status-em-andamento';
    }

    if (
      valor.includes('concluído') ||
      valor.includes('concluido') ||
      valor.includes('resolvido')
    ) {
      return 'status-concluido';
    }

    return 'status-pendente';
  }
}