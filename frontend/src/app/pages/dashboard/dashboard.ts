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

  private abrirModalAlerta(titulo: string, mensagem: string) {
    this.modalTitle = titulo;
    this.modalMessage = mensagem;
    this.modalMode = 'alert';
    this.modalOpen = true;
  }

  private abrirModalConfirmacao(titulo: string, mensagem: string): Promise<boolean> {
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
    const contactoLimpo = (contacto || '').trim();
    const descricaoLimpa = (descricao || '').trim();

    if (!email || !tipo_pedido || !contactoLimpo || !distrito || !descricaoLimpa) {
      this.abrirModalAlerta('Campos obrigatórios', 'Preencha todos os campos do pedido.');
      return;
    }

    if (!/^[0-9]{9,15}$/.test(contactoLimpo)) {
      this.abrirModalAlerta('Contacto inválido', 'O contacto deve conter apenas números, com 9 a 15 dígitos.');
      return;
    }

    if (descricaoLimpa.length < 10) {
      this.abrirModalAlerta('Descrição inválida', 'A descrição deve ter no mínimo 10 caracteres.');
      return;
    }

    this.pedidoSubmitting = true;

    try {
      await this.supabaseService.garantirSessaoPronta();

      const { data, error } = await this.supabaseService.criarPedido({
        email: email.trim(),
        tipo_pedido,
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

      this.abrirModalAlerta('Sucesso', 'Pedido enviado com sucesso!');

      this.novoPedido = {
        email,
        tipo_pedido: '',
        contacto: '',
        distrito: '',
        descricao: ''
      };

      if (form) {
        form.resetForm({
          email
        });
      }

      this.activeSection = 'meus-pedidos';
      this.cdr.detectChanges();
    } finally {
      this.pedidoSubmitting = false;
    }
  }

  verDetalhePedido(pedido: any) {
    this.router.navigate(['/pedido', pedido.id]);
  }

  async logout(event: Event) {
    event.preventDefault();

    const confirmar = await this.abrirModalConfirmacao('Sair', 'Tem a certeza que deseja sair?');
    if (!confirmar) return;

    this.nomeutilizador = 'Utilizador';
    this.isAdmin = false;
    this.pedidos = [];
    this.recursosPendentes = [];
    this.recursosAprovados = [];
    this.recursoSelecionadoPorPedido = {};
    this.cdr.detectChanges();

    await this.supabaseService.signOut();
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

    this.pedidos = this.pedidos.filter((p) => p.id !== pedido.id);
    delete this.recursoSelecionadoPorPedido[pedido.id];

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

    pedido.status = novoStatus;
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

    pedido.status = 'Encaminhado';
    pedido.recurso_id = recurso.id;
    pedido.recurso_nome = recurso.nome;
    pedido.recurso_contacto = recurso.contacto;
    pedido.recurso_website = recurso.website || null;
    pedido.mensagem_encaminhamento = mensagem;

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

    const { data, error } = await this.supabaseService.aprovarRecurso(recurso.id);

    if (error) {
      this.abrirModalAlerta('Erro ao aprovar recurso', error.message);
      return;
    }

    this.recursosPendentes = this.recursosPendentes.filter((r) => r.id !== recurso.id);

    const recursoAprovado = Array.isArray(data) ? data[0] : null;
    if (recursoAprovado) {
      const jaExiste = this.recursosAprovados.some((r) => r.id === recursoAprovado.id);
      if (!jaExiste) {
        this.recursosAprovados = [...this.recursosAprovados, recursoAprovado].sort((a, b) =>
          String(a.nome).localeCompare(String(b.nome))
        );
      }
    } else {
      await this.carregarRecursosAprovados();
    }

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

    this.recursosPendentes = this.recursosPendentes.filter((r) => r.id !== recurso.id);
    this.recursosAprovados = this.recursosAprovados.filter((r) => r.id !== recurso.id);

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