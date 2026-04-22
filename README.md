[auth.html](https://github.com/user-attachments/files/26950511/auth.html)
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>4P Patrimonial — Acesso</title>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&family=DM+Serif+Display:ital@0;1&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<style>
*{box-sizing:border-box;margin:0;padding:0}
:root{
  --gold:#C9A84C;--gold-l:#F0D88A;--gold-d:#8B6914;
  --dark:#0F0F0F;--dark2:#1A1A1A;--dark3:#242424;--dark4:#2E2E2E;
  --text:#F0EDE6;--text2:#A89F8C;--text3:#6B6359;
  --green:#2D6A4F;--green-l:#52B788;
  --red:#E05252;--red-l:#fca5a5;
  --r:14px;--r-full:999px;
}
body{font-family:'Sora',sans-serif;background:var(--dark);color:var(--text);min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px}

.logo{font-family:'DM Serif Display',serif;font-size:26px;color:var(--gold);text-align:center;margin-bottom:6px}
.logo-sub{font-size:12px;color:var(--text3);text-align:center;margin-bottom:32px;letter-spacing:.5px}

.box{background:var(--dark2);border:1px solid #252525;border-radius:var(--r);padding:36px;width:100%;max-width:400px}

.tabs{display:flex;background:var(--dark3);border-radius:var(--r-full);padding:4px;margin-bottom:28px;gap:4px}
.tab{flex:1;text-align:center;padding:9px;border-radius:var(--r-full);font-size:13px;font-weight:500;cursor:pointer;transition:all .18s;color:var(--text3);border:none;background:transparent;font-family:'Sora',sans-serif}
.tab.active{background:var(--gold);color:var(--dark);font-weight:600}

.form-group{margin-bottom:16px}
.form-label{display:block;font-size:11px;color:var(--text3);margin-bottom:6px;letter-spacing:.5px;font-weight:500}
.form-input{width:100%;background:var(--dark3);border:1px solid #333;border-radius:var(--r-full);padding:11px 18px;font-size:13px;color:var(--text);font-family:'Sora',sans-serif;outline:none;transition:border-color .18s}
.form-input:focus{border-color:var(--gold)}
.form-input::placeholder{color:var(--text3)}

.btn{width:100%;border-radius:var(--r-full);padding:13px;font-size:14px;font-weight:600;font-family:'Sora',sans-serif;cursor:pointer;transition:all .18s;border:none;margin-top:4px}
.btn-gold{background:var(--gold);color:var(--dark)}
.btn-gold:hover{background:var(--gold-l)}
.btn-gold:disabled{opacity:.5;cursor:not-allowed}
.btn-ghost{background:transparent;color:var(--text2);border:1px solid #333;margin-top:10px}
.btn-ghost:hover{border-color:var(--gold);color:var(--gold)}

.divider{display:flex;align-items:center;gap:12px;margin:20px 0}
.divider span{font-size:11px;color:var(--text3)}
.divider::before,.divider::after{content:'';flex:1;height:1px;background:#2a2a2a}

.msg{padding:12px 16px;border-radius:var(--r);font-size:13px;margin-bottom:16px;display:none}
.msg.error{background:rgba(224,82,82,.12);border:1px solid rgba(224,82,82,.25);color:var(--red-l)}
.msg.success{background:rgba(82,183,136,.12);border:1px solid rgba(82,183,136,.25);color:var(--green-l)}
.msg.show{display:block}

.forgot{font-size:12px;color:var(--text3);text-align:right;cursor:pointer;margin-top:-8px;margin-bottom:16px;transition:color .15s;display:block}
.forgot:hover{color:var(--gold)}

.terms{font-size:11px;color:var(--text3);text-align:center;margin-top:16px;line-height:1.6}
.terms a{color:var(--text2);cursor:pointer}

.spinner{display:inline-block;width:16px;height:16px;border:2px solid rgba(15,15,15,.3);border-top-color:var(--dark);border-radius:50%;animation:spin .6s linear infinite;vertical-align:middle;margin-right:8px}
@keyframes spin{to{transform:rotate(360deg)}}

.plano-sel{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px}
.plano-opt{background:var(--dark3);border:1px solid #333;border-radius:var(--r);padding:14px;cursor:pointer;transition:all .18s;text-align:center}
.plano-opt:hover{border-color:var(--gold-d)}
.plano-opt.selected{border-color:var(--gold);background:rgba(201,168,76,.08)}
.plano-opt-nome{font-size:13px;font-weight:600;color:var(--text);margin-bottom:3px}
.plano-opt-preco{font-size:11px;color:var(--text3)}
.plano-opt.selected .plano-opt-nome{color:var(--gold)}

.reset-screen{display:none}
.reset-screen.show{display:block}
.back-link{font-size:12px;color:var(--text3);cursor:pointer;display:inline-flex;align-items:center;gap:6px;margin-bottom:20px;transition:color .15s}
.back-link:hover{color:var(--gold)}
</style>
</head>
<body>

<div class="logo">4P Patrimonial</div>
<div class="logo-sub">Método de Multiplicação Patrimonial</div>

<div class="box">

  <!-- TELA PRINCIPAL (login / cadastro) -->
  <div id="main-screen">
    <div class="tabs">
      <button class="tab active" onclick="switchTab('login')">Entrar</button>
      <button class="tab" onclick="switchTab('cadastro')">Cadastrar</button>
    </div>

    <div id="msg" class="msg"></div>

    <!-- LOGIN -->
    <div id="form-login">
      <div class="form-group">
        <label class="form-label">E-mail</label>
        <input class="form-input" type="email" id="login-email" placeholder="seu@email.com" autocomplete="email">
      </div>
      <div class="form-group">
        <label class="form-label">Senha</label>
        <input class="form-input" type="password" id="login-senha" placeholder="••••••••" autocomplete="current-password">
      </div>
      <span class="forgot" onclick="showReset()">Esqueci minha senha</span>
      <button class="btn btn-gold" id="btn-login" onclick="fazerLogin()">Entrar na plataforma</button>
    </div>

    <!-- CADASTRO -->
    <div id="form-cadastro" style="display:none">
      <div class="form-group">
        <label class="form-label">Nome completo</label>
        <input class="form-input" type="text" id="cad-nome" placeholder="Seu nome">
      </div>
      <div class="form-group">
        <label class="form-label">E-mail</label>
        <input class="form-input" type="email" id="cad-email" placeholder="seu@email.com" autocomplete="email">
      </div>
      <div class="form-group">
        <label class="form-label">Senha (mínimo 8 caracteres)</label>
        <input class="form-input" type="password" id="cad-senha" placeholder="••••••••" autocomplete="new-password">
      </div>
      <div class="form-group">
        <label class="form-label">Confirmar senha</label>
        <input class="form-input" type="password" id="cad-senha2" placeholder="••••••••" autocomplete="new-password">
      </div>

      <div class="form-group">
        <label class="form-label" style="margin-bottom:10px">Seu plano</label>
        <div class="plano-sel">
          <div class="plano-opt selected" id="opt-lowticket" onclick="selecionarPlano('lowticket')">
            <div class="plano-opt-nome">Low Ticket</div>
            <div class="plano-opt-preco">R$97 · 7 aulas</div>
          </div>
          <div class="plano-opt" id="opt-mentoria" onclick="selecionarPlano('mentoria')">
            <div class="plano-opt-nome">Mentoria</div>
            <div class="plano-opt-preco">R$5.000 / ano</div>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Código de acesso</label>
        <input class="form-input" type="text" id="cad-codigo" placeholder="Código recebido após pagamento">
      </div>

      <button class="btn btn-gold" id="btn-cadastro" onclick="fazerCadastro()">Criar minha conta</button>
      <div class="terms">Ao criar conta você concorda com os <a>Termos de uso</a> e <a>Política de privacidade</a></div>
    </div>
  </div>

  <!-- TELA RESET DE SENHA -->
  <div id="reset-screen" class="reset-screen">
    <span class="back-link" onclick="voltarLogin()">← Voltar ao login</span>
    <div style="font-family:'DM Serif Display',serif;font-size:18px;color:var(--text);margin-bottom:8px">Recuperar senha</div>
    <div style="font-size:13px;color:var(--text2);margin-bottom:20px;line-height:1.6">Digite seu e-mail e enviaremos um link para redefinir sua senha.</div>
    <div id="msg-reset" class="msg"></div>
    <div class="form-group">
      <label class="form-label">E-mail cadastrado</label>
      <input class="form-input" type="email" id="reset-email" placeholder="seu@email.com">
    </div>
    <button class="btn btn-gold" onclick="enviarReset()">Enviar link de recuperação</button>
  </div>

</div>

<script>
// ─────────────────────────────────────────────────────────────────
// CONFIGURE AQUI — cole suas credenciais do Supabase
// ─────────────────────────────────────────────────────────────────
const SUPABASE_URL  = 'https://vfmtntdaohuwitajxyqc.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmbXRudGRhb2h1d2l0YWp4eXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY3ODgyOTksImV4cCI6MjA5MjM2NDI5OX0.ZM5IcM2OhVL5koj68xqP22reVFQ4ZVOR9rJ9ovxeYVI'

// Códigos de acesso válidos por plano (gere novos a cada turma)
// Na versão com Kiwify, isso é substituído pelo webhook automático
const CODIGOS_VALIDOS = {
  lowticket: ['4P97-2025', '4P97-BETA', '4P97-LAUNCH'],
  mentoria:  ['4PMENT-2025', '4PMENT-VIP', '4PMENT-TURMA1'],
}

// Redirecionar após login bem-sucedido
const REDIRECT_APOS_LOGIN = './plataforma/index.html'
// ─────────────────────────────────────────────────────────────────

const { createClient } = supabase
const db = createClient(SUPABASE_URL, SUPABASE_ANON)

let planoSelecionado = 'lowticket'

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
  event.target.classList.add('active')
  document.getElementById('form-login').style.display   = tab === 'login'    ? 'block' : 'none'
  document.getElementById('form-cadastro').style.display = tab === 'cadastro' ? 'block' : 'none'
  limparMsg()
}

function selecionarPlano(plano) {
  planoSelecionado = plano
  document.getElementById('opt-lowticket').classList.toggle('selected', plano === 'lowticket')
  document.getElementById('opt-mentoria').classList.toggle('selected',  plano === 'mentoria')
}

function showMsg(texto, tipo, alvo) {
  const el = document.getElementById(alvo || 'msg')
  el.textContent = texto
  el.className = `msg ${tipo} show`
}

function limparMsg() {
  document.getElementById('msg').className = 'msg'
}

function setLoading(btnId, loading) {
  const btn = document.getElementById(btnId)
  btn.disabled = loading
  btn.innerHTML = loading
    ? '<span class="spinner"></span>Aguarde...'
    : btnId === 'btn-login' ? 'Entrar na plataforma' : 'Criar minha conta'
}

async function fazerLogin() {
  const email = document.getElementById('login-email').value.trim()
  const senha  = document.getElementById('login-senha').value
  limparMsg()

  if (!email || !senha) {
    showMsg('Preencha e-mail e senha.', 'error')
    return
  }

  setLoading('btn-login', true)
  const { data, error } = await db.auth.signInWithPassword({ email, password: senha })
  setLoading('btn-login', false)

  if (error) {
    const msgs = {
      'Invalid login credentials': 'E-mail ou senha incorretos.',
      'Email not confirmed': 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.',
    }
    showMsg(msgs[error.message] || 'Erro ao entrar. Tente novamente.', 'error')
    return
  }

  showMsg('Login realizado! Redirecionando...', 'success')
  setTimeout(() => window.location.href = REDIRECT_APOS_LOGIN, 800)
}

async function fazerCadastro() {
  const nome   = document.getElementById('cad-nome').value.trim()
  const email  = document.getElementById('cad-email').value.trim()
  const senha  = document.getElementById('cad-senha').value
  const senha2 = document.getElementById('cad-senha2').value
  const codigo = document.getElementById('cad-codigo').value.trim().toUpperCase()
  limparMsg()

  if (!nome || !email || !senha || !codigo) {
    showMsg('Preencha todos os campos.', 'error')
    return
  }
  if (senha.length < 8) {
    showMsg('A senha deve ter pelo menos 8 caracteres.', 'error')
    return
  }
  if (senha !== senha2) {
    showMsg('As senhas não coincidem.', 'error')
    return
  }

  // Verificar código de acesso
  const codigosDoPlano = CODIGOS_VALIDOS[planoSelecionado] || []
  if (!codigosDoPlano.includes(codigo)) {
    showMsg('Código de acesso inválido. Verifique o código recebido após o pagamento.', 'error')
    return
  }

  setLoading('btn-cadastro', true)

  // Criar usuário no Supabase Auth
  const { data, error } = await db.auth.signUp({
    email,
    password: senha,
    options: {
      data: { nome, plano: planoSelecionado },
      emailRedirectTo: window.location.origin + '/auth.html'
    }
  })

  if (error) {
    setLoading('btn-cadastro', false)
    const msgs = {
      'User already registered': 'Este e-mail já tem conta. Faça login.',
      'Password should be at least 6 characters': 'Senha muito curta.',
    }
    showMsg(msgs[error.message] || 'Erro ao criar conta: ' + error.message, 'error')
    return
  }

  // Salvar perfil na tabela profiles
  if (data.user) {
    await db.from('profiles').upsert({
      id: data.user.id,
      nome,
      plano: planoSelecionado,
      status: 'ativo',
    })
  }

  setLoading('btn-cadastro', false)
  showMsg('Conta criada! Verifique seu e-mail para confirmar o acesso.', 'success')
}

function showReset() {
  document.getElementById('main-screen').style.display  = 'none'
  document.getElementById('reset-screen').classList.add('show')
}

function voltarLogin() {
  document.getElementById('reset-screen').classList.remove('show')
  document.getElementById('main-screen').style.display = 'block'
}

async function enviarReset() {
  const email = document.getElementById('reset-email').value.trim()
  if (!email) {
    showMsg('Digite seu e-mail.', 'error', 'msg-reset')
    return
  }
  const { error } = await db.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/auth.html#reset'
  })
  if (error) {
    showMsg('Erro ao enviar. Tente novamente.', 'error', 'msg-reset')
  } else {
    showMsg('Link enviado! Verifique sua caixa de entrada.', 'success', 'msg-reset')
  }
}

// Verificar se usuário já está logado
db.auth.getSession().then(({ data: { session } }) => {
  if (session) window.location.href = REDIRECT_APOS_LOGIN
})

// Tratar redirect de reset de senha
if (window.location.hash.includes('reset')) {
  const params = new URLSearchParams(window.location.hash.substring(1))
  const access_token = params.get('access_token')
  if (access_token) {
    document.getElementById('main-screen').innerHTML = `
      <div style="font-family:'DM Serif Display',serif;font-size:18px;color:var(--text);margin-bottom:12px">Nova senha</div>
      <div id="msg" class="msg"></div>
      <div class="form-group">
        <label class="form-label">Nova senha</label>
        <input class="form-input" type="password" id="nova-senha" placeholder="Mínimo 8 caracteres">
      </div>
      <div class="form-group">
        <label class="form-label">Confirmar nova senha</label>
        <input class="form-input" type="password" id="nova-senha2" placeholder="Repita a senha">
      </div>
      <button class="btn btn-gold" onclick="salvarNovaSenha()">Salvar nova senha</button>
    `
    window.salvarNovaSenha = async function() {
      const s1 = document.getElementById('nova-senha').value
      const s2 = document.getElementById('nova-senha2').value
      if (s1 !== s2 || s1.length < 8) {
        showMsg('Senhas não coincidem ou muito curtas.', 'error')
        return
      }
      const { error } = await db.auth.updateUser({ password: s1 })
      if (error) {
        showMsg('Erro ao salvar. Tente novamente.', 'error')
      } else {
        showMsg('Senha atualizada! Redirecionando...', 'success')
        setTimeout(() => window.location.href = REDIRECT_APOS_LOGIN, 1200)
      }
    }
  }
}

// Enter para submeter
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return
  if (document.getElementById('form-login').style.display !== 'none') fazerLogin()
  else fazerCadastro()
})
</script>
</body>
</html>
