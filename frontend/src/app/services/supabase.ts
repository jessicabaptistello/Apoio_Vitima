import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  // Login simples
  async signIn(email: string, pass: string) {
    return await this.supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
  }

  // Registo com o nome completo nos metadados
  async signUp(email: string, pass: string, fullName: string) {
    return await this.supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: fullName // Aqui é onde o nome fica guardado
        }
      }
    });
  }
}