import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  nomeCompleto: string = '';

  loadingLogin: boolean = false;
  loadingSignUp: boolean = false;

  errorMessage: string = '';
  successMessage: string = '';

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  usarDadosParaLogin() {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private traduzirErroLogin(message: string): string {
    const texto = (message || '').toLowerCase();

    if (texto.includes('invalid login credentials')) {
      return 'Utilizador não encontrado ou palavra-passe incorreta.';
    }

    if (texto.includes('timeout')) {
      return 'A ligação demorou demasiado. Tente novamente.';
    }

    if (texto.includes('email not confirmed')) {
      return 'Conta criada, mas o email ainda não foi confirmado.';
    }

    return message || 'Não foi possível iniciar sessão.';
  }

  private traduzirErroRegisto(message: string): string {
    const texto = (message || '').toLowerCase();

    if (texto.includes('user already registered')) {
      return 'Este email já está registado.';
    }

    if (texto.includes('timeout')) {
      return 'A conta pode ter sido criada. Tente clicar em "Entrar".';
    }

    return message || 'Não foi possível criar a conta.';
  }

  async handleLogin() {
    if (this.loadingLogin || this.loadingSignUp) return;

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Preencha email e palavra-passe.';
      return;
    }

    this.loadingLogin = true;

    try {
      const { error } = await this.supabaseService.signIn(
        this.email.trim(),
        this.password
      );

      if (error) {
        this.errorMessage = this.traduzirErroLogin(error.message);
        return;
      }

      this.successMessage = 'Entrada efetuada com sucesso.';
      await this.router.navigate(['/dashboard']);
    } finally {
      this.loadingLogin = false;
    }
  }

  async handleSignUp() {
    if (this.loadingLogin || this.loadingSignUp) return;

    this.errorMessage = '';
    this.successMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Preencha email e palavra-passe para criar a conta.';
      return;
    }

    this.loadingSignUp = true;

    try {
      const { error } = await this.supabaseService.signUp(
        this.email.trim(),
        this.password,
        this.nomeCompleto.trim()
      );

      if (error) {
        this.errorMessage = this.traduzirErroRegisto(error.message);
        return;
      }

      this.successMessage = 'Conta criada com sucesso. Agora pode clicar em "Entrar".';
    } finally {
      this.loadingSignUp = false;
    }
  }
}