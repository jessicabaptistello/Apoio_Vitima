import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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

  async enviarPedido() {
    const { email, tipo_pedido, contacto, distrito, descricao } = this.novoPedido;

    if (!email || !tipo_pedido || !contacto || !distrito || !descricao) {
      alert('Preencha todos os campos do pedido.');
      return;
    }

    await this.supabaseService.garantirSessaoPronta();

    const { data, error } = await this.supabaseService.criarPedido({
      email,
      tipo_pedido,
      contacto,
      distrito,
      descricao
    });

    if (error) {
      alert('Erro ao enviar pedido: ' + error.message);
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

    alert('Pedido enviado com sucesso!');

    this.novoPedido = {
      email,
      tipo_pedido: '',
      contacto: '',
      distrito: '',
      descricao: ''
    };

    this.activeSection = 'meus-pedidos';
    this.cdr.detectChanges();
  }

  verDetalhePedido(pedido: any) {
    this.router.navigate(['/pedido', pedido.id]);
  }

  async logout(event: Event) {
    event.preventDefault();

    const confirmar = confirm('Tem a certeza que deseja sair?');
    if (!confirmar) return;

    await this.supabaseService.signOut();

    this.nomeutilizador = 'Utilizador';
    this.isAdmin = false;
    this.pedidos = [];
    this.recursosPendentes = [];
    this.recursosAprovados = [];
    this.recursoSelecionadoPorPedido = {};

    this.cdr.detectChanges();
    alert('Sessão encerrada!');
    window.location.href = 'https://www.google.pt';
  }

  async apagarPedido(pedido: any) {
    if (!this.isAdmin) return;

    const confirmar = confirm('Tem a certeza que deseja apagar este pedido?');
    if (!confirmar) return;

    const { error } = await this.supabaseService.apagarPedido(pedido.id);

    if (error) {
      alert('Erro ao apagar pedido: ' + error.message);
      return;
    }

    this.pedidos = this.pedidos.filter((p) => p.id !== pedido.id);
    delete this.recursoSelecionadoPorPedido[pedido.id];

    this.cdr.detectChanges();
    alert('Pedido apagado com sucesso!');
  }

  async atualizarStatusPedido(pedido: any, novoStatus: string) {
    if (!this.isAdmin) return;
    if (!novoStatus) return;
    if (pedido.status === 'Concluído') return;

    const { error } = await this.supabaseService.atualizarStatusPedido(pedido.id, novoStatus);

    if (error) {
      alert('Erro ao atualizar status: ' + error.message);
      return;
    }

    pedido.status = novoStatus;
    this.cdr.detectChanges();
    alert('Status atualizado com sucesso!');
  }

  async encaminharPedido(pedido: any) {
    if (!this.isAdmin) return;

    const recursoId = this.recursoSelecionadoPorPedido[pedido.id];

    if (!recursoId) {
      alert('Selecione um recurso antes de encaminhar.');
      return;
    }

    const recurso = this.recursosAprovados.find((r: any) => r.id === Number(recursoId));

    if (!recurso) {
      alert('Recurso não encontrado.');
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
      alert('Erro ao encaminhar pedido: ' + error.message);
      return;
    }

    pedido.status = 'Encaminhado';
    pedido.recurso_id = recurso.id;
    pedido.recurso_nome = recurso.nome;
    pedido.recurso_contacto = recurso.contacto;
    pedido.recurso_website = recurso.website || null;
    pedido.mensagem_encaminhamento = mensagem;

    this.cdr.detectChanges();
    alert('Pedido encaminhado com sucesso!');
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

    alert(
      `ASSUNTO: Encaminhamento de pedido de apoio\n\n${mensagem}\n\nEste email é apenas preparado, não é enviado automaticamente.`
    );
  }

  isStatusBloqueado(pedido: any): boolean {
    return pedido.status === 'Concluído';
  }

  async aprovarRecurso(recurso: any) {
    if (!this.isAdmin) return;

    const confirmar = confirm(`Deseja aprovar o recurso "${recurso.nome}"?`);
    if (!confirmar) return;

    const { data, error } = await this.supabaseService.aprovarRecurso(recurso.id);

    if (error) {
      alert('Erro ao aprovar recurso: ' + error.message);
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
    alert('Recurso aprovado com sucesso!');
  }

  async rejeitarRecurso(recurso: any) {
    if (!this.isAdmin) return;

    const confirmar = confirm(`Deseja rejeitar/apagar o recurso "${recurso.nome}"?`);
    if (!confirmar) return;

    const { error } = await this.supabaseService.apagarRecursoPendente(recurso.id);

    if (error) {
      alert('Erro ao rejeitar recurso: ' + error.message);
      return;
    }

    this.recursosPendentes = this.recursosPendentes.filter((r) => r.id !== recurso.id);
    this.recursosAprovados = this.recursosAprovados.filter((r) => r.id !== recurso.id);

    this.cdr.detectChanges();
    alert('Recurso rejeitado com sucesso!');
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