//Importando as dependencias necessárias
const express = require("express")
const Empresa = require("./Models/Empresa")
const EmpresaService = require("./Controllers/EmpresaService")
const Usuario = require("./Models/Usuario")
const UsuarioService = require("./Controllers/UsuarioService")
const Perfil = require("./Models/Perfil")
const PerfilService = require("./Controllers/PerfilService")
const erro_mensagem = require("./Erros")
const app = express()
const cors = require('cors')
app.use(express.json())
app.use((req, res, next) => {
    //Qual site tem permissão de realizar a conexão, "*" indicando que qualquer site pode fazer a conexão
    res.header("Access-Control-Allow-Origin", "*");
	//Quais são os métodos que a conexão pode realizar na API
    res.header("Access-Control-Allow-Methods", 'GET,PUT,POST,DELETE');
    app.use(cors());
    next();
});

//Iniciando os Serviços
const empresaService = new EmpresaService()
const usuariosService = new UsuarioService()
const perfilService = new PerfilService()

//Dados de teste de empresas
const primeiraEmpresa = new Empresa(1, "Celso Lisboa")
const segundaEmpresa = new Empresa(2, "Liga Educacional")
empresaService.inserirEmpresa(primeiraEmpresa)
empresaService.inserirEmpresa(segundaEmpresa)

//Dados de teste dos usuarios
usuariosService.inserirUsuario(new Usuario(1, "gabriel", "123456","Gabriel Espindola","", "gabriel.espindola@ligaeducacional.com.br"))
usuariosService.inserirUsuario(new Usuario(2, "yasmim", "123456", "Yasmim Souza","", "yasmim@ligaeducacional.com.br"))


//Rotas das empresas
app.get("/empresa",(req,res)=>{
    const empresas = empresaService.empresas.map((empresa) => {return {...empresa}})
    
    for (const empresa of empresas){
        empresa.perfisEmpresa = perfilService.perfis
        .filter( perfil => perfil.id_empresa == empresa.id )
        .map( (perfil) => {
            const usuario = usuariosService.buscarUsuario(perfil.id_usuario)
            return {...perfil, usuario }
        })
    }

    res.status(200).send(empresas)
})



app.get("/empresa/:id",(req,res)=>{
    const {id} = req.params

    const empresa = empresaService.buscarEmpresa(id)
    if (empresa == null){
        res.status(400).send(erro_mensagem['erro.empresa.naoencontrada'])
        return
    }

    empresa.perfisEmpresa = perfilService.perfis
        .filter( perfil => perfil.id_empresa == empresa.id )
        .map( (perfil) => {
            const usuario = usuariosService.buscarUsuario(perfil.id_usuario)
            return {...perfil, usuario }
        })
    
    res.status(200).send(empresa)
})

app.post("/empresa",(req,res)=>{
    nova_empresa = req.body
    indice = (empresaService.empresas.length) - 1
    const ultimaId = empresaService.empresas[indice] ? (empresaService.empresas[indice].id) : 0
    nova_empresa["id"] = ultimaId + 1

    if (!empresaService.validarEmpresa(nova_empresa)){
        res.status(400).send(erro_mensagem['erro.camposorbigatorios.naopreenchidos'])
        return
    }
    
    if (empresaService.repeticaoEmpresa(nova_empresa)){
        return res.status(400).send(erro_mensagem['erro.empresa.jacadastrada'])
    }

    const novaEmpresa = new Empresa(nova_empresa.id, nova_empresa.empresa)

    empresaService.inserirEmpresa(novaEmpresa)
    res.status(201).send(novaEmpresa)
})

app.patch("/empresa/:id",(req,res)=>{
    edit_empresa = req.body
    const {id} = req.params
    const indice = id -1
    const empresa = empresaService.buscarEmpresa(id)
    if (empresa == null){
        res.status(400).send(erro_mensagem['erro.empresa.naoencontrada'])
        return
    }

    if (!empresaService.validarEmpresa(edit_empresa)){
        res.status(400).send(erro_mensagem['erro.camposorbigatorios.naopreenchidos'])
        return
    }
    
    if (empresaService.repeticaoEmpresa(edit_empresa)){
        return res.status(400).send(erro_mensagem['erro.empresa.jacadastrada'])
    }
    
    empresaService.alterarEmpresa(indice, empresa, edit_empresa)
    res.status(200).send(empresaService.empresas[indice])
})

