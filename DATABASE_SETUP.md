# Configuração do PostgreSQL - NeoBit

## Informações do Banco de Dados

Este projeto utiliza PostgreSQL como banco de dados principal.

### Configuração Atual

- **Host Interno (Easypanel/Docker)**: `neobit_postgres-db`
- **Host Externo**: `157.230.196.146`
- **Porta**: `5432`
- **Database**: `matrixbit_db`
- **Usuário**: `jhuanmatrixbit`
- **Versão PostgreSQL**: 17.8
- **SSL**: Desabilitado (`sslmode=disable`)

### String de Conexão

#### Para aplicações no mesmo Easypanel/Docker:
```
postgres://jhuanmatrixbit:Matrixbit2026@neobit_postgres-db:5432/matrixbit_db?sslmode=disable
```

#### Para conexões externas:
```
postgres://jhuanmatrixbit:Matrixbit2026@157.230.196.146:5432/matrixbit_db?sslmode=disable
```

## Configuração do Ambiente

Crie um arquivo `.env` na raiz do projeto com:

```env
DATABASE_URL=postgres://jhuanmatrixbit:Matrixbit2026@neobit_postgres-db:5432/matrixbit_db?sslmode=disable
NODE_ENV=production
SESSION_SECRET=sua_chave_secreta_aqui
```

## Schema do Banco de Dados

O schema é criado automaticamente na primeira execução do servidor através da função `initPostgresSchema()` em `server/index.js`.

### Tabelas Criadas:

1. **users** - Usuários do sistema
2. **ais** - AIs personalizadas
3. **conversations** - Conversas dos usuários
4. **messages** - Mensagens das conversas
5. **shares** - Compartilhamentos
6. **preferences** - Preferências dos usuários
7. **session** - Sessões (criada automaticamente pelo connect-pg-simple)

## Interface Gráfica (pgweb)

Acesse a interface gráfica do PostgreSQL em:
- **URL**: http://157.230.196.146:8081

## Notas Importantes

⚠️ **NUNCA** commite o arquivo `.env` no repositório Git, pois ele contém credenciais sensíveis.

O arquivo `.env` está no `.gitignore` para garantir que não seja versionado acidentalmente.
