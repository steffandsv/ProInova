"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORIAS, ESTAGIOS, EVENTO, PRAZO_EMPRESAS_TEXTO } from "@/constants/proinovaday";
import CamposContato, { CONTATO_INICIAL, contatoCompleto, contatoParaEnvio, type Contato } from "./Contato";
import CommitBox, { explodirConfete } from "./CommitBox";
import CoverArt from "./CoverArt";
import Agenda from "./Agenda";
import { gsap } from "./gsap";
import { IconArrow, IconArrowLeft, IconCamera, IconCategoria, IconRocket } from "./Icons";
import { reduzirImagem } from "./imagem";
import { prefereMenosMovimento, vibrar } from "./hooks";

const PASSOS = ["Você", "Startup", "A ideia", "Revisar"];

type Dados = {
  startupNome: string;
  pitch: string;
  categoria: string;
  estagio: string;
  descricao: string;
  cidade: string;
  link: string;
};

const DADOS_INICIAIS: Dados = { startupNome: "", pitch: "", categoria: "", estagio: "", descricao: "", cidade: "", link: "" };

/** O card exatamente como vai aparecer em "Conheça as Startups". */
function Previa({ d, foto, responsavel }: { d: Dados; foto: string | null; responsavel: string }) {
  const s = {
    id: d.startupNome || "nova",
    nome: d.startupNome || "Nome da sua startup",
    categoria: d.categoria || "Outro",
    fotoUrl: foto,
  };
  return (
    <div className="st-preview">
      <span className="st-preview-label">Prévia ao vivo</span>
      <article className="st-card st-card--static">
        <div className="st-card-cover">
          <CoverArt s={s} />
          <span className="st-card-cat"><IconCategoria categoria={s.categoria} size={14} /> {d.categoria || "Categoria"}</span>
          <span className="st-card-origin is-new">Nova no tanque</span>
        </div>
        <div className="st-card-body">
          <h3 className="st-card-title">{s.nome}</h3>
          <p className="st-card-pitch">{d.pitch || "Sua frase de impacto aparece aqui. Uma linha que faz qualquer tubarão parar para ouvir."}</p>
          <div className="st-card-foot">
            {d.estagio && <span className="st-card-stage">Estágio: {d.estagio}</span>}
            <span className="st-card-people">{responsavel || "Seu nome"}{d.cidade ? ` · ${d.cidade}` : ""}</span>
          </div>
        </div>
      </article>
    </div>
  );
}

function Contador({ n, max, min }: { n: number; max: number; min?: number }) {
  return <span className={`st-count ${n > max ? "is-over" : min && n < min ? "is-low" : ""}`}>{n}/{max}</span>;
}

