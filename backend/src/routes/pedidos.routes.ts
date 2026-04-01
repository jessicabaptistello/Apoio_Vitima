import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const erros = validarPedido(req.body);

    if (erros.length > 0) {
      return respostaErro(res, 400, 'Dados inválidos', erros);
    }

    const {
      email,
      tipo_pedido,
      contacto,
      distrito,
      descricao,
      user_id
    } = req.body;

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
      supabase
        .from('pedidos')
        .insert([payload])
        .select(),
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

router.get('/', async (req, res) => {
  try {
    const { user_id, status } = req.query;

    let query = supabase
      .from('pedidos')
      .select('*')
      .order('created_at', { ascending: false });

    if (user_id) {
      query = query.eq('user_id', String(user_id));
    }

    if (status) {
      query = query.eq('status', String(status));
    }

    const resultado: any = await executarComTimeout(query, 10000);

    if (resultado.error) {
      return respostaErro(res, 400, 'Erro ao listar pedidos', resultado.error.message);
    }

    return respostaSucesso(res, 200, 'Pedidos listados com sucesso', resultado.data);
  } catch (error: any) {
    return respostaErro(res, 500, 'Erro interno ao listar pedidos', error.message);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const resultado: any = await executarComTimeout(
      supabase
        .from('pedidos')
        .select('*')
        .eq('id', id)
        .maybeSingle(),
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

router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const camposPermitidos = [
      'status',
      'recurso_id',
      'recurso_nome',
      'recurso_contacto',
      'recurso_website',
      'mensagem_encaminhamento'
    ];

    const updates: any = {};

    for (const campo of camposPermitidos) {
      if (req.body[campo] !== undefined) {
        updates[campo] = req.body[campo];
      }
    }

    if (Object.keys(updates).length === 0) {
      return respostaErro(res, 400, 'Nenhum campo válido enviado para atualização');
    }

    if (updates.status && !STATUS_PEDIDOS_VALIDOS.includes(updates.status)) {
      return respostaErro(
        res,
        400,
        `Status inválido. Use: ${STATUS_PEDIDOS_VALIDOS.join(', ')}`
      );
    }

    const resultado: any = await executarComTimeout(
      supabase
        .from('pedidos')
        .update(updates)
        .eq('id', id)
        .select(),
      10000
    );

    if (resultado.error) {
      return respostaErro(res, 400, 'Erro ao atualizar pedido', resultado.error.message);
    }

    if (!resultado.data || resultado.data.length === 0) {
      return respostaErro(res, 404, 'Pedido não encontrado');
    }

    return respostaSucesso(res, 200, 'Pedido atualizado com sucesso', resultado.data);
  } catch (error: any) {
    return respostaErro(res, 500, 'Erro interno ao atualizar pedido', error.message);
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const resultado: any = await executarComTimeout(
      supabase
        .from('pedidos')
        .delete()
        .eq('id', id)
        .select(),
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

export default router;