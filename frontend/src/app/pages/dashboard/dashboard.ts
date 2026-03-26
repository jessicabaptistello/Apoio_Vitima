import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SaudacaoPipe } from '../../saudacao-pipe';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SaudacaoPipe],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  nomeutilizador: string = 'Utilizador';
  isAdmin: boolean = false;
  activeSection: string = 'info';
  mensagemLivre: string = '';
  pedidos: any[] = [];

  private authSubscription: any;

  contatos = [
    { nome: 'INEM', numero: '112', descricao: 'Emergencias Medicas'},
    { nome: 'GNR / PSP', numero: '112', descricao: 'Seguranca Imediata'},
    { nome: 'SNS 24', numero: '808242424', descricao: 'Apoio Medico'},
    { nome: 'Apoio Vitima', numero: '800202148', descricao: 'Apoio Psicologico'}
  ];

  alertasRapidos = [
    'Estou em perigo!',
    'Preciso de transporte.',
    'Alguem me persegue.',
    'Preciso de abrigo.'
  ];

  constructor(private supabaseService: SupabaseService) {}

  async ngOnInit() {
    await this.inicializarDashboard();

    const { data } = this.supabaseService.supabase.auth.onAuthStateChange(async () => {
      await this.inicializarDashboard();
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

    // pequena segunda tentativa, para garantir que o nome aparece logo após login
    setTimeout(async () => {
      await this.carregarUsuario();
    }, 300);
  }

  async carregarUsuario() {
    const user = await this.supabaseService.getUser();
    if (!user) return;

    const metadata = user.user_metadata || {};
    this.nomeutilizador = metadata['full_name'] || 'Utilizador';
    this.isAdmin = (metadata['role'] ?? '') === 'admin';
    console.log('Usuário carregado:', user);
  }

  setSection(section: string) {
    this.activeSection = section;
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
    console.log('Pedidos carregados no dashboard:', this.pedidos);
  }

  async logout() {
    const { error } = await this.supabaseService.signOut();

    if (error) {
      console.error('Erro ao sair:', error.message);
      alert('Erro ao encerrar sessão');
      return;
    }

    alert('Sessão encerrada!');
    window.location.assign('https://www.google.pt');
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