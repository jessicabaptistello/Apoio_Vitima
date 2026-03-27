import express from 'express';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_KEY || ''
);

// Nome correto da tua nova tabela
const NOVA_TABELA = 'recursos';

app.get('/', (req, res) => {
  res.send('API de Apoio à Vítima: Online! ⚖️');
});

/* =========================
   ROTAS DA TABELA PEDIDOS
========================= */

app.post('/pedidos', async (req, res) => {
  const { nome_vitima, contacto, tipo_apoio, descricao } = req.body;

  if (!nome_vitima || !contacto || !tipo_apoio || !descricao) {
    return res.status(400).json({
      error: 'nome_vitima, contacto, tipo_apoio e descricao são obrigatórios'
    });
  }

  const { data, error } = await supabase
    .from('pedidos')
    .insert([
      {
        nome_vitima,
        contacto,
        tipo_apoio,
        descricao,
        status: 'Pendente'
      }
    ])
    .select();

  if (error) {
    return res.status(400).json(error);
  }

  return res.status(201).json(data);
});


app.get('/pedidos', async (req, res) => {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*');

  if (error) {
    return res.status(400).json(error);
  }

  return res.status(200).json(data);
});

app.get('/pedidos/:id', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('pedidos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return res.status(400).json(error);
  }

  return res.status(200).json(data);
});

app.patch('/pedidos/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'O campo status é obrigatório' });
  }

  const { data, error } = await supabase
    .from('pedidos')
    .update({ status })
    .eq('id', id)
    .select();

  if (error) {
    return res.status(400).json(error);
  }

  return res.status(200).json(data);
});

app.delete('/pedidos/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('pedidos')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(400).json(error);
  }

  return res.status(200).json({ mensagem: 'Pedido removido com sucesso!' });
});

/* =========================
   ROTAS DA TABELA RECURSOS

// Criar recurso
app.post('/recursos', async (req, res) => {
  const { nome, tipo, contacto, website, distrito, descricao, status } = req.body;

  if (!nome || !tipo || !contacto || !distrito || !descricao || !status) {
    return res.status(400).json({
      error: 'nome, tipo, contacto, distrito, descricao e status são obrigatórios'
    });
  }

  const { data, error } = await supabase
    .from('recursos')
    .insert([
      {
        nome,
        tipo,
        contacto,
        website: website || null,
        distrito,
        descricao,
        status
      }
    ])
    .select();

  if (error) {
    return res.status(400).json(error);
  }

  return res.status(201).json(data);
});

// Listar recursos
app.get('/recursos', async (req, res) => {
  const { data, error } = await supabase
    .from('recursos')
    .select('*');

  if (error) {
    return res.status(400).json(error);
  }

  return res.status(200).json(data);
});

// Buscar recurso por id
app.get('/recursos/:id', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('recursos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    return res.status(400).json(error);
  }

  return res.status(200).json(data);
});

// Atualizar recurso completo
app.put('/recursos/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, tipo, contacto, website, distrito, descricao, status } = req.body;

  if (!nome || !tipo || !contacto || !distrito || !descricao || !status) {
    return res.status(400).json({
      error: 'nome, tipo, contacto, distrito, descricao e status são obrigatórios'
    });
  }

  const { data, error } = await supabase
    .from('recursos')
    .update({
      nome,
      tipo,
      contacto,
      website: website || null,
      distrito,
      descricao,
      status
    })
    .eq('id', id)
    .select();

  if (error) {
    return res.status(400).json(error);
  }

  return res.status(200).json(data);
});

// Atualizar apenas status
app.patch('/recursos/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'O campo status é obrigatório' });
  }

  const { data, error } = await supabase
    .from('recursos')
    .update({ status })
    .eq('id', id)
    .select();

  if (error) {
    return res.status(400).json(error);
  }

  return res.status(200).json(data);
});

// Remover recurso
app.delete('/recursos/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('recursos')
    .delete()
    .eq('id', id);

  if (error) {
    return res.status(400).json(error);
  }

  return res.status(200).json({ mensagem: 'Recurso removido com sucesso!' });
});

const PORT = Number(process.env.PORT) || 10000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor na porta ${PORT}`);
});