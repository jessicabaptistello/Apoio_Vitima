import type { Response } from 'express';

export const STATUS_PEDIDOS_VALIDOS = ['Pendente', 'Em análise', 'Encaminhado', 'Concluído'];

export const STATUS_RECURSOS_VALIDOS = ['Pendente', 'Aprovado', 'Rejeitado', 'Ativo', 'Inativo'];

export function respostaErro(res: Response, status: number, mensagem: string, detalhe?: any) {
  return res.status(status).json({
    success: false,
    message: mensagem,
    detail: detalhe ?? null
  });
}

export function respostaSucesso(res: Response, status: number, mensagem: string, data?: any) {
  return res.status(status).json({
    success: true,
    message: mensagem,
    data: data ?? null
  });
}

export async function executarComTimeout<T>(
  operacao: PromiseLike<T>,
  timeoutMs: number = 10000
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error('Tempo limite excedido ao comunicar com o Supabase.'));
    }, timeoutMs);
  });

  return Promise.race([Promise.resolve(operacao as T), timeoutPromise]);
}

export function textoValido(valor: any, minimo = 1) {
  return typeof valor === 'string' && valor.trim().length >= minimo;
}

export function validarPedido(body: any) {
  const erros: string[] = [];

  if (!textoValido(body.email)) erros.push('email é obrigatório');
  if (!textoValido(body.tipo_pedido)) erros.push('tipo_pedido é obrigatório');
  if (!textoValido(body.contacto)) erros.push('contacto é obrigatório');
  if (!textoValido(body.distrito)) erros.push('distrito é obrigatório');
  if (!textoValido(body.descricao, 10)) {
    erros.push('descricao é obrigatória e deve ter pelo menos 10 caracteres');
  }

  return erros;
}

export function validarRecurso(body: any, exigirStatus = false) {
  const erros: string[] = [];

  if (!textoValido(body.nome)) erros.push('nome é obrigatório');
  if (!textoValido(body.tipo)) erros.push('tipo é obrigatório');
  if (!textoValido(body.contacto)) erros.push('contacto é obrigatório');
  if (!textoValido(body.distrito)) erros.push('distrito é obrigatório');
  if (!textoValido(body.descricao, 10)) {
    erros.push('descricao é obrigatória e deve ter pelo menos 10 caracteres');
  }

  if (exigirStatus) {
    if (!textoValido(body.status)) {
      erros.push('status é obrigatório');
    } else if (!STATUS_RECURSOS_VALIDOS.includes(body.status)) {
      erros.push(`status inválido. Use: ${STATUS_RECURSOS_VALIDOS.join(', ')}`);
    }
  }

  return erros;
}