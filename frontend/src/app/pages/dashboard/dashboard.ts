import { Component, OnDestroy, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  mensagemLivre: string = '';
  pedidos: any[] = [];
  recursosPendentes: any[] = [];

  private authSubscription: any;

  contatos = [
    { nome: 'INEM', numero: '112', descricao: 'Emergencias Medicas' },
    { nome: 'GNR / PSP', numero: '112', descricao: 'Seguranca Imediata' },
    { nome: 'SNS 24', numero: '808242424', descricao: 'Apoio Medico' },
    { nome: 'Apoio Vitima', numero: '800202148', descricao: 'Apoio Psicologico' }
  ];

  alertasRapidos = [
    'Estou em perigo!',
    'Preciso de transporte.',
    'Alguem me persegue.',
    'Preciso de abrigo.'
  ];

  constructor(
    private supabaseService: SupabaseService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.inicializarDashboard();

    const { data } = this.supabaseService.supabase.auth.onAuthStateChange(async () => {
      await this.inicializarDashboard();
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
    }

    setTimeout(async () => {
      await this.carregarUsuario();
      this.cdr.detectChanges();
    }, 300);
  }

  async carregarUsuario() {
    const user = await this.supabaseService.getUser();

    if (!user) {
      this.nomeutilizador = 'Utilizador';
      this.isAdmin = false;
      this.cdr.detectChanges();
      return;
    }

    const metadata = user.user_metadata || {};
    this.nomeutilizador = metadata['full_name'] || 'Utilizador';
    this.isAdmin = (metadata['role'] ?? '') === 'admin';
    this.cdr.detectChanges();
  }

  setSection(section: string) {
    this.activeSection = section;

    if (section === 'meus-pedidos' || section === 'todos-pedidos') {
      this.carregarPedidos();
    }

    if (section === 'recursos-pendentes' && this.isAdmin) {
      this.carregarRecursosPendentes();
    }
  }

  async enviarPedido(mensagem: string) {
    if (!mensagem) return;

    const { error } = await this.supabaseService.criarPedido(mensagem);

    if (error) {
      alert('Erro ao enviar pedido: ' + error.message);
    } else {
      alert('Pedido enviado! A ajuda está a caminho.');
      this.mensagemLivre = '';
      await this.carregarPedidos();
    }
  }

  async carregarPedidos() {
    this.pedidos = await this.supabaseService.obterPedidos();
    this.cdr.detectChanges();
    console.log('Pedidos carregados no dashboard:', this.pedidos);
  }

  async carregarRecursosPendentes() {
    this.recursosPendentes = await this.supabaseService.obterRecursosPendentes();
    this.cdr.detectChanges();
    console.log('Recursos pendentes carregados:', this.recursosPendentes);
  }

  logout(event: Event) {
    const confirmar = confirm('Tem a certeza que deseja sair?');

    if (!confirmar) {
      event.preventDefault();
      return;
    }

    this.supabaseService.signOut();

    this.nomeutilizador = 'Utilizador';
    this.isAdmin = false;
    this.pedidos = [];
    this.recursosPendentes = [];
    this.cdr.detectChanges();

    alert('Sessão encerrada!');
  }

  async apagarPedido(pedido: any) {
    if (!this.isAdmin) return;

    const confirmar = confirm('Tem a certeza que deseja apagar este pedido?');
    if (!confirmar) return;

    const { error } = await this.supabaseService.supabase
      .from('pedidos')
      .delete()
      .eq('id', pedido.id);

    if (error) {
      alert('Erro ao apagar pedido: ' + error.message);
    } else {
      alert('Pedido apagado com sucesso!');
      await this.carregarPedidos();
    }
  }

  async editarPedido(pedido: any) {
    if (!this.isAdmin) return;

    const novaDescricao = prompt('Digite a nova descrição:', pedido.descricao);
    if (!novaDescricao) return;

    const { error } = await this.supabaseService.supabase
      .from('pedidos')
      .update({ descricao: novaDescricao })
      .eq('id', pedido.id);

    if (error) {
      alert('Erro ao editar pedido: ' + error.message);
    } else {
      alert('Pedido atualizado com sucesso!');
      await this.carregarPedidos();
    }
  }

  async aprovarRecurso(recurso: any) {
    if (!this.isAdmin) return;

    const confirmar = confirm(`Deseja aprovar o recurso "${recurso.nome}"?`);
    if (!confirmar) return;

    const { error } = await this.supabaseService.aprovarRecurso(recurso.id);

    if (error) {
      alert('Erro ao aprovar recurso: ' + error.message);
      return;
    }

    alert('Recurso aprovado com sucesso!');
    await this.carregarRecursosPendentes();
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

    alert('Recurso rejeitado com sucesso!');
    await this.carregarRecursosPendentes();
  }

  getStatusClass(status: string): string {
    if (!status) return 'status-pendente';

    const valor = status.toLowerCase().trim();

    if (valor.includes('pendente')) return 'status-pendente';

    if (
      valor.includes('andamento') ||
      valor.includes('análise') ||
      valor.includes('analise')
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