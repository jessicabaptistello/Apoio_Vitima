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

// 1. TESTE
app.get('/', (req, res) => {
  res.send('API de Apoio à Vítima: Online! ⚖️');
});

// 2. CRIAR (POST)
app.post('/pedidos', async (req, res) => {
  const { nome_vitima, contacto, tipo_apoio, descricao } = req.body;
  const { data, error } = await supabase
    .from('pedidos')
    .insert([{ nome_vitima, contacto, tipo_apoio, descricao, status: 'Pendente' }])
    .select();

  if (error) return res.status(400).json(error);
  res.status(201).json(data);
});

// 3. LISTAR TODOS (GET)
app.get('/pedidos', async (req, res) => {
  const { data, error } = await supabase.from('pedidos').select('*');
  if (error) return res.status(400).json(error);
  res.status(200).json(data);
});

// 4. ATUALIZAR STATUS (PATCH)
// Usamos :id para saber qual pedido mudar
app.patch('/pedidos/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // Enviamos o novo status no Postman

  const { data, error } = await supabase
    .from('pedidos')
    .update({ status })
    .eq('id', id)
    .select();

  if (error) return res.status(400).json(error);
  res.status(200).json(data);
});

// 5. ELIMINAR (DELETE)
app.delete('/pedidos/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('pedidos')
    .delete()
    .eq('id', id);

  if (error) return res.status(400).json(error);
  res.status(200).json({ mensagem: 'Pedido removido com sucesso!' });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Servidor na porta ${PORT}`));