import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Variáveis SUPABASE_URL e/ou SUPABASE_KEY em falta no .env');
  process.exit(1);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);