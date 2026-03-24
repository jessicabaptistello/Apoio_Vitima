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
 
  nomeCompleto: string = '';
  email: string = '';
  password: string = '';
  
  loading: boolean = false;
  errorMessage: string = '';

  private supabase: SupabaseClient;

  
  constructor(private router: Router) {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async handleLogin() {
   
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
      
      
      alert('Login realizado com sucesso!');
      
      
      this.router.navigate(['/dashboard']); 

    } catch (error: any) {
      
      this.errorMessage = error.message;
      console.error('Erro Supabase:', error);
    } finally {
      
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
      alert('Registo solicitado!');
    } catch (error: any) {
      this.errorMessage = error.message;
    } finally {
      this.loading = false;
    }
  }
}