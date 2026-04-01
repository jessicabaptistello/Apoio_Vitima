import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';
import * as dotenv from 'dotenv';
import { supabase } from './config/supabase.js';
import {
  STATUS_PEDIDOS_VALIDOS,
  STATUS_RECURSOS_VALIDOS,
  respostaErro,
  respostaSucesso,
  executarComTimeout,
  textoValido,
  validarPedido,
  validarRecurso
} from './utils/helpers.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT) || 10000;

app.get('/', (_req: Request, res: Response) => {
  return respostaSucesso(res, 200, 'API de Apoio à Vítima online', {
    api: 'Apoio à Vítima',
    status: 'online'
  });
});

app.get('/health', (_req: Request, res: Response) => {
  return respostaSucesso(res, 200, 'Servidor operacional', {
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.post('/pedidos', async (req: Request, res: Response) => {
  try {
    const erros = validarPedido(req.body);

    if (erros.length > 0) {
      return respostaErro(res, 400, 'Dados inválidos', erros);
    }

    const { email, tipo_pedido, contacto, distrito, descricao, user_id } = req.body;

    const payload: any = {
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

    const resultado: any = await executarComTimeout(
      supabase.from('pedidos').insert([payload]).select(),
      10000
    );

    if (resultado.error) {
      return respostaErro(res, 400, 'Erro ao criar pedido', resultado.error.message);
    }

    return respostaSucesso(res, 201, 'Pedido criado com sucesso', resultado.data);
  } catch (error: any) {
    return respostaErro(res, 500, 'Erro interno ao criar pedido', error.message);
  }
});

app.get('/pedidos', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return respostaErro(res, 401, 'Token não enviado.');
    }

    const token = authHeader.replace('Bearer ', '').trim();

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return respostaErro(res, 401, 'Utilizador não autenticado.', userError?.message);
    }

    const isAdmin = (user.user_metadata?.['role'] ?? '') === 'admin';

    let query = supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false });

    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    const resultado: any = await executarComTimeout(query, 10000);

    if (resultado.error) {
      return respostaErro(res, 400, 'Erro ao obter pedidos', resultado.error.message);
    }

    return respostaSucesso(res, 200, 'Pedidos obtidos com sucesso', resultado.data);
  } catch (error: any) {
    return respostaErro(res, 500, 'Erro interno ao obter pedidos', error.message);
  }
});

app.get('/pedidos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const resultado: any = await executarComTimeout(
      supabase.from('pedidos').select('*').eq('id', id).maybeSingle(),
      10000
    );

    if (resultado.error) {
      return respostaErro(res, 400, 'Erro ao obter pedido', resultado.error.message);
    }

    if (!resultado.data) {
      return respostaErro(res, 404, 'Pedido não encontrado');
    }

    return respostaSucesso(res, 200, 'Pedido encontrado com sucesso', resultado.data);
  } catch (error: any) {
    return respostaErro(res, 500, 'Erro interno ao obter pedido', error.message);
  }
});

app.patch('/pedidos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      status,
      recurso_id,
      recurso_nome,
      recurso_contacto,
      recurso_website,
      mensagem_encaminhamento
    } = req.body;

    console.log('PATCH /pedidos/:id =>', { id, ...req.body });

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID do pedido é obrigatório.'
      });
    }

    const updateData: any = {};

    if (status) {
      updateData.status = status;
    }

    if (status === 'Encaminhado') {
      updateData.recurso_id = recurso_id ?? null;
      updateData.recurso_nome = recurso_nome ?? null;
      updateData.recurso_contacto = recurso_contacto ?? null;
      updateData.recurso_website = recurso_website ?? null;
      updateData.mensagem_encaminhamento = mensagem_encaminhamento ?? null;
    } else if (status && status !== 'Encaminhado') {
      updateData.recurso_id = null;
      updateData.recurso_nome = null;
      updateData.recurso_contacto = null;
      updateData.recurso_website = null;
      updateData.mensagem_encaminhamento = null;
    }

    const { data, error, count, status: supabaseStatus, statusText } =
      await supabase
        .from('pedidos')
        .update(updateData)
        .eq('id', id)
        .select();

    console.log('Resultado PATCH pedidos:', {
      error,
      data,
      count,
      status: supabaseStatus,
      statusText
    });

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro ao atualizar pedido.',
        error: error.message
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Pedido atualizado com sucesso.',
      data
    });
  } catch (error: any) {
    console.error('Erro no PATCH /pedidos/:id:', error);

    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor.',
      error: error.message
    });
  }
});

app.delete('/pedidos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const resultado: any = await executarComTimeout(
      supabase.from('pedidos').delete().eq('id', id).select(),
      10000
    );

    if (resultado.error) {
      return respostaErro(res, 400, 'Erro ao remover pedido', resultado.error.message);
    }

    if (!resultado.data || resultado.data.length === 0) {
      return respostaErro(res, 404, 'Pedido não encontrado');
    }

    return respostaSucesso(res, 200, 'Pedido removido com sucesso', resultado.data);
  } catch (error: any) {
    return respostaErro(res, 500, 'Erro interno ao remover pedido', error.message);
  }
});

