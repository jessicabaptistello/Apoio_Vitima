import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment.development';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  public supabase: SupabaseClient;
  private currentUser: User | null = null;

  private sessionInitialized = false;
  private sessionInitPromise: Promise<void>;

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

    this.sessionInitPromise = this.inicializarSessao();

    this.supabase.auth.onAuthStateChange((_event, session) => {
      this.currentUser = session?.user ?? null;
      this.sessionInitialized = true;
    });
  }

  private async inicializarSessao(): Promise<void> {
    try {
      const { data, error } = await this.supabase.auth.getSession();

      if (error) {
        console.error('Erro ao restaurar sessão:', error.message);
        this.currentUser = null;
      } else {
        this.currentUser = data.session?.user ?? null;
      }
    } catch (error) {
      console.error('Erro inesperado ao inicializar sessão:', error);
      this.currentUser = null;
    } finally {
      this.sessionInitialized = true;
    }
  }

  async garantirSessaoPronta(): Promise<void> {
    if (!this.sessionInitialized) {
      await this.sessionInitPromise;
    }
  }

  async signIn(email: string, password: string) {
    const response = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (response.error) {
      console.error('Erro no login:', response.error.message);
    } else {
      this.currentUser = response.data.user ?? null;
      this.sessionInitialized = true;
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
    } else {
      this.currentUser = null;
      this.sessionInitialized = true;
    }

    return response;
  }

  async getUser(): Promise<User | null> {
    await this.garantirSessaoPronta();

    if (this.currentUser) {
      return this.currentUser;
    }

    const { data: sessionData, error: sessionError } = await this.supabase.auth.getSession();

    if (sessionError) {
      console.error('Erro ao obter sessão:', sessionError.message);
    }

    if (sessionData?.session?.user) {
      this.currentUser = sessionData.session.user;
      return this.currentUser;
    }

    const { data, error } = await this.supabase.auth.getUser();

    if (error) {
      console.error('Erro ao obter utilizador:', error.message);
      return null;
    }

    this.currentUser = data.user ?? null;
    return this.currentUser;
  }

  async criarPedido(pedido: {
    email: string;
    tipo_pedido: string;
    contacto: string;
    distrito: string;
    descricao: string;
  }) {
    const user = await this.getUser();

    if (!user) {
      console.error('Utilizador não autenticado');
      return { data: null, error: new Error('Utilizador não autenticado') };
    }

    const { data, error } = await this.supabase
      .from('pedidos')
      .insert([
        {
          user_id: user.id,
          email: pedido.email,
          tipo_pedido: pedido.tipo_pedido,
          contacto: pedido.contacto,
          distrito: pedido.distrito,
          descricao: pedido.descricao,
          status: 'Pendente'
        }
      ])
      .select();

    if (error) {
      console.error('Erro ao criar pedido:', error.message);
    }

    return { data, error };
  }

  async obterPedidos() {
    const user = await this.getUser();

    if (!user) {
      console.error('Nenhum utilizador autenticado');
      return [];
    }

    const metadata = user.user_metadata || {};
    const isAdmin = (metadata['role'] ?? '') === 'admin';

    let query = this.supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false });

    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao carregar pedidos:', error.message);
      return [];
    }

    return data || [];
  }

  async apagarPedido(id: number) {
    const { error } = await this.supabase
      .from('pedidos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao apagar pedido:', error.message);
    }

    return { error };
  }

  async atualizarStatusPedido(id: number, status: string) {
    const { data, error } = await this.supabase
      .from('pedidos')
      .update({ status })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Erro ao atualizar status do pedido:', error.message);
    }

    return { data, error };
  }

  async encaminharPedido(
    id: number,
    payload: {
      recurso_id: number;
      recurso_nome: string;
      recurso_contacto: string;
      recurso_website: string | null;
      mensagem_encaminhamento: string;
    }
  ) {
    const { data, error } = await this.supabase
      .from('pedidos')
      .update({
        status: 'Encaminhado',
        recurso_id: payload.recurso_id,
        recurso_nome: payload.recurso_nome,
        recurso_contacto: payload.recurso_contacto,
        recurso_website: payload.recurso_website,
        mensagem_encaminhamento: payload.mensagem_encaminhamento
      })
      .eq('id', id)
      .select();

    if (error) {
      console.error('Erro ao encaminhar pedido:', error.message);
    }

    return { data, error };
  }

  async obterRecursos() {
    const { data, error } = await this.supabase
      .from('recursos')
      .select('*')
      .eq('status', 'aprovado')
      .order('nome', { ascending: true });

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