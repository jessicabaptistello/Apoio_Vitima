import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
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

router.get('/', async (req, res) => {
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

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const resultado: any = await executarComTimeout(
      supabase
        .from('recursos')
        .select('*')
        .eq('id', id)
        .maybeSingle(),
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

router.put('/:id', async (req, res) => {
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

router.patch('/:id/status', async (req, res) => {
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
      supabase
        .from('recursos')
        .update({ status: status.trim() })
        .eq('id', id)
        .select(),
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

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const resultado: any = await executarComTimeout(
      supabase
        .from('recursos')
        .delete()
        .eq('id', id)
        .select(),
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

export default router;