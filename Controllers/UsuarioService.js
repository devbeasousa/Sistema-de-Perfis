//Classe de serviço dos usuarios
module.exports = class UsuarioService {

    usuarios = []

    buscarUsuario(id){
        const pesquisa = this.usuarios.filter( usuario => usuario.id == id )
        if(pesquisa.length == 0) {
            return null
        }

        return {...pesquisa[0]}
    }

    validarUsuario(usuario){
        if (("nomeCompleto" in usuario && "username" in usuario && "email" in usuario) && (usuario.nomeCompleto != "" && usuario.username != "" && usuario.email != "")){
            return true
        }
        return false
    }

    inserirUsuario(novoUsuario){
        this.usuarios.push(novoUsuario)
    }

    alterarUsuario(indice, usuario, edit_usuario){
        usuario.username = edit_usuario.username || usuario.username
        usuario.senha = edit_usuario.senha || usuario.senha
        usuario.nomeCompleto = edit_usuario.nomeCompleto || usuario.nomeCompleto
        usuario.nomeSocial = edit_usuario.nomeSocial || usuario.nomeSocial
        usuario.email = edit_usuario.email || usuario.email
    
        this.usuarios[indice] = usuario
    }

    removerUsuario(id){
        const indice = id -1
        this.usuarios.splice(indice,1)
        this.reordenarUsuarios()
    }

    reordenarUsuarios(){
        var i = 0
        while(i < this.usuarios.length){
            this.usuarios[i]["id"] = (i+1)
            i++
        }
    } 
}