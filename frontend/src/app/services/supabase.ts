import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        persistSession: true,  
        detectSessionInUrl: true
      }
    });
  }

  async signIn(email: string, password: string) {
    return await this.supabase.auth.signInWithPassword({ email, password });
  }

  async signUp(email: string, password: string, fullName: string, role?: string) {
    return await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role ?? 'user'
        }
      }
    });
  }

  async signOut() {
    return await this.supabase.auth.signOut();
  }

  async getUser() {
    const { data } = await this.supabase.auth.getUser();
    return data.user;
  }

  async criarPedido(descricao: string) {
    const user = await this.getUser();
    if (!user) return { error: new Error('Usuário não autenticado') };

    return await this.supabase
      .from('pedidos')
      .insert([{ titulo: 'Pedido de Ajuda', descricao, user_id: user.id }]);
  }

  async obterPedidos() {
    const user = await this.getUser();
    if (!user) return [];

    const role = user.user_metadata?.['role'] ?? 'user';

    if (role === 'admin') {
      const { data } = await this.supabase.from('pedidos').select('*').order('id', { ascending: false });
      return data || [];
    } else {
      const { data } = await this.supabase
        .from('pedidos')
        .select('*')
        .eq('user_id', user.id)
        .order('id', { ascending: false });
      return data || [];
    }
  }
}