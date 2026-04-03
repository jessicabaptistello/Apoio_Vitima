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
  return respostaSucesso(res, 200, 'API online');
});

app.get('/health', (_req: Request, res: Response) => {
  return respostaSucesso(res, 200, 'OK');
});

/* ================= PEDIDOS ================= */

app.post('/pedidos', async (req: Request, res: Response) => {
  try {
    const erros = validarPedido(req.body);
    if (erros.length > 0) return respostaErro(res, 400, 'Dados inválidos', erros);

    const { email, tipo_pedido, contacto, distrito, descricao, user_id } = req.body;

    const payload: any = {
      email: email.trim(),
      tipo_pedido: tipo_pedido.trim(),
      contacto: contacto.trim(),
      distrito: distrito.trim(),
      descricao: descricao.trim(),
      status: 'Pendente'
    };

    if (user_id) payload.user_id = user_id;

    const resultado: any = await executarComTimeout(
      supabase.from('pedidos').insert([payload]).select(),
      10000
    );

    if (resultado.error) return respostaErro(res, 400, 'Erro', resultado.error.message);

    return respostaSucesso(res, 201, 'Criado', resultado.data);
  } catch (error: any) {
    return respostaErro(res, 500, 'Erro interno', error.message);
  }
});

app.get('/pedidos', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return respostaErro(res, 401, 'Sem token');

    const token = authHeader.replace('Bearer ', '');

    const { data: { user } } = await supabase.auth.getUser(token);

    let query = supabase.from('pedidos').select('*').order('created_at', { ascending: false });

    if ((user?.user_metadata?.role ?? '') !== 'admin') {
      query = query.eq('user_id', user?.id);
    }

    const resultado: any = await executarComTimeout(query, 10000);

    return respostaSucesso(res, 200, 'OK', resultado.data);
  } catch (error: any) {
    return respostaErro(res, 500, 'Erro', error.message);
  }
});

app.patch('/pedidos/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const updateData: any = {};

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

    const resultado: any = await executarComTimeout(
      supabase.from('pedidos').update(updateData).eq('id', id).select(),
      10000
    );

    return respostaSucesso(res, 200, 'Atualizado', resultado.data);
  } catch (error: any) {
    return respostaErro(res, 500, 'Erro', error.message);
  }
});

app.delete('/pedidos/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const resultado: any = await executarComTimeout(
    supabase.from('pedidos').delete().eq('id', id),
    10000
  );

  return respostaSucesso(res, 200, 'Apagado', resultado.data);
});

/* ================= RECURSOS ================= */

app.post('/recursos', async (req: Request, res: Response) => {
  try {
    const { nome, tipo, contacto, website, distrito, descricao } = req.body;

    const resultado: any = await executarComTimeout(
      supabase.from('recursos').insert([{
        nome,
        tipo,
        contacto,
        website,
        distrito,
        descricao,
        status: 'pendente' 
      }]).select(),
      10000
    );

    return respostaSucesso(res, 201, 'Criado', resultado.data);
  } catch (error: any) {
    return respostaErro(res, 500, 'Erro', error.message);
  }
});

app.get('/recursos', async (req: Request, res: Response) => {
  const { status } = req.query;

  let query = supabase.from('recursos').select('*');

  if (status) query = query.eq('status', String(status));

  const resultado: any = await executarComTimeout(query, 10000);

  return respostaSucesso(res, 200, 'OK', resultado.data);
});

app.patch('/recursos/:id/status', async (req: Request, res: Response) => {
  const { id } = req.params;

  const resultado: any = await executarComTimeout(
    supabase.from('recursos').update({ status: req.body.status }).eq('id', id).select(),
    10000
  );

  return respostaSucesso(res, 200, 'Atualizado', resultado.data);
});

app.delete('/recursos/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  const resultado: any = await executarComTimeout(
    supabase.from('recursos').delete().eq('id', id),
    10000
  );

  return respostaSucesso(res, 200, 'Apagado', resultado.data);
});

app.listen(PORT, () => console.log(`Servidor na porta ${PORT}`));