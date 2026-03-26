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

  async handleLogin() {
    this.loadingLogin = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { error } = await this.supabaseService.signIn(this.email, this.password);

    if (error) {
      this.errorMessage = error.message;
      this.loadingLogin = false;
      return;
    }

    this.loadingLogin = false;
    await this.router.navigate(['/dashboard']);
  }

  async handleSignUp() {
    this.loadingSignUp = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { error } = await this.supabaseService.signUp(
      this.email,
      this.password,
      this.nomeCompleto
    );

    if (error) {
      this.errorMessage = error.message;
      this.loadingSignUp = false;
      return;
    }

    this.loadingSignUp = false;
    this.successMessage = 'Conta criada com sucesso! Agora pode clicar em "Entrar".';
  }

  usarDadosParaLogin() {
    this.successMessage = '';
  }
}