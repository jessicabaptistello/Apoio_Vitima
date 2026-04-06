import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';
import * as dotenv from 'dotenv';
import { supabase } from './config/supabase.js';
import {
  respostaErro,
  respostaSucesso,
  executarComTimeout,
  validarPedido
} from './utils/helpers.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT) || 10000;

type PedidoBody = {
  email: string;
  tipo_pedido: string;
  contacto: string;
  distrito: string;
  descricao: string;
  user_id?: string;
  status?: string;
  recurso_id?: string | number | null;
  recurso_nome?: string | null;
  recurso_contacto?: string | null;
  recurso_website?: string | null;
  mensagem_encaminhamento?: string | null;
};

type RecursoBody = {
  nome: string;
  tipo: string;
  contacto: string;
  website?: string | null;
  distrito: string;
  descricao: string;
  status?: string;
};

type AppErrorLike = {
  message?: string;
};

app.get('/', (_req: Request, res: Response) => {
  return respostaSucesso(res, 200, 'API online');
});

app.get('/health', (_req: Request, res: Response) => {
  return respostaSucesso(res, 200, 'OK');
});

/* ================= PEDIDOS ================= */

app.post('/pedidos', async (req: Request, res: Response) => {
  try {
    const body = req.body as PedidoBody;

    const erros = validarPedido(body);
    if (erros.length > 0) {
      return respostaErro(res, 400, 'Dados inválidos', erros);
    }

    const { email, tipo_pedido, contacto, distrito, descricao, user_id } = body;

    const payload: PedidoBody = {
      email: email.trim(),
      tipo_pedido: tipo_pedido.trim(),
      contacto: contacto.trim(),
      distrito: distrito.trim(),
      descricao: descricao.trim(),
      status: 'Pendente'
    };

    if (user_id) {
      payload.user_id = user_id;
    }

    const resultado = await executarComTimeout(
      supabase.from('pedidos').insert([payload]).select(),
      10000
    );

    if (resultado.error) {
      return respostaErro(res, 400, 'Erro', resultado.error.message);
    }

    return respostaSucesso(res, 201, 'Criado', resultado.data);
  } catch (error: unknown) {
    const err = error as AppErrorLike;
    return respostaErro(res, 500, 'Erro interno', err.message || 'Erro interno');
  }
});

app.get('/pedidos', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return respostaErro(res, 401, 'Sem token');
    }

    const token = authHeader.replace('Bearer ', '');

    const {
      data: { user }
    } = await supabase.auth.getUser(token);

    let query = supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false });

    if ((user?.user_metadata?.role ?? '') !== 'admin') {
      query = query.eq('user_id', user?.id);
    }

    const resultado = await executarComTimeout(query, 10000);

    return respostaSucesso(res, 200, 'OK', resultado.data);
  } catch (error: unknown) {
    const err = error as AppErrorLike;
    return respostaErro(res, 500, 'Erro', err.message || 'Erro');
  }
});

app.patch('/pedidos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body as Partial<PedidoBody>;

    const updateData: Partial<PedidoBody> = {};

    if (body.email) updateData.email = body.email;
    if (body.tipo_pedido) updateData.tipo_pedido = body.tipo_pedido;
    if (body.contacto) updateData.contacto = body.contacto;
    if (body.distrito) updateData.distrito = body.distrito;
    if (body.descricao) updateData.descricao = body.descricao;

    if (body.status) {
      updateData.status = body.status;

      if (body.status === 'Encaminhado') {
        updateData.recurso_id = body.recurso_id ?? null;
        updateData.recurso_nome = body.recurso_nome ?? null;
        updateData.recurso_contacto = body.recurso_contacto ?? null;
        updateData.recurso_website = body.recurso_website ?? null;
        updateData.mensagem_encaminhamento = body.mensagem_encaminhamento ?? null;
      } else {
        updateData.recurso_id = null;
        updateData.recurso_nome = null;
        updateData.recurso_contacto = null;
        updateData.recurso_website = null;
        updateData.mensagem_encaminhamento = null;
      }
    }

    const resultado = await executarComTimeout(
      supabase.from('pedidos').update(updateData).eq('id', id).select(),
      10000
    );

    return respostaSucesso(res, 200, 'Atualizado', resultado.data);
  } catch (error: unknown) {
    const err = error as AppErrorLike;
    return respostaErro(res, 500, 'Erro', err.message || 'Erro');
  }
});

app.delete('/pedidos/:id', async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id ?? '').trim();

    console.log('DELETE /pedidos/:id -> id recebido:', req.params.id);
    console.log('DELETE /pedidos/:id -> id tratado:', id);

    if (!id) {
      return respostaErro(res, 400, 'ID inválido.');
    }

    const resultado = await executarComTimeout(
      supabase
        .from('pedidos')
        .delete()
        .eq('id', id)
        .select('id'),
      10000
    );

    console.log('DELETE resultado:', resultado);

    if (resultado?.error) {
      return respostaErro(
        res,
        400,
        resultado.error.message || 'Erro ao apagar pedido.'
      );
    }

    if (!resultado?.data || resultado.data.length === 0) {
      return respostaErro(res, 404, 'Pedido não encontrado.');
    }

    return respostaSucesso(res, 200, 'Pedido apagado com sucesso.', resultado.data);
  } catch (error: unknown) {
    const err = error as AppErrorLike;
    console.error('Erro interno ao apagar pedido:', error);
    return respostaErro(
      res,
      500,
      err.message || 'Erro interno ao apagar pedido.'
    );
  }
});

/* ================= RECURSOS ================= */

app.post('/recursos', async (req: Request, res: Response) => {
  try {
    const body = req.body as RecursoBody;
    const { nome, tipo, contacto, website, distrito, descricao } = body;

    const resultado = await executarComTimeout(
      supabase.from('recursos').insert([
        {
          nome,
          tipo,
          contacto,
          website,
          distrito,
          descricao,
          status: 'pendente'
        }
      ]).select(),
      10000
    );

    return respostaSucesso(res, 201, 'Criado', resultado.data);
  } catch (error: unknown) {
    const err = error as AppErrorLike;
    return respostaErro(res, 500, 'Erro', err.message || 'Erro');
  }
});

app.get('/recursos', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    let query = supabase.from('recursos').select('*');

    if (status) {
      query = query.eq('status', String(status));
    }

    const resultado = await executarComTimeout(query, 10000);

    return respostaSucesso(res, 200, 'OK', resultado.data);
  } catch (error: unknown) {
    const err = error as AppErrorLike;
    return respostaErro(res, 500, 'Erro', err.message || 'Erro');
  }
});

app.patch('/recursos/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body as Partial<RecursoBody>;

    const resultado = await executarComTimeout(
      supabase
        .from('recursos')
        .update({ status: body.status })
        .eq('id', id)
        .select(),
      10000
    );

    return respostaSucesso(res, 200, 'Atualizado', resultado.data);
  } catch (error: unknown) {
    const err = error as AppErrorLike;
    return respostaErro(res, 500, 'Erro', err.message || 'Erro');
  }
});

app.delete('/recursos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const resultado = await executarComTimeout(
      supabase.from('recursos').delete().eq('id', id),
      10000
    );

    return respostaSucesso(res, 200, 'Apagado', resultado.data);
  } catch (error: unknown) {
    const err = error as AppErrorLike;
    return respostaErro(res, 500, 'Erro', err.message || 'Erro');
  }
});

app.listen(PORT, () => console.log(`Servidor na porta ${PORT}`));