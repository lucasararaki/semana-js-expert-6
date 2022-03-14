## Estrutura do projeto server

### Services
Tudo que é regra de negócio ou processamento

### Controller
Intermediar a camada de apresentação e a camada de negócio

### Routes
Camada de apresentação, a forma das aplicações externas acessarem o servidor

### Server
Responsável por criar o servidor, mas não instanciar

### Index
Instancia o servidor e expõe para a web

### Config
Tudo que for estático, variáveis de ambiente, coisas que não são modificadas