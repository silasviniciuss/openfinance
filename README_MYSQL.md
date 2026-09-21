# =============================================================================
# INSTRUÇÕES DE EXECUÇÃO LOCAL (MYSQL + NODE.JS)
# =============================================================================

1. Pré-requisitos:
   - Node.js instalado (v18 ou superior)
   - MySQL instalado e rodando localmente (MySQL Server, XAMPP, WampServer ou Docker)

2. Criar o Banco de Dados no MySQL:
   Abra seu terminal ou cliente MySQL (MySQL Workbench, phpMyAdmin, DBeaver, HeidiSQL ou linha de comando) e execute o script:
   
   mysql -u root -p < schema_mysql.sql

   Ou copie e cole todo o conteúdo do arquivo `schema_mysql.sql` dentro do Workbench / phpMyAdmin.
   Isso criará o banco `financeiro` com todas as tabelas, índices e dados padrão do usuário silas.

3. Variáveis de Ambiente no arquivo `.env`:
   Crie um arquivo chamado `.env` na raiz do projeto com o seguinte conteúdo:

   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_PASSWORD=sua_senha_do_mysql
   MYSQL_DATABASE=financeiro

4. Instalação e Execução:
   npm install
   npm run dev

5. Acesso no Navegador:
   Acesse: http://localhost:3000
   Credenciais padrão:
   - Usuário: silas
   - Senha:   060333
