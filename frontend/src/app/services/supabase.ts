import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public supabase: SupabaseClient;

  constructor() {
    console.log('Supabase URL:', environment.supabaseUrl);
    console.log('Supabase Key existe?', !!environment.supabaseKey);

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
    const response = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (response.error) {
      console.error('Erro no login:', response.error.message);
    }

    return response;
  }

  async signUp(email: string, password: string, fullName: string) {
    const response = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || 'Utilizador'
        }
      }
    });

    if (response.error) {
      console.error('Erro no registo:', response.error.message);
    }

    return response;
  }

  async signOut() {
    const response = await this.supabase.auth.signOut();

    if (response.error) {
      console.error('Erro no logout:', response.error.message);
    }

    return response;
  }

  async getUser(): Promise<User | null> {
    const { data: sessionData, error: sessionError } = await this.supabase.auth.getSession();

    if (sessionError) {
      console.error('Erro ao obter sessão:', sessionError.message);
    }

    if (sessionData?.session?.user) {
      return sessionData.session.user;
    }

    const { data, error } = await this.supabase.auth.getUser();

    if (error) {
      console.error('Erro ao obter utilizador:', error.message);
      return null;
    }

    return data.user ?? null;
  }

  async criarPedido(descricao: string) {
    const user = await this.getUser();

    if (!user) {
      console.error('Usuário não autenticado');
      return { data: null, error: new Error('Usuário não autenticado') };
    }

    const response = await this.supabase
      .from('pedidos')
      .insert([
        {
          titulo: 'Pedido de Ajuda',
          descricao: descricao,
          user_id: user.id,
          status: 'Pendente'
        }
      ])
      .select();

    if (response.error) {
      console.error('Erro ao criar pedido:', response.error.message);
    }

    return response;
  }

  async obterPedidos() {
    const user = await this.getUser();

    if (!user) {
      console.error('Nenhum utilizador autenticado');
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
        console.error('Erro ao carregar pedidos (admin):', error.message);
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

  async obterRecursos() {
    const { data, error } = await this.supabase
      .from('recursos')
      .select('*')
      .eq('status', 'aprovado')
      .order('id', { ascending: false });

    if (error) {
      console.error('Erro ao carregar recursos:', error.message);
      return [];
    }

    return data || [];
  }

  async sugerirRecurso(
    nome: string,
    tipo: string,
    contacto: string,
    website: string,
    distrito: string,
    descricao: string
  ) {
    const { data, error } = await this.supabase
      .from('recursos')
      .insert([
        {
          nome,
          tipo,
          contacto,
          website,
          distrito,
          descricao,
          status: 'pendente'
        }
      ])
      .select();

    if (error) {
      console.error('Erro ao sugerir recurso:', error.message);
    }

    return { data, error };
  }

  async obterRecursosPendentes() {
    const user = await this.getUser();

    if (!user) {
      console.error('Nenhum utilizador autenticado');
      return [];
    }

    const metadata = user.user_metadata || {};
    const isAdmin = (metadata['role'] ?? '') === 'admin';

    if (!isAdmin) {
      console.error('Apenas admin pode ver recursos pendentes');
      return [];
    }

    const { data, error } = await this.supabase
      .from('recursos')
      .select('*')
      .eq('status', 'pendente')
      .order('id', { ascending: false });

    if (error) {
      console.error('Erro ao carregar recursos pendentes:', error.message);
      return [];
    }

    return data || [];
  }

  async aprovarRecurso(id: number) {
    const { data, error } = await this.supabase
      .from('recursos')
      .update({ status: 'aprovado' })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Erro ao aprovar recurso:', error.message);
    }

    return { data, error };
  }

  async apagarRecursoPendente(id: number) {
    const { error } = await this.supabase
      .from('recursos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao apagar recurso pendente:', error.message);
    }

    return { error };
  }
}