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
  nomeutilizador: string = 'Utilizador';
  isAdmin: boolean = false;
  activeSection: string = 'info';

  pedidos: any[] = [];
  recursosPendentes: any[] = [];
  recursosAprovados: any[] = [];

  private authSubscription: any;

  recursoSelecionadoPorPedido: { [key: number]: number | null } = {};

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

  contatos = [
    { nome: 'INEM', numero: '112', descricao: 'Emergencias Medicas' },
    { nome: 'GNR / PSP', numero: '112', descricao: 'Seguranca Imediata' },
    { nome: 'SNS 24', numero: '808242424', descricao: 'Apoio Medico' },
    { nome: 'Apoio Vitima', numero: '800202148', descricao: 'Apoio Psicologico' }
  ];

  pedidoSubmitting: boolean = false;
  readonly contactoPattern = '^[0-9]{9,15}$';

  modalOpen: boolean = false;
  modalTitle: string = '';
  modalMessage: string = '';
  modalMode: 'alert' | 'confirm' = 'alert';
  private modalResolver: ((value: boolean) => void) | null = null;

  constructor(
    private supabaseService: SupabaseService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.supabaseService.garantirSessaoPronta();
    await this.inicializarDashboard();

    const { data } = this.supabaseService.supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await this.inicializarDashboard();
      } else {
        this.nomeutilizador = 'Utilizador';
        this.isAdmin = false;
        this.pedidos = [];
        this.recursosPendentes = [];
        this.recursosAprovados = [];
        this.recursoSelecionadoPorPedido = {};
      }

      this.cdr.detectChanges();
    });

    this.authSubscription = data.subscription;
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
      this.nomeutilizador = 'Utilizador';
      this.isAdmin = false;
      return;
    }

    const metadata = user.user_metadata || {};
    this.nomeutilizador = metadata['full_name'] || user.email || 'Utilizador';
    this.isAdmin = (metadata['role'] ?? '') === 'admin';

    if (!this.novoPedido.email) {
      this.novoPedido.email = user.email || '';
    }
  }

  async carregarPedidos() {
    const pedidos = await this.supabaseService.obterPedidos();

    this.pedidos = (pedidos || []).map((pedido: any) => ({
      ...pedido,
      status: pedido.status || 'Pendente'
    }));

    this.recursoSelecionadoPorPedido = {};

    this.pedidos.forEach((pedido: any) => {
      this.recursoSelecionadoPorPedido[pedido.id] = pedido.recurso_id || null;
    });
  }

  async carregarRecursosPendentes() {
    this.recursosPendentes = await this.supabaseService.obterRecursosPendentes();
  }

  async carregarRecursosAprovados() {
    this.recursosAprovados = await this.supabaseService.obterRecursos();
  }

  setSection(section: string) {
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
    if (this.pedidoSubmitting) return;

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
      const { data, error } = await this.supabaseService.criarPedido({
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

  async fazerLogout(event: Event) {
    event.preventDefault();

    const confirmar = await this.abrirModalConfirmacao(
      'Confirmar logout',
      'Tem a certeza que deseja terminar a sessão?'
    );

    if (!confirmar) return;

    const { error } = await this.supabaseService.signOut();

    if (error) {
      this.abrirModalAlerta('Erro no logout', error.message || 'Não foi possível terminar a sessão.');
      return;
    }

    this.abrirModalAlerta('Logout efetuado', 'Sessão terminada com sucesso.');

    setTimeout(async () => {
      await this.router.navigate(['/login']);
    }, 900);
  }

  logout(event: Event) {
    event.preventDefault();
    window.location.href = 'https://www.google.pt';
  }

  async apagarPedido(pedido: any) {
    if (!this.isAdmin) return;

    const confirmar = await this.abrirModalConfirmacao('Apagar pedido', 'Tem a certeza que deseja apagar este pedido?');
    if (!confirmar) return;

    const { error } = await this.supabaseService.apagarPedido(pedido.id);

    if (error) {
      this.abrirModalAlerta('Erro ao apagar pedido', error.message);
      return;
    }

    await this.carregarPedidos();
    this.cdr.detectChanges();
    this.abrirModalAlerta('Sucesso', 'Pedido apagado com sucesso!');
  }

  async atualizarStatusPedido(pedido: any, novoStatus: string) {
    if (!this.isAdmin) return;
    if (!novoStatus) return;
    if (pedido.status === 'Concluído') return;

    const { error } = await this.supabaseService.atualizarStatusPedido(pedido.id, novoStatus);

    if (error) {
      this.abrirModalAlerta('Erro ao atualizar status', error.message);
      return;
    }

    await this.carregarPedidos();
    this.cdr.detectChanges();
    this.abrirModalAlerta('Sucesso', 'Status atualizado com sucesso!');
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