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

  private async executarComTimeout<T = any>(
    operacao: PromiseLike<T>,
    timeoutMs: number = 15000
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Tempo limite excedido ao comunicar com o Supabase.'));
      }, timeoutMs);
    });

    return await Promise.race([
      Promise.resolve(operacao as any),
      timeoutPromise
    ]);
  }

  private mensagemErro(error: any, fallback: string) {
    if (!error) return { message: fallback };
    if (typeof error === 'string') return { message: error };
    if (error.message) return { message: error.message };
    return { message: fallback };
  }

  private normalizarBoolean(valor: any): boolean | null {
    if (valor === true || valor === 'true' || valor === 1 || valor === '1') return true;
    if (valor === false || valor === 'false' || valor === 0 || valor === '0') return false;
    return null;
  }

  private recursoEstaAprovado(recurso: any): boolean {
    const aprovado = this.normalizarBoolean(recurso?.aprovado);
    if (aprovado === true) return true;
    if (aprovado === false) return false;

    const status = String(recurso?.status ?? recurso?.estado ?? '').trim().toLowerCase();

    if (status.includes('aprov')) return true;
    if (status.includes('pend')) return false;
    if (status.includes('rejeit')) return false;

    return true;
  }

  private recursoEstaPendente(recurso: any): boolean {
    const aprovado = this.normalizarBoolean(recurso?.aprovado);
    if (aprovado === false) return true;
    if (aprovado === true) return false;

    const status = String(recurso?.status ?? recurso?.estado ?? '').trim().toLowerCase();

    if (status.includes('pend')) return true;
    if (status.includes('aprov')) return false;
    if (status.includes('rejeit')) return false;

    return false;
  }

  async garantirSessaoPronta(): Promise<void> {
    try {
      await this.executarComTimeout(this.supabase.auth.getSession(), 8000);
    } catch (error) {
      console.error('Erro ao garantir sessão pronta:', error);
    }
  }

  async getSession() {
    try {
      const response: any = await this.executarComTimeout(
        this.supabase.auth.getSession(),
        8000
      );

      return response?.data?.session ?? null;
    } catch (error) {
      console.error('Erro ao obter sessão:', error);
      return null;
    }
  }

  async getUser(): Promise<User | null> {
    try {
      const session = await this.getSession();
      return session?.user ?? null;
    } catch (error) {
      console.error('Erro ao obter utilizador:', error);
      return null;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    return await this.getUser();
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  }

  async getUserProfile() {
    try {
      const user = await this.getUser();

      if (!user) {
        return {
          full_name: 'Utilizador',
          role: 'user',
          email: ''
        };
      }

      const metadata = user.user_metadata || {};

      return {
        full_name: metadata['full_name'] || user.email || 'Utilizador',
        role: metadata['role'] || 'user',
        email: user.email || ''
      };
    } catch (error) {
      console.error('Erro ao obter perfil do utilizador:', error);
      return {
        full_name: 'Utilizador',
        role: 'user',
        email: ''
      };
    }
  }

  async signIn(email: string, password: string) {
    try {
      const response: any = await this.executarComTimeout(
        this.supabase.auth.signInWithPassword({
          email,
          password
        }),
        8000
      );

      return {
        data: response?.data ?? null,
        error: response?.error ?? null
      };
    } catch (error: any) {
      console.error('Erro inesperado no login:', error);
      return {
        data: null,
        error: this.mensagemErro(error, 'Erro ao iniciar sessão.')
      };
    }
  }

  async signUp(email: string, password: string, fullName: string) {
    try {
      const response: any = await this.executarComTimeout(
        this.supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: 'user'
            }
          }
        }),
        8000
      );

      return {
        data: response?.data ?? null,
        error: response?.error ?? null
      };
    } catch (error: any) {
      console.error('Erro inesperado no registo:', error);
      return {
        data: null,
        error: this.mensagemErro(error, 'Erro ao criar conta.')
      };
    }
  }

  async signOut() {
    try {
      const response: any = await this.executarComTimeout(
        this.supabase.auth.signOut(),
        8000
      );

      return {
        error: response?.error ?? null
      };
    } catch (error: any) {
      console.error('Erro inesperado ao terminar sessão:', error);
      return {
        error: this.mensagemErro(error, 'Erro ao terminar sessão.')
      };
    }
  }

  async criarPedido(dados: {
    email: string;
    tipo_pedido: string;
    contacto: string;
    distrito: string;
    descricao: string;
    [key: string]: any;
  }) {
    try {
      const payload: any = {
        ...dados
      };

      if (!payload.status) {
        payload.status = 'Pendente';
      }

      const response: any = await this.executarComTimeout(
        this.supabase
          .from('pedidos')
          .insert([payload])
          .select(),
        8000
      );

      return {
        data: response?.data ?? null,
        error: response?.error ?? null
      };
    } catch (error: any) {
      console.error('Erro inesperado ao criar pedido:', error);
      return {
        data: null,
        error: this.mensagemErro(error, 'Erro ao criar pedido.')
      };
    }
  }

  async obterPedidos() {
    try {
      const response: any = await this.executarComTimeout(
        this.supabase
          .from('pedidos')
          .select('*')
          .order('created_at', { ascending: false }),
        8000
      );

      if (response?.error) {
        console.error('Erro ao obter pedidos:', response.error.message);
        return null;
      }

      return response?.data || [];
    } catch (error: any) {
      console.error('Erro inesperado ao obter pedidos:', error);
      return null;
    }
  }

  async carregarPedidos() {
    return await this.obterPedidos();
  }

  async carregarMeusPedidos(email: string) {
    try {
      const response: any = await this.executarComTimeout(
        this.supabase
          .from('pedidos')
          .select('*')
          .eq('email', email)
          .order('created_at', { ascending: false }),
        8000
      );

      if (response?.error) {
        console.error('Erro ao carregar meus pedidos:', response.error.message);
        return null;
      }

      return response?.data || [];
    } catch (error: any) {
      console.error('Erro inesperado ao carregar meus pedidos:', error);
      return null;
    }
  }

  async apagarPedido(id: number | string) {
    try {
      const response: any = await this.executarComTimeout(
        this.supabase
          .from('pedidos')
          .delete()
          .eq('id', id),
        8000
      );

      return {
        error: response?.error ?? null
      };
    } catch (error: any) {
      console.error('Erro inesperado ao apagar pedido:', error);
      return {
        error: this.mensagemErro(error, 'Erro ao apagar pedido.')
      };
    }
  }

  async atualizarStatusPedido(id: number | string, status: string) {
    try {
      const response: any = await this.executarComTimeout(
        this.supabase
          .from('pedidos')
          .update({ status })
          .eq('id', id)
          .select(),
        8000
      );

      return {
        data: response?.data ?? null,
        error: response?.error ?? null
      };
    } catch (error: any) {
      console.error('Erro inesperado ao atualizar status do pedido:', error);
      return {
        data: null,
        error: this.mensagemErro(error, 'Erro ao atualizar status do pedido.')
      };
    }
  }

  async encaminharPedido(id: number | string, dados: any) {
    try {
      let payload: any = {};

      if (typeof dados === 'string') {
        payload = {
          encaminhado_para: dados,
          status: 'Encaminhado'
        };
      } else {
        payload = {
          ...dados,
          status: dados?.status || 'Encaminhado'
        };
      }

      const response: any = await this.executarComTimeout(
        this.supabase
          .from('pedidos')
          .update(payload)
          .eq('id', id)
          .select(),
        8000
      );

      return {
        data: response?.data ?? null,
        error: response?.error ?? null
      };
    } catch (error: any) {
      console.error('Erro inesperado ao encaminhar pedido:', error);
      return {
        data: null,
        error: this.mensagemErro(error, 'Erro ao encaminhar pedido.')
      };
    }
  }

  async obterRecursos() {
    try {
      const response: any = await this.executarComTimeout(
        this.supabase
          .from('recursos')
          .select('*')
          .order('created_at', { ascending: false }),
        8000
      );

      if (response?.error) {
        console.error('Erro ao obter recursos:', response.error.message);
        return null;
      }

      const recursos = response?.data || [];
      return recursos.filter((recurso: any) => this.recursoEstaAprovado(recurso));
    } catch (error: any) {
      console.error('Erro inesperado ao obter recursos:', error);
      return null;
    }
  }

  async carregarRecursos() {
    return await this.obterRecursos();
  }

  async obterRecursosPendentes() {
    try {
      const response: any = await this.executarComTimeout(
        this.supabase
          .from('recursos')
          .select('*')
          .order('created_at', { ascending: false }),
        8000
      );

      if (response?.error) {
        console.error('Erro ao obter recursos pendentes:', response.error.message);
        return null;
      }

      const recursos = response?.data || [];
      return recursos.filter((recurso: any) => this.recursoEstaPendente(recurso));
    } catch (error: any) {
      console.error('Erro inesperado ao obter recursos pendentes:', error);
      return null;
    }
  }

  async carregarRecursosPendentes() {
    return await this.obterRecursosPendentes();
  }

  async sugerirRecurso(
    nomeOuObjeto: string | any,
    tipo?: string,
    contacto?: string,
    website?: string,
    distrito?: string,
    descricao?: string
  ) {
    try {
      let payloadBase: any;

      if (typeof nomeOuObjeto === 'object' && nomeOuObjeto !== null) {
        payloadBase = {
          ...nomeOuObjeto
        };
      } else {
        const contactoLimpo = String(contacto ?? '').replace(/\D/g, '');

        payloadBase = {
          nome: nomeOuObjeto,
          tipo,
          contacto: contactoLimpo,
          website,
          distrito,
          descricao
        };
      }

      payloadBase.contacto = String(payloadBase.contacto ?? '').replace(/\D/g, '');

      let response: any = await this.executarComTimeout(
        this.supabase
          .from('recursos')
          .insert([{ ...payloadBase, status: 'pendente' }])
          .select(),
        8000
      );

      if (response?.error && String(response.error.message || '').toLowerCase().includes("could not find the 'status' column")) {
        response = await this.executarComTimeout(
          this.supabase
            .from('recursos')
            .insert([{ ...payloadBase, estado: 'pendente' }])
            .select(),
          8000
        );
      }

      if (response?.error && String(response.error.message || '').toLowerCase().includes("could not find the 'estado' column")) {
        response = await this.executarComTimeout(
          this.supabase
            .from('recursos')
            .insert([payloadBase])
            .select(),
          8000
        );
      }

      return {
        data: response?.data ?? null,
        error: response?.error ?? null
      };
    } catch (error: any) {
      console.error('Erro inesperado ao sugerir recurso:', error);
      return {
        data: null,
        error: this.mensagemErro(error, 'Erro ao sugerir recurso.')
      };
    }
  }

  async aprovarRecurso(id: number | string) {
    try {
      let response: any = await this.executarComTimeout(
        this.supabase
          .from('recursos')
          .update({ status: 'aprovado' })
          .eq('id', id)
          .select(),
        8000
      );

      if (response?.error && String(response.error.message || '').toLowerCase().includes("could not find the 'status' column")) {
        response = await this.executarComTimeout(
          this.supabase
            .from('recursos')
            .update({ estado: 'aprovado' })
            .eq('id', id)
            .select(),
          8000
        );
      }

      return {
        data: response?.data ?? null,
        error: response?.error ?? null
      };
    } catch (error: any) {
      console.error('Erro inesperado ao aprovar recurso:', error);
      return {
        data: null,
        error: this.mensagemErro(error, 'Erro ao aprovar recurso.')
      };
    }
  }

  async apagarRecursoPendente(id: number | string) {
    try {
      const response: any = await this.executarComTimeout(
        this.supabase
          .from('recursos')
          .delete()
          .eq('id', id),
        8000
      );

      return {
        error: response?.error ?? null
      };
    } catch (error: any) {
      console.error('Erro inesperado ao apagar recurso pendente:', error);
      return {
        error: this.mensagemErro(error, 'Erro ao apagar recurso.')
      };
    }
  }
}