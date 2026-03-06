export default function HomePage() {
  return (
    <div className="grid" style={{ gap: 18 }}>
      <div className="card">
        <h1 className="h1">A Plataforma que faz projeto virar entrega.</h1>
        <p className="p">
          ProInova não é “cadastro de ideia”. É um funil que força clareza: problema real, benefício mensurável,
          entregas mensais verificáveis e transparência.
        </p>
        <div className="grid two">
          <div className="card">
            <div className="badge"><strong>1</strong> Cadastro inteligente</div>
            <p className="p" style={{ marginTop: 10 }}>
              Você informa o CPF e o sistema identifica automaticamente seus dados (quando constar no cadastro municipal).
            </p>
            <a className="btn" href="/cadastro">Começar cadastro</a>
          </div>
          <div className="card">
            <div className="badge"><strong>2</strong> Proposta anti-vaporware</div>
            <p className="p" style={{ marginTop: 10 }}>
              Formulário estruturado para separar “ideia bonita” de projeto executável: cronograma, evidências, riscos e indicadores.
            </p>
            <a className="btn secondary" href="/login">Já tenho conta</a>
          </div>
        </div>
      </div>

      <div className="grid two">
        <div className="card">
          <div className="badge"><strong>Visão</strong> Transparência por padrão</div>
          <p className="p" style={{ marginTop: 10 }}>
            Cada projeto aprovado terá uma página pública com evolução mensal e entregas (sem expor dados sensíveis).
          </p>
        </div>
        <div className="card">
          <div className="badge"><strong>Regra</strong> Pagamento por marcos</div>
          <p className="p" style={{ marginTop: 10 }}>
            Bolsa condicionada a entregas mensais e evidências verificáveis.
          </p>
        </div>
      </div>
    </div>
  );
}
