import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
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

  private limparMensagens() {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private obterMensagemErroLogin(message: string): string {
    const texto = (message || '').toLowerCase();

    if (
      texto.includes('invalid login credentials') ||
      texto.includes('email not confirmed') ||
      texto.includes('invalid_credentials')
    ) {
      return 'Utilizador inexistente ou palavra-passe incorreta.';
    }

    return message || 'Não foi possível iniciar sessão.';
  }

  private obterMensagemErroRegisto(message: string): string {
    const texto = (message || '').toLowerCase();

    if (texto.includes('user already registered')) {
      return 'Este email já está registado.';
    }

    return message || 'Não foi possível criar a conta.';
  }

  async handleLogin(form?: NgForm) {
    if (this.loadingLogin || this.loadingSignUp) return;

    this.loadingLogin = true;
    this.limparMensagens();

    if (!this.email || !this.password) {
      this.errorMessage = 'Preencha email e palavra-passe.';
      this.loadingLogin = false;
      return;
    }

    try {
      const { error } = await this.supabaseService.signIn(this.email.trim(), this.password);

      if (error) {
        this.errorMessage = this.obterMensagemErroLogin(error.message);
        return;
      }

      await this.router.navigate(['/dashboard']);
    } catch {
      this.errorMessage = 'Ocorreu um erro ao tentar entrar.';
    } finally {
      this.loadingLogin = false;
    }
  }

  async handleSignUp(form?: NgForm) {
    if (this.loadingLogin || this.loadingSignUp) return;

    this.loadingSignUp = true;
    this.limparMensagens();

    if (!this.email || !this.password) {
      this.errorMessage = 'Preencha email e palavra-passe para criar a conta.';
      this.loadingSignUp = false;
      return;
    }

    try {
      const { error } = await this.supabaseService.signUp(
        this.email.trim(),
        this.password,
        this.nomeCompleto.trim()
      );

      if (error) {
        this.errorMessage = this.obterMensagemErroRegisto(error.message);
        return;
      }

      this.successMessage = 'Conta criada com sucesso! Agora pode clicar em "Entrar".';
    } catch {
      this.errorMessage = 'Ocorreu um erro ao criar a conta.';
    } finally {
      this.loadingSignUp = false;
    }
  }

  usarDadosParaLogin() {
    this.successMessage = '';
  }
}