export default function EmpresaForm({ abertas, vagasRestantes }: { abertas: boolean; vagasRestantes: number }) {
  const [passo, setPasso] = useState(0);
  const [contato, setContato] = useState<Contato>(CONTATO_INICIAL);
  const [d, setD] = useState<Dados>(DADOS_INICIAIS);
  const [foto, setFoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [processandoFoto, setProcessandoFoto] = useState(false);
  const [compromisso, setCompromisso] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [feito, setFeito] = useState<string | null>(null);
  const [website, setWebsite] = useState("");
  const corpoRef = useRef<HTMLDivElement>(null);
  const sucessoRef = useRef<HTMLDivElement>(null);
  const arquivoRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (foto) URL.revokeObjectURL(foto.url); }, [foto]);

  // cidade padrão para quem é de Jaborandi
  useEffect(() => {
    if (contato.status === "ok" && contato.municipe && !d.cidade) setD((x) => ({ ...x, cidade: "Jaborandi/SP" }));
  }, [contato.status, contato.municipe, d.cidade]);

  const set = (k: keyof Dados) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setD({ ...d, [k]: e.target.value });

  const valido = [
    contatoCompleto(contato),
    d.startupNome.trim().length >= 2 && d.pitch.trim().length >= 10 && d.pitch.length <= 180 && !!d.categoria,
    d.descricao.trim().length >= 40 && d.descricao.length <= 2000,
    compromisso,
  ];

  function irPara(p: number) {
    const el = corpoRef.current;
    const ir = () => {
      setPasso(p);
      setErro("");
      el?.closest(".st-sheet")?.scrollTo({ top: 0, behavior: "smooth" });
    };
    if (!el || prefereMenosMovimento()) return ir();
    const dir = p > passo ? 1 : -1;
    gsap.to(el, {
      x: -40 * dir, opacity: 0, duration: 0.22, ease: "power2.in",
      onComplete: () => {
        ir();
        gsap.fromTo(el, { x: 40 * dir, opacity: 0 }, { x: 0, opacity: 1, duration: 0.45, ease: "power3.out" });
      },
    });
  }

  async function escolherFoto(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setErro("Escolha um arquivo de imagem (JPG, PNG…).");
    setProcessandoFoto(true);
    setErro("");
    try {
      const blob = await reduzirImagem(file);
      if (foto) URL.revokeObjectURL(foto.url);
      setFoto({ blob, url: URL.createObjectURL(blob) });
      vibrar(12);
    } catch {
      setErro("Não consegui abrir essa imagem. Tente outra foto.");
    } finally {
      setProcessandoFoto(false);
    }
  }

  async function enviar() {
    if (!valido.every(Boolean) || enviando) return;
    setEnviando(true);
    setErro("");
    const c = contatoParaEnvio(contato);
    const fd = new FormData();
    fd.set("cpf", c.cpf);
    fd.set("nome", c.nome);
    fd.set("whatsapp", c.whatsapp);
    fd.set("usarWhatsappCadastro", String(c.usarWhatsappCadastro));
    Object.entries(d).forEach(([k, v]) => fd.set(k, v.trim()));
    fd.set("compromisso", "true");
    fd.set("website", website);
    if (foto) fd.set("foto", foto.blob, "foto.jpg");
    try {
      const res = await fetch("/api/proinovaday/empresa", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok || !j.ok) {
        setErro(j.message || "Não foi possível enviar agora.");
        vibrar([30, 30, 30]);
        return;
      }
      setFeito(d.startupNome.trim());
      vibrar([20, 60, 20, 60, 40]);
      window.setTimeout(() => explodirConfete(sucessoRef.current, true), 250);
    } catch {
      setErro("Sem conexão. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  if (!abertas) {
    return (
      <div className="st-form">
        <span className="st-eyebrow">Startups</span>
        <h2 className="st-form-title">Inscrições <em>encerradas.</em></h2>
        <p className="st-form-sub">O prazo para inscrever startups terminou em {PRAZO_EMPRESAS_TEXTO}. Mas você ainda pode garantir seu lugar na plateia!</p>
      </div>
    );
  }

  if (feito) {
    return (
      <div className="st-form st-form--done" ref={sucessoRef}>
        <span className="st-eyebrow" data-sheet-in>Inscrição recebida</span>
        <h2 className="st-form-title" data-sheet-in><em>{feito}</em> está na fila do tanque!</h2>
        <p className="st-form-sub" data-sheet-in>
          A organização vai analisar sua inscrição e falar com você pelo WhatsApp para confirmar a vaga de pitch.
          Quando aprovada, sua startup aparece em <strong>Conheça as Startups</strong>.
        </p>
        <div className="st-done-card" data-sheet-in>
          <Previa d={d} foto={foto?.url || null} responsavel={contato.nome} />
        </div>
        <Agenda textoConvite={`Minha startup "${feito}" vai encarar os tubarões no ProInova Day Jaborandi 🦈 dia 28/11, às 9h, no C.TECH! Vem torcer:`} />
      </div>
    );
  }

  return (
    <div className="st-form st-form--wide">
      <div className="st-form-main">
        <span className="st-eyebrow" data-sheet-in><IconRocket size={14} /> Startup ou empresa</span>
        <h2 className="st-form-title" data-sheet-in>Entre no <em>tanque.</em></h2>
        <p className="st-form-sub" data-sheet-in>
          Apresente sua ideia para prefeitos da região e o Sebrae.{" "}
          {vagasRestantes > 0 ? <strong>Restam {vagasRestantes} vagas de pitch</strong> : <strong>Vagas preenchidas: você entra na lista de espera</strong>} · até {PRAZO_EMPRESAS_TEXTO}.
        </p>

        <ol className="st-steps" data-sheet-in aria-label="Etapas">
          {PASSOS.map((p, i) => (
            <li key={p} className={`${i === passo ? "is-on" : ""} ${i < passo ? "is-done" : ""}`}>
              <button type="button" onClick={() => i < passo && irPara(i)} disabled={i > passo}>
                <span>{i + 1}</span> {p}
              </button>
            </li>
          ))}
        </ol>

        <input className="st-hp" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} aria-hidden name="website" />

        <div ref={corpoRef} className="st-step-body" data-sheet-in>
          {passo === 0 && (
            <>
              <p className="st-step-q">Primeiro, quem é o responsável?</p>
              <CamposContato valor={contato} onChange={setContato} autoFocus />
            </>
          )}

          {passo === 1 && (
            <>
              <p className="st-step-q">Agora, a cara da sua startup.</p>
              <div className="st-photo-row">
                <button type="button" className={`st-photo ${foto ? "has-photo" : ""}`} onClick={() => arquivoRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); escolherFoto(e.dataTransfer.files?.[0]); }}>
                  {foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={foto.url} alt="Prévia da foto" />
                  ) : processandoFoto ? (
                    <span className="st-spinner" />
                  ) : (
                    <><IconCamera size={30} /><span>Foto ou logo</span></>
                  )}
                </button>
                <div className="st-photo-tip">
                  <strong>{foto ? "Ficou ótima!" : "Coloque uma foto de perfil"}</strong>
                  <span>{foto ? "Toque na foto para trocar." : "Pode ser o logo, o produto ou você com o time. Sem foto, criamos uma arte para você."}</span>
                </div>
                <input ref={arquivoRef} type="file" accept="image/*" hidden onChange={(e) => escolherFoto(e.target.files?.[0])} />
              </div>

              <label className="st-field">
                <span className="st-field-label">Nome da startup ou empresa</span>
                <input value={d.startupNome} onChange={set("startupNome")} maxLength={120} placeholder="Ex.: Jabô Turismo" />
              </label>

              <label className="st-field">
                <span className="st-field-label">Frase de impacto <Contador n={d.pitch.length} max={180} min={10} /></span>
                <input value={d.pitch} onChange={set("pitch")} maxLength={180} placeholder="O que você faz, em uma frase que dá vontade de ouvir mais" />
              </label>

              <div className="st-field">
                <span className="st-field-label">Categoria</span>
                <div className="st-chips" role="radiogroup">
                  {CATEGORIAS.map((c) => (
                    <button type="button" key={c} role="radio" aria-checked={d.categoria === c} className={d.categoria === c ? "is-on" : ""} onClick={() => setD({ ...d, categoria: c })}>
                      <IconCategoria categoria={c} size={15} /> {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="st-field">
                <span className="st-field-label">Em que estágio está?</span>
                <div className="st-chips st-chips--stage" role="radiogroup">
                  {ESTAGIOS.map((c) => (
                    <button type="button" key={c} role="radio" aria-checked={d.estagio === c} className={d.estagio === c ? "is-on" : ""} onClick={() => setD({ ...d, estagio: d.estagio === c ? "" : c })}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {passo === 2 && (
            <>
              <p className="st-step-q">Conte a ideia como se fosse para um amigo.</p>
              <label className="st-field">
                <span className="st-field-label">Que problema você resolve, e como? <Contador n={d.descricao.length} max={2000} min={40} /></span>
                <textarea value={d.descricao} onChange={set("descricao")} rows={7} maxLength={2000}
                  placeholder="Quem sofre com esse problema hoje? O que a sua solução faz de diferente? Já tem alguém usando?" />
              </label>
              <div className="st-field-2">
                <label className="st-field">
                  <span className="st-field-label">Cidade</span>
                  <input value={d.cidade} onChange={set("cidade")} maxLength={120} placeholder="Jaborandi/SP" />
                </label>
                <label className="st-field">
                  <span className="st-field-label">Site ou Instagram <small>(opcional)</small></span>
                  <input value={d.link} onChange={set("link")} maxLength={500} placeholder="instagram.com/suastartup" inputMode="url" />
                </label>
              </div>
            </>
          )}

          {passo === 3 && (
            <>
              <p className="st-step-q">Tudo certo? Assim sua startup vai aparecer:</p>
              <div className="st-review-mobile">
                <Previa d={d} foto={foto?.url || null} responsavel={contato.nome} />
              </div>
              <CommitBox
                marcado={compromisso}
                onChange={setCompromisso}
                titulo="Me comprometo a apresentar no dia 28/11"
                detalhe={`Estarei no ${EVENTO.local} às ${EVENTO.hora} para o pitch, se a vaga for confirmada.`}
              />
            </>
          )}
        </div>

        {erro && <p className="st-form-err" role="alert">{erro}</p>}

        <div className="st-step-nav">
          {passo > 0 && (
            <button type="button" className="st-back" onClick={() => irPara(passo - 1)}>
              <IconArrowLeft size={18} /> Voltar
            </button>
          )}
          {passo < 3 ? (
            <button type="button" className={`st-submit ${valido[passo] ? "is-ready" : ""}`} disabled={!valido[passo]} onClick={() => irPara(passo + 1)}>
              Continuar <IconArrow size={18} />
            </button>
          ) : (
            <button type="button" className={`st-submit ${valido.every(Boolean) ? "is-ready" : ""}`} disabled={!valido.every(Boolean) || enviando} onClick={enviar}>
              {enviando ? <span className="st-spinner" /> : <>Inscrever minha startup <IconRocket size={18} /></>}
            </button>
          )}
        </div>
        <p className="st-form-lgpd">Seus dados de contato ficam só com a organização. No site aparecem apenas o nome da startup, a foto, a ideia e o nome do responsável.</p>
      </div>

      <aside className="st-form-aside" aria-hidden>
        <Previa d={d} foto={foto?.url || null} responsavel={contato.nome} />
      </aside>
    </div>
  );
}