app.delete("/empresa/:id",(req,res)=>{
    const {id} = req.params
    const empresa = empresaService.buscarEmpresa(id)
    if (empresa == null){
        res.status(400).send(erro_mensagem['erro.empresa.naoencontrada'])
        return
    }

    const perfis = perfilService.perfis.filter( perfil => (perfil.id_empresa == id))

    for (const perfil of perfis) {
        perfilService.removerPerfil(perfil.id)
    }

    let i = id
    while(i < empresaService.empresas.length){
        var aux = empresaService.empresas[i]["id"]
        const perfis = perfilService.perfis.filter( perfil => (perfil.id_empresa == aux))
        for (const perfil of perfis) {
            var indice = perfil.id - 1
            perfil.id_empresa--
            perfilService.alterarPerfil(indice,perfil,perfil)
        }
        i++
    }

    empresaService.removerEmpresa(id)
    res.status(200).send(erro_mensagem['empresa.excluida.sucesso'])
})

//Rotas dos Usuários
app.get("/usuario",(req,res)=>{
    const usuarios = usuariosService.usuarios.map((usuario) => {return {...usuario}})

    for (const usuario of usuarios){
        usuario.perfis = perfilService.perfis
        .filter( perfil => perfil.id_usuario == usuario.id )
        .map( (perfil) => {
            const empresa = empresaService.buscarEmpresa(perfil.id_empresa)
            return {...perfil, empresa }
        })
    }

    res.status(200).send(usuarios)
})

app.get("/usuario/:id",(req,res)=>{
    const {id} = req.params   
    
    const usuario = usuariosService.buscarUsuario(id)
    if (usuario == null){
        res.status(400).send(erro_mensagem['erro.usuario.naoencontrado'])
        return
    }

    usuario.perfis = perfilService.perfis
        .filter( perfil => perfil.id_usuario == usuario.id )
        .map( (perfil) => {
            const empresa = empresaService.buscarEmpresa(perfil.id_empresa)
            return {...perfil, empresa }
        })

    res.status(200).send(usuario)
})

app.post("/usuario",(req,res)=>{
    novo_usuario = req.body
    indice = (usuariosService.usuarios.length) - 1
    const ultimaId = usuariosService.usuarios[indice] ? (usuariosService.usuarios[indice].id) : 0
    novo_usuario["id"] = ultimaId + 1

    if (!usuariosService.validarUsuario(novo_usuario)){
        res.status(400).send(erro_mensagem['erro.camposorbigatorios.naopreenchidos'])
        return
    }

    if ((novo_usuario.nomeSocial == "") || !("nomeSocial" in novo_usuario)){
        novo_usuario["nomeSocial"] = novo_usuario["nomeCompleto"]
    }

    const novoUsuario = new Usuario(novo_usuario.id, novo_usuario.username, novo_usuario.senha, novo_usuario.nomeCompleto, novo_usuario.nomeSocial, novo_usuario.email)

    usuariosService.inserirUsuario(novoUsuario)
    res.status(201).send(novoUsuario)
})

app.patch("/usuario/:id",(req,res)=>{
    edit_usuario = req.body
    const {id} = req.params
    const indice = id -1
    const usuario = usuariosService.buscarUsuario(id)
    if (usuario == null){
        res.status(400).send(erro_mensagem['erro.usuario.naoencontrado'])
        return
    }

    usuariosService.alterarUsuario(indice, usuario, edit_usuario)
    res.status(200).send(usuariosService.usuarios[indice])
})

app.delete("/usuario/:id",(req,res)=>{
    const {id} = req.params
    const usuario = usuariosService.buscarUsuario(id)
    if (usuario == null){
        res.status(400).send(erro_mensagem['erro.usuario.naoencontrado'])
        return
    }
    
    const perfis = perfilService.perfis.filter( perfil => (perfil.id_usuario == id))
    
    for (const perfil of perfis) {
        perfilService.removerPerfil(perfil.id)
    }

    let i = id
    while(i < usuariosService.usuarios.length){
        var aux = usuariosService.usuarios[i]["id"]
        const perfis = perfilService.perfis.filter( perfil => (perfil.id_usuario == aux))
        for (const perfil of perfis) {
            var indice = perfil.id - 1
            perfil.id_usuario--
            perfilService.alterarPerfil(indice,perfil,perfil)
        }
        i++
    }

    usuariosService.removerUsuario(id)
    res.status(200).send(erro_mensagem['usuario.excluido.sucesso'])
})

