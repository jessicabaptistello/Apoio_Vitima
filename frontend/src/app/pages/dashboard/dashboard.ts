import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment.development';
import { SaudacaoPipe } from '../../saudacao-pipe';


@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, SaudacaoPipe],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  nomeutilizador: string = 'Utilizador';
  // Nova variável para controlar o acesso de administrador
  isAdmin: boolean = false; 
  
  activeSection: string = 'info';
  mensagemLivre: string = '';
  private supabase: SupabaseClient;

  contatos = [
    { nome: 'INEM', numero: '112', descricao: 'Emergencias Medicas', icon: '🚑' },
    { nome: 'GNR / PSP', numero: '112', descricao: 'Seguranca Imediata', icon: '👮' },
    { nome: 'SNS 24', numero: '808242424', descricao: 'Apoio Medico', icon: '🏥' },
    { nome: 'Apoio Vitima', numero: '800202148', descricao: 'Apoio Psicologico', icon: '🤝' }
  ];

  alertasRapidos = [
    'Estou em perigo!',
    'Preciso de transporte.',
    'Alguem me persegue.',
    'Preciso de abrigo.'
  ];

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async ngOnInit() {
    await this.obterDadosUtilizador();
  }

  async obterDadosUtilizador() {
    const { data: { user } } = await this.supabase.auth.getUser();
    
    if (user && user.user_metadata) {
      // 1. Pegamos o nome para a saudação
      this.nomeutilizador = user.user_metadata['full_name'] || 'Utilizador';
      
      // 2. Verificamos se o utilizador tem o papel de administrador
      // Se o role for 'admin', isAdmin será true. Caso contrário, será false.
      this.isAdmin = user.user_metadata['role'] === 'admin';
      
      console.log('Utilizador é admin?', this.isAdmin);
    }
  }

  setSection(section: string) {
    this.activeSection = section;
  }

  async enviarPedido(mensagem: string) {
    if (!mensagem) return;
    
    const { data: { user } } = await this.supabase.auth.getUser();

    const { error } = await this.supabase
      .from('pedidos')
      .insert([
        { 
          mensagem: mensagem, 
          user_id: user?.id 
        }
      ]);

    if (error) {
      console.error('Erro ao enviar:', error.message);
    } else {
      alert('Pedido enviado! A ajuda esta a caminho.');
      this.mensagemLivre = '';
    }
  }
}