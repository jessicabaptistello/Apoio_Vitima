import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      }
    );
  }

  async signIn(email: string, password: string) {
    return await this.supabase.auth.signInWithPassword({
      email,
      password
    });
  }

  async signUp(email: string, password: string, fullName: string) {
    return await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || 'Utilizador'
        }
      }
    });
  }

  async signOut() {
    return await this.supabase.auth.signOut();
  }

  async getUser(): Promise<User | null> {
    const { data, error } = await this.supabase.auth.getUser();

    if (error) {
      console.error('Erro ao obter utilizador:', error.message);
      return null;
    }

    return data.user;
  }

  async criarPedido(descricao: string) {
    const user = await this.getUser();

    if (!user) {
      return { error: new Error('Usuário não autenticado') };
    }

    return await this.supabase
      .from('pedidos')
      .insert([
        {
          titulo: 'Pedido de Ajuda',
          descricao,
          user_id: user.id,
          status: 'Pendente'
        }
      ]);
  }

  async obterPedidos() {
    const user = await this.getUser();

    if (!user) {
      return [];
    }

    const metadata = user.user_metadata || {};
    const isAdmin = (metadata['role'] ?? '') === 'admin';

    if (isAdmin) {
      const { data, error } = await this.supabase
        .from('pedidos')
        .select('*')
        .order('id', { ascending: false });

      if (error) {
        console.error('Erro ao carregar pedidos:', error.message);
        return [];
      }

      return data || [];
    }

    const { data, error } = await this.supabase
      .from('pedidos')
      .select('*')
      .eq('user_id', user.id)
      .order('id', { ascending: false });

    if (error) {
      console.error('Erro ao carregar pedidos:', error.message);
      return [];
    }

    return data || [];
  }
}