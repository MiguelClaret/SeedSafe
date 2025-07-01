const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const multer = require('multer');
const upload = multer(); 
const { v4: uuidv4 } = require('uuid');

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

app.post('/document/upload', upload.array('imagens'), async (req, res) => {
  const arquivos = req.files;

  if (!arquivos || arquivos.length === 0) {
    return res.status(400).json({ error: "Missing 'imagens' field" });
  }

  try {
    const bucket = supabase.storage.from('documents');
    const links = [];

    for (const arquivo of arquivos) {
      const nomeUnico = `${uuidv4()}_${arquivo.originalname}`;
      const { error: uploadError } = await bucket.upload(nomeUnico, arquivo.buffer);

      if (uploadError) {
        console.error(uploadError);
        return res.status(500).json({ error: 'Erro ao fazer upload' });
      }

      const { data: urlData } = bucket.getPublicUrl(nomeUnico);
      links.push(urlData.publicUrl);
    }

    return res.status(200).json({ links: links.join(',') });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Erro inesperado' });
  }
});


// ✅ Rota para enviar mensagem
app.post('/send-message', async (req, res) => {
  const { from, to, content } = req.body;

  const { data, error } = await supabase
    .from('message')
    .insert([{ from, to, content }])
    .select('*, from_user:from(full_name)');

  if (error) {
    console.error('Erro ao inserir mensagem:', error);
    return res.status(400).json({ error });
  }

  const msg = {
    id: data[0].id,
    from: data[0].from,
    to: data[0].to,
    content: data[0].content,
    created_at: data[0].created_at,
    sender_name: data[0].from_user.full_name
  };

  io.emit('newMessage', msg); // Emitir para todos os clientes conectados
  res.status(200).json(msg);
});

// ✅ Rota para buscar histórico de conversa entre dois usuários
app.get('/messages', async (req, res) => {
  const { from, to } = req.query;

  const { data, error } = await supabase
    .rpc('get_messages_with_names', { id1: parseInt(from), id2: parseInt(to) });

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