app.post('/recursos', async (req: Request, res: Response) => {
  try {
    const erros = validarRecurso(req.body, false);

    if (erros.length > 0) {
      return respostaErro(res, 400, 'Dados inválidos', erros);
    }

    const { nome, tipo, contacto, website, distrito, descricao, status } = req.body;

    const statusFinal = status && textoValido(status) ? status : 'Pendente';

    if (!STATUS_RECURSOS_VALIDOS.includes(statusFinal)) {
      return respostaErro(
        res,
        400,
        `Status inválido. Use: ${STATUS_RECURSOS_VALIDOS.join(', ')}`
      );
    }

    const resultado: any = await executarComTimeout(
      supabase
        .from('recursos')
        .insert([
          {
            nome: nome.trim(),
            tipo: tipo.trim(),
            contacto: contacto.trim(),
            website: textoValido(website) ? website.trim() : null,
            distrito: distrito.trim(),
            descricao: descricao.trim(),
            status: statusFinal
          }
        ])
        .select(),
      10000
    );

    if (resultado.error) {
      return respostaErro(res, 400, 'Erro ao criar recurso', resultado.error.message);
    }

    return respostaSucesso(res, 201, 'Recurso criado com sucesso', resultado.data);
  } catch (error: any) {
    return respostaErro(res, 500, 'Erro interno ao criar recurso', error.message);
  }
});

app.get('/recursos', async (req: Request, res: Response) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from('recursos')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', String(status));
    }

    const resultado: any = await executarComTimeout(query, 10000);

    if (resultado.error) {
      return respostaErro(res, 400, 'Erro ao listar recursos', resultado.error.message);
    }

    return respostaSucesso(res, 200, 'Recursos listados com sucesso', resultado.data);
  } catch (error: any) {
    return respostaErro(res, 500, 'Erro interno ao listar recursos', error.message);
  }
});

app.get('/recursos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const resultado: any = await executarComTimeout(
      supabase.from('recursos').select('*').eq('id', id).maybeSingle(),
      10000
    );

    if (resultado.error) {
      return respostaErro(res, 400, 'Erro ao obter recurso', resultado.error.message);
    }

    if (!resultado.data) {
      return respostaErro(res, 404, 'Recurso não encontrado');
    }

    return respostaSucesso(res, 200, 'Recurso encontrado com sucesso', resultado.data);
  } catch (error: any) {
    return respostaErro(res, 500, 'Erro interno ao obter recurso', error.message);
  }
});

app.put('/recursos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const erros = validarRecurso(req.body, true);

    if (erros.length > 0) {
      return respostaErro(res, 400, 'Dados inválidos', erros);
    }

    const { nome, tipo, contacto, website, distrito, descricao, status } = req.body;

    const resultado: any = await executarComTimeout(
      supabase
        .from('recursos')
        .update({
          nome: nome.trim(),
          tipo: tipo.trim(),
          contacto: contacto.trim(),
          website: textoValido(website) ? website.trim() : null,
          distrito: distrito.trim(),
          descricao: descricao.trim(),
          status: status.trim()
        })
        .eq('id', id)
        .select(),
      10000
    );

    if (resultado.error) {
      return respostaErro(res, 400, 'Erro ao atualizar recurso', resultado.error.message);
    }

    if (!resultado.data || resultado.data.length === 0) {
      return respostaErro(res, 404, 'Recurso não encontrado');
    }

    return respostaSucesso(res, 200, 'Recurso atualizado com sucesso', resultado.data);
  } catch (error: any) {
    return respostaErro(res, 500, 'Erro interno ao atualizar recurso', error.message);
  }
});

app.patch('/recursos/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!textoValido(status)) {
      return respostaErro(res, 400, 'O campo status é obrigatório');
    }

    if (!STATUS_RECURSOS_VALIDOS.includes(status)) {
      return respostaErro(
        res,
        400,
        `Status inválido. Use: ${STATUS_RECURSOS_VALIDOS.join(', ')}`
      );
    }

    const resultado: any = await executarComTimeout(
      supabase.from('recursos').update({ status: status.trim() }).eq('id', id).select(),
      10000
    );

    if (resultado.error) {
      return respostaErro(res, 400, 'Erro ao atualizar status do recurso', resultado.error.message);
    }

    if (!resultado.data || resultado.data.length === 0) {
      return respostaErro(res, 404, 'Recurso não encontrado');
    }

    return respostaSucesso(res, 200, 'Status do recurso atualizado com sucesso', resultado.data);
  } catch (error: any) {
    return respostaErro(res, 500, 'Erro interno ao atualizar status do recurso', error.message);
  }
});

app.delete('/recursos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const resultado: any = await executarComTimeout(
      supabase.from('recursos').delete().eq('id', id).select(),
      10000
    );

    if (resultado.error) {
      return respostaErro(res, 400, 'Erro ao remover recurso', resultado.error.message);
    }

    if (!resultado.data || resultado.data.length === 0) {
      return respostaErro(res, 404, 'Recurso não encontrado');
    }

    return respostaSucesso(res, 200, 'Recurso removido com sucesso', resultado.data);
  } catch (error: any) {
    return respostaErro(res, 500, 'Erro interno ao remover recurso', error.message);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor na porta ${PORT}`);
});