// Rotas dos Perfis
app.get("/perfil",(req,res)=>{
    const perfis = perfilService.perfis.map((perfil) => {return {...perfil}})
    
    for(const perfil of perfis){
        perfil.empresa = empresaService.buscarEmpresa(perfil.id_empresa)
        perfil.usuario = usuariosService.buscarUsuario(perfil.id_usuario)
    }

    res.status(200).send(perfis)
})

app.get("/perfil/:id",(req,res)=>{
    const {id} = req.params

    const perfil = perfilService.buscarPerfil(id)
    if(perfil == null){
        res.status(400).send(erro_mensagem['erro.perfil.naoencontrado'])
        return
    }

    perfil.empresa = empresaService.buscarEmpresa(perfil.id_empresa)
    perfil.usuario = usuariosService.buscarUsuario(perfil.id_usuario)

    res.status(200).send(perfil)
})

app.post("/perfil",(req,res)=>{
    novo_perfil = req.body
    indice = (perfilService.perfis.length) - 1
    const ultimaId = perfilService.perfis[indice] ? (perfilService.perfis[indice].id) : 0
    novo_perfil["id"] = ultimaId + 1

    const usuario = usuariosService.buscarUsuario(novo_perfil.id_usuario)
    if (usuario == null){
        res.status(400).send(erro_mensagem['erro.usuario.naoencontrado'])
        return
    }

    const empresa = empresaService.buscarEmpresa(novo_perfil.id_empresa)
    if (empresa == null){
        res.status(400).send(erro_mensagem['erro.empresa.naoencontrada'])
        return
    }

    if (perfilService.validarPerfil(novo_perfil)){
        res.status(400).send(erro_mensagem['erro.camposorbigatorios.naopreenchidos'])
        return
    }

    if( perfilService.repeticaoPerfil(novo_perfil)){
       return res.status(400).send(erro_mensagem['erro.perfil.jacadastradonaempresa'])
    }

    const novoPerfil = new Perfil(novo_perfil.id, novo_perfil.nome, novo_perfil.id_empresa, novo_perfil.id_usuario)

    perfilService.inserirPerfil(novoPerfil)
    res.status(201).send(novoPerfil)
})

app.patch('/perfil/:id', (req, res)=>{
    const { id } = req.params
    const perfilEditado = req.body
    const index = id - 1

    let perfil = perfilService.buscarPerfil(id)
    const backup = perfilService.buscarPerfil(id)

    if(!perfil){
        res.status(400).send(erro_mensagem['erro.perfil.naoencontrado'])
        return
    }

    if (!perfilService.validarPerfil(perfilEditado)){
        res.status(400).send(erro_mensagem['erro.camposorbigatorios.naopreenchidos'])
        return
    }
    perfilService.alterarPerfil(index, perfilEditado, perfil)

    const usuario = usuariosService.buscarUsuario(perfil.id_usuario)
    
    if (!usuario){
        res.status(400).send(erro_mensagem['erro.usuario.naoencontrado'])
        perfilService.alterarPerfilErroUsuario(index, backup, perfil)
    }
    
    const empresa = empresaService.buscarEmpresa(perfil.id_empresa)
    
    if(!empresa){
        res.status(400).send(erro_mensagem['erro.empresa.naoencontrada'])
        perfilService.alterarPerfilErroEmpresa(index, backup, perfil)
    }
    
    res.status(200).send(perfil)
})

app.delete("/perfil/:id",(req,res)=>{
    const {id} = req.params
    
    const perfil = perfilService.buscarPerfil(id)
    if(perfil == null){
        res.status(400).send(erro_mensagem['erro.perfil.naoencontrado'])
        return
    }

    perfilService.removerPerfil(id)
    res.status(200).send(erro_mensagem['perfil.excluido.sucesso'])
})

//Servidor
const port = 3000
app.listen(port, ()=>{
    console.log(`Iniciando servidor...`)
})