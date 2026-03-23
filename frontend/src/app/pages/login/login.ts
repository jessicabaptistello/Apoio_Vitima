import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment.development';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html', 
  styleUrls: ['./login.css']
})
export class LoginComponent {
  // Variáveis ligadas ao formulário HTML
  nomeCompleto: string = '';
  email: string = '';
  password: string = '';
  
  loading: boolean = false;
  errorMessage: string = '';

  private supabase: SupabaseClient;

  // O Router permite que o Angular mude de página após o sucesso
  constructor(private router: Router) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async handleLogin() {
    // Log de diagnóstico para verificar os dados no console
    console.log('Dados enviados:', { email: this.email, senha: this.password });

    if (!this.email || !this.password) {
      this.errorMessage = "Por favor, preencha o e-mail e a senha.";
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: this.email,
        password: this.password
      });

      if (error) throw error;
      
      // Login validado com sucesso pelo Supabase
      alert('Login realizado com sucesso!');
      
      // Redireciona o utilizador para a área interna
      this.router.navigate(['/dashboard']); 

    } catch (error: any) {
      // Exibe o erro (ex: credenciais inválidas ou e-mail não confirmado)
      this.errorMessage = error.message;
      console.error('Erro Supabase:', error);
    } finally {
      // Independentemente do resultado, o botão para de carregar
      this.loading = false;
    }
  }

  async handleSignUp() {
    this.loading = true;
    this.errorMessage = '';

    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: this.email,
        password: this.password,
        options: {
          data: { full_name: this.nomeCompleto }
        }
      });

      if (error) throw error;
      alert('Registo solicitado! Verifique o painel do Supabase.');
    } catch (error: any) {
      this.errorMessage = error.message;
    } finally {
      this.loading = false;
    }
  }
}