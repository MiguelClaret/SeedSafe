const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Setup Express + HTTP + Socket.IO
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

// Supabase client (com chave secreta)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

app.use(cors());
app.use(express.json());

// ✅ Rota para enviar mensagem
app.post('/send-message', async (req, res) => {
  const { from, to, content } = req.body;

  const { data, error } = await supabase
    .from('message')
    .insert([{ from, to, content }])
    .select()
    .single();

  if (error) {
    console.error('Erro ao inserir mensagem:', error);
    return res.status(400).json({ error });
  }

  const msg = data;

  io.emit('newMessage', msg); // Emitir para todos os clientes conectados
  res.status(200).json(msg);
});

// ✅ Rota para buscar histórico de conversa entre dois usuários
app.get('/messages', async (req, res) => {
  const { from, to } = req.query;

  const { data, error } = await supabase
    .from('message')
    .select('*')
    .or(`and(from.eq.${from},to.eq.${to}),and(from.eq.${to},to.eq.${from})`)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Erro ao buscar mensagens:', error);
    return res.status(400).json({ error });
  }

  res.status(200).json(data);
});

// ✅ Conexão via WebSocket
io.on('connection', (socket) => {
  console.log('📡 Cliente conectado');

  socket.on('disconnect', () => {
    console.log('❌ Cliente desconectado');
  });
});

// ✅ Iniciar servidor
server.listen(3001, () => {
  console.log('🚀 Servidor de chat rodando em http://localhost:3001');
});
