import type { Response } from 'express';

export const STATUS_PEDIDOS_VALIDOS = [
  'Pendente',
  'Em análise',
  'Encaminhado',
  'Concluído'
] as const;

export const STATUS_RECURSOS_VALIDOS = [
  'Pendente',
  'Aprovado',
  'Rejeitado',
  'Ativo',
  'Inativo'
] as const;

type RespostaErroDetalhe = unknown;

type PedidoBody = {
  email?: unknown;
  tipo_pedido?: unknown;
  contacto?: unknown;
  distrito?: unknown;
  descricao?: unknown;
  status?: unknown;
};

type RecursoBody = {
  nome?: unknown;
  tipo?: unknown;
  contacto?: unknown;
  distrito?: unknown;
  descricao?: unknown;
  status?: unknown;
};

export function respostaErro(
  res: Response,
  status: number,
  mensagem: string,
  detalhe?: RespostaErroDetalhe
) {
  return res.status(status).json({
    success: false,
    message: mensagem,
    detail: detalhe ?? null
  });
}

export function respostaSucesso<T>(
  res: Response,
  status: number,
  mensagem: string,
  data?: T
) {
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

  return Promise.race([Promise.resolve(operacao), timeoutPromise]);
}

export function textoValido(valor: unknown, minimo = 1): boolean {
  return typeof valor === 'string' && valor.trim().length >= minimo;
}

export function validarPedido(body: PedidoBody): string[] {
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

export function validarRecurso(body: RecursoBody, exigirStatus = false): string[] {
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
    } else if (
      !STATUS_RECURSOS_VALIDOS.includes(
        body.status as (typeof STATUS_RECURSOS_VALIDOS)[number]
      )
    ) {
      erros.push(`status inválido. Use: ${STATUS_RECURSOS_VALIDOS.join(', ')}`);
    }
  }

  return erros;
}