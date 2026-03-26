# Sistema de Pedidos de Apoio à Vítima

Aplicação web que permite a utilizadores registarem pedidos de apoio relacionados com situações de risco, violência ou necessidade urgente, acompanhando o estado de cada pedido.

##  ODS

ODS 16 — Paz, Justiça e Instituições Eficazes
Este projeto contribui para facilitar o registo e acompanhamento de pedidos de ajuda, promovendo o acesso a apoio em situações vulneráveis.

---

##  Stack Tecnológica

* Angular
* Node.js + Express
* Supabase (PostgreSQL)
* GitHub
* Postman

---

## Deploy

* Backend online:

https://apoio-vitima.onrender.com


##  Como correr o projeto

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
ng serve
```

Depois abrir no browser:
http://localhost:4200/

---

## API Endpoints

### GET /pedidos

Lista todos os pedidos de apoio

### POST /pedidos

Cria um novo pedido

Exemplo de body:

```json
{
  "titulo": "Pedido de Apoio",
  "descricao": "Preciso de ajuda urgente",
  "status": "Pendente"
}
```

### PATCH /pedidos/:id

Atualiza um pedido (ex: estado)

### DELETE /pedidos/:id

Remove um pedido

### GET /pedidos

Lista todos os pedidos de apoio após o DELETE

---

## Base de Dados

Tabela: pedidos

Campos:

* id
* user_id
* titulo
* descricao
* status (Pendente, Em Atendimento, Concluído)
* created_at

---

##  Testes com Postman

### GET todos os pedidos

![GET](./get.png)

### POST criar pedido

![POST](./post.png)

### PATCH atualizar pedido

![PATCH](./patch.png)

### DELETE pedido

![DELETE](./delete.png)

### GET após DELETE

![GETAPOSDELETE](./getaposdelete.png)
---

##  Funcionalidades

* Criar pedidos de apoio
* Listar pedidos
* Ver detalhe de cada pedido
* Atualizar estado (pendente, em atendimento, concluído)
* Eliminar pedidos

---

##  Estado do Projeto

Backend funcional ✔️
Frontend em desenvolvimento 
