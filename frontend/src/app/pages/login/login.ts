import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  email: string = '';
  password: string = '';
  nomeCompleto: string = '';
  loading: boolean = false;
  errorMessage: string = '';

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async handleLogin() {
    this.loading = true;
    this.errorMessage = '';

    const { error } = await this.supabaseService.signIn(this.email, this.password);

    if (error) {
      this.errorMessage = error.message;
      this.loading = false;
      return;
    }

    this.loading = false;
    this.router.navigate(['/dashboard']);
  }

  async handleSignUp() {
    this.loading = true;
    this.errorMessage = '';

    const { error } = await this.supabaseService.signUp(
      this.email,
      this.password,
      this.nomeCompleto
    );

    if (error) {
      this.errorMessage = error.message;
      this.loading = false;
      return;
    }

    alert('Conta criada com sucesso! Agora pode entrar.');
    this.loading = false;
  }
}